# NFC Store

A small e-commerce site for NFC items, with an admin panel that creates
client accounts, generates a QR code + link, and emails an activation code.
The same QR/link keeps working afterwards as the client's personal account
page.

## What's included

- **Storefront** (`/`) — browse NFC products, add to cart, checkout as a guest
- **Admin panel** (`/admin.html`) — log in, create client accounts, view/print each client's QR code and link, resend activation codes
- **Account page** (`/account/:token`, the URL behind the QR code)
  - Before activation: form to enter the 6-digit code emailed to the client and set a password
  - After activation: shows the client's account details and order history — this is what makes the QR/link reusable, not just a one-time activation link
- **Customer login** (`/login.html`) — normal email + password login, for accessing the account without the QR/link

## 1. Install

Requires Node.js 18+.

```bash
cd nfc-store
npm install
cp .env.example .env
```

Edit `.env`:
- `PUBLIC_BASE_URL` — set to your real domain once deployed (used to build the links/QR codes). Leave as `http://localhost:3000` for local testing.
- `JWT_SECRET` — replace with any long random string.
- `DATABASE_URL` — PostgreSQL connection string. For local dev, use a local Postgres or Neon dev branch. For Vercel, use the Vercel Postgres/Neon connection string.
- `SMTP_*` — real email credentials. For Gmail: turn on 2-Step Verification, then create an "App Password" at https://myaccount.google.com/apppasswords and use that as `SMTP_PASS` (not your normal password).

## 2. Run locally

```bash
npm start
```

Visit `http://localhost:3000`.

- Admin login: **username `admin`, password `admin123`** (seeded automatically — change this, see below).
- The database tables are created automatically on first run.

## 3. Try the flow

1. Go to `/admin.html`, log in, and create a client with a real email you can check.
2. The client gets an email with a 6-digit code and their personal link (also shown as a QR code in the admin panel).
3. Open that link (or scan the QR) — it lands on the activation page. Enter the code and set a password.
4. The same link now shows the account's details and order history any time it's opened again.
5. The client can also log in from `/login.html` with their email/password.

## Changing the default admin password

For a real deployment, do this before you go live and don't leave `admin123` in place. You can update it by running a SQL query against your PostgreSQL database:

```sql
UPDATE admins SET password_hash = '<new-bcrypt-hash>' WHERE username = 'admin';
```

Generate a bcrypt hash: `node -e "console.log(require('bcryptjs').hashSync('your-new-password', 10))"`

## Deploying to Vercel

This app is configured for **Vercel serverless deployment** with **PostgreSQL** (Vercel Postgres / Neon).

### Prerequisites
1. A **Neon** database (or Vercel Postgres integration)
2. A **Vercel** account

### Steps

1. **Create a Neon database** (or use Vercel Postgres integration):
   - Go to https://neon.tech and create a project
   - Copy the connection string (looks like `postgresql://user:pass@ep-xxx.neon.tech/dbname`)

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Vercel"
   git push origin main
   ```

3. **Import on Vercel**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Add Environment Variables:
     - `DATABASE_URL` — your Neon connection string
     - `JWT_SECRET` — long random string
     - `PUBLIC_BASE_URL` — your Vercel deployment URL (e.g., `https://my-app.vercel.app`)
     - `SMTP_*` — your email settings
   - Deploy!

4. **Run database initialization**:
   After first deploy, run the init once to create tables and seed data:
   ```bash
   npx vercel env pull .env.local
   node -e "require('./db/init').initDb()"
   ```
   Or use Vercel's CLI: `vercel env pull && node db/init.js`

### Local Development with Vercel/Neon

```bash
# Pull Vercel env vars to local .env.local
vercel env pull .env.local

# Run with local env
npm run dev
```

## Security notes worth knowing

- The account link/QR is a "capability URL" — anyone who has the exact link can view that account's details once it's activated (no login required). This is convenient for scanning a physical NFC card, but it means the link itself is sensitive. Treat it like a password: don't post it publicly, and consider rotating a client's token if a card is lost (would require a small admin feature to reissue one).
- Activation codes expire after 30 minutes; admin can resend a new one from the client list.
- Passwords are hashed with bcrypt; never stored in plain text.
- For production, put this behind HTTPS (required for any real deployment — Vercel provides it automatically).

## Project structure

```
nfc-store/
├── server.js            Express app entry point (exported for Vercel)
├── vercel.json          Vercel configuration
├── db/                  PostgreSQL connection + schema/seed
├── routes/              admin.js, account.js, auth.js, shop.js
├── services/            email.js (nodemailer), qrcode.js
├── middleware/          auth.js (JWT)
└── public/              storefront, admin, account, login pages (vanilla HTML/JS)
```