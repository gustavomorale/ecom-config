# Review screencast for app 1.0 (requirement 4.5.3)

Rewritten 2026-10-15. Shopify paused the review on 2026-10-13 (reference 137073) for the third
time on the same item: the screencast must show setup **step by step**, in English or with
English subtitles, and show **where the app's products come from** (the reviewer still reads
"stock products"). The previous video showed the 0.9 five-step setup; this one shows 1.0.

The message the video has to land, said and shown twice: **the app sells nothing and holds no
inventory. Every product in the quiz is one the store already sells, picked from the store's
own Products with Shopify's picker.**

Record the live app (1.0.7 or later) only. Nothing from `ai-draft` or `q4-gifting`: no
"Let AI set it up" card, no gift sets, no Black Friday button.

## Before recording

- **Store: a fresh one is best.** Dev Dashboard, Stores, Create store, with **test data**
  (Shopify's snowboards), default theme. Name it e.g. `bundle-quiz-review-oct`. A fresh store
  shows the real install and welcome page. To reuse `bundle-quiz-screencast` instead: in the
  app's Home delete every quiz, uninstall the app, then record (the welcome page only shows
  when the store has no quiz).
- **Products to use:** The Complete Snowboard, The Collection Snowboard: Liquid, The
  Collection Snowboard: Hydrogen, The Collection Snowboard: Oxygen, The Multi-managed
  Snowboard. **Avoid** The Archived, The Hidden and The Minimal Snowboard (not on the Online
  Store), Selling Plans Ski Wax (subscription only) and the gift card.
- **Window:** Chrome at 1760 x 990 (16:9), zoom 100%, bookmarks bar hidden, notifications off.
  `osascript -e 'tell application "Google Chrome" to set bounds of front window to {0, 33, 1760, 1023}'`
  Record with Cmd+Shift+5, Record Selected Portion, fitted to the window.
- **Voice:** narrate live from the table, or record silently and add the voiceover below
  afterwards (ElevenLabs or your own voice). No music. Pause a second on each screen before
  clicking. Final cut about 4 minutes.
- **Typing:** where a shot says CUT, stop, do it off camera, resume on the result.

## Shot list (about 4 minutes)

| Time | Shot | On screen | Narration |
|---|---|---|---|
| 0:00 | 01 Intro | Shopify admin, **Products** page of the store: the snowboards. Hold 3 seconds. | CraftFrame Bundle Quiz adds a short quiz to a Shopify store. Shoppers answer a few questions and get the right product, or a bundle, from the store's own catalogue. These are this store's own products. The app sells nothing, has no inventory, and never creates or edits products. It only recommends products like these. |
| 0:20 | 02 Install | App listing or install link, **Install**. The permissions screen: point at "View products" and "View themes". | I install the app. It asks to view products and the theme, and nothing else. |
| 0:32 | 03 Plan | Shopify's plan page: four plans. Choose **Free**, approve. | Shopify shows the plans. There is no separate account or login: everything runs inside the Shopify admin. I choose Free. |
| 0:45 | 04 Welcome | The welcome page: scroll slowly past the three steps and the plans. Click **Start setup**. | The welcome page explains the three steps: pick your products, check the questions, go live. Start setup. |
| 1:00 | 05 Quiz type | **Your products**: select **Product finder** (show both cards). "What do you sell?": choose **Sports & outdoors**. | Step one, your products. A product finder gives each shopper one product. A bundle quiz adds the extras that fit. I choose product finder. "What do you sell" only suggests the wording of the questions. |
| 1:18 | 06 Product source | Click **Choose products**. Shopify's picker opens with the store's snowboards. Tick the five snowboards slowly, **Select**. The list shows them with their real photos and prices. | This is where every product in the quiz comes from: Shopify's own product picker, showing the products this store already sells. I pick five snowboards. Their names, photos and prices come straight from the catalogue. |
| 1:45 | 07 Save | **Save and continue**. | Save and continue. The app also matches the theme's colours and fonts. |
| 1:52 | 08 Questions | **Check the questions**: the grid of ticks. Rename question 1 to "How do you ride?" (type it on camera). CUT: reword answers per table A. Resume. Untick and tick one box. Set **Show answers as** to **Picture cards**. Point at the preview. | Step two: the questions. Each answer points to one or more of the products I picked: the product with the most ticks wins. I can rename everything, change which products each answer points to, and show answers as picture cards. The preview updates as I go. |
| 2:35 | 09 Go live | **Save and continue**. **Go live**: **Open theme editor**. In the editor: Add section, Apps, **CraftFrame Bundle Quiz**, **Save**. Back in the app, **Finish setup**. Home shows the quiz as live. | Step three: go live. Open theme editor, add a section, choose Apps, and pick CraftFrame Bundle Quiz. Save the theme. Finish setup: Home now shows the quiz is live on the store. |
| 3:10 | 10 Shopper | Storefront page with the quiz. Answer every question, reach the result. Hold on it. **Add to cart**: the cart with the snowboard. | Now as a shopper. I answer the questions and get my pick: a real snowboard from this store, with its real price. Add to cart puts exactly that product in the cart. |
| 3:40 | 11 Home | Back in the app: Home with the quiz card, completions and the plan section. | Home lists every quiz, how many shoppers finished it this month, and the plan, which can be changed on Shopify's plan page. That is the full setup. The app reads products and the theme, stores no customer data, and support is at contact at craftframe dot agency. |

