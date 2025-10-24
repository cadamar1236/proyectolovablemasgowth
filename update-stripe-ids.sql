-- Actualizar IDs de Stripe en la base de datos
-- Generado automáticamente por setup-stripe-products.js

UPDATE pricing_plans SET 
  stripe_product_id = 'prod_TIJsn17JEhgQ58',
  stripe_price_id_monthly = 'price_1SLjF3GCWzoDsbCNBgAbhd6l',
  stripe_price_id_yearly = 'price_1SLjF3GCWzoDsbCNBgAbhd6l'
WHERE id = 1;

UPDATE pricing_plans SET 
  stripe_product_id = 'prod_TIJsjN6jUSqFGs',
  stripe_price_id_monthly = 'price_1SLjF3GCWzoDsbCN9uz4sxHb',
  stripe_price_id_yearly = 'price_1SLjF4GCWzoDsbCNpLANizn6'
WHERE id = 2;

UPDATE pricing_plans SET 
  stripe_product_id = 'prod_TIJssrsfMG9yBU',
  stripe_price_id_monthly = 'price_1SLjF4GCWzoDsbCNEn3nZLaI',
  stripe_price_id_yearly = 'price_1SLjF4GCWzoDsbCNGf0J0ozD'
WHERE id = 3;

UPDATE pricing_plans SET 
  stripe_product_id = 'prod_TIJswdR7LnCZAY',
  stripe_price_id_monthly = 'price_1SLjF5GCWzoDsbCNjF7n5vnB',
  stripe_price_id_yearly = 'price_1SLjF5GCWzoDsbCNjwZDBKMX'
WHERE id = 4;
