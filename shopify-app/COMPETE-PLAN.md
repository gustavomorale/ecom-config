# Compete plan, November 2026

Written 2026-11-04, after approval (2 Nov) and a check of the live listings. Target: real
stores live before Black Friday (27 Nov). Pricing (section 2) applied in app 1.0.13 on 2026-11-05. Owner: **G** is Gustavo,
**C** is Claude.

Position: **the simple, affordable product quiz for small and medium stores.** We do not fight
Kaching and Bundler on discounts. Our real rivals are the quiz apps.

## Decisions needed first

- [x] **G: Approve the new pricing** (below).
- [x] **G: Approve a real Free limit**: the quiz pauses when a Free store passes its limit.
- [ ] **G: Choose the store list for outreach** (CraftFrame clients first).

## 1. Foundations (by Fri 6 Nov)

- [ ] **G: Real install test.** Install from the public listing, choose a paid plan, finish a
      quiz, buy through to checkout.
- [ ] **G: Confirm developer registration** for the revenue share in the Partner Dashboard.
      Shopify's terms give 0% on the first USD 1M only when registered, and 20% otherwise.
- [ ] **C: Check with Shopify** whether changing the name, category or plans triggers a review.
- [x] **G: Correct the listing tags.** Remove gift boxes, mix-and-match and build a box unless
      they are true on the day. Put gift boxes back when gift sets are on.
- [ ] **C: Draft the listing copy** around "product quiz" and "product finder".
- [ ] **C + G: Test the category.** Quiz rivals sit in Pop-ups and Upsell and cross-sell. The
      Product bundles category also requires native bundle APIs for Built for Shopify.
- [ ] **C: Fix the promo video captions**: $749.43 to $749.95, "Free or USD 9 a month" to "Free
      plan available". **G:** add it to the listing.

## 2. Pricing (by Tue 10 Nov)

- [x] **C: Pause the quiz at the Free limit**, with notices in the app at 50%, 80% and 100%. Add an email at the limit later: a merchant who never opens the app would not see them. Paying stores
      are never paused. Test on the dev store.
- [x] **C: Update `app/plans.js`, the in-app plan cards, `LISTING.md`, the privacy and support
      wording.** Release together with the listing change.
- [x] **G: Update the plans in the Partner Dashboard**, including annual prices and the 14-day
      trial.
- [ ] **G: Decide how to treat any store already installed.** Keep them on their current limits.

## 3. Black Friday (by Tue 10 Nov)

- [ ] **C: Turn gift sets and the Black Friday offer back on**, test on the dev store, release.
- [ ] **C: Add the in-app review prompt** after 25 completions, with no incentive of any kind.
- [ ] **C: Add a one-page guide**: "Set up a gift finder before Black Friday".

## 4. First merchants (9 to 27 Nov)

- [ ] **G: List 30 to 50 stores**: CraftFrame clients first, then stores with 20 to 200 products
      and no quiz.
- [ ] **C: Write the outreach message** and a short follow-up.
- [ ] **G: Send it and offer a free setup.** Target: 5 live quizzes.
- [ ] **G: Ask happy stores for an honest review.** Target: 3 by 27 Nov, 5 by 31 Dec. Never pay
      or reward a review.
- [ ] **G + C: Write up one real result** as a case study.

## 5. Proof of revenue (by Fri 20 Nov)

- [ ] **C: Count add-to-carts and cart value per quiz**, shown on Home. No new scope and no
      shopper data. Update the privacy page.
- [ ] **C: Show where shoppers drop out**, question by question.

## 6. After Black Friday (December)

- [ ] **C: Release AI setup (1.1)** with "Build my quiz with AI" on Home. 3 drafts in total for
      trial and Free. Needs the data terms, privacy and listing updates. Move it earlier if
      merchants stall on Questions.
- [ ] **C: Klaviyo connection**: both main quiz rivals have it.
- [ ] **C: Automatic discounts**: only if at least 3 of the first 10 stores ask. Needs
      `write_discounts` and a new Shopify review.
- [ ] **C: Second language**, chosen from where the installs come from.
- [ ] **G + C: Work towards Built for Shopify**: 50 paid installs, 5 reviews, speed targets.
- [ ] **G: Paid ads**: only after 10 reviews and one published result.

## Pricing proposal

### The problem in the code today

The listing says Free has 50 completions a month, but the quiz keeps working past that limit:
counting simply stops (`app/routes/proxy.event.jsx`, `usageState` in `app/plans.js`). A busy
store never has to pay unless it wants the Powered by line removed or more than one quiz. Paid
plans are not stopped either. Standard is also generous enough to remove most reasons to move
up: 2,000 completions for USD 25.

### Proposed plans

| Plan | Now | Proposed | Yearly (2 months free) |
|---|---|---|---|
| Free | 50 (not enforced), 1 quiz | **100, enforced**, 1 quiz, Powered by line | n/a |
| Starter | USD 9: 300, 3 quizzes | **Same** | USD 90 |
| Standard | USD 25: 2,000, 10 quizzes | USD 25: **1,000**, 10 quizzes | USD 250 |
| Growth | USD 79: 15,000, 25 quizzes | USD 79: **5,000**, 25 quizzes | USD 790 |
| Custom | By agreement | Above 5,000 | By agreement |
| Trial | 21 days | **14 days** (decided 2026-10-19) | |

### Against the quiz apps (price per 1,000 completions)

| App and plan | Price | Included | Per 1,000 |
|---|---|---|---|
| **Us, Starter** | USD 9 | 300 | USD 30.00 |
| Quizify Starter | USD 9.99 | 200 | USD 49.95 |
| RevenueHunt Basic | USD 39 | 500 | USD 78.00 |
| **Us, Standard (proposed)** | USD 25 | 1,000 | USD 25.00 |
| RevenueHunt Pro | USD 99 | 1,000 | USD 99.00 |
| Quizify Pro | USD 49.99 | 1,500 | USD 33.33 |
| **Us, Growth (proposed)** | USD 79 | 5,000 | USD 15.80 |
| RevenueHunt Premium | USD 199 | 2,500 | USD 79.60 |

Every paid plan stays cheaper than these rivals' plans at a similar size. Prices taken from the
App Store listings on 2026-11-04. Quiz responses and completions may be counted differently.

### Why this is more profitable

- Our cost barely grows with stores: USD 7 to 20 a month for the server and database, 2.9%
  processing, and USD 0.02 to 0.25 for each AI draft (0.02 measured on 11 products; the higher
  figure is an estimate for 150 products). Support time is the real cost.
- One Standard store pays for the servers. Profit comes from how many stores pay and how long
  they stay, not from saving on costs.
- A real limit gives busy stores a reason to pay, the proposed volumes give them a reason to
  move up, and yearly billing brings cash early and should reduce cancellations.

### Measure, then adjust

Set at 90 days or 100 installs, whichever comes first:

- More than 5% of active Free stores upgrade: keep it.
- Under 2%: look at setup and value before touching the price.
- Many uninstalls at the pause: raise the Free limit or add a grace period.
- Almost nobody reaches 100 completions: lower the limit or add another reason to upgrade.

The thresholds are starting guesses, not benchmarks. Raise prices only after 20 or more reviews
at 4.8 or better (see `LAUNCH-PLAN.md`).
