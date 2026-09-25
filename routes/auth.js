const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { sign, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const client = db.prepare('SELECT * FROM clients WHERE email = ?').get(email);
  if (!client || client.status !== 'active' || !client.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials or account not activated yet' });
  }
  if (!bcrypt.compareSync(password, client.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = sign({ id: client.id, role: 'client' });
  res.json({ token });
});

router.get('/me', requireAuth('client'), (req, res) => {
  const client = db
    .prepare('SELECT id, name, email, status, token, nfc_uid, created_at FROM clients WHERE id = ?')
    .get(req.user.id);
  const orders = db.prepare('SELECT id, total, created_at FROM orders WHERE client_id = ? ORDER BY created_at DESC').all(client.id);
  res.json({ client, orders });
});

module.exports = router;
