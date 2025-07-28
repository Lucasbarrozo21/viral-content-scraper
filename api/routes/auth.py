"""
AUTHENTICATION ROUTES
Endpoints de autenticação e autorização

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from ..utils.auth import (
    authenticate_user, 
    generate_tokens, 
    refresh_access_token,
    create_user,
    get_current_user,
    AuthError
)
from ..utils.validators import validate_request, ValidationError
from ..utils.cache import cache_result

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
@validate_request({
    'email': {'type': 'email', 'required': True},
    'password': {'type': 'string', 'required': True, 'min_length': 6},
    'remember_me': {'type': 'boolean', 'default': False}
})
def login():
    """
    Fazer login do usuário
    """
    try:
        data = request.validated_data
        
        # Autenticar usuário
        user = authenticate_user(data['email'], data['password'])
        
        # Gerar tokens
        tokens = generate_tokens(user)
        
        # Log de login
        logger.info(f"Login successful for user: {user['email']} - IP: {request.remote_addr}")
        
        return jsonify({
            'success': True,
            'message': 'Login realizado com sucesso',
            'data': {
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'role': user['role']
                },
                'tokens': tokens
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except AuthError as e:
        logger.warning(f"Login failed for email: {data.get('email', 'unknown')} - Error: {e.message} - IP: {request.remote_addr}")
        return jsonify({
            'success': False,
            'error': e.message,
            'error_code': 'LOGIN_FAILED'
        }), e.status_code
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno durante login'
        }), 500

@auth_bp.route('/register', methods=['POST'])
@validate_request({
    'email': {'type': 'email', 'required': True},
    'password': {'type': 'string', 'required': True, 'min_length': 6},
    'name': {'type': 'string', 'required': True, 'min_length': 2, 'max_length': 100},
    'role': {'type': 'string', 'choices': ['user', 'moderator'], 'default': 'user'}
})
def register():
    """
    Registrar novo usuário
    """
    try:
        data = request.validated_data
        
        # Criar usuário
        user = create_user(
            email=data['email'],
            password=data['password'],
            name=data['name'],
            role=data['role']
        )
        
        # Gerar tokens
        tokens = generate_tokens(user)
        
        # Log de registro
        logger.info(f"User registered: {user['email']} - IP: {request.remote_addr}")
        
        return jsonify({
            'success': True,
            'message': 'Usuário registrado com sucesso',
            'data': {
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'role': user['role']
                },
                'tokens': tokens
            },
            'timestamp': datetime.utcnow().isoformat()
        }), 201
        
    except AuthError as e:
        return jsonify({
            'success': False,
            'error': e.message,
            'error_code': 'REGISTRATION_FAILED'
        }), e.status_code
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno durante registro'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@validate_request({
    'refresh_token': {'type': 'string', 'required': True}
})
def refresh_token():
    """
    Renovar access token
    """
    try:
        data = request.validated_data
        
        # Renovar token
        new_tokens = refresh_access_token(data['refresh_token'])
        
        return jsonify({
            'success': True,
            'message': 'Token renovado com sucesso',
            'data': new_tokens,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except AuthError as e:
        return jsonify({
            'success': False,
            'error': e.message,
            'error_code': 'TOKEN_REFRESH_FAILED'
        }), e.status_code
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno durante renovação de token'
        }), 500

@auth_bp.route('/me', methods=['GET'])
def get_profile():
    """
    Obter perfil do usuário atual
    """
    try:
        user = get_current_user()
        
        return jsonify({
            'success': True,
            'data': {
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'role': user['role']
                }
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except AuthError as e:
        return jsonify({
            'success': False,
            'error': e.message,
            'error_code': 'PROFILE_ACCESS_DENIED'
        }), e.status_code
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno ao obter perfil'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Fazer logout do usuário
    """
    try:
        # TODO: Implementar blacklist de tokens
        # Por enquanto, apenas retornar sucesso
        # O frontend deve descartar os tokens
        
        return jsonify({
            'success': True,
            'message': 'Logout realizado com sucesso',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno durante logout'
        }), 500

@auth_bp.route('/validate', methods=['POST'])
def validate_token():
    """
    Validar token de acesso
    """
    try:
        user = get_current_user()
        
        return jsonify({
            'success': True,
            'valid': True,
            'data': {
                'user_id': user['id'],
                'email': user['email'],
                'role': user['role']
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except AuthError as e:
        return jsonify({
            'success': True,
            'valid': False,
            'error': e.message,
            'error_code': 'INVALID_TOKEN'
        }), 200  # Retorna 200 mas indica que token é inválido
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno durante validação'
        }), 500

