# 🚀 Próximos Pasos para Deployment - ValidAI Studio

## ✅ LO QUE YA ESTÁ HECHO

### 1. Sistema de Pagos Stripe Implementado
- ✅ API completo con todos los endpoints
- ✅ Webhooks configurados en el código
- ✅ Base de datos con campos de Stripe
- ✅ Sistema de idempotencia
- ✅ Gestión de clientes automática

### 2. Productos Creados en Stripe
- ✅ Free Plan ($0)
- ✅ Starter Plan ($29/mes, $290/año)
- ✅ Pro Plan ($99/mes, $990/año)
- ✅ Enterprise Plan ($299/mes, $2990/año)

### 3. Base de Datos Local
- ✅ Actualizada con todos los IDs de Stripe
- ✅ Migraciones aplicadas
- ✅ Tablas de eventos y pagos listas

---

## 🔧 PASOS PARA COMPLETAR EL DEPLOYMENT

### **PASO 1: Actualizar Base de Datos Remota**

```bash
# Conectar a la base de datos remota de Cloudflare
wrangler d1 execute webapp-production --remote --file=./update-stripe-ids.sql

# Verificar que se actualizó correctamente
wrangler d1 execute webapp-production --remote --command="SELECT id, name, stripe_product_id, stripe_price_id_monthly FROM pricing_plans;"
```

**Resultado esperado**: Deberías ver los 4 planes con sus IDs de Stripe.

---

### **PASO 2: Configurar Secrets en Cloudflare**

```bash
# 1. Configurar Secret Key
wrangler pages secret put STRIPE_SECRET_KEY

# Cuando te pida el valor, pega tu clave secreta sk_live_...

# 2. Verificar que se configuró
wrangler pages secret list
```

**Resultado esperado**: Deberías ver `STRIPE_SECRET_KEY` en la lista.

---

### **PASO 3: Crear Webhook en Stripe Dashboard**

#### A. Accede a Stripe Dashboard
1. Ve a: https://dashboard.stripe.com/webhooks
2. Haz clic en **"Add endpoint"**

#### B. Configurar Endpoint
```
Endpoint URL: https://TU-DOMINIO.pages.dev/api/stripe/webhook
```

**Reemplaza `TU-DOMINIO` con tu dominio de Cloudflare Pages**

Ejemplo: `https://webapp-xyz.pages.dev/api/stripe/webhook`

#### C. Seleccionar Eventos
Marca estos eventos:
- ✅ `checkout.session.completed`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.deleted`

#### D. Guardar y Copiar Secret
1. Haz clic en **"Add endpoint"**
2. Copia el **Signing secret** (empieza con `whsec_...`)

#### E. Configurar Webhook Secret en Cloudflare
```bash
wrangler pages secret put STRIPE_WEBHOOK_SECRET

# Cuando te pida el valor, pega el whsec_... que copiaste
```

---

### **PASO 4: Deploy a Producción**

```bash
# 1. Build del proyecto
npm run build

# 2. Deploy a Cloudflare Pages
wrangler pages deploy dist

# O si tienes configurado npm script:
npm run deploy
```

**Resultado esperado**: El proyecto se desplegará y obtendrás una URL.

---

### **PASO 5: Verificar que Todo Funciona**

#### A. Verificar API de Stripe
```bash
# Obtener configuración pública
curl https://TU-DOMINIO.pages.dev/api/stripe/config

# Debería devolver:
# {"publishableKey":"pk_live_51QhutTGCWzoDsbCN..."}
```

#### B. Verificar Planes
```bash
curl https://TU-DOMINIO.pages.dev/api/plans

# Debería devolver los 4 planes con sus datos completos
```

#### C. Probar Checkout (requiere estar autenticado)
1. Inicia sesión en tu aplicación
2. Ve a la página de pricing
3. Selecciona un plan
4. Verifica que te redirija a Stripe Checkout

---

## 🧪 TESTING

### Test 1: Crear Sesión de Checkout

```bash
# Necesitarás un token de autenticación válido
curl -X POST https://TU-DOMINIO.pages.dev/api/stripe/create-checkout-session \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 2,
    "billing_cycle": "monthly"
  }'
