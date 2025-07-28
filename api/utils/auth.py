"""
AUTHENTICATION UTILITIES
Sistema de autenticação JWT para a API

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
import os

# Configurações JWT
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'viral_scraper_secret_key_2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24
JWT_REFRESH_EXPIRATION_DAYS = 30

class AuthError(Exception):
    """Exceção personalizada para erros de autenticação"""
    def __init__(self, message, status_code=401):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def hash_password(password):
    """
    Hash da senha usando bcrypt
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, hashed_password):
    """
    Verificar senha contra hash
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_tokens(user_data):
    """
    Gerar tokens JWT (access e refresh)
    """
    now = datetime.utcnow()
    
    # Payload do access token
    access_payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'role': user_data.get('role', 'user'),
        'iat': now,
        'exp': now + timedelta(hours=JWT_EXPIRATION_HOURS),
        'type': 'access'
    }
    
    # Payload do refresh token
    refresh_payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'iat': now,
        'exp': now + timedelta(days=JWT_REFRESH_EXPIRATION_DAYS),
        'type': 'refresh'
    }
    
    # Gerar tokens
    access_token = jwt.encode(access_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': JWT_EXPIRATION_HOURS * 3600,
        'expires_at': (now + timedelta(hours=JWT_EXPIRATION_HOURS)).isoformat()
    }

def decode_token(token):
    """
    Decodificar e validar token JWT
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthError('Token expirado', 401)
    except jwt.InvalidTokenError:
        raise AuthError('Token inválido', 401)

def get_token_from_header():
    """
    Extrair token do header Authorization
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        raise AuthError('Header Authorization não encontrado', 401)
    
    try:
        scheme, token = auth_header.split(' ', 1)
        if scheme.lower() != 'bearer':
            raise AuthError('Esquema de autenticação deve ser Bearer', 401)
        return token
    except ValueError:
        raise AuthError('Formato do header Authorization inválido', 401)

def get_current_user():
    """
    Obter usuário atual do token
    """
    try:
        token = get_token_from_header()
        payload = decode_token(token)
        
        # Verificar se é um access token
        if payload.get('type') != 'access':
            raise AuthError('Tipo de token inválido', 401)
        
        return {
            'id': payload['user_id'],
            'email': payload['email'],
            'role': payload.get('role', 'user'),
            'token_payload': payload
        }
    except AuthError:
        raise
    except Exception as e:
        raise AuthError(f'Erro ao processar token: {str(e)}', 401)

def require_auth(f):
    """
    Decorator para exigir autenticação
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user = get_current_user()
            request.current_user = user
            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify({
                'success': False,
                'error': e.message,
                'error_code': 'AUTHENTICATION_REQUIRED'
            }), e.status_code
        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Erro interno de autenticação',
                'error_code': 'INTERNAL_AUTH_ERROR'
            }), 500
    
    return decorated_function

