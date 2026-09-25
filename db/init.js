const sql = require('./database');
const bcrypt = require('bcryptjs');

async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      stock INTEGER DEFAULT 100
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      password_hash TEXT,
      activation_code TEXT,
      code_expires_at TIMESTAMP,
      nfc_uid TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      client_id INTEGER,
      guest_name TEXT,
      guest_email TEXT,
      total REAL NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `;

  // Check if admin exists
  const adminResult = await sql`SELECT id FROM admins LIMIT 1`;
  if (adminResult.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await sql`INSERT INTO admins (username, password_hash) VALUES (${'admin'}, ${hash})`;
    console.log('Seeded default admin -> username: admin / password: admin123 (CHANGE THIS AFTER FIRST LOGIN)');
  }

  // Seed products if empty
  const productResult = await sql`SELECT COUNT(*) as c FROM products`;
  if (productResult[0].c === 0) {
    await sql`
      INSERT INTO products (name, description, price, image_url, stock) VALUES
      ('NFC Tap Card - Classic', 'Reusable NFC card. Program it once to link to a profile, menu, or payment page.', 12.99, '', 200),
      ('NFC Tag Sticker (5-pack)', 'Small adhesive NFC stickers for products, packaging, or business cards.', 9.99, '', 200),
      ('NFC Keychain Fob', 'Durable NFC fob for keys or bags.', 14.99, '', 150)
    `;
    console.log('Seeded default products');
  }
}

module.exports = { initDb };