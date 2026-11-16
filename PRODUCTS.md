# Saints Closet: products and SKUs

Source: `Saints-Closet-Hoodie-Cutouts.zip` and the three new product photos `new-design-1.jpg` through `new-design-3.jpg` (14 active back designs plus one front per colour). Every hoodie has the gold Saints wordmark on the chest.

**SKU format:** `SC-HD-<colour>-<design>`, plus `-<size>` for each size.
- Colour codes: BLK black, WHT white, PNK pink.
- Example: Franklin's Blessing, black, size M = `SC-HD-BLK-FRB-M`.
- Never reuse a retired SKU for a different design.

"New name" means the zip only had a description, so the name was created for the site.

**Price:** every hoodie is **$35.99**, shown as a discount from **$42.99** ("$7 forgiven"). Set by `price` and `compareAt` in `shop-data.js`; delete `compareAt` to end the discount. Sizes (S–XXL) are still a placeholder.

| # | Name | Colour | Style SKU | Name source | Back design |
|---|---|---|---|---|---|
| 1 | Franklin's Blessing | Black | SC-HD-BLK-FRB | zip | Benjamin Franklin in shades with money bags |
| 2 | Heaven's Payroll | Black | SC-HD-BLK-HVP | zip | Winged cherub in shades holding money bags |
| 3 | Guardian Angel | Black | SC-HD-BLK-GDA | zip | Flying cherub in shades with a rifle |
| 4 | Crimson Halo | Black | SC-HD-BLK-CRH | **new name** (red-halo) | Red saint inside a silver flame halo |
| 5 | Divine Strike | Black | SC-HD-BLK-DVS | **new name** (red-slash) | Marble bust cut by a red streak |
| 6 | Archangel | Black | SC-HD-BLK-ARC | **new name** (winged-guardian) | Winged stone angel statue |
| 7 | Gilded Vice | Black | SC-HD-BLK-GVC | **new name** (new-design-3) | Blindfolded marble bust with a cigarette and a gilded rifle |
| 8 | Holy Attitude | White | SC-HD-WHT-HAT | **new name** (cherub-in-shades) | Cherub in shades with an attitude |
| 9 | Fallen Idol | White | SC-HD-WHT-FID | **new name** (broken-statue) | Classical face breaking apart |
| 10 | Golden Silence | White | SC-HD-WHT-GLS | zip | Bust with a gold band over the eyes |
| 11 | Sweet Sin | White | SC-HD-WHT-SWS | zip | David in shades with an ice cream |
| 12 | Iced Out | Pink | SC-HD-PNK-ICO | zip | Cherub in shades with an iced coffee |
| 13 | Gilded Veil | Pink | SC-HD-PNK-GVL | **new name** (new-design-1) | Classical bust with a band of fractured gold over the eyes |
| 14 | Gilded Vice | Pink | SC-HD-PNK-GVC | **new name** (new-design-2) | Blindfolded marble bust with a cigarette and a gilded rifle |

Size SKUs for each style: `-S`, `-M`, `-L`, `-XL`, `-XXL` (e.g. `SC-HD-PNK-GVC-XL`).

## Drop 02 · The Vault (sealed, not orderable)
The designs are not chosen yet. The site shows four sealed cards (`vault-1` to `vault-4` in `site/js/shop-data.js`):
a hoodie silhouette, a wax seal and a redacted name, with nothing about the design.

To reveal a piece, give its line a real name, `image` and `description` (it then shows as a normal "Coming soon" card),
and a colour SKU like the ones above. Add `sizes` when it can be ordered.

Earlier Vault placeholders, no longer on the site: Cupid Ink, Hush, Holy Smoke, Thunder Father.

## Removed from the site
Holy Quack (`SC-HD-PNK-HQK`) and Sunday Rest (`SC-HD-PNK-SNR`) were retired from Drop 01. These SKUs remain reserved.

These were design placeholders and aren't in the official zip: The Tithe Collector, Blind Faith. Guardian Angel, Iced Out, Sweet Sin and Golden Silence moved from the Vault to Drop 01.
