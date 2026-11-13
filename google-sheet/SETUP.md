# Google Sheet order log: setup

Takes about 10 minutes. Do it from the Google account that should own the orders (the shop's or Weave's).

## 1. Make the Sheet
1. Go to sheets.google.com and click **Blank spreadsheet**.
2. Name it **Saints Closet Orders**.

## 2. Add the script
1. In the Sheet: **Extensions → Apps Script**. A code editor opens in a new tab.
2. Delete everything in `Code.gs`, then paste the whole of `google-sheet/Code.gs` from this folder.
3. Click the **Save** icon (or Ctrl+S).
4. Name the project at the top left: **Saints Closet order log**.

## 3. Create the tabs
1. In the function menu at the top (next to **Debug**), pick **setup**, then click **Run**.
2. Google asks for permission: **Review permissions** → choose your account → **Advanced** → **Go to Saints Closet order log (unsafe)** → **Allow**. (It says "unsafe" only because you wrote the script yourself and Google hasn't reviewed it.)
3. Back in the Sheet you should see two tabs: **Orders** and **Order lines**, with gold-on-black headers.
4. Optional check: pick **testOrder** and click **Run**. A row `SC-0000-TEST` appears in both tabs. Delete those rows.

## 4. Publish it as a web app
1. In the Apps Script tab: **Deploy → New deployment**.
2. Click the gear next to "Select type" → **Web app**.
3. Description: `v1`. **Execute as: Me**. **Who has access: Anyone**.
   (Anyone means the website can send orders to it without signing in. It can only add rows; nobody can read the Sheet through it.)
4. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
5. Paste that link in the browser. You should see: *Saints Closet order log is running.*
6. Send the link to Weave, or put it in `site/js/shop-data.js` → `sheetUrl: '...'` yourself.

## Changing the script later
Edit the code, then **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. The link stays the same. (A *new deployment* would give a new link, and the site would need updating.)

## Using the Sheet
- **Status** has a dropdown: New, Confirmed, Delivered, Picked up, Cancelled, No reply.
- **WhatsApp → Chat** opens a chat with the customer.
- **Check** says `OK`, or flags totals that don't add up. Someone could have edited the page, so confirm the price on WhatsApp.
- **Test** says `TEST` for orders placed while the site is in test mode.
- A customer can fill the cart, get WhatsApp opened and then not press send. So a row in the Sheet with no WhatsApp message means "abandoned". Mark it **No reply**.
