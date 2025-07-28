"""
VALIDATION UTILITIES
Sistema de validação de dados para a API

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import re
from datetime import datetime
from functools import wraps
from flask import request, jsonify
from urllib.parse import urlparse

class ValidationError(Exception):
    """Exceção personalizada para erros de validação"""
    def __init__(self, message, field=None):
        self.message = message
        self.field = field
        super().__init__(self.message)

class Validator:
    """Classe base para validadores"""
    
    @staticmethod
    def is_string(value, min_length=None, max_length=None, pattern=None):
        """Validar string"""
        if not isinstance(value, str):
            raise ValidationError("Deve ser uma string")
        
        if min_length and len(value) < min_length:
            raise ValidationError(f"Deve ter pelo menos {min_length} caracteres")
        
        if max_length and len(value) > max_length:
            raise ValidationError(f"Deve ter no máximo {max_length} caracteres")
        
        if pattern and not re.match(pattern, value):
            raise ValidationError("Formato inválido")
        
        return True
    
    @staticmethod
    def is_integer(value, min_value=None, max_value=None):
        """Validar inteiro"""
        if not isinstance(value, int):
            try:
                value = int(value)
            except (ValueError, TypeError):
                raise ValidationError("Deve ser um número inteiro")
        
        if min_value is not None and value < min_value:
            raise ValidationError(f"Deve ser maior ou igual a {min_value}")
        
        if max_value is not None and value > max_value:
            raise ValidationError(f"Deve ser menor ou igual a {max_value}")
        
        return True
    
    @staticmethod
    def is_float(value, min_value=None, max_value=None):
        """Validar float"""
        if not isinstance(value, (int, float)):
            try:
                value = float(value)
            except (ValueError, TypeError):
                raise ValidationError("Deve ser um número")
        
        if min_value is not None and value < min_value:
            raise ValidationError(f"Deve ser maior ou igual a {min_value}")
        
        if max_value is not None and value > max_value:
            raise ValidationError(f"Deve ser menor ou igual a {max_value}")
        
        return True
    
    @staticmethod
    def is_boolean(value):
        """Validar boolean"""
        if not isinstance(value, bool):
            if isinstance(value, str):
                if value.lower() in ['true', '1', 'yes', 'on']:
                    return True
                elif value.lower() in ['false', '0', 'no', 'off']:
                    return True
            raise ValidationError("Deve ser um valor booleano")
        
        return True
    
    @staticmethod
    def is_email(value):
        """Validar email"""
        if not isinstance(value, str):
            raise ValidationError("Email deve ser uma string")
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, value):
            raise ValidationError("Formato de email inválido")
        
        return True
    
    @staticmethod
    def is_url(value, schemes=None):
        """Validar URL"""
        if not isinstance(value, str):
            raise ValidationError("URL deve ser uma string")
        
        try:
            parsed = urlparse(value)
            if not parsed.scheme or not parsed.netloc:
                raise ValidationError("URL inválida")
            
            if schemes and parsed.scheme not in schemes:
                raise ValidationError(f"Esquema deve ser um de: {', '.join(schemes)}")
            
        except Exception:
            raise ValidationError("URL inválida")
        
        return True
    
    @staticmethod
    def is_date(value, format='%Y-%m-%d'):
        """Validar data"""
        if isinstance(value, datetime):
            return True
        
        if not isinstance(value, str):
            raise ValidationError("Data deve ser uma string ou objeto datetime")
        
        try:
            datetime.strptime(value, format)
        except ValueError:
            raise ValidationError(f"Data deve estar no formato {format}")
        
        return True
    
    @staticmethod
    def is_in_choices(value, choices):
        """Validar se valor está nas opções"""
        if value not in choices:
            raise ValidationError(f"Deve ser um de: {', '.join(map(str, choices))}")
        
        return True
    
    @staticmethod
    def is_list(value, item_validator=None, min_items=None, max_items=None):
        """Validar lista"""
        if not isinstance(value, list):
            raise ValidationError("Deve ser uma lista")
        
        if min_items is not None and len(value) < min_items:
            raise ValidationError(f"Deve ter pelo menos {min_items} itens")
        
        if max_items is not None and len(value) > max_items:
            raise ValidationError(f"Deve ter no máximo {max_items} itens")
        
        if item_validator:
            for i, item in enumerate(value):
                try:
                    item_validator(item)
                except ValidationError as e:
                    raise ValidationError(f"Item {i}: {e.message}")
        
        return True
    
    @staticmethod
    def is_dict(value, schema=None):
        """Validar dicionário"""
        if not isinstance(value, dict):
            raise ValidationError("Deve ser um objeto")
        
        if schema:
            for key, validator in schema.items():
                if key in value:
                    try:
                        validator(value[key])
                    except ValidationError as e:
                        raise ValidationError(f"Campo '{key}': {e.message}")
        
        return True

def validate_field(value, rules):
    """
    Validar campo individual com regras
    
    Args:
        value: Valor a ser validado
        rules: Dicionário com regras de validação
    """
    # Verificar se é obrigatório
    if rules.get('required', False) and (value is None or value == ''):
        raise ValidationError("Campo obrigatório")
    
    # Se valor é None/vazio e não é obrigatório, pular validação
    if value is None or value == '':
        return True
    
    # Aplicar valor padrão se fornecido
    if value is None and 'default' in rules:
        value = rules['default']
    
    # Validar tipo
    field_type = rules.get('type', 'string')
    
    if field_type == 'string':
        Validator.is_string(
            value,
            min_length=rules.get('min_length'),
            max_length=rules.get('max_length'),
            pattern=rules.get('pattern')
        )
    elif field_type == 'integer':
        Validator.is_integer(
            value,
            min_value=rules.get('min_value'),
            max_value=rules.get('max_value')
        )
    elif field_type == 'float':
        Validator.is_float(
            value,
            min_value=rules.get('min_value'),
            max_value=rules.get('max_value')
        )
    elif field_type == 'boolean':
        Validator.is_boolean(value)
    elif field_type == 'email':
        Validator.is_email(value)
    elif field_type == 'url':
        Validator.is_url(value, schemes=rules.get('schemes'))
    elif field_type == 'date':
        Validator.is_date(value, format=rules.get('format', '%Y-%m-%d'))
    elif field_type == 'list':
        Validator.is_list(
            value,
            item_validator=rules.get('item_validator'),
            min_items=rules.get('min_items'),
            max_items=rules.get('max_items')
        )
    elif field_type == 'dict':
        Validator.is_dict(value, schema=rules.get('schema'))
    
    # Validar choices
    if 'choices' in rules:
        Validator.is_in_choices(value, rules['choices'])
    
    # Validação customizada
    if 'custom_validator' in rules:
        custom_validator = rules['custom_validator']
        if callable(custom_validator):
            custom_validator(value)
    
    return True

def validate_data(data, schema):
    """
    Validar dados completos contra esquema
    
    Args:
        data: Dados a serem validados
        schema: Esquema de validação
    
    Returns:
        dict: Dados validados e processados
    """
    if not isinstance(data, dict):
        raise ValidationError("Dados devem ser um objeto")
    
    validated_data = {}
    errors = {}
    
    # Validar campos do esquema
    for field_name, field_rules in schema.items():
        try:
            value = data.get(field_name)
            
            # Aplicar valor padrão se necessário
            if value is None and 'default' in field_rules:
                value = field_rules['default']
            
            validate_field(value, field_rules)
            validated_data[field_name] = value
            
        except ValidationError as e:
            errors[field_name] = e.message
    
    # Verificar campos extras se não permitidos
    if not schema.get('_allow_extra_fields', False):
        extra_fields = set(data.keys()) - set(schema.keys())
        if extra_fields:
            for field in extra_fields:
                errors[field] = "Campo não permitido"
    
    if errors:
        raise ValidationError("Erros de validação", errors)
    
    return validated_data

def validate_request(schema, location='json'):
    """
    Decorator para validar dados da requisição
    
    Args:
        schema: Esquema de validação
        location: Localização dos dados ('json', 'form', 'args')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Obter dados da requisição
                if location == 'json':
                    data = request.get_json() or {}
                elif location == 'form':
                    data = request.form.to_dict()
                elif location == 'args':
                    data = request.args.to_dict()
                else:
                    return jsonify({
                        'success': False,
                        'error': 'Localização de dados inválida'
                    }), 400
                
                # Validar dados
                validated_data = validate_data(data, schema)
                
                # Adicionar dados validados à requisição
                request.validated_data = validated_data
                
                return f(*args, **kwargs)
                
            except ValidationError as e:
                if hasattr(e, 'field') and isinstance(e.field, dict):
                    # Múltiplos erros
                    return jsonify({
                        'success': False,
                        'error': 'Dados inválidos',
                        'validation_errors': e.field
                    }), 400
                else:
                    # Erro único
                    return jsonify({
                        'success': False,
                        'error': e.message
                    }), 400
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Erro na validação: {str(e)}'
                }), 500
        
        return decorated_function
    return decorator