def require_role(required_role):
    """
    Decorator para exigir role específica
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user = get_current_user()
                
                if user['role'] != required_role and user['role'] != 'admin':
                    raise AuthError(f'Acesso negado. Role necessária: {required_role}', 403)
                
                request.current_user = user
                return f(*args, **kwargs)
            except AuthError as e:
                return jsonify({
                    'success': False,
                    'error': e.message,
                    'error_code': 'INSUFFICIENT_PERMISSIONS'
                }), e.status_code
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': 'Erro interno de autorização',
                    'error_code': 'INTERNAL_AUTH_ERROR'
                }), 500
        
        return decorated_function
    return decorator

def require_admin(f):
    """
    Decorator para exigir role de admin
    """
    return require_role('admin')(f)

def refresh_access_token(refresh_token):
    """
    Renovar access token usando refresh token
    """
    try:
        payload = decode_token(refresh_token)
        
        # Verificar se é um refresh token
        if payload.get('type') != 'refresh':
            raise AuthError('Tipo de token inválido para refresh', 401)
        
        # Simular busca do usuário no banco
        # TODO: Implementar busca real no banco de dados
        user_data = {
            'id': payload['user_id'],
            'email': payload['email'],
            'role': 'user'  # TODO: Buscar role real do banco
        }
        
        # Gerar novo access token
        tokens = generate_tokens(user_data)
        
        return {
            'access_token': tokens['access_token'],
            'token_type': 'Bearer',
            'expires_in': tokens['expires_in'],
            'expires_at': tokens['expires_at']
        }
        
    except AuthError:
        raise
    except Exception as e:
        raise AuthError(f'Erro ao renovar token: {str(e)}', 401)

def authenticate_user(email, password):
    """
    Autenticar usuário com email e senha
    """
    try:
        # TODO: Implementar busca real no banco de dados
        # Por enquanto, usar dados mockados para desenvolvimento
        
        mock_users = {
            'admin@viralscraper.com': {
                'id': 1,
                'email': 'admin@viralscraper.com',
                'password_hash': hash_password('admin123'),
                'role': 'admin',
                'name': 'Administrador',
                'active': True,
                'created_at': '2025-01-01T00:00:00Z'
            },
            'user@viralscraper.com': {
                'id': 2,
                'email': 'user@viralscraper.com',
                'password_hash': hash_password('user123'),
                'role': 'user',
                'name': 'Usuário Teste',
                'active': True,
                'created_at': '2025-01-01T00:00:00Z'
            }
        }
        
        user = mock_users.get(email.lower())
        
        if not user:
            raise AuthError('Credenciais inválidas', 401)
        
        if not user['active']:
            raise AuthError('Conta desativada', 401)
        
        if not verify_password(password, user['password_hash']):
            raise AuthError('Credenciais inválidas', 401)
        
        # Remover senha do retorno
        user_data = {k: v for k, v in user.items() if k != 'password_hash'}
        
        return user_data
        
    except AuthError:
        raise
    except Exception as e:
        raise AuthError(f'Erro ao autenticar usuário: {str(e)}', 500)

def create_user(email, password, name, role='user'):
    """
    Criar novo usuário
    """
    try:
        # TODO: Implementar criação real no banco de dados
        
        # Validações básicas
        if len(password) < 6:
            raise AuthError('Senha deve ter pelo menos 6 caracteres', 400)
        
        if role not in ['user', 'admin', 'moderator']:
            raise AuthError('Role inválida', 400)
        
        # Verificar se email já existe
        # TODO: Implementar verificação real no banco
        
        # Hash da senha
        password_hash = hash_password(password)
        
        # Simular criação do usuário
        user_data = {
            'id': 999,  # TODO: ID real do banco
            'email': email.lower(),
            'name': name,
            'role': role,
            'active': True,
            'created_at': datetime.utcnow().isoformat()
        }
        
        return user_data
        
    except AuthError:
        raise
    except Exception as e:
        raise AuthError(f'Erro ao criar usuário: {str(e)}', 500)

def validate_api_key(api_key):
    """
    Validar API key para acesso programático
    """
    try:
        # TODO: Implementar validação real de API keys
        
        # API keys mockadas para desenvolvimento
        mock_api_keys = {
            'vsc_test_key_123': {
                'id': 'key_1',
                'name': 'Chave de Teste',
                'user_id': 1,
                'permissions': ['read', 'write'],
                'rate_limit': 1000,
                'active': True
            },
            'vsc_readonly_key_456': {
                'id': 'key_2',
                'name': 'Chave Somente Leitura',
                'user_id': 2,
                'permissions': ['read'],
                'rate_limit': 500,
                'active': True
            }
        }
        
        key_data = mock_api_keys.get(api_key)
        
        if not key_data or not key_data['active']:
            raise AuthError('API key inválida', 401)
        
        return key_data
        
    except AuthError:
        raise
    except Exception as e:
        raise AuthError(f'Erro ao validar API key: {str(e)}', 500)

def require_api_key(f):
    """
    Decorator para exigir API key
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            api_key = request.headers.get('X-API-Key')
            
            if not api_key:
                raise AuthError('API key não fornecida', 401)
            
            key_data = validate_api_key(api_key)
            request.api_key_data = key_data
            
            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify({
                'success': False,
                'error': e.message,
                'error_code': 'INVALID_API_KEY'
            }), e.status_code
        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Erro interno de autenticação',
                'error_code': 'INTERNAL_AUTH_ERROR'
            }), 500
    
    return decorated_function

def get_user_permissions(user_or_key):
    """
    Obter permissões do usuário ou API key
    """
    if isinstance(user_or_key, dict):
        if 'permissions' in user_or_key:  # API key
            return user_or_key['permissions']
        elif 'role' in user_or_key:  # User
            role_permissions = {
                'admin': ['read', 'write', 'delete', 'admin'],
                'moderator': ['read', 'write'],
                'user': ['read']
            }
            return role_permissions.get(user_or_key['role'], ['read'])
    
    return ['read']

def require_permission(permission):
    """
    Decorator para exigir permissão específica
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Tentar autenticação JWT primeiro
                user_permissions = []
                try:
                    user = get_current_user()
                    user_permissions = get_user_permissions(user)
                    request.current_user = user
                except AuthError:
                    # Se JWT falhar, tentar API key
                    api_key = request.headers.get('X-API-Key')
                    if api_key:
                        key_data = validate_api_key(api_key)
                        user_permissions = get_user_permissions(key_data)
                        request.api_key_data = key_data
                    else:
                        raise AuthError('Autenticação necessária', 401)
                
                if permission not in user_permissions:
                    raise AuthError(f'Permissão necessária: {permission}', 403)
                
                return f(*args, **kwargs)
            except AuthError as e:
                return jsonify({
                    'success': False,
                    'error': e.message,
                    'error_code': 'INSUFFICIENT_PERMISSIONS'
                }), e.status_code
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': 'Erro interno de autorização',
                    'error_code': 'INTERNAL_AUTH_ERROR'
                }), 500
        
        return decorated_function
    return decorator

