-- Migration: add stripe_config to account_types

-- 1) Add column
ALTER TABLE account_types
  ADD COLUMN stripe_config JSON NULL AFTER features;

-- 2) Optional backfill from features.stripe
UPDATE account_types
SET stripe_config = JSON_OBJECT(
  'priceMonthly', JSON_UNQUOTE(JSON_EXTRACT(features, '$.stripe.priceMonthly')),
  'priceYearly',  JSON_UNQUOTE(JSON_EXTRACT(features, '$.stripe.priceYearly'))
)
WHERE JSON_EXTRACT(features, '$.stripe') IS NOT NULL
  AND (stripe_config IS NULL OR JSON_EXTRACT(stripe_config, '$.priceMonthly') IS NULL);
