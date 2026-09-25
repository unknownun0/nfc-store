const express = require('express');
const bcrypt = require('bcryptjs');
const sql = require('../db/database');
const { sign } = require('../middleware/auth');

const router = express.Router();

// Used by the account page on load to decide whether to show the
// "enter your code" form or the account details.
router.get('/:token/status', async (req, res) => {
  const client = (await sql`SELECT id, name, status FROM clients WHERE token = ${req.params.token}`)[0];
  if (!client) return res.status(404).json({ error: 'Account not found' });
  res.json(client);
});

router.post('/:token/activate', async (req, res) => {
  const { code, password } = req.body;
  const client = (await sql`SELECT * FROM clients WHERE token = ${req.params.token}`)[0];
  if (!client) return res.status(404).json({ error: 'Account not found' });
  if (client.status === 'active') return res.status(400).json({ error: 'This account is already activated' });
  if (!code || code !== client.activation_code) return res.status(400).json({ error: 'Incorrect code' });
  if (new Date() > new Date(client.code_expires_at)) {
    return res.status(400).json({ error: 'Code expired - ask the admin to resend it' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const hash = bcrypt.hashSync(password, 10);
  await sql`UPDATE clients SET status = 'active', password_hash = ${hash}, activation_code = NULL WHERE id = ${client.id}`;
  const token = sign({ id: client.id, role: 'client' });
  res.json({ ok: true, token });
});

// The QR code / link keeps working after activation as a way to view account details.
router.get('/:token', async (req, res) => {
  const client = (await sql`SELECT id, name, email, status, nfc_uid, created_at FROM clients WHERE token = ${req.params.token}`)[0];
  if (!client) return res.status(404).json({ error: 'Account not found' });
  if (client.status !== 'active') return res.status(403).json({ error: 'Account not activated yet' });

  const orders = await sql`SELECT id, total, created_at FROM orders WHERE client_id = ${client.id} ORDER BY created_at DESC`;

  res.json({ client, orders });
});

module.exports = router;