"""
SISTEMA DE ARMAZENAMENTO DE ARQUIVOS
Gerenciador completo para mídia, assets e arquivos do sistema

Autor: Manus AI
Data: 27 de Janeiro de 2025
"""

import os
import shutil
import hashlib
import mimetypes
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Union
import logging
import json
from PIL import Image, ImageOps
import requests
from urllib.parse import urlparse
import asyncio
import aiohttp
import aiofiles

logger = logging.getLogger(__name__)

class FileManager:
    def __init__(self, config):
        self.config = config
        
        # Diretórios base
        self.base_path = Path(config.get('storage_path', '/home/ubuntu/viral_content_scraper/storage'))
        self.media_path = self.base_path / 'media'
        self.cache_path = self.base_path / 'cache'
        self.archives_path = self.base_path / 'archives'
        self.temp_path = self.base_path / 'temp'
        
        # Configurações
        self.max_file_size = config.get('max_file_size_mb', 100) * 1024 * 1024  # MB para bytes
        self.allowed_extensions = config.get('allowed_extensions', {
            'images': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
            'videos': ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'],
            'audio': ['.mp3', '.wav', '.aac', '.ogg', '.m4a'],
            'documents': ['.pdf', '.doc', '.docx', '.txt', '.md', '.json', '.csv']
        })
        
        # Configurações de thumbnails
        self.thumbnail_sizes = config.get('thumbnail_sizes', {
            'small': (150, 150),
            'medium': (300, 300),
            'large': (600, 600)
        })
        
        # Criar diretórios
        self._create_directories()
        
        # Estatísticas
        self.stats = {
            'files_uploaded': 0,
            'files_downloaded': 0,
            'files_deleted': 0,
            'bytes_stored': 0,
            'cache_hits': 0,
            'cache_misses': 0
        }
    
    def _create_directories(self):
        """Cria estrutura de diretórios"""
        directories = [
            self.base_path,
            self.media_path,
            self.cache_path,
            self.archives_path,
            self.temp_path,
            self.media_path / 'images',
            self.media_path / 'videos',
            self.media_path / 'audio',
            self.media_path / 'documents',
            self.media_path / 'thumbnails',
            self.cache_path / 'scraped_content',
            self.cache_path / 'analysis_results',
            self.archives_path / 'old_content',
            self.temp_path / 'downloads'
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            
        logger.info(f"Estrutura de diretórios criada em {self.base_path}")
    
    def _get_file_hash(self, file_path: Path) -> str:
        """Calcula hash SHA256 do arquivo"""
        sha256_hash = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    
    def _get_file_type(self, file_path: Path) -> str:
        """Determina tipo do arquivo baseado na extensão"""
        extension = file_path.suffix.lower()
        
        for file_type, extensions in self.allowed_extensions.items():
            if extension in extensions:
                return file_type
        
        return 'unknown'
    
    def _generate_unique_filename(self, original_name: str, directory: Path) -> str:
        """Gera nome único para arquivo"""
        name = Path(original_name)
        base_name = name.stem
        extension = name.suffix
        
        counter = 1
        new_name = original_name
        
        while (directory / new_name).exists():
            new_name = f"{base_name}_{counter}{extension}"
            counter += 1
        
        return new_name
    
    def save_file(self, file_data: Union[bytes, str], filename: str, 
                  file_type: str = None, metadata: Dict = None) -> Dict:
        """Salva arquivo no sistema"""
        try:
            # Determinar tipo se não fornecido
            if file_type is None:
                file_type = self._get_file_type(Path(filename))
            
            # Determinar diretório de destino
            if file_type in ['images', 'videos', 'audio', 'documents']:
                target_dir = self.media_path / file_type
            else:
                target_dir = self.media_path
            
            # Gerar nome único
            unique_filename = self._generate_unique_filename(filename, target_dir)
            file_path = target_dir / unique_filename
            
            # Verificar tamanho se for bytes
            if isinstance(file_data, bytes) and len(file_data) > self.max_file_size:
                raise ValueError(f"Arquivo muito grande: {len(file_data)} bytes (máximo: {self.max_file_size})")
            
            # Salvar arquivo
            if isinstance(file_data, bytes):
                with open(file_path, 'wb') as f:
                    f.write(file_data)
            else:
                # Assumir que é caminho para arquivo existente
                shutil.copy2(file_data, file_path)
            
            # Calcular hash e tamanho
            file_hash = self._get_file_hash(file_path)
            file_size = file_path.stat().st_size
            
            # Criar thumbnails para imagens
            thumbnails = {}
            if file_type == 'images':
                thumbnails = self._create_thumbnails(file_path)
            
            # Metadados do arquivo
            file_metadata = {
                'filename': unique_filename,
                'original_filename': filename,
                'file_path': str(file_path),
                'file_type': file_type,
                'file_size': file_size,
                'file_hash': file_hash,
                'mime_type': mimetypes.guess_type(str(file_path))[0],
                'created_at': datetime.now().isoformat(),
                'thumbnails': thumbnails,
                'custom_metadata': metadata or {}
            }
            
            # Salvar metadados
            metadata_file = file_path.with_suffix(file_path.suffix + '.meta.json')
            with open(metadata_file, 'w') as f:
                json.dump(file_metadata, f, indent=2)
            
            # Atualizar estatísticas
            self.stats['files_uploaded'] += 1
            self.stats['bytes_stored'] += file_size
            
            logger.info(f"Arquivo salvo: {unique_filename} ({file_size} bytes)")
            
            return {
                'success': True,
                'file_id': file_hash,
                'metadata': file_metadata
            }
            
        except Exception as e:
            logger.error(f"Erro ao salvar arquivo {filename}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_thumbnails(self, image_path: Path) -> Dict:
        """Cria thumbnails para imagem"""
        thumbnails = {}
        
        try:
            with Image.open(image_path) as img:
                # Corrigir orientação EXIF
                img = ImageOps.exif_transpose(img)
                
                # Converter para RGB se necessário
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                for size_name, (width, height) in self.thumbnail_sizes.items():
                    # Criar thumbnail mantendo proporção
                    thumbnail = img.copy()
                    thumbnail.thumbnail((width, height), Image.Resampling.LANCZOS)
                    
                    # Salvar thumbnail
                    thumb_filename = f"{image_path.stem}_{size_name}.jpg"
                    thumb_path = self.media_path / 'thumbnails' / thumb_filename
                    
                    thumbnail.save(thumb_path, 'JPEG', quality=85, optimize=True)
                    
                    thumbnails[size_name] = {
                        'filename': thumb_filename,
                        'path': str(thumb_path),
                        'size': thumbnail.size,
                        'file_size': thumb_path.stat().st_size
                    }
            
            logger.debug(f"Thumbnails criados para {image_path.name}")
            
        except Exception as e:
            logger.error(f"Erro ao criar thumbnails para {image_path}: {e}")
        
        return thumbnails
    
    async def download_file(self, url: str, filename: str = None, 
                           file_type: str = None, metadata: Dict = None) -> Dict:
        """Baixa arquivo de URL"""
        try:
            # Gerar filename se não fornecido
            if filename is None:
                parsed_url = urlparse(url)
                filename = Path(parsed_url.path).name or 'downloaded_file'
            
            # Diretório temporário para download
            temp_file = self.temp_path / 'downloads' / filename
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        raise Exception(f"HTTP {response.status}: {response.reason}")
                    
                    # Verificar tamanho
                    content_length = response.headers.get('content-length')
                    if content_length and int(content_length) > self.max_file_size:
                        raise ValueError(f"Arquivo muito grande: {content_length} bytes")
                    
                    # Baixar arquivo
                    async with aiofiles.open(temp_file, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            await f.write(chunk)
            
            # Mover para local definitivo
            result = self.save_file(str(temp_file), filename, file_type, metadata)
            
            # Limpar arquivo temporário
            if temp_file.exists():
                temp_file.unlink()
            
            if result['success']:
                self.stats['files_downloaded'] += 1
                logger.info(f"Arquivo baixado: {url} -> {filename}")
            
            return result
            
        except Exception as e:
            logger.error(f"Erro ao baixar arquivo {url}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_file(self, file_id: str) -> Optional[Dict]:
        """Obtém arquivo por ID (hash)"""
        try:
            # Buscar em todos os diretórios de mídia
            for media_type in ['images', 'videos', 'audio', 'documents']:
                media_dir = self.media_path / media_type
                
                for metadata_file in media_dir.glob('*.meta.json'):
                    try:
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                            
                        if metadata.get('file_hash') == file_id:
                            # Verificar se arquivo ainda existe
                            file_path = Path(metadata['file_path'])
                            if file_path.exists():
                                return metadata
                            else:
                                logger.warning(f"Arquivo não encontrado: {file_path}")
                                return None
                                
                    except Exception as e:
                        logger.debug(f"Erro ao ler metadata {metadata_file}: {e}")
                        continue
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao buscar arquivo {file_id}: {e}")
            return None
    
    def delete_file(self, file_id: str) -> bool:
        """Remove arquivo do sistema"""
        try:
            metadata = self.get_file(file_id)
            if not metadata:
                return False
            
            file_path = Path(metadata['file_path'])
            
            # Remover arquivo principal
            if file_path.exists():
                file_path.unlink()
            
            # Remover metadados
            metadata_file = file_path.with_suffix(file_path.suffix + '.meta.json')
            if metadata_file.exists():
                metadata_file.unlink()
            
            # Remover thumbnails se existirem
            thumbnails = metadata.get('thumbnails', {})
            for thumb_info in thumbnails.values():
                thumb_path = Path(thumb_info['path'])
                if thumb_path.exists():
                    thumb_path.unlink()
            
            # Atualizar estatísticas
            self.stats['files_deleted'] += 1
            self.stats['bytes_stored'] -= metadata.get('file_size', 0)
            
            logger.info(f"Arquivo removido: {metadata['filename']}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao remover arquivo {file_id}: {e}")
            return False
    
    def list_files(self, file_type: str = None, limit: int = 100, 
                   offset: int = 0, sort_by: str = 'created_at') -> Dict:
        """Lista arquivos do sistema"""
        try:
            files = []
            
            # Determinar diretórios para buscar
            if file_type and file_type in ['images', 'videos', 'audio', 'documents']:
                search_dirs = [self.media_path / file_type]
            else:
                search_dirs = [
                    self.media_path / 'images',
                    self.media_path / 'videos',
                    self.media_path / 'audio',
                    self.media_path / 'documents'
                ]
            
            # Coletar metadados
            for search_dir in search_dirs:
                for metadata_file in search_dir.glob('*.meta.json'):
                    try:
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                        
                        # Verificar se arquivo ainda existe
                        file_path = Path(metadata['file_path'])
                        if file_path.exists():
                            files.append(metadata)
                    except:
                        continue
            
            # Ordenar
            if sort_by == 'created_at':
                files.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            elif sort_by == 'file_size':
                files.sort(key=lambda x: x.get('file_size', 0), reverse=True)
            elif sort_by == 'filename':
                files.sort(key=lambda x: x.get('filename', ''))
            
            # Aplicar paginação
            total_files = len(files)
            paginated_files = files[offset:offset + limit]
            
            return {
                'files': paginated_files,
                'total': total_files,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_files
            }
            
        except Exception as e:
            logger.error(f"Erro ao listar arquivos: {e}")
            return {
                'files': [],
                'total': 0,
                'limit': limit,
                'offset': offset,
                'has_more': False,
                'error': str(e)
            }
    
    def cleanup_temp_files(self, max_age_hours: int = 24) -> int:
        """Remove arquivos temporários antigos"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
            removed_count = 0
            
            for temp_file in self.temp_path.rglob('*'):
                if temp_file.is_file():
                    file_time = datetime.fromtimestamp(temp_file.stat().st_mtime)
                    
                    if file_time < cutoff_time:
                        temp_file.unlink()
                        removed_count += 1
            
            logger.info(f"Removidos {removed_count} arquivos temporários")
            return removed_count
            
        except Exception as e:
            logger.error(f"Erro na limpeza de arquivos temporários: {e}")
            return 0
    
    def cleanup_orphaned_files(self) -> int:
        """Remove arquivos órfãos (sem metadados)"""
        try:
            removed_count = 0
            
            # Buscar em diretórios de mídia
            for media_type in ['images', 'videos', 'audio', 'documents']:
                media_dir = self.media_path / media_type
                
                # Coletar arquivos de metadados
                metadata_files = set()
                for meta_file in media_dir.glob('*.meta.json'):
                    try:
                        with open(meta_file, 'r') as f:
                            metadata = json.load(f)
                        
                        original_file = Path(metadata['file_path'])
                        metadata_files.add(original_file.name)
                    except:
                        continue
                
                # Verificar arquivos sem metadados
                for file_path in media_dir.iterdir():
                    if file_path.is_file() and not file_path.name.endswith('.meta.json'):
                        if file_path.name not in metadata_files:
                            file_path.unlink()
                            removed_count += 1
                            logger.debug(f"Arquivo órfão removido: {file_path}")
            
            logger.info(f"Removidos {removed_count} arquivos órfãos")
            return removed_count
            
        except Exception as e:
            logger.error(f"Erro na limpeza de arquivos órfãos: {e}")
            return 0
    
    def get_storage_stats(self) -> Dict:
        """Obtém estatísticas de armazenamento"""
        try:
            stats = {
                'total_files': 0,
                'total_size_bytes': 0,
                'by_type': {},
                'directory_sizes': {},
                'manager_stats': self.stats.copy()
            }
            
            # Analisar cada tipo de mídia
            for media_type in ['images', 'videos', 'audio', 'documents']:
                media_dir = self.media_path / media_type
                
                type_stats = {
                    'file_count': 0,
                    'total_size': 0,
                    'average_size': 0
                }
                
                sizes = []
                for file_path in media_dir.iterdir():
                    if file_path.is_file() and not file_path.name.endswith('.meta.json'):
                        file_size = file_path.stat().st_size
                        type_stats['file_count'] += 1
                        type_stats['total_size'] += file_size
                        sizes.append(file_size)
                
                if sizes:
                    type_stats['average_size'] = sum(sizes) / len(sizes)
                
                stats['by_type'][media_type] = type_stats
                stats['total_files'] += type_stats['file_count']
                stats['total_size_bytes'] += type_stats['total_size']
            
            # Tamanhos de diretórios
            for directory in [self.media_path, self.cache_path, self.archives_path, self.temp_path]:
                if directory.exists():
                    dir_size = sum(f.stat().st_size for f in directory.rglob('*') if f.is_file())
                    stats['directory_sizes'][directory.name] = {
                        'size_bytes': dir_size,
                        'size_human': self._format_bytes(dir_size)
                    }
            
            # Formatação humana
            stats['total_size_human'] = self._format_bytes(stats['total_size_bytes'])
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
            return {}
    
    def _format_bytes(self, bytes_value: int) -> str:
        """Formata bytes em formato legível"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.1f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.1f} PB"
    
    def archive_old_files(self, days_old: int = 90) -> int:
        """Arquiva arquivos antigos"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            archived_count = 0
            
            # Criar diretório de arquivo por data
            archive_dir = self.archives_path / f"archive_{datetime.now().strftime('%Y%m%d')}"
            archive_dir.mkdir(exist_ok=True)
            
            # Buscar arquivos antigos
            for media_type in ['images', 'videos', 'audio', 'documents']:
                media_dir = self.media_path / media_type
                type_archive_dir = archive_dir / media_type
                type_archive_dir.mkdir(exist_ok=True)
                
                for metadata_file in media_dir.glob('*.meta.json'):
                    try:
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                        
                        created_at = datetime.fromisoformat(metadata['created_at'])
                        
                        if created_at < cutoff_date:
                            # Mover arquivo e metadados
                            file_path = Path(metadata['file_path'])
                            
                            if file_path.exists():
                                new_file_path = type_archive_dir / file_path.name
                                new_metadata_path = type_archive_dir / metadata_file.name
                                
                                shutil.move(str(file_path), str(new_file_path))
                                shutil.move(str(metadata_file), str(new_metadata_path))
                                
                                # Mover thumbnails se existirem
                                thumbnails = metadata.get('thumbnails', {})
                                for thumb_info in thumbnails.values():
                                    thumb_path = Path(thumb_info['path'])
                                    if thumb_path.exists():
                                        new_thumb_path = type_archive_dir / thumb_path.name
                                        shutil.move(str(thumb_path), str(new_thumb_path))
                                
                                archived_count += 1
                                
                    except Exception as e:
                        logger.debug(f"Erro ao arquivar {metadata_file}: {e}")
                        continue
            
            logger.info(f"Arquivados {archived_count} arquivos antigos")
            return archived_count
            
        except Exception as e:
            logger.error(f"Erro no arquivamento: {e}")
            return 0

# CLI para gerenciar arquivos
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Gerenciador de Arquivos')
    parser.add_argument('command', choices=['list', 'stats', 'cleanup', 'archive'])
    parser.add_argument('--type', help='Tipo de arquivo (images, videos, audio, documents)')
    parser.add_argument('--days', type=int, default=90, help='Dias para arquivamento')
    
    args = parser.parse_args()
    
    config = {
        'storage_path': '/home/ubuntu/viral_content_scraper/storage',
        'max_file_size_mb': 100
    }
    
    manager = FileManager(config)
    
    try:
        if args.command == 'list':
            result = manager.list_files(file_type=args.type)
            print(f"Total de arquivos: {result['total']}")
            for file_info in result['files'][:10]:  # Mostrar primeiros 10
                print(f"  {file_info['filename']} ({manager._format_bytes(file_info['file_size'])})")
        
        elif args.command == 'stats':
            stats = manager.get_storage_stats()
            print("Estatísticas de Armazenamento:")
            print(f"  Total de arquivos: {stats['total_files']}")
            print(f"  Tamanho total: {stats['total_size_human']}")
            print("\nPor tipo:")
            for file_type, type_stats in stats['by_type'].items():
                print(f"  {file_type}: {type_stats['file_count']} arquivos, {manager._format_bytes(type_stats['total_size'])}")
        
        elif args.command == 'cleanup':
            temp_removed = manager.cleanup_temp_files()
            orphaned_removed = manager.cleanup_orphaned_files()
            print(f"Limpeza concluída:")
            print(f"  Arquivos temporários removidos: {temp_removed}")
            print(f"  Arquivos órfãos removidos: {orphaned_removed}")
        
        elif args.command == 'archive':
            archived = manager.archive_old_files(args.days)
            print(f"Arquivados {archived} arquivos com mais de {args.days} dias")
    
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == '__main__':
    main()

