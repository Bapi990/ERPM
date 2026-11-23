"""
Django settings for Greenbacks ERP project.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'greenbacks-erp-super-secret-key-change-in-prod-xyz123')

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'corsheaders',
    'rest_framework',
    
    # ERP domain apps
    'accounts',
    'organizations',
    'hrms',
    'payroll',
    'crm',
    'billing',
    'audit_logs',
    'notifications',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'erp_backend.db_middleware.DatabaseFailoverMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'erp_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'erp_backend.wsgi.application'

def check_mysql_health():
    if os.environ.get('FORCE_SQLITE'):
        return False
    try:
        import pymysql
        conn = pymysql.connect(
            host=os.environ.get('DB_HOST', 'srv685.hstgr.io'),
            user=os.environ.get('DB_USER', 'u529002218_erpodias90890'),
            password=os.environ.get('DB_PASSWORD', 'Erp@Odias909'),
            database=os.environ.get('DB_NAME', 'u529002218_erpodias90890'),
            port=int(os.environ.get('DB_PORT', '3306')),
            connect_timeout=2
        )
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
        conn.close()
        return True
    except Exception as e:
        print(f">>> [MYSQL HEALTH NOTICE] {e}")
        return False

MYSQL_AVAILABLE = check_mysql_health()

if MYSQL_AVAILABLE:
    print(">>> [DATABASE ENGINE] Connected to Hostinger MySQL (srv685.hstgr.io)")
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('DB_NAME', 'u529002218_erpodias90890'),
            'USER': os.environ.get('DB_USER', 'u529002218_erpodias90890'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'Erp@Odias909'),
            'HOST': os.environ.get('DB_HOST', 'srv685.hstgr.io'),
            'PORT': os.environ.get('DB_PORT', '3306'),
            'CONN_MAX_AGE': 600,
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        },
        'sqlite': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    print(">>> [DATABASE ENGINE] Hostinger MySQL limit reached/unavailable. Active Failover to Local SQLite (db.sqlite3).")
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 6},
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'accounts.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
