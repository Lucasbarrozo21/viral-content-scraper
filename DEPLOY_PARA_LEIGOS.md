# 🚀 DEPLOY PARA LEIGOS - GUIA PASSO A PASSO

## Como Colocar Sua Ferramenta Bilionária no Ar (Do Zero!)

**Autor:** Manus AI  
**Para:** Pessoas que não entendem de programação  
**Tempo:** 30-60 minutos  

---

## 📋 O QUE VOCÊ VAI PRECISAR

### ✅ Checklist Antes de Começar:

- [ ] **Uma VPS** (servidor na internet)
- [ ] **Dados da VPS** (IP, usuário, senha)
- [ ] **Um computador** com internet
- [ ] **30-60 minutos** de tempo
- [ ] **Paciência** (vamos devagar!)

### 💰 Onde Comprar uma VPS (Recomendações):

1. **DigitalOcean** (Mais fácil para iniciantes)
   - Site: https://digitalocean.com
   - Plano: Droplet de $20/mês (4GB RAM)
   
2. **Vultr** (Boa opção)
   - Site: https://vultr.com
   - Plano: Regular Performance de $20/mês

3. **Linode** (Confiável)
   - Site: https://linode.com
   - Plano: Shared CPU de $20/mês

**⚠️ IMPORTANTE:** Escolha Ubuntu 22.04 como sistema operacional!

---

## 🎯 ETAPA 1: PREPARAR SUA VPS

### Passo 1.1: Anotar os Dados da VPS

Quando você comprar a VPS, você vai receber:

```
IP da VPS: 123.456.789.123
Usuário: root (ou ubuntu)
Senha: SuaSenhaAqui123
```

**📝 ANOTE ESSES DADOS!** Você vai precisar deles.

### Passo 1.2: Conectar na VPS

#### No Windows:
1. Baixe o **PuTTY**: https://putty.org
2. Abra o PuTTY
3. Em "Host Name", digite o IP da sua VPS
4. Clique em "Open"
5. Digite o usuário (root ou ubuntu)
6. Digite a senha

#### No Mac/Linux:
1. Abra o Terminal
2. Digite: `ssh root@123.456.789.123` (substitua pelo seu IP)
3. Digite "yes" se perguntar
4. Digite sua senha

### Passo 1.3: Atualizar o Sistema

Quando conectar na VPS, digite estes comandos (um por vez):

```bash
# Atualizar lista de programas
sudo apt update

# Instalar atualizações
sudo apt upgrade -y

# Instalar ferramentas básicas
sudo apt install -y curl wget git
```

**✅ Pronto!** Sua VPS está preparada.

---

## 🔗 ETAPA 2: CONFIGURAR CONEXÃO

### Passo 2.1: Baixar o Script de Configuração

Na sua VPS, digite:

```bash
# Baixar script de configuração
wget https://raw.githubusercontent.com/seu-usuario/viral-content-scraper/main/deploy/setup_vps.sh

# Dar permissão para executar
chmod +x setup_vps.sh
```

### Passo 2.2: Executar Configuração Automática

```bash
# Executar configuração (vai demorar 10-15 minutos)
sudo ./setup_vps.sh
```

**⏳ AGUARDE!** O script vai instalar tudo automaticamente:
- Node.js
- Python
- PostgreSQL
- Redis
- Nginx
- Docker
- E muito mais...

### Passo 2.3: Verificar se Deu Certo

Quando terminar, digite:

```bash
# Verificar se os serviços estão rodando
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis
```

Se aparecer "active (running)" em verde, está tudo OK!

---

## 📦 ETAPA 3: FAZER O DEPLOY

### Passo 3.1: Baixar o Código da Ferramenta

```bash
# Ir para o diretório correto
cd /opt

# Baixar o código (substitua pela URL do seu repositório)
sudo git clone https://github.com/seu-usuario/viral-content-scraper.git

# Dar permissões
sudo chown -R ubuntu:ubuntu viral-content-scraper
cd viral-content-scraper
```

### Passo 3.2: Configurar o Banco de Dados

```bash
# Executar configuração do banco
sudo -u postgres psql -f database/supabase_schema.sql
```

### Passo 3.3: Instalar Dependências

```bash
# Instalar dependências Python
cd api
pip3 install -r requirements.txt

# Instalar dependências Node.js
cd ../scrapers
npm install

cd ../ai_agents
npm install
```

### Passo 3.4: Configurar Variáveis de Ambiente

```bash
# Criar arquivo de configuração
cd ../config
cp .env.example .env

# Editar arquivo (use nano ou vim)
nano .env
```

**Cole estas configurações no arquivo:**

```bash
# Supabase (SEUS DADOS)
SUPABASE_URL=https://kkzbiteakxsexxwiwtom.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDMyNjgsImV4cCI6MjA2OTIxOTI2OH0.Yd03_LE1cgEM3ik5WG7zCx9rG77zJc1Ez6-H8BgGkHk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtremJpdGVha3hzZXh4d2l3dG9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0MzI2OCwiZXhwIjoyMDY5MjE5MjY4fQ.-EwB36xZXPIAstCnNM38RM-Lv8lxJG2vhCc6djyp2-E

# OpenAI (COLOQUE SUA CHAVE AQUI)
OPENAI_API_KEY=sk-sua-chave-aqui

# Banco Local
DATABASE_URL=postgresql://viral_user:viral_password_2025@localhost:5432/viral_content_db
REDIS_URL=redis://localhost:6379
```