YouTube chapters for the description:

```
0:00 The store's own products (the app has no inventory)
0:20 Install, permissions and plan
0:45 Welcome
1:00 Step 1: Your products (Shopify's product picker)
1:52 Step 2: Questions
2:35 Step 3: Go live (theme editor)
3:10 The shopper's view and the cart
3:40 Home
```

## Text to type

### A. Questions (shot 08)

| Question | Answers |
|---|---|
| How do you ride? | Mostly groomed runs · Park and tricks · Deep powder |
| How long have you been riding? | First season · A few seasons · Many years |

Tick so each snowboard is reached by at least one answer (the page warns otherwise).

## Voiceover (plain text, for ElevenLabs and for the English subtitles)

CraftFrame Bundle Quiz adds a short quiz to a Shopify store. Shoppers answer a few questions and get the right product, or a bundle, from the store's own catalogue. These are this store's own products. The app sells nothing, has no inventory, and never creates or edits products. It only recommends products like these.

I install the app. It asks to view products and the theme, and nothing else.

Shopify shows the plans. There is no separate account or login: everything runs inside the Shopify admin. I choose Free.

The welcome page explains the three steps: pick your products, check the questions, go live. Start setup.

Step one, your products. A product finder gives each shopper one product. A bundle quiz adds the extras that fit. I choose product finder. "What do you sell" only suggests the wording of the questions.

This is where every product in the quiz comes from: Shopify's own product picker, showing the products this store already sells. I pick five snowboards. Their names, photos and prices come straight from the catalogue.

Save and continue. The app also matches the theme's colours and fonts.

Step two: the questions. Each answer points to one or more of the products I picked: the product with the most ticks wins. I can rename everything, change which products each answer points to, and show answers as picture cards. The preview updates as I go.

Step three: go live. Open theme editor, add a section, choose Apps, and pick CraftFrame Bundle Quiz. Save the theme. Finish setup: Home now shows the quiz is live on the store.

Now as a shopper. I answer the questions and get my pick: a real snowboard from this store, with its real price. Add to cart puts exactly that product in the cart.

Home lists every quiz, how many shoppers finished it this month, and the plan, which can be changed on Shopify's plan page. That is the full setup. The app reads products and the theme, stores no customer data, and support is at contact at craftframe dot agency.

## After recording

1. Upload to YouTube as **Unlisted**, title "CraftFrame Bundle Quiz: setup walkthrough (app review)",
   chapters above in the description. Subtitles: English, Auto-sync, paste the voiceover text.
2. Put the link in the testing instructions (`REVIEW.md` section 1, last line) and in the
   submission's screencast field.
3. Partner Dashboard, the app's submission: paste the testing instructions, the video link,
   **Submit**. Reply in the review thread (if open) that the new screencast shows the product
   source at 0:00 and 1:18.
