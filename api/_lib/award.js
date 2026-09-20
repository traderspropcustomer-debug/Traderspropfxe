// Awards a challenge account server-side once a PesaPal payment is verified as
// COMPLETED. Idempotent: relies on tp_payments.awarded and the unique tracking_id
// constraint on tp_challenge_accounts so a retried status check never double-awards.
async function awardChallengeAccount(pool, { trackingId, clientEmail, metadata }) {
  const meta = typeof metadata === 'string' ? JSON.parse(metadata || '{}') : metadata || {}
  const challengeId = Number(meta.challengeId) || 1
  const challengeType = String(meta.challengeType || '1-phase')
  const accountSize = Number(meta.accountSize) || 0
  const fee = Number(meta.originalAmount) || 0

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const inserted = await client.query(
      `INSERT INTO tp_challenge_accounts (client_email, challenge_id, challenge_type, account_size, fee, status, tracking_id)
       VALUES ($1,$2,$3,$4,$5,'active',$6)
       ON CONFLICT (tracking_id) DO NOTHING
       RETURNING *`,
      [clientEmail, challengeId, challengeType, accountSize, fee, trackingId]
    )
    await client.query('UPDATE tp_payments SET awarded=TRUE, updated_at=now() WHERE tracking_id=$1', [trackingId])
    await client.query('COMMIT')
    return inserted.rows[0] || null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = { awardChallengeAccount }
