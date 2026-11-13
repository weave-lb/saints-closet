# Saints Closet: products and SKUs

Source: `Saints-Closet-Hoodie-Cutouts.zip` (13 back designs plus one front per colour). Every hoodie has the gold Saints wordmark on the chest.

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
| 7 | Holy Attitude | White | SC-HD-WHT-HAT | **new name** (cherub-in-shades) | Cherub in shades with an attitude |
| 8 | Fallen Idol | White | SC-HD-WHT-FID | **new name** (broken-statue) | Classical face breaking apart |
| 9 | Golden Silence | White | SC-HD-WHT-GLS | zip | Bust with a gold band over the eyes |
| 10 | Sweet Sin | White | SC-HD-WHT-SWS | zip | David in shades with an ice cream |
| 11 | Iced Out | Pink | SC-HD-PNK-ICO | zip | Cherub in shades with an iced coffee |
| 12 | Holy Quack | Pink | SC-HD-PNK-HQK | **new name** (duck-with-headphones) | Duckling with headphones and a smoothie |
| 13 | Sunday Rest | Pink | SC-HD-PNK-SNR | **new name** (hamster-and-chair) | Hamster in a bucket hat beside a folding chair |

Size SKUs for each style: `-S`, `-M`, `-L`, `-XL`, `-XXL` (e.g. `SC-HD-PNK-SNR-XL`).

## Drop 02 · The Vault (coming soon, not orderable)
These are designs from the original artwork that are not in the official zip.

| Name | SKU (reserved) | Artwork |
|---|---|---|
| Cupid Ink | SC-HD-V-CPI | 1000588155 tattooed angel with bow |
| Hush | SC-HD-V-HSH | 1000588158 shushing cherub |
| Holy Smoke | SC-HD-V-HSM | 1000588160 haloed cigar cherub |
| Thunder Father | SC-HD-V-THF | 1000588152 statue collage |

`V` marks a Vault design with no colour yet. When one is released, give it a colour SKU like the ones above.

## Removed from the site
These were design placeholders and aren't in the official zip: The Tithe Collector, Blind Faith. Guardian Angel, Iced Out, Sweet Sin and Golden Silence moved from the Vault to Drop 01.
