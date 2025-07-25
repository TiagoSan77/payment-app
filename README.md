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

#### 5. Consultar Pagamento por ID (🔒 Protegida)
```bash
curl -X GET http://localhost:3000/api/payment/12345678 \
  -H "Authorization: Bearer SEU_ID_TOKEN_JWT"
```

**Resposta:**
```json
{
  "local": {
    "_id": "507f1f77bcf86cd799439011",
    "mercadoPagoId": "12345678",
    "status": "approved",
    "transactionAmount": 100.50,
    "payerEmail": "pagador@exemplo.com",
    "dateCreated": "2025-01-01T00:00:00.000Z",
    "dateApproved": "2025-01-01T00:05:00.000Z"
  },
  "mercadoPago": {
    "id": 12345678,
    "status": "approved",
    "transaction_amount": 100.50,
    "description": "Pagamento de teste PIX"
  },
  "synchronized": true
}
```

#### 6. Listar Pagamentos (🔒 Protegida)
```bash
# Listar todos os pagamentos
curl -X GET http://localhost:3000/api/payments \
  -H "Authorization: Bearer SEU_ID_TOKEN_JWT"

# Filtrar por email
curl -X GET "http://localhost:3000/api/payments?email=pagador@exemplo.com" \
  -H "Authorization: Bearer SEU_ID_TOKEN_JWT"

# Filtrar por status
curl -X GET "http://localhost:3000/api/payments?status=approved" \
  -H "Authorization: Bearer SEU_ID_TOKEN_JWT"

# Filtros combinados
curl -X GET "http://localhost:3000/api/payments?email=pagador@exemplo.com&status=approved" \
  -H "Authorization: Bearer SEU_ID_TOKEN_JWT"
```

**Resposta:**
```json
{
  "total": 2,
  "payments": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "mercadoPagoId": "12345678",
      "status": "approved",
      "statusDetail": "accredited",
      "transactionAmount": 100.50,
      "description": "Pagamento de teste PIX",
      "paymentMethodId": "pix",
      "payerEmail": "pagador@exemplo.com",
      "dateCreated": "2025-01-01T00:00:00.000Z",
      "dateApproved": "2025-01-01T00:05:00.000Z",
      "processedAt": "2025-01-01T00:05:10.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "mercadoPagoId": "87654321",
      "status": "pending",
      "transactionAmount": 50.25,
      "description": "Outro pagamento",
      "paymentMethodId": "pix",
      "payerEmail": "pagador@exemplo.com",
      "dateCreated": "2025-01-01T01:00:00.000Z"
    }
  ]
}
```

#### 7. Webhook MercadoPago (🌐 Pública)
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
Webhook processado com sucesso
```

### 🔄 Fluxo Completo de Pagamento

1. **Criar pagamento PIX** → `/api/create_pix_payment`
2. **Cliente escaneia QR Code** (do campo `qr_code_base64`)
3. **MercadoPago envia webhook** → `/api/webhook` (automático)
4. **Sistema processa pagamento** baseado no status:
   - ✅ **approved**: Pagamento confirmado → libera produto/serviço
   - ⏳ **pending**: Aguardando confirmação
   - ❌ **rejected**: Pagamento rejeitado
   - 🚫 **cancelled**: Pagamento cancelado
5. **Consultar status** → `/api/payment/:id` ou `/api/payments`

### 📱 Verificação de Status no Frontend

#### **Opção 1: Polling (Simples)**
```javascript
// Verificar status a cada 3 segundos
async function checkPaymentStatus(paymentId, idToken) {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/payment/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      const data = await response.json();
      
      if (data.local?.status === 'approved') {
        console.log('✅ Pagamento aprovado!');
        clearInterval(interval);
        // Redirecionar para sucesso
        window.location.href = '/sucesso';
      } else if (data.local?.status === 'rejected') {
        console.log('❌ Pagamento rejeitado');
        clearInterval(interval);
        alert('Pagamento rejeitado');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  }, 3000);
  
  // Para após 5 minutos
  setTimeout(() => clearInterval(interval), 300000);
}
```

#### **Opção 2: WebSockets (Recomendado para produção)**
Para notificações em tempo real, considere implementar WebSockets:
- Cliente conecta via WebSocket após criar pagamento
- Webhook notifica cliente instantaneamente via WebSocket
- Elimina necessidade de polling

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

## ⚙️ Processamento Automático de Webhooks

Quando o MercadoPago envia um webhook, o sistema automaticamente:

### ✅ **Pagamento Aprovado**
```
🔔 Webhook recebido
📊 Busca detalhes do pagamento
💾 Salva/atualiza no banco de dados
🎉 Log: "PAGAMENTO APROVADO! ID: 12345678"
💰 Log: "Valor: R$ 100.50"
📧 Log: "Pagador: cliente@email.com"
✅ Pronto para: enviar email, liberar produto, atualizar pedido
```

### ⏳ **Pagamento Pendente**
```
📋 Salva como pendente no banco
📬 Pronto para notificar cliente sobre aguardo
```

### ❌ **Pagamento Rejeitado**
```
📄 Registra motivo da rejeição
📧 Pronto para notificar cliente sobre falha
```

### 🚫 **Pagamento Cancelado**
```
🧹 Registra cancelamento
� Pronto para liberar reservas/estoque
```

## �📁 Estrutura do Projeto

```
src/
├── config/
│   └── firebase.ts          # Configuração Firebase Admin
├── controllers/
│   ├── PaymentsNew.ts       # Controlador completo de pagamentos
│   └── UserController.ts    # Controlador de autenticação
├── models/
│   └── Payment.ts           # Model MongoDB para pagamentos
├── routes/
│   ├── authRoutes.ts        # Rotas de autenticação
│   ├── paymentRoutes.ts     # Rotas de pagamento
│   └── index.ts             # Agregador de rotas
└── index.ts                 # Servidor principal
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
