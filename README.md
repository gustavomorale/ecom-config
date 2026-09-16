# Bundle Configurator

A white-label Shopify configurator: shoppers answer a few questions, the widget builds the
right bundle and hands it to checkout. Merchants pick a category, edit the template, and the
widget picks up their store's colours, type and corner radius automatically.

## Try it

```
npm run dev
open http://localhost:8765/demo/
```

Or open `demo/bundle-configurator.mvp.html` directly, no server needed.

## Structure

- `src/` runtime (engine, core CSS, glass preset, theme inheritance, scenes)
- `configs/` category registry and full templates
- `demo/` the MVP harness with storefront, mock admin, theme sync and analytics tabs
- `shopify-app/extensions/` theme app extension (app block)
- `scripts/` build helpers (`npm run build:extension` copies runtime assets into the extension)

See `CLAUDE.md` for the decisions, roadmap and what blocks a public listing.
