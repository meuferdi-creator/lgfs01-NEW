# LGF's Mall

Multi-vendor marketplace for Togo/West Africa: customers, vendors, delivery drivers, and admins in
one platform. Built with TanStack Start, Netlify Database (Postgres/Drizzle), Netlify Identity, and
Netlify Blobs.

## Getting started

```bash
npm install
npm run dev
```

Netlify Identity (login/signup) only works on a deployed Netlify site, not under `vite dev` — deploy
the site (or use `netlify dev` connected to a real site) to exercise the auth flow.

## Configuration

Set these environment variables in the Netlify site's dashboard (or a local `.env` for `netlify dev`):

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Enables Stripe checkout and wallet top-up. Without it, those payment options are disabled (not faked) in the UI. |
| `SITE_URL` | Base URL used to build Stripe success/cancel redirect URLs. |
| `VITE_SUPPORT_WHATSAPP` | WhatsApp number (digits only, with country code) used by the support/contact links. |

## Granting admin access

Admin accounts are never created through public signup. To promote an account:

1. Go to the site's Netlify dashboard → **Identity**.
2. Find the user and edit their metadata to add `"admin"` (or `"super_admin"`) to `app_metadata.roles`.

Every other signup is automatically assigned the `customer` role by the `identity-signup` Netlify
Function.

## Database migrations

Schema lives in `db/schema.ts`. After editing it, generate a migration:

```bash
npx drizzle-kit generate --name <migration-name>
```

Migrations are applied automatically on deploy via Netlify Database.

## Architecture

See `AGENTS.md` for a full breakdown of the directory structure, roles/permissions model, pricing and
commission logic, and payment flow.
