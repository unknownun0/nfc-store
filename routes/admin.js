const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sql = require('../db/database');
const { sign, requireAuth } = require('../middleware/auth');
const { sendActivationEmail } = require('../services/email');
const { generateQrDataUrl } = require('../services/qrcode');

const router = express.Router();

function genToken() {
  return crypto.randomBytes(20).toString('hex');
}
function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function accountUrlFor(req, token) {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/account/${token}`;
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = (await sql`SELECT * FROM admins WHERE username = ${username}`)[0];
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = sign({ id: admin.id, role: 'admin' });
  res.json({ token });
});

// Create a client account: generates token, QR, link, and emails the activation code
router.post('/clients', requireAuth('admin'), async (req, res) => {
  const { name, email, nfc_uid, notes } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

  const token = genToken();
  const code = genCode();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  try {
    const result = await sql`
      INSERT INTO clients (name, email, token, status, activation_code, code_expires_at, nfc_uid, notes)
      VALUES (${name}, ${email}, ${token}, 'pending', ${code}, ${expiresAt}, ${nfc_uid || null}, ${notes || null})
      RETURNING id
    `;

    const accountUrl = accountUrlFor(req, token);
    const qr = await generateQrDataUrl(accountUrl);

    await sendActivationEmail({ to: email, name, code, accountUrl });

    res.json({ id: result[0].id, token, accountUrl, qr });
  } catch (e) {
    if (String(e).includes('unique') || String(e).includes('duplicate')) {
      return res.status(409).json({ error: 'That email already has an account' });
    }
    console.error(e);
    res.status(500).json({ error: 'Could not create client' });
  }
});

router.get('/clients', requireAuth('admin'), async (req, res) => {
  const clients = await sql`SELECT id, name, email, token, status, nfc_uid, created_at FROM clients ORDER BY created_at DESC`;
  res.json(clients);
});

router.get('/clients/:id/qr', requireAuth('admin'), async (req, res) => {
  const client = (await sql`SELECT * FROM clients WHERE id = ${req.params.id}`)[0];
  if (!client) return res.status(404).json({ error: 'Not found' });
  const accountUrl = accountUrlFor(req, client.token);
  const qr = await generateQrDataUrl(accountUrl);
  res.json({ accountUrl, qr });
});

router.post('/clients/:id/resend-code', requireAuth('admin'), async (req, res) => {
  const client = (await sql`SELECT * FROM clients WHERE id = ${req.params.id}`)[0];
  if (!client) return res.status(404).json({ error: 'Not found' });
  if (client.status === 'active') return res.status(400).json({ error: 'Account is already activated' });

  const code = genCode();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await sql`UPDATE clients SET activation_code = ${code}, code_expires_at = ${expiresAt} WHERE id = ${client.id}`;

  const accountUrl = accountUrlFor(req, client.token);
  await sendActivationEmail({ to: client.email, name: client.name, code, accountUrl });
  res.json({ ok: true });
});

module.exports = router;