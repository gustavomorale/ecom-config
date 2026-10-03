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

## The open review

The current submission is still open with item 4.5.3. Reply in the review thread that a
revised version with a simpler setup is coming, so the reviewer is not waiting on the old
screencast. If the submission is closed meanwhile, resubmit with 1.0. Pricing changes
restart review, which no longer matters because 1.0 is reviewed as new.
