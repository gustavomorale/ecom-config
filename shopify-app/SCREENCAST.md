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

## Before recording

- **Store:** a fresh development store with Dawn and a handful of its own products. Create it
  with Shopify's generated test data, or add five or six products by hand with your own
  photos. No products tagged `bundle-configurator-sample`, and no photos from a stock library.
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

### 6. Setup step 4, Products: where the products come from (75 s)
This scene answers the inventory question. Do it slowly.

First show the store's own product list in Shopify (Products), for two seconds.
> "These are the store's own products. The app does not supply, sell or create products,
> and it has no inventory. It only reads the products that are already here."

Back in the app, on Products:
> "Step four links each bundle and add-on in the questionnaire to one of those products, so
> Add to cart puts real products in the cart. I click Choose product, and Shopify's own
> product picker opens with this store's catalogue."

Click **Choose product** on the first bundle, pick a product, show the row turn Linked. For a
product with several variants, show the variant dropdown. Link the remaining rows quickly
(cut the repetition if you like), then point at the badge saying all are connected.
> "If a store doesn't have matching products yet, it can rename the placeholders in Rules or
> skip this step; nothing is ever added to the store. Save and continue."

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
4. On every demo or dev store we used, delete the old products tagged
   `bundle-configurator-sample` (Products, filter by tag, select all, Delete).
