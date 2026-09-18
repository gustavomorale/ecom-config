# Bundle Configurator

White-label Shopify app: a shopper answers a short questionnaire and gets a configured
bundle/cart. Any merchant installs it, picks a category, edits the template, and the widget
wears their store's colours. **A store is a JSON config, not a fork.**

Owner: Gustavo (CraftFrame). Current version: engine v1.2, app 0.9 beta. Status: the Shopify
app (`shopify-app/`, React Router + Polaris web components) runs on the dev store with the
five-step setup, metafield config, theme block, sample catalogue and compliance webhooks.
The full editor is in the app: Rules (bundles and add-on rules with a row-based condition
builder, `app/lib/conditions.js`; conditions the rows cannot represent are kept untouched
and shown in words), Questions (labels, descriptions, emoji or https image icons, required,
add/remove/reorder) and Copy & cart (all copy, footer, promo, cart mode, answer memory).
Analytics endpoint and price sync are not built. Listing copy in
`shopify-app/LISTING.md`; the beta status and support email live in
`shopify-app/app/components/SetupRail.jsx` (`BETA`, `SUPPORT_EMAIL`).

## Layout

| Path | What it is |
|---|---|
| `src/configurator.js` | Engine: state, steps, rules, cart, promo, stock. Exposes `window.BundleConfigurator` (`mount`, `registerScene`, `sniffHost`, `tokensFrom`, `inheritFromHost`). IIFE, no build step. |
| `src/configurator.css` | Core stylesheet. Every brand and scene value is a `--bcfg-*` custom property. Never edit rules below the `:root`-style token block; override tokens. |
| `src/themes/glass.css` | Glass preset (Apple-style translucent skin). Additive, loads after core, activated by `brand.preset: 'glass'`. |
| `src/theme-inherit.js` | Reads the host storefront's computed styles and derives the token set. Never imports merchant CSS. |
| `src/scenes/summary.js`, `src/scenes/house.js` | Scenes: neutral answer-stack preview, and the property illustration. De-branded; colours come from `--bcfg-scene-*`. |
| `configs/categories.js` | Category registry. The merchant's first decision. Adding a category = adding one object to the array. |
| `configs/templates/*.js` | Full templates (house accessories, subscription boxes, cosmetics). The UK niche categories are expanded by `starter()`. |
| `demo/index.html` + `harness.*` | The MVP harness: Storefront, Merchant admin (mock), Theme sync, Analytics (mock), MVP model tabs. `demo/bundle-configurator.mvp.html` is the single-file build of the same thing. |
| `shopify-app/` | The Shopify app: embedded admin (React Router + Polaris, Shopify's current app template) and `shopify.app.toml` (name "Bundle Configurator", handle `bundle-configurator`, dev store `funrackets.myshopify.com`). `client_id` is filled in by the first `shopify app dev`. |
| `shopify-app/extensions/bundle-configurator/` | Theme app extension: app block + assets. Assets are copied from `src/` by `npm run build:extension` and are gitignored. |
| `scripts/` | Build helpers. |

Run locally: `npm run dev` then open `http://localhost:8765/demo/`. Syntax check: `npm run check`. Single-file demo: `npm run sync:mvp`.
Run the Shopify app against the dev store: `cd shopify-app && npm install && npm run dev`
(first run logs into Partners in the browser and creates the app there; see `shopify-app/README.md`).

Claude Code: `.claude/settings.json` pre-approves the npm scripts and read-only git. Slash
commands: `/check`, `/build-extension`, `/sync-mvp`, `/next-blocker [n]`. Personal overrides go in
`.claude/settings.local.json` (gitignored).

## Decisions (do not relitigate without a reason)

1. **Category first.** The admin opens on "what are you building a configurator for" and
   nothing else is visible until answered. Picking seeds a complete working template and
   decides which scene ships. Nobody faces an empty questionnaire.
2. **Glass is a preset, not a replacement.** `brand.preset: 'glass' | 'base'`. Theme
   resolution is three layers, each overridden by the next: preset skin, then
   `brand.inherited` (sniffed), then `brand.theme` (merchant's explicit choices, always wins).
   `brand.appearance` is `auto | light | dark`.
3. **Theme sync reads computed values, it never imports CSS.** The sniffer reads body, the
   add-to-cart button and links, reduces them to six readings (accent, ink, paper, font,
   radius, light/dark) and derives the rest. Text on accent is chosen by measured contrast.
4. **Nothing is stamped.** `brand.id`, `brand.name`, `brand.footerText` are empty in every
   template; the footer is not rendered unless filled. Headlines are unbranded but
   natural per template ("Find your routine", "Build your home security kit", starters
   via `spec.title`, blank: "Build your bundle"); the overview nudges merchants to write
   their own and offers the template's in one click where the pre-0.9 placeholder is still
   saved. Illustrations carry no palette of their own.
5. **Visuals are per-option config**, edited on the Questions page: `icon` (emoji), or
   `image` from one of three sources: a product's or collection's picture chosen with the
   Shopify resource picker (`imageSource` records which), or a custom https link. Per
   question, `display: 'cards'` renders options as picture cards (image or large icon on
   top) instead of compact rows; tokens `--bcfg-card-media-ratio`, `--bcfg-card-min`.
   Works for single choice, multiple choice and toggles. No file upload in the app: that
   would need the `write_files` scope.
6. **First access is a five-step setup, then the full editor.** Category, Look ("Match my
   store" runs theme sync), Questions, Products (variant IDs; the only step that gates a
   real checkout), Go live. One decision per step, one sentence of why, one primary
   action, always a "Skip for now". Progress and the config in progress persist, so a
   refresh resumes. The mock in `demo/harness.js` (`Setup`) is the spec for the React Router +
   Polaris admin. The bar is a top-tier Shopify App Store listing.

## Conventions

- Plain ES5-style IIFEs on `window`, no bundler, no framework in the runtime. Keep it that
  way until the admin app (React Router + Polaris) is built; the admin can be modern, the
  storefront runtime must stay dependency-free and tiny.
- Zero brand, product, price, illustration colour or copy in `src/`. If you find yourself
  typing a product name into the engine, it belongs in a config.
- New CSS values go in as `--bcfg-*` tokens with a sensible default, never as literals in
  rules.
- Keep `demo/index.html` (split files) and `demo/bundle-configurator.mvp.html` (single
  file) in sync when the runtime changes; the single file is what gets shared.
- No em dashes in copy or docs.

## Roadmap

- **v1, ship:** app block, config metafield, category step and templates, the four admin
  screens, permalink cart, glass + base presets, theme sync.
- **v1.1:** analytics endpoint and drop-off funnel. Ajax cart.
- **v1.2 (current):** answer persistence (`sessionStorage` + resumable link), done.
- **v1.3:** price sync from the Storefront API. Metaobject-backed accessory catalogue.
- **v2:** draft orders for high-value configs. Per-market/per-locale configs.
  Merchant-defined scenes.
- **Not in v1:** multi-language, customer accounts, B2B price lists, anything needing an
  app database.

## Blocking a public listing (work these first)

1. **Accessibility. Resolved (2026-09-16).** Answer controls are `<button>`s: single
   choice is a `radiogroup` with roving tabindex and arrow keys, tiles use `aria-pressed`,
   the scene toggle `aria-expanded`. `render()` restores focus by data-* identity; step
   changes focus the question and announce "Step x of y" through a `role="status"` region.
   Focus rings are `:focus-visible` only, via `--bcfg-focus`, `--bcfg-focus-halo`,
   `--bcfg-focus-width` (glass draws ink plus an opaque halo so blur cannot eat it).
   Default text tokens were re-measured to 4.5:1 or better on their own surfaces (accent
   `#3d5ee6`, muted `#6b6b6b`, faint `#6f6f6f`, good `#1f7a45`, warn `#7a5c00`; glass
   `--g-ink-3` at 60% light / 62% dark). Copy keys added: `requiredHint`, `decreaseLabel`,
   `increaseLabel`, `removeAddonLabel`, `removedNote`. Still open: a merchant's own theme
   colours can break contrast; that warning belongs in the admin (see 5).
2. **Price drift. Mitigated (2026-09-16), resolved by v1.3 price sync.** The result
   shows "Prices are a preview. Checkout shows the final price." under the price
   (`copy.priceNote`, token `--bcfg-price-note-ink`). `pricing.synced: true` removes it;
   the v1.3 Storefront API sync will set that automatically.
3. **Persistence. Resolved (2026-09-16).** Answers save to `sessionStorage` on every
   answer and step, keyed by `brand.id` or a fingerprint of the questionnaire shape, so a
   changed questionnaire never loads stale answers. Restored silently with a "Picked up
   where you left off. Start over" note; Start over clears the store. The result screen
   has "Copy a link to this bundle": answers travel in `?bcfg=<base64url json>` and a link
   wins over storage. Config: `persist: { mode: session | local | none, key, link, param }`.
   Copy keys: `resumedNote`, `resumedLinkNote`, `shareLabel`, `shareCopied`.
4. **Glass performance. Resolved (2026-09-16).** Lite glass keeps layout and colours
   and removes every `backdrop-filter`, the grain layer and the blur-in animation. Reached
   by `@supports not (backdrop-filter)`, by `prefers-reduced-transparency`, or by the
   engine adding `.bcfg-lite` (`BundleConfigurator.isLowEndDevice()`: Save-Data, <= 2 GB
   memory, <= 2 cores; or `brand.performance: 'lite'`, default `auto`, `full` never steps
   down). Still worth measuring on a real low-end Android before listing.
5. **Sniffer failure mode. Resolved (2026-09-16).** `sniffHost()` returns
   `confidence: { score, level: high | medium | low, reasons[], source }` scored from where
   the accent came from (primary button, button, link, neutral, fallback) and measured
   contrast of accent ink and page text. Setup step 2 and the Theme sync tab show it in
   words ("Partial match. Accent taken from link colour") and, below high, offer "use my
   own colours instead", which drops `brand.inherited`. The full editor has the same
   control under Appearance whenever an inherited layer exists.

## Commercials

One plan via the Billing API: 14-day free trial, then USD 25 a month (about GBP 19), never
per order. On in production since 2026-09-18 (`BCFG_BILLING=on` in Netlify; development
stores, reviewers' included, are detected by plan and get a test charge). Submission pack:
`shopify-app/REVIEW.md`.
Scopes: `read_products`, `read_themes`; the app writes one shop metafield. No theme write
scope; app blocks do not modify the theme. Running costs are fixed (one small app server
and database, roughly USD 7 to 20 a month): the widget is served from Shopify's CDN and
the config from a metafield, so shopper traffic costs nothing. The drop-off funnel is the
retention mechanic.
