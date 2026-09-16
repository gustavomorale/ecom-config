# Bundle Configurator

White-label Shopify app: a shopper answers a short questionnaire and gets a configured
bundle/cart. Any merchant installs it, picks a category, edits the template, and the widget
wears their store's colours. **A store is a JSON config, not a fork.**

Owner: Gustavo (CraftFrame). Current version: engine v1.1. Status: testable MVP, admin app
and analytics endpoint are mocked in the harness and not built.

## Layout

| Path | What it is |
|---|---|
| `src/configurator.js` | Engine: state, steps, rules, cart, promo, stock. Exposes `window.BundleConfigurator` (`mount`, `registerScene`, `sniffHost`, `tokensFrom`, `inheritFromHost`). IIFE, no build step. |
| `src/configurator.css` | Core stylesheet. Every brand and scene value is a `--bcfg-*` custom property. Never edit rules below the `:root`-style token block; override tokens. |
| `src/themes/glass.css` | Glass preset (Apple-style translucent skin). Additive, loads after core, activated by `brand.preset: 'glass'`. |
| `src/theme-inherit.js` | Reads the host storefront's computed styles and derives the token set. Never imports merchant CSS. |
| `src/scenes/summary.js`, `src/scenes/house.js` | Scenes: neutral answer-stack preview, and the property illustration. De-branded; colours come from `--bcfg-scene-*`. |
| `configs/categories.js` | Category registry. The merchant's first decision. Adding a category = adding one object to the array. |
| `configs/templates/*.js` | Full templates (house accessories, subscription boxes). Other categories are expanded by `starter()`. |
| `demo/index.html` + `harness.*` | The MVP harness: Storefront, Merchant admin (mock), Theme sync, Analytics (mock), MVP model tabs. `demo/bundle-configurator.mvp.html` is the single-file build of the same thing. |
| `shopify-app/extensions/bundle-configurator/` | Theme app extension: app block + assets. Assets are copied from `src/` by `npm run build:extension` and are gitignored. |
| `scripts/` | Build helpers. |

Run locally: `npm run dev` then open `http://localhost:8765/demo/`. Syntax check: `npm run check`.

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
   template; the footer is not rendered unless filled. Default headline: *Build custom
   widget for configured check out*. Illustrations carry no palette of their own.
5. **Icons are per-option config**, edited in the admin: `icon` (emoji or inline SVG) or
   `image` (URL to the merchant's asset). Real admin gets the Shopify asset picker.

## Conventions

- Plain ES5-style IIFEs on `window`, no bundler, no framework in the runtime. Keep it that
  way until the admin app (Remix + Polaris) is built; the admin can be modern, the
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
- **v1.1:** analytics endpoint and drop-off funnel. Ajax cart. Answer persistence
  (`sessionStorage` + resumable link).
- **v1.2:** price sync from the Storefront API. Metaobject-backed accessory catalogue.
- **v2:** draft orders for high-value configs. Per-market/per-locale configs.
  Merchant-defined scenes.
- **Not in v1:** multi-language, customer accounts, B2B price lists, anything needing an
  app database.

## Blocking a public listing (work these first)

1. **Accessibility.** Options are `div`s with click handlers. Need real `button`/`radio`
   semantics, keyboard nav, focus management, visible focus rings. Every glass token pair
   needs a 4.5:1 audit.
2. **Price drift.** Prices live in config and in Shopify. Show "preview, checkout is the
   source of truth" until Storefront API sync lands.
3. **Persistence.** Answers are lost on refresh.
4. **Glass performance.** Stacked `backdrop-filter` is expensive on low-end Android.
   Respect `prefers-reduced-transparency`, step down on slow devices.
5. **Sniffer failure mode.** Theme sync guesses. Needs a confidence signal and a one-click
   "ignore, use my colours" in the admin.

## Commercials

Monthly tiers by questionnaire count and step count, not per order. Scopes:
`read_products` and `write_app_metafields`. No theme write scope; app blocks do not modify
the theme. The drop-off funnel is the retention mechanic.
