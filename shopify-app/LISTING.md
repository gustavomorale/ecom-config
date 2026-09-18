# App Store listing copy

Paste into the Partner Dashboard listing. Character limits are Shopify's at the time of
writing; trim rather than rewrite if they change. Keep the beta status visible until the
first paid version ships.

## App name

Bundle Configurator

## Tagline (max 62 characters)

Guided questionnaire that builds the right bundle and cart

## App introduction (max 100 characters)

Ask shoppers a few questions, recommend the right bundle, open checkout pre-filled.

## App details (max 500 characters)

Turn "which one should I buy?" into a five-minute setup and a one-click cart. Shoppers
answer four to six questions in a block on any page; your rules pick the base bundle and
the add-ons that fit; the result shows what is in the set and why, then opens checkout
with everything loaded. Pick a category to start from a working template (skincare, home
security, subscription boxes and more), match your store's colours in one click, link
your products, done. 14-day free trial, and we answer every email within a working day.

## Feature list (each max 80 characters)

- Category templates: a working questionnaire the moment you pick what you sell
- Match my store: reads your theme's colours, type and corners, with a confidence check
- Every product linked from your catalogue with the product picker, no IDs to type
- Options as emoji rows or picture cards, using your product and collection photos
- Rules editor in plain rows: no code, no JSON, quantities can be calculated from answers
- Result screen with reasons, price preview and a pre-filled checkout link
- Shoppers' answers survive a refresh and can be shared as a link
- Accessible: keyboard navigation, screen reader announcements, focus management
- Glass or Base look; steps down to flat surfaces on slow devices automatically
- Sample catalogue import for stores that want to try it before adding products
- No theme edits, no code, and no customer data stored

## Beta notice (put at the top of the details, and in the support section)

Bundle Configurator is in beta. Still to come: live price sync from your catalogue and
drop-off analytics. Report anything broken or missing to contact@craftframe.agency and
expect a reply within a working day.

## Pricing

One plan, set in the Billing API (`shopify-app/app/shopify.server.js`): **14-day free
trial, then USD 25 a month** on the merchant's Shopify bill, never per order. App charges
are set in USD; Shopify shows merchants an approximate local amount (about GBP 19).
Billing is on in production since 2026-09-18 (`BCFG_BILLING=on` in Netlify). Development
stores, including reviewers', get a test charge automatically; real stores a real one. Register for Shopify's revenue share programme in the Partner
dashboard: 0% on the first USD 1M a year.

## Access scopes and why (privacy section)

- read_products: to link bundles and add-ons to your products in setup.
- read_themes: to read your published theme's colours, type and corners for "Match my store".
- The app writes one shop metafield (bundle_configurator.config) that holds your setup.

The app does not edit your theme, products or orders. It stores no customer data: shoppers'
answers stay in their browser, and a shared link contains only the answers the shopper
chose to share. Privacy webhooks (customers/data_request, customers/redact, shop/redact)
are implemented.

## Privacy policy URL

https://bundle-configurator.netlify.app/privacy (source: `app/routes/privacy.jsx`; keep it in
step with the code). Have it read by whoever advises CraftFrame on data protection before
submitting, and add the registered office address and company number if required.

## Support

Email: contact@craftframe.agency
Reply time: within one working day
Developer: CraftFrame WORKS Ltd

## Screenshots to take (5, 1600 x 1200)

1. Storefront: the questionnaire, step 1, glass look on the cosmetics demo.
2. Storefront: the result screen with bundle, add-ons and the cart panel.
3. Admin: the welcome page.
4. Admin: Look step with "Good match" and the live preview.
5. Admin: Products step with everything linked.

## Demo store

The MySuperStore dev store with the cosmetics template and the sample catalogue is the
screenshot and video set. Rename products before recording if the placeholder images show.
