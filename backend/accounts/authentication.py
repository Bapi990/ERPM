import jwt
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import User

JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7 # 7 days for development ease

def generate_tokens(user):
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role.code if user.role else 'employee',
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow(),
    }
    access_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    refresh_payload = {
        'user_id': str(user.id),
        'type': 'refresh',
        'exp': datetime.utcnow() + timedelta(days=30),
        'iat': datetime.utcnow(),
    }
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return {
        'access': access_token,
        'refresh': refresh_token,
    }

def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Token has expired')
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed('Invalid token')

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]
        payload = decode_token(token)

        try:
            user = User.objects.select_related('role').get(id=payload['user_id'])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')

        if user.status != 'active':
            raise exceptions.AuthenticationFailed('User account is inactive or suspended')

        return (user, token)
