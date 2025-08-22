const express = require('express');
const router = express.Router();

const STRIPE_KEY   = process.env.STRIPE_SECRET_KEY || '';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/,'');
const PRICE_WALLET = process.env.STRIPE_PRICE_WALLET || '';

router.post('/stripe/checkout', async (req, res) => {
  const { sku, to_addr, count = 1 } = req.body || {};
  if (!sku || !to_addr) return res.status(400).json({ error: 'missing_fields' });
  if (!STRIPE_KEY) return res.status(400).json({ error: 'stripe_not_configured' });

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(STRIPE_KEY);
    if (sku !== 'WALLET_LICENSE') return res.status(400).json({ error: 'unknown_sku' });
    if (!PRICE_WALLET) return res.status(400).json({ error: 'stripe_price_not_set' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: PRICE_WALLET, quantity: count }],
      success_url: `${FRONTEND_URL}/pay/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pay/cancel`,
      metadata: { sku, to_addr, count: String(count) },
    });

    return res.json({ checkout_url: session.url });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'bad_request' });
  }
});

module.exports = router;
