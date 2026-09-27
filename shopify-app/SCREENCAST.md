# Review screencast (requirement 4.5.3)

Feedback of 2026-09-25: the first screencast (3 min 20 s, 2026-09-22) did not give enough
step-by-step detail to set up and test the app, and the reviewer saw "stock products" and
asked for the source of the app's inventory. Their reference clip showed the products from
our old sample CSV active and for sale on their storefront. We removed the sample catalogue
(2026-09-26): the app never adds products to a store. This video shows setup step by step
and makes the product source explicit: the merchant's own products, linked with the picker.

The video must show the version deployed on Netlify after the sample catalogue removal
(released as bundle-configurator-2; the extension did not change). Do not record anything from the `q4-gifting` branch: no
Gift finder, no gift sets, no Black Friday button.

## The story

A new development store created with Shopify's test data sells snowboards. The video sets
up the app from scratch, links the store's own snowboards, rewords the Sports & outdoors
template into a snowboard shop, and shows the shopper's side. Everything to type is in the
tables at the end, so nothing is improvised on camera.

## Before recording

- **Store:** `bundle-quiz-screencast` (Basic plan, test data, Dawn). Its products are
  Shopify's test snowboards. Nothing tagged `bundle-configurator-sample`, no stock photos.
- **Window:** Chrome at 1760 x 990 (16:9), zoom 100%, bookmarks bar hidden, one tab plus the
  storefront tab, notifications off. To reset the size:
  `osascript -e 'tell application "Google Chrome" to set bounds of front window to {0, 33, 1760, 1023}'`
  Record with Cmd+Shift+5, Record Selected Portion, fitted to the window.
- **Voice:** record the screen silently and add the ElevenLabs clips from
  `branding/screencast/voiceover-v3-review.txt` afterwards (one clip per scene), or narrate
  live from the same text. Fit the voice to the picture: hold a frame where a clip runs long,
  never speed the voice up. No music, no sound effects. Upload to YouTube as Unlisted with
  English subtitles (Subtitles, English, Auto-sync, paste the voiceover text without the
  break tags).
- **Pace:** a second's pause on every screen before clicking. The final cut is about 4 minutes.
- **Cuts:** where the script says CUT, stop recording (or trim later), do the repetitive
  typing off camera, then resume on the finished result. The voiceover says so.
- **Products that must not be linked:** The Archived, The Hidden and The Minimal Snowboard
  (not on the Online Store, Add to cart would fail), Selling Plans Ski Wax (subscription
  only) and the gift card.

## Script: short cut (about 4 minutes)

Twelve shots, recorded in six parts. The times are where each shot sits in the final video;
record each part a little long and trim to the time. Everything typed happens off camera
(CUT or Prep), using tables A to D below. Voice clips are in
`branding/screencast/voiceover-v3-review.txt` (clip names match the shot numbers).

