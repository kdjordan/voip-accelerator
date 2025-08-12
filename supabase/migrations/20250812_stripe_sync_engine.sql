-- Stripe Sync Engine Schema Migration
-- This creates the necessary tables for syncing Stripe data to Supabase

-- Create stripe schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS stripe;

-- Customers table
CREATE TABLE IF NOT EXISTS stripe.customers (
  id TEXT PRIMARY KEY,
  object TEXT,
  address JSONB,
  balance INTEGER,
  created TIMESTAMP WITH TIME ZONE,
  currency TEXT,
  default_source TEXT,
  delinquent BOOLEAN,
  description TEXT,
  discount JSONB,
  email TEXT,
  invoice_prefix TEXT,
  invoice_settings JSONB,
  livemode BOOLEAN,
  metadata JSONB,
  name TEXT,
  phone TEXT,
  preferred_locales TEXT[],
  shipping JSONB,
  tax_exempt TEXT,
  test_clock TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS stripe.subscriptions (
  id TEXT PRIMARY KEY,
  object TEXT,
  application TEXT,
  application_fee_percent NUMERIC,
  automatic_tax JSONB,
  billing_cycle_anchor TIMESTAMP WITH TIME ZONE,
  billing_cycle_anchor_config JSONB,
  billing_thresholds JSONB,
  cancel_at TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN,
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancellation_details JSONB,
  collection_method TEXT,
  created TIMESTAMP WITH TIME ZONE,
  currency TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  customer TEXT REFERENCES stripe.customers(id),
  days_until_due INTEGER,
  default_payment_method TEXT,
  default_source TEXT,
  default_tax_rates JSONB,
  description TEXT,
  discount JSONB,
  discounts JSONB,
  ended_at TIMESTAMP WITH TIME ZONE,
  invoice_settings JSONB,
  items JSONB,
  latest_invoice TEXT,
  livemode BOOLEAN,
  metadata JSONB,
  next_pending_invoice_item_invoice TIMESTAMP WITH TIME ZONE,
  on_behalf_of TEXT,
  pause_collection JSONB,
  payment_settings JSONB,
  pending_invoice_item_interval JSONB,
  pending_setup_intent TEXT,
  pending_update JSONB,
  schedule TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  test_clock TEXT,
  transfer_data JSONB,
  trial_end TIMESTAMP WITH TIME ZONE,
  trial_settings JSONB,
  trial_start TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS stripe.products (
  id TEXT PRIMARY KEY,
  object TEXT,
  active BOOLEAN,
  created TIMESTAMP WITH TIME ZONE,
  default_price TEXT,
  description TEXT,
  features JSONB,
  images TEXT[],
  livemode BOOLEAN,
  marketing_features JSONB,
  metadata JSONB,
  name TEXT,
  package_dimensions JSONB,
  shippable BOOLEAN,
  statement_descriptor TEXT,
  tax_code TEXT,
  type TEXT,
  unit_label TEXT,
  updated TIMESTAMP WITH TIME ZONE,
  url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prices table
CREATE TABLE IF NOT EXISTS stripe.prices (
  id TEXT PRIMARY KEY,
  object TEXT,
  active BOOLEAN,
  billing_scheme TEXT,
  created TIMESTAMP WITH TIME ZONE,
  currency TEXT,
  currency_options JSONB,
  custom_unit_amount JSONB,
  livemode BOOLEAN,
  lookup_key TEXT,
  metadata JSONB,
  nickname TEXT,
  product TEXT REFERENCES stripe.products(id),
  recurring JSONB,
  tax_behavior TEXT,
  tiers_mode TEXT,
  transform_quantity JSONB,
  type TEXT,
  unit_amount INTEGER,
  unit_amount_decimal TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS stripe.invoices (
  id TEXT PRIMARY KEY,
  object TEXT,
  account_country TEXT,
  account_name TEXT,
  account_tax_ids JSONB,
  amount_due INTEGER,
  amount_paid INTEGER,
  amount_remaining INTEGER,
  amount_shipping INTEGER,
  application TEXT,
  application_fee_amount INTEGER,
  attempt_count INTEGER,
  attempted BOOLEAN,
  auto_advance BOOLEAN,
  automatic_tax JSONB,
  billing_reason TEXT,
  charge TEXT,
  collection_method TEXT,
  created TIMESTAMP WITH TIME ZONE,
  currency TEXT,
  custom_fields JSONB,
  customer TEXT REFERENCES stripe.customers(id),
  customer_address JSONB,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_shipping JSONB,
  customer_tax_exempt TEXT,
  customer_tax_ids JSONB,
  default_payment_method TEXT,
  default_source TEXT,
  default_tax_rates JSONB,
  description TEXT,
  discount JSONB,
  discounts JSONB,
  due_date TIMESTAMP WITH TIME ZONE,
  effective_at TIMESTAMP WITH TIME ZONE,
  ending_balance INTEGER,
  footer TEXT,
  from_invoice JSONB,
  hosted_invoice_url TEXT,
  invoice_pdf TEXT,
  issuer JSONB,
  last_finalization_error JSONB,
  latest_revision TEXT,
  lines JSONB,
  livemode BOOLEAN,
  metadata JSONB,
  next_payment_attempt TIMESTAMP WITH TIME ZONE,
  number TEXT,
  on_behalf_of TEXT,
  paid BOOLEAN,
  paid_out_of_band BOOLEAN,
  payment_intent TEXT,
  payment_settings JSONB,
  period_end TIMESTAMP WITH TIME ZONE,
  period_start TIMESTAMP WITH TIME ZONE,
  post_payment_credit_notes_amount INTEGER,
  pre_payment_credit_notes_amount INTEGER,
  quote TEXT,
  receipt_number TEXT,
  rendering JSONB,
  rendering_options JSONB,
  shipping_cost JSONB,
  shipping_details JSONB,
  starting_balance INTEGER,
  statement_descriptor TEXT,
  status TEXT,
  status_transitions JSONB,
  subscription TEXT REFERENCES stripe.subscriptions(id),
  subscription_details JSONB,
  subtotal INTEGER,
  subtotal_excluding_tax INTEGER,
  tax INTEGER,
  test_clock TEXT,
  total INTEGER,
  total_discount_amounts JSONB,
  total_excluding_tax INTEGER,
  total_tax_amounts JSONB,
  transfer_data JSONB,
  webhooks_delivered_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Intents table
CREATE TABLE IF NOT EXISTS stripe.payment_intents (
  id TEXT PRIMARY KEY,
  object TEXT,
  amount INTEGER,
  amount_capturable INTEGER,
  amount_details JSONB,
  amount_received INTEGER,
  application TEXT,
  application_fee_amount INTEGER,
  automatic_payment_methods JSONB,
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  capture_method TEXT,
  client_secret TEXT,
  confirmation_method TEXT,
  created TIMESTAMP WITH TIME ZONE,
  currency TEXT,
  customer TEXT REFERENCES stripe.customers(id),
  description TEXT,
  invoice TEXT,
  last_payment_error JSONB,
  latest_charge TEXT,
  livemode BOOLEAN,
  metadata JSONB,
  next_action JSONB,
  on_behalf_of TEXT,
  payment_method TEXT,
  payment_method_configuration_details JSONB,
  payment_method_options JSONB,
  payment_method_types TEXT[],
  processing JSONB,
  receipt_email TEXT,
  review TEXT,
  setup_future_usage TEXT,
  shipping JSONB,
  source TEXT,
  statement_descriptor TEXT,
  statement_descriptor_suffix TEXT,
  status TEXT,
  transfer_data JSONB,
  transfer_group TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checkout Sessions table
CREATE TABLE IF NOT EXISTS stripe.checkout_sessions (
  id TEXT PRIMARY KEY,
  object TEXT,
  after_expiration JSONB,
  allow_promotion_codes BOOLEAN,
  amount_subtotal INTEGER,
  amount_total INTEGER,
  automatic_tax JSONB,
  billing_address_collection TEXT,
  cancel_url TEXT,
  client_reference_id TEXT,
  client_secret TEXT,
  consent JSONB,
  consent_collection JSONB,
  created TIMESTAMP WITH TIME ZONE,
  currency TEXT,
  currency_conversion JSONB,
  custom_fields JSONB,
  custom_text JSONB,
  customer TEXT REFERENCES stripe.customers(id),
  customer_creation TEXT,
  customer_details JSONB,
  customer_email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  invoice TEXT,
  invoice_creation JSONB,
  line_items JSONB,
  livemode BOOLEAN,
  locale TEXT,
  metadata JSONB,
  mode TEXT,
  payment_intent TEXT,
  payment_link TEXT,
  payment_method_collection TEXT,
  payment_method_configuration_details JSONB,
  payment_method_options JSONB,
  payment_method_types TEXT[],
  payment_status TEXT,
  phone_number_collection JSONB,
  recovered_from TEXT,
  redirect_on_completion TEXT,
  return_url TEXT,
  saved_payment_method_options JSONB,
  setup_intent TEXT,
  shipping_address_collection JSONB,
  shipping_cost JSONB,
  shipping_details JSONB,
  shipping_options JSONB,
  status TEXT,
  submit_type TEXT,
  subscription TEXT REFERENCES stripe.subscriptions(id),
  success_url TEXT,
  tax_id_collection JSONB,
  total_details JSONB,
  ui_mode TEXT,
  url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table (stores all webhook events)
CREATE TABLE IF NOT EXISTS stripe.events (
  id TEXT PRIMARY KEY,
  object TEXT,
  api_version TEXT,
  created TIMESTAMP WITH TIME ZONE,
  data JSONB,
  livemode BOOLEAN,
  pending_webhooks INTEGER,
  request JSONB,
  type TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON stripe.customers(email);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer ON stripe.subscriptions(customer);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer ON stripe.invoices(customer);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_subscription ON stripe.invoices(subscription);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_intents_customer ON stripe.payment_intents(customer);
CREATE INDEX IF NOT EXISTS idx_stripe_checkout_sessions_customer ON stripe.checkout_sessions(customer);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe.events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created ON stripe.events(created);

-- Grant permissions
GRANT USAGE ON SCHEMA stripe TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA stripe TO authenticated;

-- Create a view to easily get current subscription info for users
CREATE OR REPLACE VIEW stripe.user_subscriptions AS
SELECT 
  p.id as user_id,
  p.email,
  c.id as stripe_customer_id,
  s.id as subscription_id,
  s.status as subscription_status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.trial_start,
  s.trial_end,
  pr.unit_amount / 100.0 as price_amount,
  pr.currency,
  pr.recurring->>'interval' as billing_interval,
  prod.name as product_name,
  prod.description as product_description,
  CASE 
    WHEN prod.name ILIKE '%accelerator%' THEN 'accelerator'
    WHEN prod.name ILIKE '%optimizer%' THEN 'optimizer'
    WHEN prod.name ILIKE '%enterprise%' THEN 'enterprise'
    ELSE NULL
  END as tier
FROM profiles p
LEFT JOIN stripe.customers c ON c.email = p.email
LEFT JOIN stripe.subscriptions s ON s.customer = c.id AND s.status IN ('active', 'trialing')
LEFT JOIN LATERAL (
  SELECT items->0->'price'->>'id' as price_id
  FROM stripe.subscriptions
  WHERE id = s.id
) sub_items ON true
LEFT JOIN stripe.prices pr ON pr.id = sub_items.price_id
LEFT JOIN stripe.products prod ON prod.id = pr.product;

-- Create helper functions for common queries
CREATE OR REPLACE FUNCTION stripe.get_user_tier(user_email TEXT)
RETURNS TEXT AS $$
  SELECT tier FROM stripe.user_subscriptions WHERE email = user_email LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION stripe.is_subscription_active(user_email TEXT)
RETURNS BOOLEAN AS $$
  SELECT 
    CASE 
      WHEN subscription_status IN ('active', 'trialing') THEN true
      ELSE false
    END
  FROM stripe.user_subscriptions 
  WHERE email = user_email 
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Add comment to explain the schema
COMMENT ON SCHEMA stripe IS 'Stripe Sync Engine - Synchronized data from Stripe webhooks';