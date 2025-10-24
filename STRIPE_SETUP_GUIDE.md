# 🚀 Guía Completa de Configuración de Stripe

## ✅ Lo que ya está hecho:

1. ✅ Base de datos configurada con tablas de Stripe
2. ✅ API backend implementado (endpoints listos)
3. ✅ Dependencias instaladas (stripe, @stripe/stripe-js)
4. ✅ Variables públicas configuradas en wrangler.jsonc

---

## 🔑 PASO 1: Obtener las claves de Stripe

### A. Crear cuenta en Stripe (si no tienes)
1. Ve a https://dashboard.stripe.com/register
2. Completa el registro

### B. Obtener las claves de TEST

1. Ve a https://dashboard.stripe.com/test/apikeys
2. Copia estas claves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

---

## 🔐 PASO 2: Configurar Secrets en Cloudflare

### Opción A: Localmente (para desarrollo)

Crea un archivo `.dev.vars` en la raíz del proyecto:

```bash
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI
```

### Opción B: En producción (Cloudflare)

Ejecuta estos comandos:

```bash
# Configurar Secret Key
wrangler pages secret put STRIPE_SECRET_KEY
# Cuando te pida el valor, pega: sk_test_...

# Configurar Webhook Secret (lo obtendremos después)
wrangler pages secret put STRIPE_WEBHOOK_SECRET
# Cuando te pida el valor, pega: whsec_...
```

---

## 🎯 PASO 3: Crear Productos en Stripe

### Manualmente en Dashboard:

1. Ve a https://dashboard.stripe.com/test/products
2. Haz clic en "Create product"
3. Crea estos productos:

#### **Plan Free**
- Name: `ValidAI - Free Plan`
- Price: $0/month y $0/year
- Recurring: Monthly y Yearly
- Copia los Price IDs generados

#### **Plan Starter**
- Name: `ValidAI - Starter Plan`
- Price: $29/month y $290/year
- Recurring: Monthly y Yearly
- Copia los Price IDs generados

#### **Plan Pro**
- Name: `ValidAI - Pro Plan`
- Price: $99/month y $990/year
- Recurring: Monthly y Yearly
- Copia los Price IDs generados

#### **Plan Enterprise**
- Name: `ValidAI - Enterprise Plan`
- Price: $299/month y $2990/year
- Recurring: Monthly y Yearly
- Copia los Price IDs generados

### O automáticamente con script:

Puedes crear un script para automatizar esto. Te daré un ejemplo después.

---

## 📊 PASO 4: Actualizar la Base de Datos con IDs de Stripe

Ejecuta este SQL en tu base de datos:

```sql
-- Actualizar Free Plan
UPDATE pricing_plans 
SET 
  stripe_product_id = 'prod_XXXXXX',
  stripe_price_id_monthly = 'price_XXXXXX',
  stripe_price_id_yearly = 'price_XXXXXX'
WHERE name = 'free';

-- Actualizar Starter Plan
UPDATE pricing_plans 
SET 
  stripe_product_id = 'prod_XXXXXX',
  stripe_price_id_monthly = 'price_XXXXXX',
  stripe_price_id_yearly = 'price_XXXXXX'
WHERE name = 'starter';

-- Actualizar Pro Plan
UPDATE pricing_plans 
SET 
  stripe_product_id = 'prod_XXXXXX',
  stripe_price_id_monthly = 'price_XXXXXX',
  stripe_price_id_yearly = 'price_XXXXXX'
WHERE name = 'pro';

-- Actualizar Enterprise Plan
UPDATE pricing_plans 
SET 
  stripe_product_id = 'prod_XXXXXX',
  stripe_price_id_monthly = 'price_XXXXXX',
  stripe_price_id_yearly = 'price_XXXXXX'
WHERE name = 'enterprise';
```

Comando para ejecutar:
```bash
wrangler d1 execute webapp-production --local --command="UPDATE pricing_plans SET stripe_price_id_monthly='price_XXXXX' WHERE name='starter';"
```

---

## 🔔 PASO 5: Configurar Webhooks

### A. Obtener el webhook secret

1. Ve a https://dashboard.stripe.com/test/webhooks
2. Haz clic en "Add endpoint"
3. URL del endpoint: `https://tu-dominio.pages.dev/api/stripe/webhook`
4. Selecciona estos eventos:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Copia el "Signing secret" (whsec_...)
6. Guárdalo como secret:
   ```bash
   wrangler pages secret put STRIPE_WEBHOOK_SECRET
   ```

### B. Para pruebas locales (Stripe CLI)

```bash
# Instalar Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe
# Linux: wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz

# Login
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Copiar el webhook secret que te da y ponlo en .dev.vars
```

---

## 🧪 PASO 6: Probar el Sistema

### Test 1: Crear Checkout Session

```bash
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 2,
    "billing_cycle": "monthly"
  }'
```

### Test 2: Simular Pago

