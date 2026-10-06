# AI draft: a finished quiz from the store's catalogue (spec)

Rewritten 2026-10-06 for the 1.0 simple setup. Decided by Gustavo the same day: this is a
core feature of the public release, worth a longer review. Ships as app 1.1.0, submitted
with (or right after) the 1.0 listing.

## What the merchant gets

On "Your products", above the manual choices, a card: **Let AI set it up**. The merchant
can leave everything to the AI or narrow it first (quiz type, a collection to draw from,
one line about who buys). About 20 to 60 seconds later they see a complete proposal:

- the quiz type (Product finder or Bundle quiz) and why;
- which products are the main picks and which are extras;
- two to four questions with their answers, wording, emoji or product photo per answer,
  and whether answers show as picture cards;
- the ticks: which products each answer points to;
- a headline and sub-headline in the store's voice;
- a short "check this" list: answers that point nowhere, products no answer reaches.

Buttons: **Use this draft** (saves it as the quiz, then opens Questions, where every word
and tick is editable), **Try again** (one more draft, counted), **Set up myself**. Nothing
reaches the storefront until the merchant goes live, exactly as with a manual setup.

## Why the 1.0 setup makes this safe

The AI does not invent products, prices, pictures or "what's included" text. It only:
1. picks product IDs from the catalogue it was given,
2. writes questions and answers,
3. fills the answer grid with those IDs.

Everything a shopper sees about a product still comes from Shopify (title, photo, price),
because `configs/simple.js` compiles the quiz from linked products. The reply is checked by
the same rules the Questions page uses before anything is saved.

## Inputs (read with the scopes the app already has)

- `read_products`: up to 150 products, active and published to the Online Store, with
  title, product type, vendor, tags, price range, first variant ID, availability, featured
  image URL, and the first 300 characters of the description (HTML stripped). If the store
  has more, use the collection the merchant chose; with no collection, the 150 most
  recently updated (best sellers would need `read_orders`), and the card says so.
- `shop { name description currencyCode }` for voice and currency.
- `read_themes`: nothing extra is sent; the look is matched as today.
- The category registry (`configs/categories.js`): ids, labels and each category's
  question wording, so the AI can start from proven questions and name the category.
- Never sent: customers, orders, analytics, anything personal.

"Reading the website" is done through this data, not by scraping pages: it is complete,
structured, and the same for every theme.

## The model call (server only)

- `@anthropic-ai/sdk`, model `claude-opus-5-5`, adaptive thinking (default on this model),
  `output_config.effort: "medium"` to start (raise to `high` if drafts need it; measure).
- Guaranteed shape: structured outputs, `output_config.format` with the JSON schema below
  (`additionalProperties: false`, every field required). Parse with `JSON.parse` and still
  validate (the schema guarantees shape, not sense).
- Refusals: check `stop_reason` before reading; enable the server-side fallback
  (`betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`). On `refusal`,
  `max_tokens` or invalid output: retry once, then show "Set up myself" with the reason.
- Prompt caching: system prompt (instructions, schema, category wording) first and frozen,
  `cache_control` on it; the catalogue goes in the user message. Only helps when the same
  store retries within minutes, but costs nothing.
- Streaming with `max_tokens` around 32,000 and `.finalMessage()`, so long drafts never hit
  an HTTP timeout.
- Key: `ANTHROPIC_API_KEY` in Netlify environment variables; never in the browser.

### Runs as a background job

A draft can take longer than a Netlify page request may run, so:
1. `POST /app/ai/draft` checks the plan allowance, creates an `AiDraft` row
   (shop, quiz, status `pending`, inputs hash) and starts the job (Netlify background
   function, `-background` suffix; confirm the site's plan allows them, otherwise a queue
   on the same server with a 15-minute cap).
2. The job calls Claude, validates, stores the draft JSON and status `ready` or `failed`.
3. The page polls `GET /app/ai/draft?id=` every 3 seconds with a progress message
   ("Reading 86 products", "Writing questions", "Checking the draft").

