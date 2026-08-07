# AGENTS.md

This document provides an overview of the project structure for developers and AI agents working on this codebase.

## Project Overview

LGF's Mall — a multi-vendor marketplace for Togo/West Africa. Customers browse a shared catalog of
products sold directly by LGF or by independent vendors, vendors apply through a KYC-gated onboarding
flow before they can list products, drivers apply the same way before they can receive delivery
missions, and administrators approve/reject vendors and drivers, manage orders, coupons, investment
projects, and support tickets. Built with TanStack Start and deployed on Netlify, using Netlify
Database (Postgres via Drizzle), Netlify Identity (auth), and Netlify Blobs (KYC documents, product
images).

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Database | Netlify Database (Postgres) via Drizzle ORM |
| Auth | Netlify Identity (`@netlify/identity`) |
| File storage | Netlify Blobs (`@netlify/blobs`) |
| Payments | Stripe Checkout (card payments + wallet top-up) |
| Language | TypeScript 5.9 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
├── db
│   ├── schema.ts        # Drizzle schema: users, vendors, drivers, kycDocuments, categories,
│   │                    # products, productReviews, cartItems, orders, orderItems,
│   │                    # walletTransactions, coupons, investmentProjects, investments, supportTickets
│   └── index.ts          # Drizzle client (drizzle-orm/netlify-db)
├── drizzle.config.ts      # dialect: postgresql, migrations output to netlify/database/migrations
├── netlify
│   ├── database/migrations
│   └── functions/identity-signup.ts  # Forces every new signup to default to the "customer" role
├── src
│   ├── lib
│   │   ├── auth.ts                 # getServerUser(), isAdmin()
│   │   ├── identity-context.tsx    # React IdentityProvider / useIdentity()
│   │   └── format.ts               # formatMoney(), slugify()
│   ├── middleware/identity.ts      # requireAuthMiddleware, requireAdminMiddleware
│   ├── components
│   │   ├── Header.tsx              # Nav, cart badge, auth controls, WhatsApp link
│   │   └── CallbackHandler.tsx     # Handles Netlify Identity auth redirect hashes
│   ├── server                      # createServerFn-based server functions, one file pair per domain
│   │   ├── users.server.ts / users.functions.ts
│   │   ├── catalog.server.ts / catalog.functions.ts   # categories, products, wholesale pricing
│   │   ├── reviews.functions.ts
│   │   ├── cart.functions.ts
│   │   ├── orders.server.ts / orders.functions.ts     # checkout, Stripe, wallet payments, payouts
│   │   ├── vendors.server.ts / vendors.functions.ts   # vendor application, products CRUD
│   │   ├── drivers.functions.ts                       # driver application, deliveries
│   │   ├── admin.functions.ts                         # all admin-only actions
│   │   ├── investments.functions.ts
│   │   ├── support.functions.ts
│   │   └── uploads.server.ts                          # Netlify Blobs upload/serve helper
│   └── routes
│       ├── __root.tsx                 # Root layout: IdentityProvider, CallbackHandler, Header
│       ├── index.tsx                  # Marketplace homepage (search, categories, product grid)
│       ├── produits/$slug.tsx         # Product detail, reviews, add to cart
│       ├── panier.tsx                 # Cart
│       ├── checkout/{index,success,cancel}.tsx
│       ├── connexion.tsx              # Login/signup (Netlify Identity)
│       ├── compte/                    # Customer account: profile, orders, wallet, investments
│       ├── vendre.tsx / vendeur/      # Vendor application + dashboard (products, orders)
│       ├── livrer.tsx / livreur.tsx   # Driver application + dashboard (availability, deliveries)
│       ├── investissements/           # Public investment project listing + detail + invest
│       ├── support.tsx                # Contact/FAQ/ticket form
│       ├── admin/                     # Admin dashboard: vendors, drivers, KYC, orders, coupons,
│       │                              # investment projects, support tickets
│       └── api/uploads/$.ts           # Serves Netlify Blobs content back over HTTP
├── AGENTS.md
├── netlify.toml
├── package.json
└── vite.config.ts
```

## Key Concepts

### Roles and access control

- Netlify Identity's `app_metadata.roles` is used **only** to distinguish `admin` / `super_admin`
  (`isAdmin()` in `src/lib/auth.ts`). Admin accounts cannot be self-registered — they must be granted
  the `admin` role manually from the Netlify dashboard's Identity panel.
- Every other signup defaults to the `customer` role via the `identity-signup` webhook function.
- Vendor and driver access is gated by the `status` column (`pending` / `approved` / `rejected`) on
  the `vendors` / `drivers` tables, not by Identity roles — see `requireApprovedVendor()` in
  `src/server/vendors.server.ts`.

### Marketplace and pricing

- A product's `vendorId` is `null` for LGF-direct products, or points to a `vendors` row.
- Wholesale pricing: `priceForQuantity()` in `src/server/catalog.server.ts` returns `wholesalePrice`
  once the cart quantity reaches `minWholesaleQty`, otherwise `retailPrice`.
- Commission: for vendor-owned order lines, `commissionAmount = lineTotal * vendor.commissionRate / 100`
  is withheld and the remainder is credited to the vendor's wallet when the order is marked paid.

### Payments and wallet

- Stripe Checkout Sessions are used for both order payment and wallet top-up. Server functions always
  re-verify the session server-side (`stripe.checkout.sessions.retrieve()`) before crediting a wallet
  or marking an order paid — client redirects are never trusted directly.
- `markOrderPaid()` and `confirmWalletTopup()` are idempotent so a page refresh on the success page
  cannot double-credit a wallet or double-process an order.
- The customer wallet can also be used directly at checkout in place of Stripe.

### File uploads

KYC documents/selfies and product images are stored in Netlify Blobs (`getUploadsStore()`) and served
back through `src/routes/api/uploads/$.ts`.

## Development Commands

```bash
npm run dev      # Start dev server (note: Netlify Identity auth does not work under vite dev — deploy to test login/signup)
npm run build    # Production build
npx drizzle-kit generate --name <name>  # Generate a new migration after editing db/schema.ts
```

## Environment Variables

```
STRIPE_SECRET_KEY=...          # Enables Stripe checkout + wallet top-up; without it those actions are disabled in the UI
SITE_URL=...                   # Base URL used to build Stripe success/cancel redirect URLs
VITE_SUPPORT_WHATSAPP=...      # WhatsApp number (digits only, with country code) shown on the /support page
```

## Conventions

- Server functions use `.inputValidator()` (not `.validator()`) with Zod schemas.
- Loaders are isomorphic — they call server functions, never the database directly.
- French-language UI copy throughout (target market is Togo/West Africa).
- `@/` path alias maps to `src/`.
