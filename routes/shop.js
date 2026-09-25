const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products').all());
});

router.post('/checkout', (req, res) => {
  const { items, guest_name, guest_email, client_id } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const products = db.prepare('SELECT * FROM products').all();
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let total = 0;
  for (const item of items) {
    const p = productMap[item.productId];
    if (!p) return res.status(400).json({ error: `Unknown product ${item.productId}` });
    total += p.price * item.quantity;
  }

  const insertOrder = db.prepare(
    `INSERT INTO orders (client_id, guest_name, guest_email, total, created_at) VALUES (?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`
  );

  const runTransaction = db.transaction(() => {
    const info = insertOrder.run(client_id || null, guest_name || null, guest_email || null, total, Date.now());
    for (const item of items) {
      const p = productMap[item.productId];
      insertItem.run(info.lastInsertRowid, p.id, item.quantity, p.price);
    }
    return info.lastInsertRowid;
  });

  const orderId = runTransaction();
  res.json({ ok: true, orderId, total });
});

module.exports = router;
