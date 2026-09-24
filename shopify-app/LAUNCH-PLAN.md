# Launch plan: first installs

Written 2026-09-24 while the app is in review. Evidence from the App Store listings on that
date and Shopify's own marketing and advertising guidance. Prices in USD as listed.

## 1. Where the app sits in the market

The App Store has two niches that meet at this app. Both are crowded and both use
"free plan, then tiers" pricing.

**Product quiz apps** (the closer match; merchants search "product quiz")

| App | Reviews | Launched | Free tier | Paid tiers |
|---|---|---|---|---|
| RevenueHunt | 457 at 4.9 | 2019 | 100 responses/mo | 39 / 99 / 199 by responses |
| Quiz Kit | 177 at 4.9 | | dev stores only | 59 (10-day trial) |
| Lantern | 127 at 4.9 | 2021 | 50 quiz takers | 39 to 399 by takers, 499 unlimited |
| Quizell | 135 at 4.9 | 2021 | dev stores only | 15 / 49 / 199 by engagements |
| Recomma | 89 at 4.9 | Jul 2024 | 50 responses, 1 quiz | 15 / 29 / 99 by responses |

**Bundle builders** (adjacent; merchants search "bundle builder")

| App | Reviews | Free tier | Paid tiers |
|---|---|---|---|
| Fast Bundle | 3,458 at 5.0 | dev stores | 19 / 49 / 139 by bundle sales |
| Easy Bundles (Skai Lama, UK) | 1,325 at 4.9 | up to $500 sales/mo | 29 / 49 / 99 by bundle sales |

Every established competitor prices by usage (responses, quiz takers, or bundle revenue),
which is how they capture larger stores. All but one have a free tier, which is how they
get installs and reviews. Trials are 7 to 15 days.

## 2. Is USD 25 flat the right price?

Where 25 lands: below RevenueHunt's and Lantern's entry tier (39), above Quizell's and
Recomma's (15), and at the low end of the bundle builders (19 to 29). For a new app with no
reviews it is a fair mid-market number and it is not the problem.

The problem is the shape, not the number. A single flat plan with no free tier means:
- No free tier: the "Free plan available" badge is on almost every competitor card. New
  merchants filter by it, and the badge is how those apps collected their first reviews.
  We show only "Free trial available", which reads as the more expensive option.
- Flat price: a store doing 50 quiz completions a month pays the same as one doing 5,000.
  We leave money on the table at the top and look expensive at the bottom.

Recommendation, after approval (changing plans during review restarts it):
- **Free**: up to 100 quiz completions a month, all features, "Powered by" line on the
  result screen. Gets installs, reviews and the badge.
- **Standard, USD 25**: up to 2,000 completions, no attribution line, email support.
  Keep the 14-day trial.
- **Growth, USD 79**: up to 15,000 completions, priority support. Larger stores, and the
  natural home for price sync and AI draft when they ship.
Completion counting needs the analytics endpoint (v1.1), so this depends on that work.
Until then, the honest interim is Free (attribution line) and Standard 25, both unlimited.

Keep USD 25 as the anchor. Move it to 29 only once there are 20+ reviews at 4.8 or better;
that is where Easy Bundles sits and the market accepts it.

## 3. Campaign for first installs

The goal for the first 90 days is not revenue. It is 20 reviews at 4.8+, because on this
store reviews are the ranking signal and the trust signal, and every competitor has 90+.
Roughly 1 in 8 satisfied merchants leaves a review when asked well, so that means about
150 to 200 active installs.

### Phase 0, before approval (now)
- Optimise the listing for search: the terms "product quiz", "recommendation quiz",
  "skincare quiz" are in place. Add "gift finder" and "product finder", which appear in
  competitor titles and have less competition than "bundle".
- Write three help articles on a simple docs page at bundle-configurator.netlify.app
  (setup in five minutes, matching your theme, writing rules). Shopify's guidance rewards
  filled Resources fields, and reviewers and merchants both read them.
- Prepare the review-ask: an in-app prompt on the overview once the block is live and the
  store has had 25 completions ("Is the quiz working for you? A review helps other stores
  find it"). No incentive of any kind; Shopify removes apps for that.

### Phase 1, launch week (approval to day 14): free channels
1. **Shopify Community**: one post in the "Shopify Apps" and "Ecommerce Marketing"
   boards, written as a build story, not an advert (how a quiz differs from a bundle builder,
   what we learned about theme matching). Link to the listing. Answer every reply.
2. **Reddit** r/shopify and r/ecommerce: same story, in the weekly self-promotion threads
   only; direct posts get removed.
3. **CraftFrame's own channels**: LinkedIn post from Gustavo (founder voice), the agency
   newsletter, and a case study page on craftframe.agency. This also feeds the agency's
   positioning as a Shopify builder.
4. **Direct outreach, 30 stores**: UK skincare and supplement D2C brands on Shopify with 20
   to 200 products and no quiz on site (check with BuiltWith or by hand). Personal email,
   offer to set the quiz up for them free on a call. These become the first case studies
   and the first reviews. ERA Protect is the obvious first install: home security is a
   shipped template.
5. **Product Hunt**: worth one launch day for a burst of traffic and backlinks; not a
   source of merchants.

### Phase 2, days 14 to 90: paid, small and measured
App Store ads are cost-per-click, first-price auction, and Shopify prices relevant
keywords cheaper for relevant apps. They are the only paid channel that puts the app in
front of merchants at the moment of intent, so they are the one to test.
- Budget: USD 300 a month for two months, then decide.
- Search ads on 5 keywords: product quiz, recommendation quiz, quiz builder, skincare quiz,
  gift finder. Start bids at USD 0.80 to 1.20; Shopify shows suggested bids in the tool.
- Skip homepage and category ads: those auctions are won by the 1,000-review apps.
- Track: installs by day from the Partner Dashboard, with ads on and off in alternating
  weeks. Target a cost per install under USD 15 and a trial-to-paid rate of 25% or better;
  at 25 a month that pays back inside three months.
- No Google or Meta ads at this stage: merchants searching for quiz apps search inside
  Shopify, and the CPCs outside are three to five times higher for the same intent.

### Phase 3, ongoing: the flywheel
- Every support email that ends well gets a review ask 48 hours later.
- Monthly changelog on the docs page and in the app's Help card; merchants who see
  movement stay.
- Apply for **Built for Shopify** once at 50 installs and 4.8 stars; the badge is a
  ranking boost and a filter merchants use. The app already meets the technical bar
  (embedded, App Bridge, theme app extension, no theme edits).

## 4. What to measure
Weekly: listing views, installs, trials started, trials converted, uninstalls, reviews.
All are in the Partner Dashboard. Add a UTM to every link we control
(`?utm_source=community&utm_medium=post`), which the dashboard reports as referrer.

## 5. Decisions needed from Gustavo
1. Adopt the three-tier pricing after approval, and schedule the completion counter
   (analytics endpoint) as the next build item.
2. Approve the USD 600 App Store ads test.
3. Nominate the 30 outreach stores, or approve me drafting the list from BuiltWith data.
4. Agree the community and LinkedIn posts before they go out; they carry the agency name.
