# App Store submission pack

Everything needed to submit Bundle Configurator for review. Listing copy is in `LISTING.md`.
Production app in the Dev Dashboard: **bundle-configurator-2** (client ID `a1b72ae7…`).

## 1. Test instructions (paste into "Testing instructions" in the submission form)

Bundle Configurator adds a questionnaire block to the storefront. A shopper answers a few
questions, the app's rules choose a bundle and add-ons, and the result opens a pre-filled cart.
No account or credentials are needed beyond installing the app.

**Install and billing**
1. Install the app. You are asked to approve the plan: 14-day free trial, then USD 25 every
   30 days. On a development store this is a test charge. Approve it.
2. You land on the welcome page. Click **Start setup**.

**Setup (about five minutes)**
3. **Category**: choose *Cosmetics & skincare* (a full template). You are taken to Look.
4. **Look**: click **Match my store**. The app reads the published theme's settings and reports
   how good the match is. Optionally set a brand colour. The preview on the right has Mobile and
   Desktop views. **Save and continue**.
5. **Questions**: rename a question, set one question to *Picture cards*, and for an option
   choose *Picture from my store* then **Choose a product**. **Save and continue**.
6. **Products**: if the store has no matching products, use **Download sample CSV**, import it
   under Products, Import, return and click **Link imported samples**. Otherwise use
   **Choose product** on each row. **Save and continue**.
7. **Go live**: click **Open theme editor**. In any section choose Add block, Apps,
   **Bundle Configurator** (or Add section, Apps). Save the theme. **Finish setup**.

**Storefront**
8. Open the storefront page with the block. Answer the questions and reach the result: a bundle,
   add-ons with reasons, an order total and **Add to cart**, which opens the cart with those
   variants. Refresh mid-way: answers are kept. **Copy a link to this bundle** reproduces the
   result in another browser.
9. Keyboard only: Tab into the questionnaire, use the arrow keys on a single-choice question,
   Enter on Continue. Focus moves to each new question.

**Editing after setup**
10. In the app: **Rules** (change a condition or a quantity; an invalid quantity such as
    `people + nonsense` is refused with an explanation), **Copy & cart** (headline, promo code,
    cart mode). Saved changes appear on the storefront at once.
11. The overview banner reports whether the block is on the published theme.

**Uninstall**: removing the app deletes its session data. The block disappears from the
storefront with the app. The app's configuration metafield remains in the store's custom data.

**What the app accesses**: `read_products` (product picker, sample linking), `read_themes`
(Match my store, block detection). It writes one shop metafield. No customer data.
Privacy policy: https://bundle-configurator.netlify.app/privacy
Support: contact@craftframe.agency

## 2. QA store for reviewers (do this before submitting)

Reviewers normally install on their own store, but a prepared demo store speeds things up and
is what the screenshots come from.

- [ ] Dev Dashboard, Stores, create `bundle-configurator-demo` with test data off (clean).
- [ ] Theme: Dawn (current version). Set a real brand colour on the buttons in theme settings so
      **Match my store** shows "Good match" in screenshots. Set a storefront password and note it.
- [ ] Install the app via
      `https://admin.shopify.com/store/<handle>/oauth/install?client_id=a1b72ae7a95a6312f1f0587db9042df4`.
- [ ] Run setup with *Cosmetics & skincare*. Import the sample CSV, then replace the placeholder
      images on the 16 sample products with real product photos (any royalty-free skincare set)
      so the picture cards and the result look real.
- [ ] Questions: first question as Picture cards with product photos. Headline written in a
      brand voice (not the template's).
- [ ] Add the block to the home page in its own Apps section. Check mobile and desktop.
- [ ] Put the demo store URL and its storefront password in the submission form.

## 3. Screenshots (1600 x 1200 px, PNG, no browser chrome, no personal data)

1. **Storefront, question 1** as picture cards, desktop. Caption: "Ask what matters, in your
   store's own look."
2. **Storefront, result**: bundle, add-ons with reasons, cart panel. Caption: "A ready-made
   cart, with the reasons shown."
3. **Admin overview**: live banner, setup guide, quick actions, phone preview. Caption: "Set up
   in five minutes, edit any time."
4. **Rules page**: one bundle condition and one add-on rule in rows. Caption: "Rules in plain
   rows. No code."
5. **Look page** with "Good match" and the swatches. Caption: "Matches your theme in one click."
6. (optional) **Questions page** showing Emoji / Picture from my store / Custom image.

Mobile screenshot (optional, 900 x 1600): the questionnaire on a phone with the sticky bar.

Tip: use the app's Enlarge preview for clean storefront captures, and the browser's device
toolbar at 1600 x 1200 for admin pages.

## 4. App icon (1200 x 1200 px, PNG or JPG, under 1 MB)

**Chosen 2026-09-18: concept A, "steps".** Files in `branding/`: `app-icon-1200.png` (upload this
one to the Dev Dashboard app settings and to the listing), `app-icon-512.png`, `app-icon.svg`
(source; also served as the app's favicon from `public/icon.svg`). The other concepts are kept
as `icon-b/c/d-*.svg`.

Original brief: a simple mark that reads at 40 px. Suggested concept: three stacked rounded bars (the
questionnaire steps) resolving into a check or a basket, on a solid background in the brand
blue `#3d5ee6` with a white mark. No text, no Shopify bag, no screenshots, square with the
artwork inside a safe area of about 80%. Upload it in the Dev Dashboard app settings and in the
listing.

## 5. Listing form fields

| Field | Value |
|---|---|
| App name | Bundle Configurator |
| Tagline, introduction, details, features | `LISTING.md` |
| Category | Store design, or Selling products: Product bundles |
| Pricing | Recurring: USD 25 / 30 days, 14-day free trial. No usage charges |
| Privacy policy URL | https://bundle-configurator.netlify.app/privacy |
| Support email | contact@craftframe.agency |
| Demo store | `bundle-configurator-demo` URL plus storefront password |
| Languages | English |
| Works with | Online Store 2.0 themes (app blocks) |

## 6. Pre-flight

- [ ] Client secret rotated after it appeared in a screenshot; new value set in Netlify;
      redeployed; app still opens.
- [x] `BCFG_BILLING=on` in Netlify. Verified on MySuperStore 2026-09-18: the approval page shows
      Standard, 14-day trial, USD 25 every 30 days as a test charge; Approve opens the overview;
      Cancel returns to Settings, Apps without a loop. The return URL must be absolute.
- [ ] Fresh install on a clean dev store end to end, following section 1 exactly.
- [ ] Uninstall and reinstall: no errors, welcome page appears, old session gone.
- [ ] Privacy policy read by CraftFrame's adviser. Registered address and company number
      added 2026-09-18 from Companies House (16669774); confirm they are current.
- [ ] Privacy webhooks respond 200 to a signed test and 401/400 unsigned (verified 2026-09-16).
- [ ] Storefront on a slow phone and with reduced motion / reduced transparency.
- [ ] No console errors in the admin or on the storefront.
- [ ] `LISTING.md` beta wording matches what is true on submission day.
- [ ] Submit. Expect 1 to 2 weeks and at least one round of feedback; answer within a day.