# Validadores específicos para o domínio

def validate_platform(platform):
    """Validar plataforma social"""
    valid_platforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook']
    if platform.lower() not in valid_platforms:
        raise ValidationError(f"Plataforma deve ser uma de: {', '.join(valid_platforms)}")
    return True

def validate_content_type(content_type):
    """Validar tipo de conteúdo"""
    valid_types = ['post', 'reel', 'story', 'carousel', 'video', 'image', 'article']
    if content_type.lower() not in valid_types:
        raise ValidationError(f"Tipo de conteúdo deve ser um de: {', '.join(valid_types)}")
    return True

def validate_viral_score(score):
    """Validar score viral"""
    if not isinstance(score, (int, float)):
        raise ValidationError("Score viral deve ser um número")
    
    if not 0 <= score <= 100:
        raise ValidationError("Score viral deve estar entre 0 e 100")
    
    return True

def validate_hashtag(hashtag):
    """Validar hashtag"""
    if not isinstance(hashtag, str):
        raise ValidationError("Hashtag deve ser uma string")
    
    # Remover # se presente
    hashtag = hashtag.lstrip('#')
    
    # Validar formato
    if not re.match(r'^[a-zA-Z0-9_]+$', hashtag):
        raise ValidationError("Hashtag deve conter apenas letras, números e underscore")
    
    if len(hashtag) < 1 or len(hashtag) > 100:
        raise ValidationError("Hashtag deve ter entre 1 e 100 caracteres")
    
    return True

