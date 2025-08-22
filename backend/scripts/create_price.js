"use strict";
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

(async () => {
  const prod = await stripe.products.create({ name: "Wallet License (Dev)" });
  const price = await stripe.prices.create({
    unit_amount: 10000, // $100.00
    currency: "usd",
    product: prod.id,
  });
  console.log("PRICE_ID=" + price.id);
})().catch(e => { console.error(e); process.exit(1); });
