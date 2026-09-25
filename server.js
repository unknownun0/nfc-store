require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDb } = require('./db/init');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const accountRoutes = require('./routes/account');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/shop', shopRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/auth', authRoutes);

// This is the URL that goes in the QR code / activation email.
// It serves the same page whether the account is pending or active.
app.get('/account/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'account.html'));
});

// Initialize database on startup (for local dev)
if (require.main === module) {
  initDb().catch(console.error);
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`NFC Store running at http://localhost:${PORT}`);
  });
}

module.exports = app;