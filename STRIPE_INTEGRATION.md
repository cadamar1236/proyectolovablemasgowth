# 💳 Integración de Stripe - Guía de Implementación

## ⚠️ PENDIENTE DE IMPLEMENTACIÓN

Este documento detalla cómo integrar Stripe para procesar pagos en el marketplace.

---

## 📋 Requisitos Previos

1. **Cuenta de Stripe**: https://stripe.com
2. **API Keys**: 
   - Publishable Key (para el frontend)
   - Secret Key (para el backend)
3. **Webhook Secret**: Para verificar eventos de Stripe

---

## 🏗️ Arquitectura Propuesta

### Flujo de Pago

```
Founder crea producto → Validator aplica → Founder aprueba
→ Stripe Checkout Session → Founder paga
→ Webhook confirma pago → Crea contrato
→ Validator trabaja → Completa trabajo
→ Stripe Transfer → Validator recibe pago
```

---

## 🔧 Configuración

### 1. Instalar Dependencias

```bash
npm install stripe
```

### 2. Configurar Variables de Entorno

En `wrangler.jsonc` agregar:

```jsonc
{
  "vars": {
    "STRIPE_PUBLISHABLE_KEY": "pk_test_...",
  },
  // En producción usar secrets:
  // wrangler secret put STRIPE_SECRET_KEY
  // wrangler secret put STRIPE_WEBHOOK_SECRET
}
```

### 3. Crear Cuentas Conectadas (Stripe Connect)

Para que los validadores reciban pagos directamente:

```typescript
// En src/api/marketplace.ts

import Stripe from 'stripe';

// Endpoint para conectar cuenta de Stripe
marketplace.post('/validators/connect-stripe', requireAuth, async (c) => {
  const userId = c.get('userId');
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  
  // Obtener validator
  const validator = await c.env.DB.prepare(
    'SELECT * FROM validators WHERE user_id = ?'
  ).bind(userId).first() as any;
  
  if (!validator) {
    return c.json({ error: 'Validator not found' }, 404);
  }
  
  // Crear cuenta conectada si no existe
  if (!validator.stripe_account_id) {
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        transfers: { requested: true }
      }
    });
    
    await c.env.DB.prepare(
      'UPDATE validators SET stripe_account_id = ? WHERE id = ?'
    ).bind(account.id, validator.id).run();
    
    validator.stripe_account_id = account.id;
  }
  
  // Crear link de onboarding
  const accountLink = await stripe.accountLinks.create({
    account: validator.stripe_account_id,
    refresh_url: `${c.req.url}/refresh`,
    return_url: `${c.req.url}/return`,
    type: 'account_onboarding',
  });
  
  return c.json({ url: accountLink.url });
});
```

---

## 💰 Implementar Pagos

### Paso 1: Crear Checkout Session

```typescript
// Cuando founder aprueba una aplicación
marketplace.post('/applications/:id/approve-with-payment', requireAuth, async (c) => {
  const userId = c.get('userId');
  const applicationId = c.req.param('id');
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  
  // Get application details
  const application = await c.env.DB.prepare(`
    SELECT 
      a.*,
      p.title as product_title,
      p.company_user_id,
      v.stripe_account_id,
      v.user_id as validator_user_id
    FROM applications a
    JOIN beta_products p ON a.product_id = p.id
    JOIN validators v ON a.validator_id = v.id
    WHERE a.id = ?
  `).bind(applicationId).first() as any;
  
  if (!application || application.company_user_id !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  if (!application.stripe_account_id) {
    return c.json({ error: 'Validator must connect Stripe first' }, 400);
  }
  
  // Calculate platform fee (example: 10%)
  const amount = Math.round(application.proposed_rate * application.estimated_hours * 100); // cents
  const platformFee = Math.round(amount * 0.10); // 10% fee
  
  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Validation Service: ${application.product_title}`,
          description: `${application.estimated_hours} hours @ $${application.proposed_rate}/hour`
        },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: application.stripe_account_id,
      },
    },
    success_url: `${c.req.url}?success=true&application_id=${applicationId}`,
    cancel_url: `${c.req.url}?canceled=true`,
    metadata: {
      application_id: applicationId,
      validator_user_id: application.validator_user_id,
      product_id: application.product_id
    }
  });
  
  return c.json({ 
    sessionId: session.id,
    url: session.url 
  });
});
```

### Paso 2: Webhook para Confirmar Pago

```typescript
// Manejar eventos de Stripe
marketplace.post('/webhooks/stripe', async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  const sig = c.req.header('stripe-signature');
  const body = await c.req.text();
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }
  
  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { application_id, product_id, validator_user_id } = session.metadata;
    
    // Approve application
    await c.env.DB.prepare(
      'UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind('approved', application_id).run();
    
    // Create contract
    const application = await c.env.DB.prepare(
      'SELECT * FROM applications WHERE id = ?'
    ).bind(application_id).first() as any;
    
    const totalAmount = (session.amount_total || 0) / 100; // Convert cents to dollars
    
    await c.env.DB.prepare(`
      INSERT INTO contracts (
        application_id, product_id, validator_id,
        start_date, rate, total_amount, status,
        stripe_payment_intent_id
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, 'active', ?)
    `).bind(
      application_id,
      product_id,
      application.validator_id,
      application.proposed_rate,
      totalAmount,
      session.payment_intent
    ).run();
  }
  
  return c.json({ received: true });
});
```

---

## 🎨 Frontend (Stripe Checkout)

```html
<!-- Agregar en <head> del marketplace -->
<script src="https://js.stripe.com/v3/"></script>
```

```javascript
// En marketplace.js