```

**Resultado esperado**: Deberías obtener un `sessionId` y una `url` de Stripe.

### Test 2: Realizar un Pago de Prueba

**⚠️ IMPORTANTE**: Aunque estás usando claves de PRODUCCIÓN, Stripe tiene un modo de prueba. Para testing real sin cobrar, deberías:

1. Usar tarjetas de prueba de Stripe:
   - **Éxito**: 4242 4242 4242 4242
   - **Fallo**: 4000 0000 0000 0002

2. O crear un producto de $0.01 para testing

### Test 3: Verificar Webhook

1. Realiza un pago de prueba
2. Ve a Stripe Dashboard → Webhooks
3. Verifica que el webhook se disparó correctamente
4. Revisa los logs

---

## 📊 MONITOREO

### En Stripe Dashboard

1. **Pagos**: https://dashboard.stripe.com/payments
   - Ver todos los pagos procesados

2. **Suscripciones**: https://dashboard.stripe.com/subscriptions
   - Ver suscripciones activas/canceladas

3. **Clientes**: https://dashboard.stripe.com/customers
   - Ver clientes creados automáticamente

4. **Webhooks**: https://dashboard.stripe.com/webhooks
   - Ver logs de webhooks
   - Debugging de eventos

### En tu Base de Datos

```sql
-- Ver eventos procesados
SELECT * FROM stripe_events 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver pagos completados
SELECT 
  sp.id,
  sp.amount,
  sp.payment_status,
  u.email,
  pp.display_name as plan
FROM subscription_payments sp
JOIN users u ON sp.user_id = u.id
JOIN pricing_plans pp ON sp.plan_id = pp.id
WHERE sp.payment_status = 'completed'
ORDER BY sp.created_at DESC;

-- Ver usuarios con planes activos
SELECT 
  u.email,
  u.name,
  pp.display_name as plan,
  u.plan_status,
  u.plan_started_at,
  u.plan_expires_at
FROM users u
JOIN pricing_plans pp ON u.plan_id = pp.id
WHERE u.plan_status = 'active'
ORDER BY u.created_at DESC;
```

---

## 🎨 INTEGRACIÓN FRONTEND (OPCIONAL)

Si quieres agregar botones de pago personalizados en el frontend:

```javascript
// Ejemplo: Botón de suscripción
async function subscribeToPlan(planId, billingCycle) {
  try {
    // Obtener token de autenticación
    const token = localStorage.getItem('authToken');
    
    // Crear sesión de checkout
    const response = await axios.post('/api/stripe/create-checkout-session', {
      plan_id: planId,
      billing_cycle: billingCycle
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Redirigir a Stripe Checkout
    window.location.href = response.data.url;
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al procesar el pago');
  }
}
```

---

## 🔐 SEGURIDAD

### Variables de Entorno en .dev.vars (LOCAL)

Tu archivo `.dev.vars` debe contener:

```bash
STRIPE_SECRET_KEY=sk_live_TU_CLAVE_SECRETA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_AQUI
```

**⚠️ NUNCA** subas este archivo a git (ya está en .gitignore).

### Variables en Producción (CLOUDFLARE)

Las claves están como **secrets** en Cloudflare Pages y son:
- ✅ Encriptadas
- ✅ No visibles en el código
- ✅ Solo accesibles por el worker

---

## 🆘 TROUBLESHOOTING

### Error: "Stripe customer not found"
**Solución**: El customer se crea automáticamente en el primer pago. Asegúrate de que el usuario esté autenticado.

### Error: "Invalid API key"
**Solución**: 
1. Verifica que `STRIPE_SECRET_KEY` esté configurado en Cloudflare
2. Usa: `wrangler pages secret list` para verificar

### Error: "Webhook signature verification failed"
**Solución**:
1. Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
2. Asegúrate de usar el secret del webhook correcto
3. Verifica la URL del webhook en Stripe Dashboard

### Pagos no aparecen en el dashboard
**Solución**:
1. Verifica que el webhook esté configurado correctamente
2. Revisa los logs del webhook en Stripe Dashboard
3. Verifica la tabla `stripe_events` en tu base de datos

---

## ✅ CHECKLIST FINAL

Antes de lanzar a usuarios reales:

- [ ] Base de datos remota actualizada
- [ ] Secrets configurados en Cloudflare (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [ ] Webhook creado en Stripe Dashboard
- [ ] Proyecto desplegado en Cloudflare Pages
- [ ] Test de checkout realizado exitosamente
- [ ] Webhook verificado (evento recibido y procesado)
- [ ] Verificado que el plan se actualiza correctamente después del pago
- [ ] Política de reembolsos definida
- [ ] Términos de servicio actualizados
- [ ] Documentación para usuarios creada
- [ ] Soporte técnico preparado

---

## 📞 RECURSOS

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe Docs**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Cloudflare Pages**: https://dash.cloudflare.com
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler

---

## 🎉 ¡LISTO PARA PRODUCCIÓN!

Una vez completados todos los pasos, tu sistema de pagos estará **completamente funcional** y listo para aceptar pagos reales.

**Recuerda**: 
- Monitorea los primeros pagos de cerca
- Revisa regularmente el dashboard de Stripe
- Ten un plan de soporte para usuarios

¡Éxito con el lanzamiento! 🚀
