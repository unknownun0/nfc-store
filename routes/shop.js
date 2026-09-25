const express = require('express');
const sql = require('../db/database');

const router = express.Router();

router.get('/products', async (req, res) => {
  res.json(await sql`SELECT * FROM products`);
});

router.post('/checkout', async (req, res) => {
  const { items, guest_name, guest_email, client_id } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const products = await sql`SELECT * FROM products`;
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let total = 0;
  for (const item of items) {
    const p = productMap[item.productId];
    if (!p) return res.status(400).json({ error: `Unknown product ${item.productId}` });
    total += p.price * item.quantity;
  }

  try {
    const orderResult = await sql`
      INSERT INTO orders (client_id, guest_name, guest_email, total)
      VALUES (${client_id || null}, ${guest_name || null}, ${guest_email || null}, ${total})
      RETURNING id
    `;
    const orderId = orderResult[0].id;

    for (const item of items) {
      const p = productMap[item.productId];
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (${orderId}, ${p.id}, ${item.quantity}, ${p.price})
      `;
    }

    res.json({ ok: true, orderId, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not process order' });
  }
});

module.exports = router;