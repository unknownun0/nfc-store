const express = require('express');
const bcrypt = require('bcryptjs');
const sql = require('../db/database');
const { sign, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const client = (await sql`SELECT * FROM clients WHERE email = ${email}`)[0];
  if (!client || client.status !== 'active' || !client.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials or account not activated yet' });
  }
  if (!bcrypt.compareSync(password, client.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = sign({ id: client.id, role: 'client' });
  res.json({ token });
});

router.get('/me', requireAuth('client'), async (req, res) => {
  const client = (await sql`SELECT id, name, email, status, token, nfc_uid, created_at FROM clients WHERE id = ${req.user.id}`)[0];
  const orders = await sql`SELECT id, total, created_at FROM orders WHERE client_id = ${client.id} ORDER BY created_at DESC`;
  res.json({ client, orders });
});

module.exports = router;