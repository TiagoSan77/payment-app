# PIX MercadoPago App

Uma API REST para gerenciar pagamentos PIX via MercadoPago com autenticação Firebase.

## 🚀 Como Rodar

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

O servidor estará disponível em: `http://localhost:3000`

## 📋 Variáveis de Ambiente

Configure o arquivo `.env` com suas credenciais:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seu-projeto.iam.gserviceaccount.com

# MercadoPago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-sua-access-token
```

## 🔗 Rotas Disponíveis

### 🔐 Autenticação

#### 1. Registrar Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "message": "Usuário criado com sucesso",
  "uid": "user_uid_aqui",
  "email": "usuario@exemplo.com"
}
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "uid": "user_uid_aqui",
  "email": "usuario@exemplo.com",
  "customToken": "custom_token_aqui",
  "note": "Use este customToken para fazer login no frontend com signInWithCustomToken"
}
```

#### 3. Obter Informações do Usuário (🔒 Protegida)
```bash
curl -X GET http://localhost:3000/api/auth/user/USER_UID_AQUI \
  -H "Authorization: Bearer SEU_ID_TOKEN_JWT"
```

**Resposta:**
```json
{
  "uid": "user_uid_aqui",
  "email": "usuario@exemplo.com",
  "emailVerified": false,
  "disabled": false,
  "creationTime": "2025-01-01T00:00:00.000Z",
  "lastSignInTime": "2025-01-01T00:00:00.000Z"
}
```

### 💳 Pagamentos PIX

#### 4. Criar Pagamento PIX (🔒 Protegida)
```bash
curl -X POST http://localhost:3000/api/create_pix_payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ID_TOKEN_JWT" \
  -d '{
    "transaction_amount": 100.50,
    "description": "Pagamento de teste PIX",
    "payment_method_id": "pix",
    "payer": {
      "email": "pagador@exemplo.com"
    },
    "notification_url": "https://seudominio.com/webhook"
  }'
```

**Resposta:**
```json
{
  "id": 12345678,
  "status": "pending",
  "transaction_amount": 100.50,
  "description": "Pagamento de teste PIX",
  "payment_method_id": "pix",
  "point_of_interaction": {
    "transaction_data": {
      "qr_code": "00020126580014br.gov.bcb.pix...",
      "qr_code_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  }
}
```

#### 5. Webhook MercadoPago (🌐 Pública)
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345678,
    "live_mode": false,
    "type": "payment",
    "date_created": "2025-01-01T00:00:00.000Z",
    "application_id": 123456789,
    "user_id": 987654321,
    "version": 1,
    "api_version": "v1",
    "action": "payment.updated",
    "data": {
      "id": "12345678"
    }
  }'
```

**Resposta:**
```
Webhook recebido com sucesso
```

## 🔑 Autenticação

### Fluxo de Autenticação

1. **Registrar** usuário → `/api/auth/register`
2. **Fazer login** → `/api/auth/login` (recebe `customToken`)
3. **No frontend**: usar `customToken` com `signInWithCustomToken()` para obter `idToken`
4. **Usar** `idToken` nas rotas protegidas

### Headers de Autenticação

Para rotas protegidas, inclua o header:
```
Authorization: Bearer SEU_ID_TOKEN_JWT
```

## 📁 Estrutura do Projeto

```
src/
├── config/
│   └── firebase.ts          # Configuração Firebase Admin
├── controllers/
│   ├── Payments.ts          # Controlador de pagamentos
│   └── UserController.ts    # Controlador de autenticação
├── routes/
│   ├── authRoutes.ts        # Rotas de autenticação
│   ├── paymentRoutes.ts     # Rotas de pagamento
│   └── index.ts             # Agregador de rotas
└── server.ts                # Servidor principal
```

## ⚠️ Observações Importantes

- ✅ **Rotas protegidas**: Requerem token JWT válido
- 🌐 **Webhook público**: MercadoPago precisa acessar sem autenticação
- 🔐 **Credenciais**: Nunca commite o arquivo `.env`
- 📱 **Frontend**: Use `signInWithCustomToken()` para obter `idToken`

## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Firebase Admin SDK** - Autenticação
- **MercadoPago SDK** - Pagamentos PIX
- **MongoDB** + **Mongoose** - Banco de dados

## 📧 Suporte

Para dúvidas sobre integração, consulte:
- [Documentação MercadoPago](https://www.mercadopago.com.br/developers)
- [Documentação Firebase](https://firebase.google.com/docs/admin/setup)
