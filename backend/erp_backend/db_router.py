import time

class FailoverRouter:
    mysql_down_until = 0

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
        if not self.is_mysql_available():
            return 'sqlite'
        return 'default'

    def db_for_write(self, model, **hints):
        if not self.is_mysql_available():
            return 'sqlite'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True
