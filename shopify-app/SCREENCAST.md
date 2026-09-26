# Review screencast (requirement 4.5.3)

Feedback of 2026-09-25: the first screencast (3 min 20 s, 2026-09-22) did not give enough
step-by-step detail to set up and test the app, and the reviewer saw "stock products" and
asked for the source of the app's inventory. This script answers both in one video.

The video must show the version in review (tag `app-0.9.0`, what is deployed on Netlify and
released as bundle-configurator-2). Do not record anything from the `q4-gifting` branch: no
Gift finder, no gift sets, no Black Friday button.

## Before recording

- **Store:** a fresh development store with no products, Dawn theme. A clean store shows the
  whole setup, including where the sample products come from. Do not use product photos from
  a stock library anywhere in the video.
- **Screen:** 1920 x 1080, browser zoom 100%, one window, bookmarks bar hidden, no other tabs,
  notifications off (macOS: Focus on). Record with QuickTime (File, New Screen Recording) or
  Cmd+Shift+5.
- **Voice:** narrate in English, reading the lines below. Upload to YouTube as Unlisted and
  turn on English subtitles (Subtitles, English, auto-sync with the narration script pasted
  in). That covers "English or English subtitles" twice.
- **Pace:** pause a second on every screen before clicking. Target 6 to 8 minutes. Longer and
  clear beats short and rushed; the first video was rejected for being too thin.
- Each numbered scene starts with an on-screen title (add in iMovie or YouTube editor, or
  just say the step number out loud).

## Script

### 1. What the app does (15 s)
Screen: the App Store listing or the app's welcome page.
> "CraftFrame Bundle Quiz adds a short questionnaire to a store. Shoppers answer a few
> questions, the merchant's rules pick a bundle and add-ons from the merchant's own products,
> and the result opens a filled cart. The app sells no products and supplies no inventory.
> I'll set it up from scratch on a new development store."

### 2. Install and plan (40 s)
Screen: install link, Shopify's install screen, Shopify's plan page, approval.
> "I install the app and approve the permissions: read products and read themes. Shopify then
> shows the app's plan page. The plan is Standard with a 14-day free trial; on a development
> store it is free. I approve it and land on the app's welcome page."

Click **Start setup**.

### 3. Setup step 1, Category (30 s)
> "Setup has five steps. Step one: what are you selling? Each category starts a complete,
> working questionnaire. I'll choose Cosmetics and skincare."

Click the category. The app moves to Look.

### 4. Setup step 2, Look (45 s)
> "Step two makes the questionnaire look like the store. Match my store reads the published
> theme's colours, font and corners. It tells me how good the match is. I can pick my own brand
> colour instead. The preview updates, in desktop and mobile."

Click **Match my store**, show the result, toggle the preview to mobile, **Save and continue**.

### 5. Setup step 3, Questions (60 s)
> "Step three: the questions. I can rename any question and its answers, make a question
> required, reorder or remove questions and add new ones. I'll change the wording of the first
> question. Answers can show an emoji, a picture from one of my products or collections, or an
> image link. Every change shows in the preview."

Rename one question, point at the icon options, **Save and continue**.

### 6. Setup step 4, Products, and where the products come from (90 s)
This scene answers the inventory question. Do it slowly.
> "Step four links each bundle and add-on to a product in my store, so the cart holds real
> products. This store is new and has no products. The app does not provide products. For
> stores that want to try it first, it offers a sample CSV."

Click **Download sample CSV**, open the file (Numbers or a text editor), and hold on it.
> "This file is generated from the template I just picked: one row per bundle and add-on, with
> the template's names and prices. Vendor is 'Sample', every row is tagged
> bundle-configurator-sample, and the images are plain text placeholders. There is no supplier,
> no stock and no fulfilment behind them; they are ordinary products the merchant creates in
> their own store and can delete at any time."

In Shopify: **Products, Import**, upload the CSV, import. Show the product list with the grey
text-tile images and vendor "Sample".
> "I import it with Shopify's own product import. These are now my store's products."

Back in the app: **Link imported samples**, show every row linked. Then show **Choose product**
on one row with the Shopify product picker.
> "The app links the samples by their handle. With real products I'd use Choose product on each
> row instead, which opens Shopify's product picker. Save and continue."

### 7. Setup step 5, Go live (60 s)
> "Step five puts the questionnaire on the store. Open theme editor takes me to the theme
> editor. I add a section, choose Apps, and pick CraftFrame Bundle Quiz. The questions and
> products come from the app; the block only offers look, width and performance, with
> sensible defaults. I save the theme."

Click **Open theme editor**, Add section, Apps, **CraftFrame Bundle Quiz**, Save. Back in the
app, **Finish setup**. Show the overview banner saying the block is on the published theme.

### 8. The shopper's side (75 s)
Open the storefront page with the block.
> "Now as a shopper. I answer each question. The keyboard works too: arrow keys on a single
> choice, Enter to continue. On the result I see the recommended set, the add-ons with the
> reason for each, a price preview and the order total."

Answer all questions, hold on the result. Refresh the page halfway through once:
> "If I refresh, my answers are kept."

Click **Add to cart**:
> "Add to cart opens the cart with exactly those products."

### 9. Editing after setup (60 s)
Back in the app.
> "After setup everything stays editable. In Rules I change which bundle an answer leads to,
> or how many of an add-on to include; the quantity can be calculated from answers. I'll
> change one condition and save."

Change one rule, **Save rules**, reload the storefront, show the different result.
> "In Copy and cart I can change every word the shopper reads, add a promo code, and choose
> how the cart opens. Changes are live as soon as they are saved."

### 10. Close (15 s)
> "That is the full setup. The app reads products and themes, writes one setting to the store,
> and stores no customer data. Support is at contact@craftframe.agency."

## After recording

1. Upload to YouTube as Unlisted, title "CraftFrame Bundle Quiz: setup and demo". Add English
   subtitles. Check they are on in the player.
2. Put the link in the listing's Screencast field (replace https://youtu.be/VPd381BuGe4) and in
   `public/proof/4-5-3/index.html`, then deploy the proof page.
3. In the review thread, choose Show resolved state and paste the proof page URL:
   https://bundle-configurator.netlify.app/proof/4-5-3/
4. The reviewers' demo store (`bundle-configurator-demo`): if its sample products carry photos
   from a stock library, either switch them back to the placeholder images or name the source
   on the proof page. The app itself never adds those photos.