### Reply schema (draft v1)

```json
{
  "mode": "finder | bundle",
  "category": "<registry id>",
  "reason": "one sentence for the merchant",
  "products": [{ "productId": "gid://shopify/Product/…", "role": "main | extra" }],
  "questions": [{
    "title": "…", "sub": "…", "multi": false, "target": "main | extra", "display": "rows | cards",
    "answers": [{ "label": "…", "desc": "…", "icon": "emoji or empty", "pictureProductId": "gid or empty" }]
  }],
  "grid": [{ "question": 0, "answer": 1, "productIds": ["gid://…"] }],
  "copy": { "title": "…", "titleHighlight": "…", "subtitle": "…" },
  "notes": ["…"]
}
```

## Checks before saving (same code as the editor, plus)

- Every `productId` is in the catalogue sent; unknown IDs are dropped, not guessed.
- 2 to 12 main products; extras only in a Bundle quiz; 2 to 4 questions; 2 to 6 answers.
- Every main product is reachable by at least one answer; every answer points somewhere.
  Gaps are fixed by dropping the answer or added to "check this", never silently.
- Text limits from `app.grid.jsx` (`cleanQuestions`); no em dashes, no claims about results
  ("best", "guaranteed"), no prices in text (prices come from Shopify).
- The result becomes `config.simple` via `buildSimple` / `recompile`, so the storefront
  engine needs no change. `meta.aiDraft = { at, model, effort }` records where it came from.

## Prompt (system, abridged)

You set up a shopping quiz for a Shopify store using only the products listed. Choose
Product finder when products are alternatives to each other, Bundle quiz when there are
clear main products plus accessories. Ask about the shopper (need, experience, budget,
use), never about product names. Prefer the category's proven questions and reword them in
the store's voice. Every answer must point to at least one listed product. Use product
photos for answers when the products differ visibly; otherwise one plain emoji. Keep text
short and plain. Do not mention prices, discounts or outcomes. Reply in the schema only.

## Plans, cost and limits

- Drafts per month: Free 1, Starter 5, Standard 20, Growth 50; Custom by agreement. Counted
  in an `AiUsage` row per shop and month; shown on the AI card and the Plan card.
- Cost per draft, estimated from the Claude Opus 5.5 list price (USD 4 per million input
  tokens, USD 20 per million output): about 15,000 input tokens for 150 products plus
  instructions and about 4,000 to 8,000 output tokens including thinking, so roughly
  USD 0.15 to 0.25. Measure on ten real catalogues before fixing the limits; the plan
  prices leave ample margin even on Growth.
- Shopper traffic still costs nothing: the AI runs once per draft, in the admin.

## Privacy, listing and review

- Privacy policy: product data and shop name are sent to Anthropic, PBC to generate the
  draft when the merchant asks; nothing personal; Anthropic acts as processor (sign the DPA
  in the Anthropic Console before launch and confirm its retention and training terms).
- Listing: an "AI draft" feature line and Shopify's AI disclosure where the form asks.
- Review: mention the feature and the test steps in the testing instructions; the reviewer
  needs a store with products (their own) to try it.
- Merchant control: the draft is a proposal; nothing goes live without them.

## Build plan (about 1.5 weeks)

| Day | Work |
|---|---|
| 1 | `AiDraft` and `AiUsage` models and migration; catalogue reader (150 products, stripped) |
| 2 to 3 | Claude call (schema, fallback, retry), validation into `config.simple`, unit tests on fixtures (snowboards, skincare, gifts) |
| 4 | Background job and polling route; allowance checks per plan |
| 5 to 6 | "Let AI set it up" card, progress, proposal review (summary, Use / Try again / Set up myself) |
| 7 | Ten real catalogues: quality pass, tune prompt and effort, measure cost and time |
| 8 | Privacy policy, listing lines, review notes, screencast segment; release 1.1.0 |

Needs from Gustavo: an Anthropic API key (Console, organisation CraftFrame) for Netlify and
for local testing, the DPA signed, and a go-ahead to change the privacy policy.
