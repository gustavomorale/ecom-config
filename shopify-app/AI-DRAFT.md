# AI draft: setup from the catalogue (v1.4, parked 2026-09-22)

Goal: the slow part of setup is deciding what to ask and which product answers each
question, not clicking. An "AI draft" step reads the store's products and writes a first
questionnaire, bundles and add-on rules into the config for the merchant to edit.

Why not now: Shopify's Sidekick cannot write into third-party app fields, so an in-app
feature is the only way to make this one click. It sends catalogue data to a model
provider, which means new privacy policy and listing disclosures. Ship after the first
approval, not during review.

## Shape

- Button on the Category step: "Draft from my products". Runs after the template is chosen.
- Input: template config, plus up to 50 products (title, type, tags, price, first line of
  description) read with the existing `read_products` scope. No customer data.
- Output: JSON matching the config shape (steps, bundles, accessories, addonRules), validated
  with the same code the editor uses, then saved as the draft the setup wizard continues with.
- Every generated line is editable; the wizard still runs.
- Model call from the server only; key in Netlify env; log nothing but counts.

## Prompt (merchant-facing version, usable today with any assistant)

You are helping set up CraftFrame Bundle Quiz, a Shopify app that asks shoppers a few
questions and recommends a bundle plus add-ons from my catalogue.

My store: [store URL]
What I sell, in one line: [...]
Who buys it: [...]
Best-selling products: [5 to 15 names with prices, or a collection URL]

Produce a first draft with these parts, using only products I actually sell:
1. Headline (under 40 characters) and a one-sentence sub-headline, in my brand voice.
2. Four to six questions, each with 3 to 6 options. Each option: short label, one-line
   description, one emoji. Cover the shopper's goal, how much they buy or use, and a
   preference or constraint.
3. Three or four bundles: name, one-line "why this set", which answers lead to it, products in it.
4. Six to twelve add-ons: product, triggering answer, one-line reason the shopper sees.
5. A short note on gaps: questions with no matching product, products no answer reaches.
Keep every piece of text short and plain. No claims about results or outcomes.
