// backend/routes/stripe_webhook.js
"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* Plain-text append (simple, atomic enough for dev) */
function appendJSONL(file, obj) {
  fs.appendFileSync(path.join(uploadsDir, file), JSON.stringify(obj) + "\n");
}

/* Idempotency: skip already-processed event ids */
function hasProcessed(eventId) {
  const flag = path.join(uploadsDir, `.evt_${eventId}`);
  if (fs.existsSync(flag)) return true;
  fs.writeFileSync(flag, "1");
  return false;
}

/* Fulfillment stub — replace with real chain/DB write when ready */
async function grantLicense({ to_addr, count, source, session_id, amount_total, currency }) {
  const rec = {
    ts: new Date().toISOString(),
    to_addr,
    count: Number(count || 1),
    source,
    session_id,
    amount_total,
    currency
  };
  appendJSONL("fulfillments.jsonl", rec);
  return rec;
}

router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }), // must be raw for signature check
  async (req, res) => {
    const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
    const whsec = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret || !whsec) return res.status(400).json({ error: "stripe env missing" });

    const stripe = require("stripe")(stripeSecret, { apiVersion: "2024-06-20" });

    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, whsec);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Idempotency gate
    if (hasProcessed(event.id)) return res.json({ received: true, dedup: true });

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const s = event.data.object;
          // prefer request-time metadata
          const meta = s.metadata || {};
          await grantLicense({
            to_addr: meta.to_addr,
            count: meta.count || 1,
            source: "checkout.session.completed",
            session_id: s.id,
            amount_total: s.amount_total,
            currency: s.currency
          });
          break;
        }

        case "payment_intent.succeeded": {
          const pi = event.data.object;
          const meta = pi.metadata || {};
          await grantLicense({
            to_addr: meta.to_addr,
            count: meta.count || 1,
            source: "payment_intent.succeeded",
            session_id: pi.id,
            amount_total: pi.amount,
            currency: pi.currency
          });
          break;
        }

        default:
          // keep a breadcrumb for other events
          appendJSONL("webhook_events.jsonl", { ts: new Date().toISOString(), type: event.type, id: event.id });
      }
      return res.json({ received: true });
    } catch (e) {
      appendJSONL("webhook_errors.jsonl", { ts: new Date().toISOString(), id: event.id, err: String(e) });
      return res.status(500).send("handler error");
    }
  }
);

module.exports = router;
