# Guia de Deploy

## Preparação para Deploy

### 1. Variáveis de Ambiente

Antes de fazer o deploy, certifique-se de configurar todas as variáveis de ambiente necessárias:

#### Variáveis Obrigatórias:

```bash
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY_ID=sua-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua-private-key-aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=seu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# JWT Secret para tokens da API
JWT_SECRET=sua_chave_secreta_super_segura_aqui

# MercadoPago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-sua-access-token-aqui

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Server Configuration
PORT=3000
NODE_ENV=production
```

### 2. Arquivos de Configuração

- ✅ `.env` - Configurações locais (não commitado)
- ✅ `.env.example` - Exemplo de configurações para desenvolvimento
- ✅ `.env.production.example` - Exemplo de configurações para produção
- ✅ `.gitignore` - Exclui arquivos sensíveis do Git

### 3. Segurança

#### Informações removidas do código:
- ❌ String de conexão MongoDB hardcoded
- ❌ Porta hardcoded
- ❌ Arquivo serviceAccountKey.json local

#### Variáveis de ambiente implementadas:
- ✅ `MONGODB_URI` - String de conexão do MongoDB
- ✅ `PORT` - Porta do servidor
- ✅ `NODE_ENV` - Ambiente (development/production)
- ✅ Todas as configurações do Firebase via variáveis
- ✅ Token do MercadoPago via variável

### 4. Deploy em Diferentes Plataformas

#### Heroku:
```bash
heroku config:set MONGODB_URI=sua-uri-mongodb
heroku config:set FIREBASE_PROJECT_ID=seu-project-id
# ... configure todas as outras variáveis
```

#### Vercel:
Adicione as variáveis na interface do Vercel ou via CLI:
```bash
vercel env add MONGODB_URI
vercel env add FIREBASE_PROJECT_ID
# ... configure todas as outras variáveis
```

#### Railway/Render:
Configure as variáveis de ambiente no painel da plataforma.

### 5. Validação Pré-Deploy

Antes de fazer o deploy, verifique:

1. ✅ Todas as variáveis de ambiente estão configuradas
2. ✅ Não há informações sensíveis no código
3. ✅ O arquivo `.env` está no `.gitignore`
4. ✅ O build está funcionando localmente
5. ✅ Os testes estão passando

### 6. Comandos Úteis

```bash
# Verificar se todas as variáveis estão definidas
npm run check-env

# Build para produção
npm run build

# Iniciar em produção
npm start
```

### 7. Monitoramento

Após o deploy, monitore:
- Logs da aplicação
- Conexão com MongoDB
- Autenticação Firebase
- Integração MercadoPago
