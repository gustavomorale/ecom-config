# Release 1.0: the simple setup, gifting and Black Friday

Decided 2026-10-03 (Gustavo). The first public release is the simple version, not the
five-step 0.9.4 that is in review. The goal: a merchant sets up a quiz that sells their own
products in a few minutes, with nothing to rename and nothing made up.

## Branches

| Branch | What it is |
|---|---|
| `full-0.9.4` | The reviewed five-step app, frozen (tag `app-0.9.4`). Kept, not developed. Production on Netlify stays on it until 1.0 deploys. |
| `release-1.0` | The first release. Started from `main` with `q4-gifting` and `template-slots` merged in. All 1.0 work lands here. |
| `main` | Unchanged until 1.0 is ready, then `release-1.0` merges back. |

## What ships in 1.0

1. **Three setup steps:** Your products, Questions, Go live. The look is matched on install
   (Look stays as a page for later edits, not a setup step).
2. **Two quiz types on every plan:** Product finder (one product per shopper, about two
   minutes to set up) and Bundle quiz (a main product plus extras in one cart).
3. **Answer grid instead of rules:** tick which products each answer points to; the most
   ticks wins. Rules move under Advanced for quantities and formulas.
4. **Template slots** (`TEMPLATE-SLOTS.md`): templates carry questions and logic only.
   Every name, picture and price a shopper sees comes from a linked product. Nothing
   unlinked is ever shown.
5. **Gifting and Black Friday** (from `q4-gifting`): Gift finder template, gift sets built
   from components, seasonal categories and the Black Friday offer, reworked to fit the
   three-step setup and template slots.
6. **Pricing:** 21-day trial, then Free (50 completions a month, "Powered by CraftFrame"),
   Standard USD 25 (2,000), Growth USD 79 (15,000). Needs the completion counter.
   Fallback if the counter is late: Free unlimited with the attribution line.

Out of 1.0: analytics funnel UI, price sync, AI draft.

## Timeline (Black Friday is 27 November 2026)

| Date | Milestone |
|---|---|
| 3 Oct | Plan agreed, branches set up |
| by 10 Oct | Three-step setup, finder/bundle types and the answer grid working on the dev store |
| by 17 Oct | Template slots and gifting reworked onto the new setup; completion counter |
| by 23 Oct | Code freeze, QA (fresh install, reinstall, keyboard, slow phone, console clean) |
| by 26 Oct | New screencast (three steps, short), listing and pricing updated, resubmitted |
| Nov | Review feedback answered within a day; approval in time for merchants to set up before Black Friday |

## Progress

**3 Oct: simple setup built (items 1 to 4).**
- `configs/simple.js`: the simple setup (`config.simple`: mode, products, questions, grid),
  suggested ticks from product names, types and tags, and `compile()` to the engine config
  (`match: 'score'`, `meta.schema: 3`). Questions and wording come from the category.
- Engine 1.3 (`src/configurator.js`): score matching (most ticks wins, ties to the first
  product), "Because you chose" reasons, "Also a good fit" in Product finder, product
  names as fallbacks, unlinked products never shown (schema 2+), "Almost ready" when
  nothing is linked. Schema 1 configs behave as before.
- Admin: `/app/start` (Your products: type, what you sell, products), `/app/grid`
  (Questions: wording and ticks, live preview), Go live and Overview with three tasks,
  look matched on the first save, menu follows the setup. "Switch to the rules editor"
  on the Overview turns ticks into rules (`meta.mode: 'advanced'`) and back.
- Verified: code check, production build, all 17 categories in both modes, storefront
  result in a real browser (mobile and desktop).

**3 Oct: gifting and Black Friday on the simple setup (item 5).**
- Your products: "Add a gift set" builds a main product from several store products under
  a name the merchant gives it; all of them go in the cart, the price is their sum, and
  "What's in the gift" lists them. "Refresh from my catalogue" re-reads prices and pictures.
- Suggested ticks read price bands ("Under £25", "£25 to £50", "Over £100") and tick by
  price; yes/no extras from the template ("Gift wrap it", "Add a card") become an extras
  question in a Bundle quiz. Gift finder is listed first in gifting season.
- Overview shows a Black Friday card from 1 October until Cyber Monday when no offer covers
  it, linking to the Black Friday preset in Copy & cart.
- Verified in a real browser: gift set, wrap add-on and BLACKFRIDAY20 in the cart link.

**3 Oct: plans and the completion counter (item 6).**
- `app/plans.js`: Free (50 completions, attribution line), Starter USD 9 (300, added 3 Oct), Standard USD 25 (2,000),
  Growth USD 79 (15,000), 21-day trial on paid plans. The active subscription is mapped by
  name; no subscription is Free. No redirect to the plan page any more (a Free plan means
  every store has a valid plan), which also retires the 0.9.4 redirect-loop guard.
- Counter: the theme block posts `{type: 'complete'}` to `/apps/bundle-quiz/event` when a
  shopper reaches a result (not in the theme editor, not for restored or shared results).
  The app proxy forwards it signed to `routes/proxy.event.jsx`, which adds one to `Usage`
  (shop, month). New Prisma model and migration `20261003000000_usage`.
- Over the limit the quiz keeps working; the merchant sees a banner from 80% and the plan
  card on the Overview (count, progress, trial days left, link to Shopify's plan page).
  The storefront's copy of the plan (`config.plan`) is kept in step on every admin load and
  by the `app_subscriptions/update` webhook.
- Privacy policy and compliance webhook updated: a monthly count per store, deleted on
  shop redact.
- Local testing: set `BCFG_PLAN=free` (or standard, growth) to see each plan without a
  subscription; production reads Shopify with `BCFG_BILLING=on`.

## Shopify side, before resubmitting

1. Done 3 Oct: App Pricing has Free (USD 0), Starter (USD 9), Standard (USD 25) and Growth
   (USD 79), paid plans with a 21-day trial. Plan names must contain "Free", "Starter",
   "Standard" and "Growth" (the app maps by name). Listing features describe each by
   completions: 50, 300, 2,000, 15,000 a month; Free shows a small attribution line.
2. `npm run deploy` from `release-1.0` registers the app proxy and the new webhook
   (config change only; no new access scopes, so merchants are not asked to re-approve).
3. Netlify: deploy `release-1.0`; `netlify:build` runs `prisma migrate deploy`, which
   creates the Usage table.
4. Listing: update the pricing text, screenshots and the privacy policy link date.

- Still to do: run on the dev store (`npm run dev`, after `npx prisma migrate deploy`
  against the dev database), new screencast, listing update, resubmission.

**3 Oct: local test setup (dev store).**
- Neon branch `dev` (from `production`) is the development database; its connection string
  is in `shopify-app/.env` (gitignored). The Usage migration is applied there. Production
  is untouched.
- Run `BCFG_PLAN=free npm run dev` in `shopify-app`. The first "Configuring host theme"
  step can take five to seven minutes.
- If the app opens example.com, the dev preview was lost (usually after uninstalling the
  dev app): restart `npm run dev`. If a page shows "TypeError: Failed to fetch", the
  Cloudflare quick tunnel has dropped (its hostname no longer resolves): restart `npm run
  dev` for a new one. Neither is an app bug.
- A store with a saved 0.9.4 setup opens the old Overview; "Start a simple setup" in the
  Simple setup section starts 1.0's three steps.

## The open review

The current submission is still open with item 4.5.3. Reply in the review thread that a
revised version with a simpler setup is coming, so the reviewer is not waiting on the old
screencast. If the submission is closed meanwhile, resubmit with 1.0. Pricing changes
restart review, which no longer matters because 1.0 is reviewed as new.