| Time | Shot | On screen | Narration |
|---|---|---|---|
| **Part 1** | | *one continuous take* | |
| 0:00 to 0:22 | 01 | Install app screen. Open **View store data**. Click **Install**. | CraftFrame Bundle Quiz adds a short questionnaire to a Shopify store. Shoppers answer a few questions and get a bundle of the store's own products in their cart. The app sells no products and has no inventory. It asks to view products and the theme, and never edits them. |
| 0:22 to 0:34 | 02 | Plan page, **Approve**, welcome page, **Start setup**. | Shopify shows the plan page: one plan, with a fourteen-day free trial, free on development stores. I approve it and start setup. |
| 0:34 to 0:46 | 03 | Category grid, choose **Sports & outdoors**. | Step one: what does the store sell? Each category starts a working questionnaire. This store sells snowboards, so I choose Sports and outdoors. |
| 0:46 to 1:00 | 04 | **Match my store**, the result, **Save and continue**. | Step two: Match my store reads the theme's colours, font and corners, and shows how close the match is. Save and continue. |
| **Part 2** | | *CUT in the middle* | |
| 1:00 to 1:25 | 05 | Questions. Type "How do you ride?" into question 1, set **Show options as** to **Picture cards**. CUT: finish table A off camera (labels, pictures, questions 2 and 3). Resume on the preview with the three snowboard cards, **Save and continue**. | Step three: the questions. I can reword any question and its answers, and show answers as picture cards with my own product photos. I've reworded these for a snowboard shop. Save and continue. |
| **Part 3** | | *CUT in the middle* | |
| 1:25 to 1:34 | 06 | Shopify **Products**: the store's snowboards. | These are the store's own snowboards. The app never creates or supplies products; it only reads these. |
| 1:34 to 2:00 | 07 | App Products: **Choose product** on Trek Kit (picker opens, pick). On Camp Kit, pick The Complete Snowboard and open the variant dropdown. CUT: link the rest (table B). Resume on "All 8 products connected", **Save and continue**. | Step four links each bundle and add-on to one of them with Shopify's product picker, choosing the size where there are variants. Once all are linked, Add to cart fills the cart with real products. Save and continue. |
| **Part 4** | | *one continuous take* | |
| 2:00 to 2:35 | 08 | **Open theme editor**, Add section, Apps, **CraftFrame Bundle Quiz**, **Save**. Back in the app, **Finish setup**. The overview banner. | Step five: Open theme editor. I add a section, choose Apps, and pick CraftFrame Bundle Quiz. I save the theme, finish setup, and the overview confirms the block is live. |
| **Prep** | | *off camera* | Rules and Copy & cart as in tables C and D. Save both. |
| **Part 5** | | *one continuous take* | |
| 2:35 to 2:57 | 09 | **Rules**: scroll slowly past the three renamed bundles (What's included) and the add-on rules. Then **Copy & cart**, the headline field. | After setup, everything stays editable. In Rules I choose which bundle each answer leads to, what it includes, and which add-ons follow and why. I've renamed them for this shop. In Copy and cart I change every word the shopper reads. |
| **Part 6** | | *one continuous take* | |
| 2:57 to 3:35 | 10 | Storefront. **All-mountain**, Continue, 2 nights and 2 riders, Continue, **Powder days** and **Park and tricks**, **See my setup**. Hold on the result. | Now, as a shopper. I pick all-mountain, the trip length, and powder days and park riding. The result recommends the All-Mountain Setup, adds a powder board and a park board with the reason for each, and shows the total. |
| 3:35 to 3:45 | 11 | **Add to cart**: the cart with the snowboards. | Add to cart opens the cart with exactly those snowboards. |
| 3:45 to 3:58 | 12 | The app's overview. | That's the full setup. The app reads products and themes, writes one setting to the store, and stores no customer data. Support: contact at craftframe dot agency. |

YouTube chapters for the description:

```
0:00 Install and plan
0:34 Setup 1: Category
0:46 Setup 2: Look
1:00 Setup 3: Questions
1:25 Setup 4: Products (the store's own products)
2:00 Setup 5: Go live
2:35 Editing rules and copy
2:57 The shopper's side
3:45 Summary
```

## Text to type

### A. Questions (scene 5)

| Question | Change to |
|---|---|
| 1. Question | How do you ride? |
| 1. Helper text | Your board follows from this. |
| 1. Day hikes | Label: Learning. Description: First seasons, a forgiving board. Picture: The Multi-location Snowboard |
| 1. Camping | Label: All-mountain. Description: Groomers, some powder, the odd park lap. Picture: The Complete Snowboard |
| 1. Backpacking | Label: Backcountry. Description: Off-piste and long days. Picture: The Collection Snowboard: Liquid |
| 2. Question | How long is the trip? |
| 2. Helper text | This sizes the extras. |
| 2. Counters | Nights out: Nights away. People: Riders |
| 3. Question | Anything else? |
| 3. Options | Wet weather: Powder days (emoji ❄️). Cold nights: Icy mornings (🧊). Ultralight: Travelling light (🎒). Cooking: Park and tricks (🛹) |

### B. Products (scene 6)

| Row | Link to |
|---|---|
| Trek Kit | The Collection Snowboard: Liquid |
| Camp Kit | The Complete Snowboard (show the variant dropdown) |
| Day Kit | The Multi-location Snowboard |
| Waterproof shell | The Collection Snowboard: Oxygen |
| Bag liner | The Collection Snowboard: Hydrogen |
| Stove and pot | The 3p Fulfilled Snowboard |
| Water filter | The Multi-managed Snowboard |
| Trekking poles | The Complete Snowboard |

### C. Rules (scene 8)

| Bundle | Title | Subtitle | Why | What's included (one row) |
|---|---|---|---|---|
| Trek Kit | Backcountry Setup | Stiff, directional, built for long days | Off-piste days need a stiffer board that floats in powder and holds an edge on the way down. | Backcountry board, The Collection: Liquid, 1 |
| Camp Kit | All-Mountain Setup | One board for the whole mountain | An all-mountain board handles groomers, powder and the odd park lap, so one board covers the trip. | All-mountain board, The Complete Snowboard, 1 |
| Day Kit | Starter Setup | Soft and forgiving | A softer board forgives mistakes while you learn to link your turns. | Beginner board, The Multi-location Snowboard, 1 |

| Add-on rule | Shopper sees | Reason | Quantity |
|---|---|---|---|
| Waterproof shell | Powder board | For your powder days | 1 |
| Bag liner | Hardpack board | Holds an edge on icy mornings | 1 |
| Stove and pot | Park board | You ride the park | 1 |
| Water filter | Spare board | {nights} nights away is a lot of riding | 1 |
| Trekking poles | Remove rule | | |

### D. Copy & cart (scene 8)

| Field | Change to |
|---|---|
| Headline | Build your snowboard setup |
| Words to colour in the headline | snowboard setup |
| Sub-headline | Three questions and we will put your setup together. |
| Last step button | See my setup |
| After the price | complete setup |

## After recording

1. Upload to YouTube as Unlisted, title "CraftFrame Bundle Quiz: setup and demo". Add English
   subtitles. Check they are on in the player.
2. Put the link in the listing's Screencast field (replace https://youtu.be/VPd381BuGe4) and in
   `public/proof/4-5-3/index.html`, then deploy the proof page.
3. In the review thread, choose Show resolved state and paste the proof page URL:
   https://bundle-configurator.netlify.app/proof/4-5-3/
4. On every demo or dev store we used, delete the old products tagged
   `bundle-configurator-sample` (Products, filter by tag, select all, Delete).
