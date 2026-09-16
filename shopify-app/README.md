# Bundle Configurator — Shopify app

Embedded admin (React Router + Polaris) plus the `bundle-configurator` theme app extension
that mounts the configurator widget on any storefront page. The widget runtime itself lives
one level up in `../src`; `npm run build:extension` (run from the repo root) copies the built
assets into `extensions/bundle-configurator/assets/`.

## Two apps: dev and production

- `shopify.app.toml`: **bundle-configurator**, the app merchants install. Its URL is the Netlify
  site. Released with `npm run deploy`. Never run `shopify app dev` against it.
- `shopify.app.dev.toml`: **bundle-configurator-dev**, for local work. `npm run dev` uses it,
  rewrites its URL to the tunnel each run, and puts the dev store into dev preview. Nothing
  it does reaches production.

`npm run deploy:web` pushes the app server to Netlify (`netlify deploy --build --prod`).

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

## Database

Sessions live in Postgres on Neon, in production and in local dev alike (one provider, one
migration history). Create a Neon project, use the main branch for Netlify and a `dev`
branch locally, and put the pooled connection string in `.env`:

```
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
BCFG_BILLING=off
```

First time on a branch: `npx prisma migrate deploy`.

## Deploy (Netlify)

`netlify.toml` builds from this folder with `npm run netlify:build` (extension assets,
Prisma generate, migrate deploy, React Router build). Once in the Netlify UI:

1. New site from the GitHub repo, base directory `shopify-app` (the toml sets it too).
2. Environment variables: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET` (from
   `npm run env -- show`), `SHOPIFY_APP_URL` = the site URL, `SCOPES` =
   `read_products,read_themes`, `DATABASE_URL` (Neon main branch), `BCFG_BILLING`.
3. Put the site URL in `shopify.app.toml` (`application_url`, `redirect_urls`) and run
   `npm run deploy` to push the app config and the theme extension to Shopify.

After that the app runs without a terminal and can be installed on any store from the
Partner dashboard.

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
