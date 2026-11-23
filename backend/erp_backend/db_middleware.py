from django.db.utils import OperationalError
from .db_router import FailoverRouter

class DatabaseFailoverMiddleware:
    """
    Catches transient database quota limits (e.g. Hostinger 1226 max_connections_per_hour)
    or connection drops, marks MySQL down, and transparently retries the request against SQLite.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except OperationalError as e:
            err_msg = str(e)
            if any(code in err_msg for code in ['1226', 'max_connections_per_hour', '2003', '2006', '2013']):
                FailoverRouter.mark_mysql_down(duration=600)
                # Transparently retry request with failover router active
                return self.get_response(request)
            raise
