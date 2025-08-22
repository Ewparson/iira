import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

// in your Express server:
import { stripe } from './utils/stripe';
import bodyParser from 'body-parser';

app.post('/webhook/stripe', bodyParser.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // handle event.type…
  res.json({received: true});
});
