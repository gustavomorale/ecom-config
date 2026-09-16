---
description: Copy the runtime assets into the Shopify theme app extension
allowed-tools: Bash(npm run check), Bash(npm run build:extension), Bash(ls:*)
---
1. Run `npm run check`. Stop if it fails.
2. Run `npm run build:extension`.
3. List `shopify-app/extensions/bundle-configurator/assets/` and confirm every file from
   `src/` that the app block needs is there. These assets are gitignored, so nothing to commit.