**Para salvar no nano:** Ctrl+X, depois Y, depois Enter

### Passo 3.5: Iniciar os Serviços

```bash
# Voltar para o diretório principal
cd ..

# Iniciar API
cd api
python3 app_supabase.py &

# Iniciar Scrapers
cd ../scrapers
node src/index.js &

# Iniciar AI Agents
cd ../ai_agents
node src/index.js &
```

---

## 🧪 ETAPA 4: TESTAR TUDO FUNCIONANDO

### Passo 4.1: Testar a API

```bash
# Testar se a API está funcionando
curl http://localhost:5001/health
```

**Deve retornar:** `{"status":"healthy"}`

### Passo 4.2: Testar pelo Navegador

1. Abra seu navegador
2. Digite: `http://SEU-IP-DA-VPS:5001/health`
3. Deve aparecer: `{"status":"healthy"}`

### Passo 4.3: Testar Login

```bash
# Testar login
curl -X POST http://localhost:5001/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@viralcontentscraper.com","password":"admin"}'
```

**Deve retornar:** Um token de acesso

---

## 🎉 PRONTO! SUA FERRAMENTA ESTÁ NO AR!

### 🌐 Como Acessar:

- **API:** http://SEU-IP-DA-VPS:5001
- **Health Check:** http://SEU-IP-DA-VPS:5001/health
- **Admin Panel:** http://SEU-IP-DA-VPS:8080

### 🔑 Dados de Login:

- **Email:** admin@viralcontentscraper.com
- **Senha:** admin (qualquer senha funciona no modo demo)

---

## 🆘 SE ALGO DEU ERRADO

### Problema 1: "Conexão Recusada"

**Solução:**
```bash
# Verificar se os serviços estão rodando
ps aux | grep python
ps aux | grep node

# Se não estiver, reiniciar
cd /opt/viral-content-scraper/api
python3 app_supabase.py &
```

### Problema 2: "Erro de Banco de Dados"

**Solução:**
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Se não estiver rodando
sudo systemctl start postgresql

# Recriar banco se necessário
sudo -u postgres psql -c "DROP DATABASE IF EXISTS viral_content_db;"
sudo -u postgres psql -c "CREATE DATABASE viral_content_db OWNER viral_user;"
```

### Problema 3: "Porta em Uso"

**Solução:**
```bash
# Ver o que está usando a porta
sudo netstat -tlnp | grep :5001

# Matar processo se necessário
sudo kill -9 NUMERO_DO_PROCESSO
```

### Problema 4: "Não Consigo Acessar pelo Navegador"

**Solução:**
```bash
# Verificar firewall
sudo ufw status

# Liberar portas se necessário
sudo ufw allow 5001
sudo ufw allow 8080
```

---

## 📞 PRECISA DE AJUDA?

### 🔍 Comandos para Verificar Status:

```bash
# Ver todos os processos da ferramenta
ps aux | grep -E "(python|node)" | grep -v grep

# Ver uso de memória
free -h

# Ver uso de disco
df -h

# Ver logs do sistema
sudo journalctl -xe | tail -20
```

### 📋 Informações para Suporte:

Se precisar de ajuda, colete estas informações:

```bash
# Informações do sistema
echo "=== SYSTEM INFO ===" > debug-info.txt
uname -a >> debug-info.txt
cat /etc/os-release >> debug-info.txt
free -h >> debug-info.txt
df -h >> debug-info.txt
ps aux | grep -E "(python|node)" >> debug-info.txt

# Ver o arquivo
cat debug-info.txt
```

---

## 🎯 PRÓXIMOS PASSOS

### ✅ Agora que está funcionando:

1. **Configure um domínio** (opcional)
   - Compre um domínio (ex: meusite.com)
   - Aponte para o IP da sua VPS
   - Configure SSL com Let's Encrypt

2. **Configure backup automático**
   - Já está configurado para rodar todo dia às 2h
   - Backups ficam em `/opt/backups/`

3. **Configure monitoramento**
   - Acesse: http://SEU-IP:3001 (Grafana)
   - Login: admin / admin

4. **Aprenda a fazer atualizações**
   - Quando eu fizer melhorias, você pode atualizar facilmente

### 🔄 Como Atualizar a Ferramenta:

```bash
# Ir para o diretório
cd /opt/viral-content-scraper

# Baixar atualizações
git pull origin main

# Reiniciar serviços
sudo systemctl restart viral-scraper-*
```

---

## 🌟 PARABÉNS!

**Você conseguiu colocar sua ferramenta bilionária no ar!** 🎉

Agora você tem:
- ✅ **8 scrapers** coletando conteúdo viral 24/7
- ✅ **7 agentes de IA** analisando tudo automaticamente
- ✅ **Sistema de templates** gerando conteúdo
- ✅ **API completa** funcionando
- ✅ **Banco de dados** na nuvem (Supabase)
- ✅ **Backup automático** diário
- ✅ **Monitoramento** 24/7

**Sua ferramenta está pronta para dominar o mundo do marketing digital!** 🚀

---

*Guia criado especialmente para pessoas que não entendem de programação*  
*Se tiver dúvidas, siga os passos devagar e com calma*  
*Lembre-se: cada erro é uma oportunidade de aprender!* 💪