def validate_username(username):
    """Validar nome de usuário"""
    if not isinstance(username, str):
        raise ValidationError("Nome de usuário deve ser uma string")
    
    # Remover @ se presente
    username = username.lstrip('@')
    
    # Validar formato básico
    if not re.match(r'^[a-zA-Z0-9._]+$', username):
        raise ValidationError("Nome de usuário deve conter apenas letras, números, pontos e underscore")
    
    if len(username) < 1 or len(username) > 50:
        raise ValidationError("Nome de usuário deve ter entre 1 e 50 caracteres")
    
    return True

def validate_social_media_url(url):
    """Validar URL de rede social"""
    if not isinstance(url, str):
        raise ValidationError("URL deve ser uma string")
    
    # Padrões de URL para diferentes plataformas
    patterns = {
        'instagram': r'https?://(www\.)?instagram\.com/.+',
        'tiktok': r'https?://(www\.)?tiktok\.com/.+',
        'youtube': r'https?://(www\.)?youtube\.com/.+',
        'linkedin': r'https?://(www\.)?linkedin\.com/.+',
        'twitter': r'https?://(www\.)?twitter\.com/.+',
        'facebook': r'https?://(www\.)?facebook\.com/.+'
    }
    
    # Verificar se corresponde a algum padrão
    for platform, pattern in patterns.items():
        if re.match(pattern, url):
            return True
    
    raise ValidationError("URL deve ser de uma rede social suportada")

# Esquemas de validação comuns

PAGINATION_SCHEMA = {
    'page': {'type': 'integer', 'min_value': 1, 'default': 1},
    'limit': {'type': 'integer', 'min_value': 1, 'max_value': 100, 'default': 20},
    'sort_by': {'type': 'string', 'default': 'created_at'},
    'sort_order': {'type': 'string', 'choices': ['asc', 'desc'], 'default': 'desc'}
}

FILTER_SCHEMA = {
    'platform': {'type': 'string', 'custom_validator': validate_platform},
    'content_type': {'type': 'string', 'custom_validator': validate_content_type},
    'min_viral_score': {'type': 'float', 'min_value': 0, 'max_value': 100},
    'max_viral_score': {'type': 'float', 'min_value': 0, 'max_value': 100},
    'date_from': {'type': 'date'},
    'date_to': {'type': 'date'},
    'hashtags': {'type': 'list', 'item_validator': lambda x: validate_hashtag(x)},
    'username': {'type': 'string', 'custom_validator': validate_username}
}

SCRAPING_CONFIG_SCHEMA = {
    'platform': {'type': 'string', 'required': True, 'custom_validator': validate_platform},
    'target_type': {'type': 'string', 'required': True, 'choices': ['hashtag', 'user', 'location', 'trending']},
    'target_value': {'type': 'string', 'required': True},
    'max_posts': {'type': 'integer', 'min_value': 1, 'max_value': 1000, 'default': 100},
    'viral_threshold': {
        'type': 'dict',
        'schema': {
            'min_likes': {'type': 'integer', 'min_value': 0, 'default': 100},
            'min_comments': {'type': 'integer', 'min_value': 0, 'default': 10},
            'min_engagement_rate': {'type': 'float', 'min_value': 0, 'default': 1.0}
        }
    },
    'schedule': {
        'type': 'dict',
        'schema': {
            'enabled': {'type': 'boolean', 'default': False},
            'interval_hours': {'type': 'integer', 'min_value': 1, 'max_value': 168, 'default': 24}
        }
    }
}

ANALYSIS_CONFIG_SCHEMA = {
    'analysis_types': {
        'type': 'list',
        'required': True,
        'item_validator': lambda x: Validator.is_in_choices(x, ['sentiment', 'visual', 'metrics', 'trends'])
    },
    'include_recommendations': {'type': 'boolean', 'default': True},
    'save_results': {'type': 'boolean', 'default': True},
    'notify_on_completion': {'type': 'boolean', 'default': False}
}

