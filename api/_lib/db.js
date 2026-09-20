const { Pool } = require('pg')

let pool
let schemaReady

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 5,
      ssl: { rejectUnauthorized: false },
    })
  }
  return pool
}

async function ensureSchema() {
  if (schemaReady) return schemaReady
  schemaReady = getPool().query(`
    CREATE TABLE IF NOT EXISTS tp_payments (
      id BIGSERIAL PRIMARY KEY,
      tracking_id TEXT UNIQUE NOT NULL,
      merchant_reference TEXT NOT NULL,
      client_email TEXT NOT NULL,
      product_type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'PENDING',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      awarded BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS tp_payments_client_email_idx ON tp_payments (client_email);

    CREATE TABLE IF NOT EXISTS tp_challenge_accounts (
      id BIGSERIAL PRIMARY KEY,
      client_email TEXT NOT NULL,
      challenge_id INTEGER NOT NULL,
      challenge_type TEXT NOT NULL,
      account_size NUMERIC NOT NULL,
      fee NUMERIC NOT NULL,
      target TEXT,
      daily NUMERIC,
      total NUMERIC,
      profit_split NUMERIC,
      payout TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      tracking_id TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS tp_challenge_accounts_client_email_idx ON tp_challenge_accounts (client_email);

    CREATE TABLE IF NOT EXISTS tp_competition_registrations (
      id BIGSERIAL PRIMARY KEY,
      client_email TEXT NOT NULL,
      competition_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (client_email, competition_key)
    );
  `).then(() => true)
  return schemaReady
}

module.exports = { getPool, ensureSchema }
