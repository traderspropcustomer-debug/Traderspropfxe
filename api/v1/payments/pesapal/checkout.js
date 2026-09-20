const { randomUUID } = require('crypto')
const { requireAuthenticatedUser } = require('../../../_lib/auth')
const { ensureSchema, getPool } = require('../../../_lib/db')
const pesapal = require('../../../_lib/pesapal')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed.' })
    return
  }
  try {
    const user = await requireAuthenticatedUser(req)
    const email = String(user.email || '').trim().toLowerCase()
    const { productType, amount, currency, description, metadata } = req.body || {}
    const numericAmount = Number(amount)
    if (!productType || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ message: 'A valid productType and amount are required.' })
      return
    }

    await ensureSchema()

    const trackingId = randomUUID()
    const merchantReference = `TP-${Date.now()}-${trackingId.slice(0, 8)}`
    const origin = process.env.PESAPAL_NOTIFICATION_URL
      ? new URL(process.env.PESAPAL_NOTIFICATION_URL).origin
      : `https://${req.headers.host}`
    const callbackUrl = `${origin}/#/pesapal-callback`

    const order = await pesapal.submitOrder({
      id: merchantReference,
      currency: currency || 'USD',
      amount: numericAmount,
      description: description || 'TradersProp payment',
      callbackUrl,
      notificationId: process.env.PESAPAL_NOTIFICATION_ID,
      email,
    })

    const finalTrackingId = order.order_tracking_id || trackingId

    await getPool().query(
      `INSERT INTO tp_payments (tracking_id, merchant_reference, client_email, product_type, amount, currency, status, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7)`,
      [finalTrackingId, merchantReference, email, productType, numericAmount, currency || 'USD', JSON.stringify(metadata || {})]
    )

    res.status(200).json({ redirectUrl: order.redirect_url, trackingId: finalTrackingId, merchantReference })
  } catch (error) {
    console.error('[v0] pesapal checkout error:', error)
    res.status(error.statusCode || 500).json({ message: error.message || 'Unable to start PesaPal checkout.' })
  }
}
