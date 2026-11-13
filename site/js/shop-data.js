/* ═══════════════════════════════════════════════════════════════
   SAINTS CLOSET · SHOP DATA
   This is the only file you edit to change products, prices, sizes, delivery and the WhatsApp number.
   Save it, push it to GitHub, and the site updates in about a minute.

   Rules for editing:
   · Keep the commas between items and the quotes around text.
   · Prices are plain numbers in the shop currency: 35.99 means $35.99, 75 means $75.
   · compareAt: 42.99 shows $42.99 struck through next to the price, and the saving as "$7 forgiven".
   · A product with an empty sizes list ( sizes: [] ) shows as "Coming soon" and cannot be ordered.
     With no image as well, it shows as a sealed mystery card (see Drop 02 below).
   · To mark one size as sold out, add it to soldOut, e.g. soldOut: ['XL'].
   · Photos live in /assets, with a smaller copy (about 400 px) under /assets/thumbs at the same path.
     kind: 'cutout'     = a hoodie photo on a transparent background, with back and front photos
           'photo-pair' = one photo (image) with the front on the left and the back on the right
           'flat-lay'   = one photo (image) of the piece
   ═══════════════════════════════════════════════════════════════ */
window.SHOP = {
  /* ── Launch switches ─────────────────────────────── */
  // true = the page says orders are tests and asks search engines not to index it. Set to false at launch.
  testMode: false,

  // The number orders are sent to on WhatsApp: country code + number, digits only (961 = Lebanon).
  whatsapp: '96171644493',

  // The Google Apps Script web app link that saves every order to the Google Sheet (ends in /exec).
  // Leave empty until the script is deployed; orders still go to WhatsApp.
  sheetUrl: 'https://script.google.com/macros/s/AKfycbweqLb6k0Vtr3amex7yokbLz88k6cPq5CF37VtOS0BBXEkkZln0AlaCkxXRVBlxUb8O/exec',

  /* ── Money ───────────────────────────────────────── */
  currency: 'USD',
  decimals: 2,

  /* ── How orders reach the customer ───────────────── */
  pickup: true,
  pickupDetails: 'Pick up by appointment. We confirm the place and time on WhatsApp.',
  // Delivery areas and their fees. Leave the list empty ( zones: [] ) to offer pickup only.
  // PLACEHOLDER areas and fees: confirm with the shop.
  zones: [
    { id: 'beirut', name: 'Beirut', fee: 4 },
    { id: 'mount-lebanon', name: 'Mount Lebanon', fee: 4 },
    { id: 'rest-of-lebanon', name: 'Rest of Lebanon', fee: 4 },
  ],
  paymentMethod: 'Cash on delivery or at pickup.',
  maxPerSize: 10,

  /* ── Shop information (shown above the footer; leave '' to hide a block) ── */
  contact: '',
  returns: '',
  exchanges: '',

  // Garment measurements in cm. Leave empty ( sizeGuide: [] ) to hide the size guide.
  sizeGuide: [],

  /* ── The Procession: the real pieces on mannequins, out on the street ── */
  // Shown between Drop 01 and the Gospel, in this order, uncropped. Photos are in assets/street/
  // (full size) and assets/street/m/ (900 px tall copy for the gallery), same file name in both.
  // colour must be Black, White or Pink (it drives the colour filter). view is Front or Back.
  // product (optional) is the id of the product it shows: its name appears and "Shop this piece" jumps to its card.
  procession: [
    { image: '01.jpg', w: 699, h: 900, colour: 'Black', view: 'Front', alt: 'Gold Saints logo on the chest' },
    { product: 'heavens-payroll', image: '02.jpg', w: 675, h: 900, colour: 'Black', view: 'Back', alt: 'Cherub in sunglasses holding two money bags' },
    { product: 'guardian-angel', image: '03.jpg', w: 675, h: 900, colour: 'Black', view: 'Back', alt: 'Cherub in sunglasses holding a rifle' },
    { product: 'franklins-blessing', image: '04.jpg', w: 675, h: 900, colour: 'Black', view: 'Back', alt: 'Benjamin Franklin in sunglasses with money bags' },
    { product: 'divine-strike', image: '05.jpg', w: 675, h: 900, colour: 'Black', view: 'Back', alt: 'Classical bust struck by a red streak' },
    { product: 'crimson-halo', image: '06.jpg', w: 675, h: 900, colour: 'Black', view: 'Back', alt: 'Red figure inside an ornate silver frame' },
    { product: 'archangel', image: '07.jpg', w: 677, h: 900, colour: 'Black', view: 'Back', alt: 'Winged angel statue' },
    { image: '08.jpg', w: 699, h: 900, colour: 'White', view: 'Front', alt: 'Gold Saints logo on the chest' },
    { product: 'holy-attitude', image: '09.jpg', w: 576, h: 900, colour: 'White', view: 'Back', alt: 'Cherub in sunglasses with an attitude' },
    { product: 'fallen-idol', image: '10.jpg', w: 675, h: 900, colour: 'White', view: 'Back', alt: 'Classical face breaking apart, a hand over the mouth' },
    { product: 'sweet-sin', image: '11.jpg', w: 675, h: 900, colour: 'White', view: 'Back', alt: 'Classical bust in sunglasses blowing a pink bubble' },
    { product: 'golden-silence', image: '12.jpg', w: 675, h: 900, colour: 'White', view: 'Back', alt: 'Classical bust in a woven straw hat' },
    { image: '13.jpg', w: 699, h: 900, colour: 'Pink', view: 'Front', alt: 'Gold Saints logo on the chest' },
    { product: 'iced-out', image: '14.jpg', w: 677, h: 900, colour: 'Pink', view: 'Back', alt: 'Cherub in sunglasses sipping an iced drink' },
    { product: 'holy-quack', image: '15.jpg', w: 678, h: 900, colour: 'Pink', view: 'Back', alt: 'Duckling with headphones and a backpack' },
    { product: 'sunday-rest', image: '16.jpg', w: 677, h: 900, colour: 'Pink', view: 'Back', alt: 'Hamster in a bucket hat beside a yellow folding chair' },
  ],

  /* ── Products ────────────────────────────────────── */
  // collection: 'Drop 01' shows in the first section; 'Drop 02' shows in The Vault (coming soon).
  //
  // Official hoodies (from Saints-Closet-Hoodie-Cutouts.zip). Each has:
  //   sku    the style code: SC-HD-<colour>-<design>. Each size adds its size: SC-HD-BLK-FRB-M.
  //          Colour codes: BLK black, WHT white, PNK pink. Keep SKUs unique and never reuse an old one.
  //   back   the design photo (shown first on the card); front = the chest view for that colour.
  //   price      what the customer pays. compareAt (optional) = the old price: the card strikes it through
  //              and shows the difference as "forgiven". Remove compareAt to end the discount.
  // PLACEHOLDER: sizes are not confirmed yet.
  products: [
    // ── Black ──
    { id: 'franklins-blessing', sku: 'SC-HD-BLK-FRB', name: "Franklin's Blessing", colour: 'Black', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/black-franklins-blessing-back.webp', front: 'products/black-front.webp',
      description: 'Old Ben in shades, holding the bag. Bless the hustle.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'heavens-payroll', sku: 'SC-HD-BLK-HVP', name: "Heaven's Payroll", colour: 'Black', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/black-heavens-payroll-back.webp', front: 'products/black-front.webp',
      description: 'Wings out, bags full. Divine compensation, delivered.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'guardian-angel', sku: 'SC-HD-BLK-GDA', name: 'Guardian Angel', colour: 'Black', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/black-guardian-angel-back.webp', front: 'products/black-front.webp',
      description: 'A cherub on watch, armed and unbothered. Protection, but make it heavy.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'crimson-halo', sku: 'SC-HD-BLK-CRH', name: 'Crimson Halo', colour: 'Black', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/black-crimson-halo-back.webp', front: 'products/black-front.webp',
      description: 'A red saint crowned in silver flame. Holy, with a temper.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'divine-strike', sku: 'SC-HD-BLK-DVS', name: 'Divine Strike', colour: 'Black', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/black-divine-strike-back.webp', front: 'products/black-front.webp',
      description: 'A marble face, cut clean by a red bolt. Judgement, delivered.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'archangel', sku: 'SC-HD-BLK-ARC', name: 'Archangel', colour: 'Black', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/black-archangel-back.webp', front: 'products/black-front.webp',
      description: "A stone angel, wings folded, standing guard. Heaven's front line.", sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    // ── White ──
    { id: 'holy-attitude', sku: 'SC-HD-WHT-HAT', name: 'Holy Attitude', colour: 'White', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/white-holy-attitude-back.webp', front: 'products/white-front.webp',
      description: 'A cherub in shades with a message for the haters.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'fallen-idol', sku: 'SC-HD-WHT-FID', name: 'Fallen Idol', colour: 'White', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/white-fallen-idol-back.webp', front: 'products/white-front.webp',
      description: 'A classical face, cracked wide open. Even idols fall apart.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'golden-silence', sku: 'SC-HD-WHT-GLS', name: 'Golden Silence', colour: 'White', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/white-golden-silence-back.webp', front: 'products/white-front.webp',
      description: 'Eyes sealed in gold. Say less. Shine more.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'sweet-sin', sku: 'SC-HD-WHT-SWS', name: 'Sweet Sin', colour: 'White', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/white-sweet-sin-back.webp', front: 'products/white-front.webp',
      description: 'David in shades, cheating on his diet.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    // ── Pink ──
    { id: 'iced-out', sku: 'SC-HD-PNK-ICO', name: 'Iced Out', colour: 'Pink', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/pink-iced-out-back.webp', front: 'products/pink-front.webp',
      description: 'A cherub in shades, iced coffee in hand. Heaven runs on cold brew.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'holy-quack', sku: 'SC-HD-PNK-HQK', name: 'Holy Quack', colour: 'Pink', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/pink-holy-quack-back.webp', front: 'products/pink-front.webp',
      description: 'A duckling with headphones and a smoothie. Blessed and unbothered.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },
    { id: 'sunday-rest', sku: 'SC-HD-PNK-SNR', name: 'Sunday Rest', colour: 'Pink', collection: 'Drop 01', price: 35.99, compareAt: 42.99,
      kind: 'cutout', back: 'products/pink-sunday-rest-back.webp', front: 'products/pink-front.webp',
      description: 'A hamster in a bucket hat, chair ready. Even saints take the day off.', sizes: ['S', 'M', 'L', 'XL', 'XXL'], soldOut: [] },

    // ── Drop 02 · The Vault (sealed: the designs are not chosen yet) ──
    // A coming-soon piece with no image shows as a sealed card: a hoodie silhouette, a wax seal and a
    // redacted name. Nothing about the design appears on the page. To reveal one, give it a real
    // name, image and description; add sizes when it can be ordered. Add or remove lines for more or fewer seals.
    { id: 'vault-1', name: 'Sealed I', collection: 'Drop 02', price: 35.99, sizes: [] },
    { id: 'vault-2', name: 'Sealed II', collection: 'Drop 02', price: 35.99, sizes: [] },
    { id: 'vault-3', name: 'Sealed III', collection: 'Drop 02', price: 35.99, sizes: [] },
    { id: 'vault-4', name: 'Sealed IV', collection: 'Drop 02', price: 35.99, sizes: [] },
  ],
};
