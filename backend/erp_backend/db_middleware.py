from django.conf import settings
from django.db import connections
from django.db.utils import DatabaseError, InterfaceError, OperationalError
from .db_router import FailoverRouter

TRANSIENT_MYSQL_MARKERS = (
    '1226',
    'max_connections_per_hour',
    'max_user_connections',
    '2002',
    '2003',
    '2006',
    '2013',
    '1040',
    '1044',
    '1045',
    'lost connection',
    'gone away',
    'can\'t connect to mysql',
    'access denied',
    'connection refused',
    'timed out',
    'broken pipe',
)


class DatabaseFailoverMiddleware:
    """
    Catches transient database quota limits (e.g. Hostinger 1226 max_connections_per_hour),
    dropped persistent sockets (2006/2013/InterfaceError), or uninitialized SQLite tables,
    closes stale handles, switches to Local SQLite failover when needed, and retries cleanly.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Ensure SQLite schema is initialized if booted directly in SQLite failover mode
        default_engine = settings.DATABASES.get('default', {}).get('ENGINE', '')
        if 'sqlite' in default_engine and not FailoverRouter._sqlite_checked:
            FailoverRouter.ensure_sqlite_ready('default')

        try:
            return self.get_response(request)
        except (OperationalError, InterfaceError, DatabaseError) as exc:
            err_msg = str(exc).lower()
            is_stale_socket = any(m in err_msg for m in ('2006', '2013', 'gone away', 'lost connection', 'broken pipe')) or isinstance(exc, InterfaceError)
            is_mysql_outage = any(m in err_msg for m in TRANSIENT_MYSQL_MARKERS)

            if is_stale_socket and FailoverRouter.is_mysql_available():
                # Close stale MySQL connection and retry once on primary before failing over
                connections.close_all()
                try:
                    return self.get_response(request)
                except (OperationalError, InterfaceError, DatabaseError) as retry_exc:
                    err_msg = str(retry_exc).lower()
                    is_mysql_outage = True

            if is_mysql_outage or 'mysql' in default_engine:
                if any(m in err_msg for m in TRANSIENT_MYSQL_MARKERS) or isinstance(exc, InterfaceError):
                    connections.close_all()
                    FailoverRouter.mark_mysql_down(duration=300)
                    FailoverRouter.ensure_sqlite_ready('sqlite' if 'sqlite' in settings.DATABASES else 'default')
                    return self.get_response(request)

            if 'no such table' in err_msg:
                connections.close_all()
                FailoverRouter._sqlite_checked = False
                FailoverRouter.ensure_sqlite_ready('sqlite' if not FailoverRouter.is_mysql_available() and 'sqlite' in settings.DATABASES else 'default')
                return self.get_response(request)

            raise
