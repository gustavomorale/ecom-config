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
- **Pace:** a second's pause on every screen before clicking. Expect about 8 minutes.
- **Cuts:** where the script says CUT, stop recording (or trim later), do the repetitive
  typing off camera, then resume on the finished result. The voiceover says so.
- **Products that must not be linked:** The Archived, The Hidden and The Minimal Snowboard
  (not on the Online Store, Add to cart would fail), Selling Plans Ski Wax (subscription
  only) and the gift card.

## Script

### 1. What the app does (15 s)
Screen: Shopify's Install app screen, which opens as soon as the install link is pasted.
Start recording on it. Clip `scene-01`.

### 2. Install and plan (40 s)
Open **View store data** so Products and Online Store show. **Install**. Shopify's plan
page: Standard, free on a development store. Approve. The welcome page. Clip `scene-02`.

### 3. Setup step 1, Category (25 s)
**Start setup**. Hold on the category grid, then choose **Sports & outdoors**. Clip `scene-03`.

### 4. Setup step 2, Look (45 s)
**Match my store**, hold on the match result, switch the preview to mobile and back,
**Save and continue**. Clip `scene-04`.

### 5. Setup step 3, Questions (75 s)
On camera, question 1 (table A): change the question and helper text, the three answer
labels and descriptions. Set **Show options as** to **Picture cards**. For each answer set
**Visual** to **Picture from my store**, **Choose a product**, and pick the snowboard in the
table. Show the preview with the three snowboard pictures. Clip `scene-05a`.

CUT: reword questions 2 and 3 as in table A. Resume on the finished list, scroll past
questions 2 and 3, **Save and continue**. Clip `scene-05b`.

### 6. Setup step 4, Products: where the products come from (90 s)
Open Shopify's **Products** for two seconds: the store's own snowboards. Clip `scene-06a`.

Back in the app, Products. **Choose product** on each row, as in table B. On Camp Kit pick
The Complete Snowboard and show the variant dropdown. Clip `scene-06b` over the first two
rows; trim or speed up the rest of the linking without voice.

End on the badge "All 8 products connected". **Save and continue**. Clip `scene-06c`.

### 7. Setup step 5, Go live (60 s)
**Open theme editor**. Add section, Apps, **CraftFrame Bundle Quiz**. Show the block's three
settings (Look, Width, Performance) briefly. **Save**. Back in the app, **Finish setup**.
Hold on the overview banner that says the block is live. Clip `scene-07`.

### 8. Make it a snowboard shop: Rules and Copy (90 s)
Open **Rules**. On camera, the third bundle (Day Kit) per table C: title, subtitle, why, and
in **What's included** change the items (remove the extras, keep one row). Clip `scene-08a`.

CUT: do the other two bundles and the add-on rules per table C (remove the Trekking poles
rule, set every add-on Quantity to 1). Resume on the finished page, scroll through it,
**Save rules**. Clip `scene-08b`.

Open **Copy & cart**, change the fields in table D, **Save**. Clip `scene-08c`.

### 9. The shopper's side (90 s)
Open the storefront (Online Store, View, or the "View storefront" button). Answer:
**All-mountain** (the snowboard picture cards), 2 nights and 2 riders, then **Powder days**
and **Park and tricks**. Use the keyboard on the first question (arrow keys, Enter) for a
moment. Clip `scene-09a`.

Halfway, refresh the page: the answers are kept. Clip `scene-09b`.

Result: All-Mountain Setup, the add-ons Powder board and Park board with their reasons, the
total. **Add to cart**: the cart opens with those snowboards. Clip `scene-09c`.

### 10. Change a rule and see it (45 s)
Back in the app, **Rules**. The Spare board rule: change **Nights away is at least 3** to
**at least 2**. **Save rules**. On the storefront, **Start over** and answer with 2 nights:
Spare board now appears. Clip `scene-10`.

### 11. Close (15 s)
The app's overview. Clip `scene-11`.

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
