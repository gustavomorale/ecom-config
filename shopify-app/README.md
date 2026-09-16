# Bundle Configurator — Shopify app

Embedded admin (React Router + Polaris) plus the `bundle-configurator` theme app extension
that mounts the configurator widget on any storefront page. The widget runtime itself lives
one level up in `../src`; `npm run build:extension` (run from the repo root) copies the built
assets into `extensions/bundle-configurator/assets/`.

## Run it against the dev store

```sh
cd shopify-app
npm install
npm run dev          # = shopify app dev
```

First run only: the CLI opens a browser to log into Partners, asks which org to use, and
offers to create the app "Bundle Configurator" there. Accept, and it writes `client_id`
into `shopify.app.toml`. The dev store is `mysuperstore-ehtodjg8.myshopify.com` (created by the CLI under the
CraftFrame WORKS Ltd org); it asks for the storefront password from Online Store >
Preferences on first run. Press `p` in the CLI to open the app in the store admin.

## Layout

- `app/` — admin app (routes, Shopify auth, Prisma session storage). `config.server.js` runs
  `../configs` in a vm sandbox (one source of truth for categories) and reads/writes the
  `bundle_configurator.config` shop metafield.
- `extensions/bundle-configurator/` — theme app extension (app block + built assets)
- `shopify.app.toml` — app config (name, handle, scopes, webhooks, dev store)
- `prisma/` — SQLite session store for development

## Webhooks

Declared in `shopify.app.toml`, handled in `app/routes/webhooks.*.jsx`: `app/uninstalled`
(drops the shop's sessions), `app/scopes_update`, and the three privacy compliance topics
(`customers/data_request`, `customers/redact`, `shop/redact`). The app holds no customer
data: per shop it stores an OAuth session and one metafield with the merchant's config.
Shoppers' answers stay in their browser.
