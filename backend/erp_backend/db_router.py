import threading
import time
from django.conf import settings
from django.db import connections


class FailoverRouter:
    mysql_down_until = 0
    _sqlite_checked = False
    _sqlite_lock = threading.Lock()

    @classmethod
    def active_db_alias(cls):
        """Return the DB alias currently selected for read/write traffic."""
        if not cls.is_mysql_available() and 'sqlite' in settings.DATABASES:
            return 'sqlite'
        return 'default'

    @classmethod
    def ensure_sqlite_ready(cls, alias='sqlite'):
        """
        Ensure the SQLite fallback database has applied migrations and at least one
        default superadmin account if starting on an uninitialized fallback file.
        """
        if cls._sqlite_checked:
            return
        with cls._sqlite_lock:
            if cls._sqlite_checked:
                return
            if alias not in settings.DATABASES:
                alias = 'default'
            try:
                conn = connections[alias]
                tables = conn.introspection.table_names()
                if 'accounts_user' not in tables or 'crm_lead' not in tables or 'hrms_employee' not in tables:
                    from django.core.management import call_command
                    print(f">>> [SQLITE FAILOVER INIT] Applying migrations on '{alias}' database...")
                    call_command('migrate', database=alias, interactive=False, verbosity=0)

                from accounts.models import User, Role
                if not User.objects.using(alias).filter(is_superuser=True).exists():
                    role, _ = Role.objects.using(alias).get_or_create(
                        code='super_admin',
                        defaults={
                            'name': 'Super Admin',
                            'description': 'Full system administrator access',
                            'is_system': True,
                        },
                    )
                    if not User.objects.using(alias).filter(email='superadmin12@gmail.com').exists():
                        u = User(
                            username='superadmin12',
                            email='superadmin12@gmail.com',
                            first_name='Super',
                            last_name='Admin',
                            role=role,
                            status='active',
                            is_staff=True,
                            is_superuser=True,
                            is_active=True,
                        )
                        u.set_password('Password@123')
                        u.save(using=alias)
                cls._sqlite_checked = True
            except Exception as exc:
                print(f">>> [SQLITE FAILOVER INIT WARNING] {exc}")

    @classmethod
    def is_mysql_available(cls):
        return time.time() >= cls.mysql_down_until

    @classmethod
    def mark_mysql_down(cls, duration=300):
        cls.mysql_down_until = time.time() + duration
        print(f">>> [ROUTER FAILOVER] Hostinger MySQL connection throttled/unavailable. Routing traffic to Local SQLite (db.sqlite3) for {duration}s.")

    @classmethod
    def mark_mysql_up(cls):
        cls.mysql_down_until = 0
        print(">>> [ROUTER RECOVERY] Hostinger MySQL connection restored. Routing traffic to MySQL.")

    def db_for_read(self, model, **hints):
        return self.active_db_alias()

    def db_for_write(self, model, **hints):
        return self.active_db_alias()

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True