async function approveApplicationWithPayment(applicationId) {
  try {
    const response = await axios.post(
      `/api/marketplace/applications/${applicationId}/approve-with-payment`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    // Redirect to Stripe Checkout
    const stripe = Stripe(STRIPE_PUBLISHABLE_KEY); // Definir esta variable
    await stripe.redirectToCheckout({
      sessionId: response.data.sessionId
    });
    
  } catch (error) {
    console.error('Payment failed:', error);
    showToast('Error al procesar pago', 'error');
  }
}
```

---

## 📊 Gestión de Pagos

### Dashboard para Founders

```javascript
// Ver pagos realizados
marketplace.get('/my-payments', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  const payments = await c.env.DB.prepare(`
    SELECT 
      c.*,
      p.title as product_title,
      u.name as validator_name
    FROM contracts c
    JOIN beta_products p ON c.product_id = p.id
    JOIN validators v ON c.validator_id = v.id
    JOIN users u ON v.user_id = u.id
    WHERE p.company_user_id = ?
    ORDER BY c.created_at DESC
  `).bind(userId).all();
  
  return c.json({ payments: payments.results });
});
```

### Dashboard para Validators

```javascript
// Ver pagos recibidos
marketplace.get('/my-earnings', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  const validator = await c.env.DB.prepare(
    'SELECT id FROM validators WHERE user_id = ?'
  ).bind(userId).first() as any;
  
  const earnings = await c.env.DB.prepare(`
    SELECT 
      c.*,
      p.title as product_title,
      u.name as founder_name
    FROM contracts c
    JOIN beta_products p ON c.product_id = p.id
    JOIN users u ON p.company_user_id = u.id
    WHERE c.validator_id = ?
    ORDER BY c.created_at DESC
  `).bind(validator.id).all();
  
  return c.json({ earnings: earnings.results });
});
```

---

## 🔐 Seguridad

### 1. Verificar Webhooks

```typescript
// SIEMPRE verificar firma de webhook
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

### 2. Validar Montos

```typescript
// Verificar que el monto pagado coincide
if (session.amount_total !== expectedAmount) {
  // Log discrepancy
  console.error('Amount mismatch');
}
```

### 3. Idempotencia

```typescript
// Usar metadata para evitar procesamiento duplicado
const existingContract = await c.env.DB.prepare(
  'SELECT id FROM contracts WHERE stripe_payment_intent_id = ?'
).bind(paymentIntentId).first();

if (existingContract) {
  return c.json({ message: 'Already processed' });
}
```

---

## 🧪 Testing

### Modo Test

```bash
# Usar claves de test
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Tarjetas de Prueba

```
Éxito: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

### Stripe CLI para Webhooks Locales

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:3000/api/marketplace/webhooks/stripe

# Obtener webhook secret
stripe listen --print-secret
```

---

## 💡 Mejoras Futuras

### 1. **Pagos Recurrentes** (Suscripciones)
- Para founders que quieren servicios continuos
- Usar Stripe Subscriptions

### 2. **Pagos Parciales**
- Milestone-based payments
- Liberar fondos por etapas

### 3. **Dispute Management**
- Integrar sistema de disputas
- Escrow payments

### 4. **Invoicing**
- Generar facturas automáticas
- Stripe Invoicing API

### 5. **Multi-Currency**
- Soporte para múltiples monedas
- Conversión automática

---

## 📚 Recursos

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Connect**: https://stripe.com/docs/connect
- **Webhooks**: https://stripe.com/docs/webhooks
- **Testing**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

---

## ⚠️ Notas Importantes

1. **Comisiones**: Definir % de comisión de la plataforma (sugerido: 10-15%)
2. **Impuestos**: Considerar tax handling para diferentes países
3. **Compliance**: Verificar requisitos KYC/AML según región
4. **Refunds**: Implementar política de reembolsos
5. **Soporte**: Tener proceso para resolver disputas de pago

---

## 🚀 Próximos Pasos

1. [ ] Crear cuenta de Stripe
2. [ ] Configurar Stripe Connect
3. [ ] Implementar checkout básico
4. [ ] Configurar webhooks
5. [ ] Testing exhaustivo con tarjetas de prueba
6. [ ] Documentar flujo de pagos para usuarios
7. [ ] Deploy a producción con claves reales
8. [ ] Monitorear transacciones en Stripe Dashboard

---

¿Necesitas ayuda con la implementación? Stripe tiene excelente soporte y documentación.
