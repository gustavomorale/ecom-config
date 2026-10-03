# Templates as logic, products from the store (spec)

Written 2026-09-27. Status: proposal, for after App Store approval. Target release 0.11.0
(after or alongside the 0.10.0 gifting release). Nothing here changes the reviewed app.

## The problem

A category template today carries two things at once:

1. **The logic:** questions, answers, which bundle each answer leads to, which add-ons
   follow and why. This is the reusable expertise a merchant pays for.
2. **A made-up catalogue:** bundle names ("Camp Kit"), what each contains ("Tent, Sleeping
   bag"), add-on names ("Water filter"), prices and reasons that name those products.

Only the second is a problem, and it is a big one. Linking a real product to a bundle
changes the picture and the price, but the storefront keeps showing the template's words:
`rec.bundle.title`, the `contents` list and each add-on rule's `text` all come from the
template (`src/configurator.js`, result rendering). So a snowboard store that links its
own boards still shows "Camp Kit" with "Tent" under What's included, and a "Waterproof
shell" add-on that is actually a snowboard. Making the template fit meant rewriting about
40 fields on the screencast store. A merchant who misses one shows a shopper a product the
store does not sell.

Starting from blank is not the answer: an empty questionnaire leaves the merchant to invent
the logic, which is the hardest part (Decision 1, "nobody faces an empty questionnaire").

## The change in one sentence

Templates keep the questions and the logic; every product a shopper sees, and every word
that names it, comes from the product the merchant links. Nothing unlinked is ever shown.

## What a template contains after the change

| Part | Today | After |
|---|---|---|
| Questions, answers, helper text | Template | Template (unchanged) |
| Bundle and add-on conditions, quantities | Template | Template (unchanged) |
| Bundle name, image, price | Template name; product image and price once linked | Linked product's title, image and price |
| What's included | Template list (tents) | The linked product's items: its components for a gift set (0.10.0), else empty unless the merchant writes one |
| Add-on name, image, price | Rule `text` (template); product image and price | Linked product's title, image and price |
| Why this bundle, add-on reason | Template text that may name products | Template text written about the answers only ("For long days off-piste, this is the one we'd pick") |
| Merchant-facing slot label | None (the fake name doubles as one) | `role` and `hint`, admin only: "Starter option", "The pick for experienced riders" |

In config terms, a template bundle becomes:

```js
{ id: 'starter', role: 'Starter option', hint: 'Your most forgiving, beginner-friendly product',
  why: 'A forgiving pick while you are learning.', when: { ... },
  // no title, no contents, no price: they come from the linked product
  variantId: '' }
```

and an add-on:

```js
accessories: { wet: { role: 'Extra for wet weather', hint: 'Anything that keeps a shopper dry', variantId: '' } },
addonRules: [{ id: 'wet', accessory: 'wet', when: { field: 'priorities', op: 'includes', value: 'wet' },
               reason: 'You said wet weather matters' /* no text: the product's title is shown */ }]
```

`meta.schema: 2` marks a config built this way.

## Engine (src/configurator.js)

1. **Names fall back to the product.** Bundle title: `b.title || b.productTitle`. Add-on
   text: `rule.text || acc.productTitle || acc.title`. Image and price already come from the
   linked product.
2. **Unlinked slots are never shown on the storefront.** A bundle without a product (and
   without components) is skipped when matching, so the next one wins; an add-on without a
   product is dropped. If the fallback bundle is unlinked and nothing else matches, the
   result says the store is still setting up and shows no cart button. (Advisory add-ons,
   `rule.advisory`, stay as they are: they name no product.)
3. **The admin preview is different on purpose:** it shows unlinked slots by their role,
   greyed, with "Link a product", so the merchant can see the whole logic before linking.
   A config flag passed only by the admin preview (`preview: true`) switches this on.
4. **Schema 1 configs behave exactly as today.** The fallbacks only apply when a field is
   empty, and only schema 2 hides unlinked slots, so no live store changes on upgrade.

About a day, plus the demo and single-file demo sync.

## Templates (configs/)

- `starter()` builds 12 of the 16 categories, so most of the work is changing it once:
  tiers become roles (entry, middle, top), `contents` and titles go, `why` and reasons are
  reworded to talk about answers only.
- The four full templates (house accessories, subscription boxes, cosmetics, gift finder)
  are rewritten by hand: roles, hints, answer-only copy.
- Question wording stays, with one rule for authors: questions ask about the shopper, not
  about products ("How experienced are you?" rather than "Which tent do you need?").

About two days.

## Admin (shopify-app/)

- **Products step** becomes "Link a product to each role": each row shows the role, its
  hint, and once linked, exactly what the shopper will see (product title, photo, price).
  The gift-set editor (0.10.0) works per role as it does per bundle today.
- **Rules page:** the bundle "Title" and add-on "Shopper sees" fields become optional
  overrides: "Name shown to shoppers (leave empty to use the product's name)". What's
  included stays editable, empty by default.
- **Overview and Go live:** "Connect your products" counts roles. Go live warns, in words,
  when a role is unlinked ("2 roles have no product yet; shoppers who would get them see
  the next match instead"), and blocks nothing.
- The five setup steps and their order do not change (Decision 6).

About two days.

## Existing merchants

Nothing changes for configs already saved (schema 1). The overview offers, once, "Use your
products' names everywhere": it clears template-only bundle titles, add-on texts and
contents where a product is linked, sets `meta.schema: 2`, and can be undone from Rules by
typing a name back. Merchants who wrote their own names keep them, because only fields
still equal to the template's text are cleared.

## How it fits the roadmap

- **0.10.0, gifting:** gift sets from components already derive What's included from real
  products, which is this same principle for one bundle type.
- **0.11.0, this spec.**
- **v1.4, AI draft (`AI-DRAFT.md`):** reads the catalogue and fills the roles, and can
  reword questions for the store ("snowboards" rather than "camping"). With roles in place
  the AI writes links and wording only, never product copy, which makes its output safe
  to accept.

## Open questions for Gustavo

1. **Unlinked fallback on the storefront:** hide the widget until the fallback role is
   linked, or show "still setting up" (proposed above)?
2. **Broad categories:** Sports & outdoors asks about camping. Split broad categories into
   narrower templates (camping, snow sports, cycling, running), or leave the wording to the
   merchant and to the AI draft?
3. **Offer for existing merchants:** a one-off "Use your products' names everywhere", as
   proposed, or leave schema 1 configs alone entirely?

## Effort and order

About a week and a half: engine 1 day, templates 2, admin 2, migration offer 1, tests and
demo sync 1.5, plus review of the listing screenshots. No new scopes, so no new permission
approval from merchants. Build on its own branch after approval; ship after or with 0.10.0.