1. Abre la URL del checkout que te devuelve el API
2. Usa estas tarjetas de prueba:
   - **Éxito**: 4242 4242 4242 4242
   - **Fallo**: 4000 0000 0000 0002
   - **3D Secure**: 4000 0027 6000 3184
3. Cualquier fecha futura y cualquier CVC

### Test 3: Verificar Webhook

El webhook debería procesarse automáticamente cuando completes el pago.

Verifica en la tabla `stripe_events`:
```bash
wrangler d1 execute webapp-production --local --command="SELECT * FROM stripe_events;"
```

---

## 💻 PASO 7: Integración Frontend

Ya tienes todo listo en el backend. Ahora necesitas agregar los botones de pago en el frontend.

### Ejemplo de botón de pago:

```javascript
async function subscribeToPlan(planId, billingCycle) {
  try {
    // 1. Crear sesión de checkout
    const response = await axios.post('/api/stripe/create-checkout-session', {
      plan_id: planId,
      billing_cycle: billingCycle
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // 2. Redirigir a Stripe Checkout
    window.location.href = response.data.url;
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al procesar pago');
  }
}
```

---

## 📝 PASO 8: Actualizar el Frontend de Pricing

Necesitarás agregar el script de Stripe en las páginas:

```html
<!-- Agregar en el <head> -->
<script src="https://js.stripe.com/v3/"></script>
```

Y en el JavaScript de pricing:

```javascript
// Al hacer clic en "Seleccionar Plan"
async function selectPlan(planId, billingCycle) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('Por favor inicia sesión');
    return;
  }

  try {
    const response = await axios.post('/api/stripe/create-checkout-session', {
      plan_id: planId,
      billing_cycle: billingCycle
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Redirigir a Stripe
    window.location.href = response.data.url;
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al procesar el pago');
  }
}
```

---

## 🔒 Seguridad

### ✅ Lo que ya está implementado:

1. ✅ Verificación de firma de webhook
2. ✅ Idempotencia (evita procesar eventos duplicados)
3. ✅ Autenticación de usuario requerida
4. ✅ Validación de montos
5. ✅ Secrets en variables de entorno

---

## 📊 Monitoreo

### Dashboard de Stripe
- Ve a https://dashboard.stripe.com/test/payments
- Monitorea pagos, suscripciones y webhooks

### Logs en tu Base de Datos
```sql
-- Ver todos los eventos de Stripe procesados
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 10;

-- Ver pagos completados
SELECT * FROM subscription_payments WHERE payment_status = 'completed';

-- Ver usuarios con planes activos
SELECT u.email, pp.display_name, u.plan_status 
FROM users u 
JOIN pricing_plans pp ON u.plan_id = pp.id 
WHERE u.plan_status = 'active';
```

---

## 🚀 Deploy a Producción

### 1. Cambiar a claves de producción

Obtén las claves de producción:
1. Ve a https://dashboard.stripe.com/apikeys (sin /test/)
2. Copia las claves de producción (pk_live_... y sk_live_...)

### 2. Actualizar secrets en producción

```bash
# En producción
wrangler pages secret put STRIPE_SECRET_KEY
# Pega: sk_live_...

wrangler pages secret put STRIPE_WEBHOOK_SECRET
# Pega: whsec_... (de producción)
```

### 3. Actualizar variable pública

En `wrangler.jsonc`:
```json
"vars": {
  "STRIPE_PUBLISHABLE_KEY": "pk_live_TU_CLAVE_AQUI"
}
```

### 4. Deploy

```bash
npm run build
wrangler pages deploy dist
```

---

## 🆘 Troubleshooting

### Error: "No Stripe customer ID"
- Verifica que el usuario tenga cuenta en tu sistema
- El customer ID se crea automáticamente en el primer pago

### Error: "Webhook signature verification failed"
- Verifica que el STRIPE_WEBHOOK_SECRET esté configurado
- Asegúrate de usar el secret correcto (test vs producción)

### Error: "Plan not found"
- Verifica que los planes existan en la base de datos
- Verifica que tengan los stripe_price_id configurados

### Pagos no se procesan
- Revisa los logs de webhooks en Stripe Dashboard
- Verifica que el endpoint webhook sea accesible públicamente
- Revisa la tabla `stripe_events` para ver si se recibieron

---

## 📚 Recursos

- **Stripe Docs**: https://stripe.com/docs
- **Testing**: https://stripe.com/docs/testing
- **Webhooks**: https://stripe.com/docs/webhooks
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

---

## ✅ Checklist Final

Antes de lanzar a producción:

- [ ] Claves de Stripe configuradas (test y producción)
- [ ] Productos creados en Stripe
- [ ] Base de datos actualizada con Price IDs
- [ ] Webhooks configurados
- [ ] Probado con tarjetas de prueba
- [ ] Frontend integrado
- [ ] Error handling probado
- [ ] Logs y monitoreo funcionando
- [ ] Política de reembolsos definida
- [ ] Términos de servicio actualizados

---

¿Necesitas ayuda con algún paso específico?
