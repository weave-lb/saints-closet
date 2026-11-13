/* ═══════════════════════════════════════════════════════════════
   THE SHOP'S DATA · products, sizes, prices and shop details
   Everything commercial comes from shop-data.js (window.SHOP). Nothing else in the page is hard-coded.
   Amounts are kept in minor units (cents) inside the page and only turned into text by money().
   ═══════════════════════════════════════════════════════════════ */
const Store = (() => {
  'use strict';
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let settings = null;
  let products = [];
  let maxQuantityPerLine = 0;
  let motionPaused = false;

  // Whole amounts show no decimals ("$75"), as the design has it; any other amount shows all of the currency's
  // decimals ("$75.50", "$75.05"). Judged in minor units, so sums count right.
  function money(minor, shop = settings) {
    const scale = 10 ** shop.exponent;
    const digits = minor % scale === 0 ? 0 : shop.exponent;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: shop.currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / scale);
  }

  // Drop 02 has its own section ("The Vault"); every other collection is shown in Drop 01.
  const isVault = collection => /^\s*drop\s*0?2\s*$/i.test(collection || '');

  const SLUG = /^[a-z0-9][a-z0-9-]{0,60}$/;
  const toMinor = (amount, exponent) => Math.round(Number(amount) * 10 ** exponent);
  const SKU = /^[A-Z0-9][A-Z0-9-]{2,39}$/;
  const path = file => String(file || '').split('/').map(encodeURIComponent).join('/');
  const asset = file => 'assets/' + path(file);
  const thumb = file => 'assets/thumbs/' + path(file);

  function shape(raw, exponent, cap) {
    if (!raw || !SLUG.test(String(raw.id || ''))) throw new Error(`A product in shop-data.js has a missing or invalid id: ${raw && raw.id}`);
    const price = toMinor(raw.price, exponent);
    if (!Number.isSafeInteger(price) || price < 0) throw new Error(`"${raw.name}" in shop-data.js has an invalid price.`);
    const compareAt = raw.compareAt == null ? 0 : toMinor(raw.compareAt, exponent);
    if (!Number.isSafeInteger(compareAt) || compareAt < 0) throw new Error(`"${raw.name}" in shop-data.js has an invalid compareAt price.`);
    const soldOut = Array.isArray(raw.soldOut) ? raw.soldOut.map(String) : [];
    const sizes = Array.isArray(raw.sizes) ? raw.sizes.map(String) : [];
    const kind = ['photo-pair', 'cutout'].includes(raw.kind) ? raw.kind : 'flat-lay';
    const sku = String(raw.sku || '').toUpperCase();
    if (sku && !SKU.test(sku)) throw new Error(`"${raw.name}" in shop-data.js has an invalid SKU: ${raw.sku}`);
    // cutout: a hoodie on a transparent background; the back (the design) shows first, the front is one tap away
    const look = kind === 'cutout'
      ? { split: false, separate: true, cutout: true, startsOnBack: true, image: asset(raw.back), backImage: asset(raw.front), railImage: thumb(raw.back), bg: '#e6e0d4' }
      : { split: kind === 'photo-pair', separate: false, image: asset(raw.image), backImage: '', railImage: thumb(raw.image), bg: /^#[0-9a-f]{3,8}$/i.test(raw.bg || '') ? raw.bg : '#111' };
    return {
      id: raw.id,
      name: String(raw.name || raw.id),
      collection: String(raw.collection || 'Drop 01'),
      subtitle: String(raw.subtitle || ''),
      description: String(raw.description || ''),
      tag: String(raw.tag || ''),
      sku,
      colour: String(raw.colour || ''),
      kind,
      basePrice: price,
      // the old price, only when it is really higher than today's
      compareAt: compareAt > price ? compareAt : 0,
      drop: isVault(raw.collection) ? 'd02' : 'd01',
      comingSoon: sizes.length === 0,
      look,
      variants: sizes.map(size => ({ size, sku: `${sku || raw.id.toUpperCase()}-${size}`, price, available: soldOut.includes(size) ? 0 : cap })),
    };
  }

  async function load() {
    const data = window.SHOP;
    if (!data || !Array.isArray(data.products)) throw new Error('The collection could not load. Please try again.');
    const exponent = Number.isInteger(data.decimals) ? data.decimals : 2;
    const cap = Number.isInteger(data.maxPerSize) && data.maxPerSize > 0 ? data.maxPerSize : 10;
    const ids = new Set(), skus = new Set();
    settings = {
      demoMode: data.testMode !== false,
      currency: String(data.currency || 'USD'),
      exponent,
      whatsapp: String(data.whatsapp || '').replace(/\D/g, ''),
      sheetUrl: /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(String(data.sheetUrl || '')) ? data.sheetUrl : '',
      pickup: !!data.pickup,
      pickupDetails: String(data.pickupDetails || ''),
      zones: (Array.isArray(data.zones) ? data.zones : []).map(z => ({ id: String(z.id), name: String(z.name), fee: toMinor(z.fee, exponent) })),
      paymentMethod: String(data.paymentMethod || ''),
      orderChannel: 'whatsapp-request',
      phone: String(data.whatsapp || ''),
      contact: String(data.contact || ''),
      returns: String(data.returns || ''),
      exchanges: String(data.exchanges || ''),
      sizeGuide: Array.isArray(data.sizeGuide) ? data.sizeGuide : [],
    };
    maxQuantityPerLine = cap;
    products = data.products.map(raw => {
      const product = shape(raw, exponent, cap);
      if (ids.has(product.id)) throw new Error(`Two products in shop-data.js share the id "${product.id}".`);
      ids.add(product.id);
      if (product.sku && skus.has(product.sku)) throw new Error(`Two products in shop-data.js share the SKU "${product.sku}".`);
      if (product.sku) skus.add(product.sku);
      return product;
    });
    document.querySelectorAll('[data-demo-note]').forEach(element => { element.hidden = !settings.demoMode; });
    if (settings.demoMode) { const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex'; document.head.append(robots); }
  }

  const api = {
    ready: null,
    reload() { api.ready = load(); return api.ready; },
    get settings() { return settings; },
    get products() { return products; },
    get maxQuantityPerLine() { return maxQuantityPerLine; },
    money: (minor, shop) => money(minor, shop),
    product: id => products.find(product => product.id === id),
    variant: (id, size) => api.product(id)?.variants.find(variant => variant.size === size),
    // A line holds at most what is available and at most the shop's per-size cap, whichever is smaller.
    maxQuantity(id, size) { const variant = api.variant(id, size); return variant ? Math.min(variant.available, maxQuantityPerLine) : 0; },
    /** The lowest and highest size price of a product, in minor units. */
    priceRange(product) {
      const prices = product.variants.map(variant => variant.price);
      return prices.length ? [Math.min(...prices), Math.max(...prices)] : [product.basePrice, product.basePrice];
    },
    escape: value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])),
    /** True while motion should stay still: the visitor's system setting, or the page's pause button. */
    reduceMotion: () => reduceQuery.matches || motionPaused,
    setMotionPaused(paused) {
      motionPaused = paused;
      document.documentElement.classList.toggle('motion-off', paused);
      document.dispatchEvent(new CustomEvent('saints:motion', { detail: { paused: api.reduceMotion() } }));
    },
  };
  reduceQuery.addEventListener('change', () => document.dispatchEvent(new CustomEvent('saints:motion', { detail: { paused: api.reduceMotion() } })));
  api.reload();
  return api;
})();
