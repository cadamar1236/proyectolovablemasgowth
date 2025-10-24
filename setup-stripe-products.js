#!/usr/bin/env node

/**
 * Script para crear productos y precios en Stripe automáticamente
 * y actualizar la base de datos con los IDs generados
 */

import Stripe from 'stripe';

// Configuración
// IMPORTANTE: La clave secreta debe estar en .dev.vars o como variable de entorno
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY no está configurada.');
  console.error('   Crea un archivo .dev.vars con:');
  console.error('   STRIPE_SECRET_KEY=sk_live_...');
  process.exit(1);
}
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Planes a crear basados en la base de datos
const PLANS = [
  {
    id: 1,
    name: 'free',
    display_name: 'Free',
    description: 'Perfecto para explorar la plataforma',
    price_monthly: 0,
    price_yearly: 0,
  },
  {
    id: 2,
    name: 'starter',
    display_name: 'Starter',
    description: 'Perfecto para comenzar a validar tu producto',
    price_monthly: 29,
    price_yearly: 290,
  },
  {
    id: 3,
    name: 'pro',
    display_name: 'Pro',
    description: 'Para empresas en crecimiento que necesitan más validación',
    price_monthly: 99,
    price_yearly: 990,
  },
  {
    id: 4,
    name: 'enterprise',
    display_name: 'Enterprise',
    description: 'Solución completa para grandes empresas',
    price_monthly: 299,
    price_yearly: 2990,
  },
];

async function createStripeProducts() {
  console.log('🚀 Iniciando creación de productos en Stripe...\n');
  
  const results = [];

  for (const plan of PLANS) {
    console.log(`📦 Creando producto: ${plan.display_name}...`);
    
    try {
      // 1. Crear producto en Stripe
      const product = await stripe.products.create({
        name: `ValidAI Studio - ${plan.display_name}`,
        description: plan.description,
        metadata: {
          plan_id: plan.id.toString(),
          plan_name: plan.name,
        },
      });
      
      console.log(`  ✅ Producto creado: ${product.id}`);
      
      let priceMonthly = null;
      let priceYearly = null;
      
      // 2. Crear precio mensual
      if (plan.price_monthly > 0) {
        priceMonthly = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price_monthly * 100), // Convertir a centavos
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          metadata: {
            plan_id: plan.id.toString(),
            plan_name: plan.name,
            billing_cycle: 'monthly',
          },
        });
        console.log(`  ✅ Precio mensual creado: ${priceMonthly.id} ($${plan.price_monthly}/mes)`);
      } else {
        // Para plan gratuito, crear precio sin recurrencia
        priceMonthly = await stripe.prices.create({
          product: product.id,
          unit_amount: 0,
          currency: 'usd',
          metadata: {
            plan_id: plan.id.toString(),
            plan_name: plan.name,
            billing_cycle: 'monthly',
          },
        });
        console.log(`  ✅ Precio gratuito creado: ${priceMonthly.id}`);
      }
      
      // 3. Crear precio anual
      if (plan.price_yearly > 0) {
        priceYearly = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(plan.price_yearly * 100), // Convertir a centavos
          currency: 'usd',
          recurring: {
            interval: 'year',
          },
          metadata: {
            plan_id: plan.id.toString(),
            plan_name: plan.name,
            billing_cycle: 'yearly',
          },
        });
        console.log(`  ✅ Precio anual creado: ${priceYearly.id} ($${plan.price_yearly}/año)`);
      } else {
        // Para plan gratuito, usar el mismo precio
        priceYearly = priceMonthly;
        console.log(`  ✅ Precio anual (gratuito): ${priceYearly.id}`);
      }
      
      // Guardar resultado
      results.push({
        plan_id: plan.id,
        plan_name: plan.name,
        stripe_product_id: product.id,
        stripe_price_id_monthly: priceMonthly.id,
        stripe_price_id_yearly: priceYearly.id,
      });
      
      console.log(`  🎉 Plan ${plan.display_name} creado exitosamente!\n`);
      
    } catch (error) {
      console.error(`  ❌ Error creando ${plan.display_name}:`, error.message);
      console.error(`     Detalle:`, error);
      // Continuar con el siguiente plan
    }
  }
  
  return results;
}

async function generateUpdateSQL(results) {
  console.log('\n📝 Generando SQL para actualizar base de datos...\n');
  
  const sqlStatements = [];
  
  for (const result of results) {
    const sql = `UPDATE pricing_plans SET 
  stripe_product_id = '${result.stripe_product_id}',
  stripe_price_id_monthly = '${result.stripe_price_id_monthly}',
  stripe_price_id_yearly = '${result.stripe_price_id_yearly}'
WHERE id = ${result.plan_id};`;
    
    sqlStatements.push(sql);
  }
  
  return sqlStatements.join('\n\n');
}

async function main() {
  try {
    console.log('════════════════════════════════════════════════════════');
    console.log('  🎯 Setup de Productos Stripe para ValidAI Studio');
    console.log('════════════════════════════════════════════════════════\n');
    
    // Crear productos en Stripe
    const results = await createStripeProducts();
    
    if (results.length === 0) {
      console.log('❌ No se crearon productos. Verifica los errores arriba.');
      process.exit(1);
    }
    
    // Generar SQL
    const sql = await generateUpdateSQL(results);
    
    console.log('════════════════════════════════════════════════════════');
    console.log('  ✅ PRODUCTOS CREADOS EXITOSAMENTE');
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log('📊 Resumen:\n');
    results.forEach(r => {
      console.log(`✓ ${r.plan_name.toUpperCase()}`);
      console.log(`  Product ID: ${r.stripe_product_id}`);
      console.log(`  Monthly Price ID: ${r.stripe_price_id_monthly}`);
      console.log(`  Yearly Price ID: ${r.stripe_price_id_yearly}`);
      console.log('');
    });
    
    console.log('════════════════════════════════════════════════════════');
    console.log('  📝 SQL PARA ACTUALIZAR BASE DE DATOS');
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log(sql);
    console.log('\n');
    
    console.log('════════════════════════════════════════════════════════');
    console.log('  🚀 PRÓXIMOS PASOS');
    console.log('════════════════════════════════════════════════════════\n');
    
    console.log('1. Copia el SQL de arriba y guárdalo en update-stripe-ids.sql');
    console.log('2. Ejecuta: wrangler d1 execute webapp-production --local --file=./update-stripe-ids.sql');
    console.log('3. Para producción: wrangler d1 execute webapp-production --remote --file=./update-stripe-ids.sql');
    console.log('4. Configura el webhook secret después de crear el webhook en Stripe Dashboard');
    console.log('\n✨ ¡Todo listo para empezar a cobrar!\n');
    
  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
