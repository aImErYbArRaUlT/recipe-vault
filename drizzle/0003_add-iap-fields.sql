ALTER TABLE users ADD COLUMN revenuecat_customer_id TEXT;
ALTER TABLE users ADD COLUMN subscription_platform TEXT;
CREATE INDEX idx_users_revenuecat ON users(revenuecat_customer_id);
