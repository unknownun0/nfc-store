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
- `SMTP_*` — real email credentials. For Gmail: turn on 2-Step Verification, then create an "App Password" at https://myaccount.google.com/apppasswords and use that as `SMTP_PASS` (not your normal password).

## 2. Run

```bash
npm start
```

Visit `http://localhost:3000`.

- Admin login: **username `admin`, password `admin123`** (seeded automatically — change this, see below).
- The database is a single file, `data.sqlite`, created automatically on first run.

## 3. Try the flow

1. Go to `/admin.html`, log in, and create a client with a real email you can check.
2. The client gets an email with a 6-digit code and their personal link (also shown as a QR code in the admin panel).
3. Open that link (or scan the QR) — it lands on the activation page. Enter the code and set a password.
4. The same link now shows the account's details and order history any time it's opened again.
5. The client can also log in from `/login.html` with their email/password.

## Changing the default admin password

The simplest way: delete `data.sqlite` and edit `db/init.js` to seed a
different password before first run, or add a small script that updates the
`admins` table with a new bcrypt hash. For a real deployment, do this before
you go live and don't leave `admin123` in place.

## Deploying for real

This app needs a place to run 24/7 with persistent storage for `data.sqlite`
(or swap in Postgres/MySQL for higher-traffic sites — the `db/` folder is the
only place that would need to change). Straightforward options:

- **Railway / Render / Fly.io** — deploy the repo, add the `.env` variables in their dashboard, mount a persistent volume for `data.sqlite`.
- **A small VPS** (e.g. DigitalOcean) — run with `pm2` or a systemd service, put Nginx in front for HTTPS.

Whatever you choose, set `PUBLIC_BASE_URL` to your real `https://` domain —
that's what gets baked into every QR code and email link.

## Security notes worth knowing

- The account link/QR is a "capability URL" — anyone who has the exact link can view that account's details once it's activated (no login required). This is convenient for scanning a physical NFC card, but it means the link itself is sensitive. Treat it like a password: don't post it publicly, and consider rotating a client's token if a card is lost (would require a small admin feature to reissue one).
- Activation codes expire after 30 minutes; admin can resend a new one from the client list.
- Passwords are hashed with bcrypt; never stored in plain text.
- For production, put this behind HTTPS (required for any real deployment — most of the hosts above provide it automatically).

## Project structure

```
nfc-store/
├── server.js            Express app entry point
├── db/                  SQLite connection + schema/seed
├── routes/               admin.js, account.js, auth.js, shop.js
├── services/             email.js (nodemailer), qrcode.js
├── middleware/           auth.js (JWT)
└── public/               storefront, admin, account, login pages (vanilla HTML/JS)
```
