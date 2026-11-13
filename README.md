# Saints Closet: static storefront

The live site, at **https://weave-lb.github.io/saints-closet/** (repo: https://github.com/weave-lb/saints-closet). A static page on GitHub Pages: no server, no CMS.

- The cart is saved in the customer's browser.
- **Order on WhatsApp** opens WhatsApp with the order typed out, addressed to the shop's number. At the same moment a copy goes to a Google Sheet through a Google Apps Script web app.
- Each order has a reference such as `SC-1113-4F7K`, and it's the same in the WhatsApp message and the Sheet.
- The design is the Saints Closet design from `../storefront` (WeaveMS), without the server. The WeaveMS version stays there for when the CMS is ready.

## Change products, prices, delivery or the WhatsApp number
Edit **`site/js/shop-data.js`** only. The rules are at the top of the file. Commit, push, and Pages updates in about a minute.
New photos go in `assets/`, with a smaller copy (about 480 px) in `assets/thumbs/` under the same file name.

Product names and SKUs: see [PRODUCTS.md](PRODUCTS.md).

## Files
| Path | What it is |
|---|---|
| `index.html` | The page |
| `site/js/shop-data.js` | Products, prices, sizes, delivery areas, WhatsApp number, Sheet link, test mode |
| `site/js/store.js` | Reads shop-data.js |
| `site/js/closet.js` | Cart and checkout (WhatsApp message + Sheet copy) |
| `site/js/site.js`, `hero.js` | Product cards, hero animation, page behaviour |
| `site/js/procession.js` | The Procession: the 16 mannequin street photos between Drop 01 and the Gospel (list in `shop-data.js` → `procession`; photos in `assets/street/`, gallery copies in `assets/street/m/`) |
| `google-sheet/Code.gs` | The Apps Script for the order Sheet ([setup](google-sheet/SETUP.md)) |

## Preview locally
Run `python -m http.server 8080` in this folder and open http://localhost:8080.

## Deploy (GitHub Pages)
Repo: https://github.com/weave-lb/saints-closet (public). Every push to `main` updates the site within about a minute.
1. Repo → **Settings → Pages**. Source: **Deploy from a branch**. Branch: `main`, folder `/ (root)`. Save.
2. The site is served at https://weave-lb.github.io/saints-closet/.

### Adding a domain later
1. Add a file named `CNAME` containing just the domain, e.g. `saintscloset.store`.
2. Replace `https://weave-lb.github.io/saints-closet/` with the new address in `index.html` (canonical and og tags).
3. At the registrar, add four A records for `@` (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and a `www` CNAME to `weave-lb.github.io`.
4. In Settings → Pages, enter the domain, wait for the check, then tick **Enforce HTTPS**.

## Launch checklist
- [ ] Real WhatsApp number in `shop-data.js` → `whatsapp`. Ordering stays closed while the placeholder is there.
- [ ] Real products, prices, sizes and photos.
- [ ] Delivery areas and fees, pickup yes/no, payment text.
- [ ] Sheet deployed and its `/exec` link in `sheetUrl`.
- [ ] One test order from a phone: the WhatsApp message arrives and a row appears in the Sheet.
- [ ] `testMode: false` (removes the "orders are tests" notes and lets Google index the site).
- [ ] Returns/exchanges text, if the shop wants it shown.
