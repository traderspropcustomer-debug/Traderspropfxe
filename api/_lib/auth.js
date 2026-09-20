const { createClient } = require('@supabase/supabase-js')

let adminClient

function getAdminClient() {
  if (!adminClient) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    if (!url || !key) throw new Error('Supabase server credentials are not configured.')
    adminClient = createClient(url, key, { auth: { persistSession: false } })
  }
  return adminClient
}

// Verifies the bearer token from the Authorization header against Supabase Auth
// and returns the authenticated user. Never trust a client-supplied email/id alone.
async function requireAuthenticatedUser(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'] || ''
  const token = String(header).replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    const err = new Error('Missing authentication token.')
    err.statusCode = 401
    throw err
  }
  const supabase = getAdminClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    const err = new Error('Invalid or expired session.')
    err.statusCode = 401
    throw err
  }
  return data.user
}

module.exports = { getAdminClient, requireAuthenticatedUser }
