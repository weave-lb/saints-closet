/* ═══════════════════════════════════════════════════════════════
   THE CLOSET · cart and checkout
   · a piece leaves its card, catches a gold hanger in mid-air and
     hooks onto the rail in the dock; its neighbours swing
   · the halo meter in the header fills: Sinner → Saint
   · opening the closet swings two wardrobe doors open onto the rail
   · checkout gives the order a reference, opens WhatsApp with the order typed
     out for the shop's number, and sends a copy to the shop's Google Sheet
   The bag is saved in the browser; every open tab shares one closet.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = Store.escape;
  const money = minor => Store.money(minor);
  const KEY = 'saints-closet-bag-v1';

  /* ── State ───────────────────────────────────────── */
  // A line: { id: product slug, size, quantity, priceSeen: the size price in minor units when it was added }.
  let lines = [];
  let storedBag = readStored();
  function readStored() {
    try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* The bag still works in memory. */ } }
  /** Rebuilds the bag from saved entries against the live catalogue. Returns true when anything had to change. */
  function restore(entries) {
    let changed = false;
    const next = [];
    for (const item of entries) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.size !== 'string') { changed = true; continue; }
      const variant = Store.variant(item.id, item.size);
      if (!variant || !Number.isInteger(item.quantity) || item.quantity < 1 || variant.available < 1) { changed = true; continue; }
      const cap = Store.maxQuantity(item.id, item.size);
      const quantity = Math.min(item.quantity, cap);
      if (quantity !== item.quantity) changed = true;
      const existing = next.find(line => line.id === item.id && line.size === item.size);
      if (existing) { existing.quantity = Math.min(existing.quantity + quantity, cap); changed = true; }
      else next.push({ id: item.id, size: item.size, quantity, priceSeen: Number.isSafeInteger(item.priceSeen) ? item.priceSeen : variant.price });
    }
    lines = next;
    return changed;
  }
  const lkey = l => l.id + '|' + l.size;
  const find = k => lines.find(l => lkey(l) === k);
  const units = () => lines.reduce((s, l) => s + l.quantity, 0);
  const unitPrice = l => Store.variant(l.id, l.size)?.price ?? l.priceSeen;
  const subtotal = () => lines.reduce((s, l) => s + unitPrice(l) * l.quantity, 0);
  /** What the old prices would have cost minus what the customer pays now. */
  const forgiven = () => lines.reduce((s, l) => { const p = Store.product(l.id); return s + (p && p.compareAt > unitPrice(l) ? (p.compareAt - unitPrice(l)) * l.quantity : 0); }, 0);
  // absolute URL: a relative url() inside a custom property would resolve against the stylesheet, not the page
  const lookStyle = p => `--img:url('${new URL(p.look.railImage || p.look.image, document.baseURI).href}');--pos:${p.look.split ? '97% 50%' : '50% 38%'};--bg:${p.look.bg}`;

  /* ── The rail ────────────────────────────────────── */
  const WIRE = '<svg class="wire" viewBox="0 0 60 44" aria-hidden="true"><path d="M30 30v-4.6c0-3-4-4.5-4-9.2 0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 5.7c0 2.4-1.4 3.7-3 4.4"/><path d="M30 30 6 40.6c-2.2 1-1.5 2.7.6 2.7h46.8c2.1 0 2.8-1.7.6-2.7Z"/></svg>';

  class Rail {
    constructor(root) { this.root = root; this.items = root.querySelector('.rail-items'); this.bar = root.querySelector('.rail-bar'); this.els = new Map(); this.order = []; }
    make(l) {
      const el = document.createElement('span');
      el.className = 'hanger';
      el.innerHTML = WIRE + `<span class="hanger-item" style="${esc(lookStyle(Store.product(l.id)))}"></span><span class="qty" hidden></span>`;
      return el;
    }
    sync(hideKey) {
      const keys = lines.map(lkey);
      for (const [k, el] of this.els) if (!keys.includes(k)) { this.lift(el); this.els.delete(k); }
      lines.forEach(l => {
        const k = lkey(l);
        let el = this.els.get(k);
        if (!el) {
          el = this.make(l); el.style.transition = 'none'; el.dataset.fresh = '1';
          if (k === hideKey) el.style.visibility = 'hidden';
          this.items.append(el); this.els.set(k, el);
        }
        const q = el.querySelector('.qty'); q.hidden = l.quantity < 2; q.textContent = '×' + l.quantity;
      });
      this.order = keys;
      this.layout();
    }
    layout() {
      const w = this.items.clientWidth;
      const iw = parseFloat(getComputedStyle(this.root).getPropertyValue('--item-w')) || 34;
      const n = this.order.length;
      // like a real rail: comfortable gaps, then pieces crowd (and overlap) as the closet fills
      const step = n > 1 ? Math.min(iw * 1.32, Math.max(8, (w - iw) / (n - 1))) : 0;
      const start = Math.max(0, (w - (step * (n - 1) + iw)) / 2);
      this.order.forEach((k, i) => {
        const el = this.els.get(k); if (!el) return;
        el.style.left = (start + step * i) + 'px'; el.style.zIndex = i + 1;
        if (el.dataset.fresh) { void el.offsetWidth; el.style.transition = ''; delete el.dataset.fresh; }
      });
    }
    rect(k) { const el = this.els.get(k); return el ? el.getBoundingClientRect() : null; }
    show(k) { const el = this.els.get(k); if (el) el.style.visibility = ''; }
    swing(k, amp, delay = 0) {
      const el = this.els.get(k); if (!el || Store.reduceMotion()) return;
      el.animate([{ transform: `rotate(${amp}deg)` }, { transform: `rotate(${-amp * .62}deg)` }, { transform: `rotate(${amp * .34}deg)` }, { transform: `rotate(${-amp * .14}deg)` }, { transform: 'rotate(0)' }],
        { duration: 1500 + Math.abs(amp) * 35, delay, easing: 'cubic-bezier(.3,.5,.4,1)' });
    }
    jostle(k) {
      const i = this.order.indexOf(k);
      this.order.forEach((o, j) => { if (o !== k) { const d = Math.abs(j - i); if (d <= 3) this.swing(o, (j < i ? -1 : 1) * (5 - d), 60 + d * 80); } });
    }
    dip() { if (!Store.reduceMotion() && this.bar) this.bar.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(2px)' }, { transform: 'translateY(0)' }], { duration: 360, easing: 'ease-out' }); }
    lift(el) {
      if (Store.reduceMotion()) { el.remove(); return; }
      el.style.pointerEvents = 'none';
      el.animate([{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: 'translateY(-14px) rotate(-6deg)', opacity: 1, offset: .5 }, { transform: 'translateY(-34px) rotate(-10deg)', opacity: 0 }],
        { duration: 480, easing: 'ease-in', fill: 'forwards' }).onfinish = () => el.remove();
    }
    reset() { this.items.innerHTML = ''; this.els.clear(); this.order = []; }
  }

  const dock = $('#dock'), dockBtn = $('#dock-open');
  const dockRail = new Rail($('#dock-rail'));
  const closetRail = new Rail($('#closet-rail'));
  const haloBtn = $('#closet-btn');
  const dlg = $('#closet');

  /* ── Header halo meter + dock numbers ────────────── */
  const TIERS = ['Sinner', 'Confessed', 'Blessed', 'Saint'];
  function renderDock() {
    const u = units();
    $('#dock-count').textContent = `${u} ${u === 1 ? 'piece' : 'pieces'} hanging`;
    $('#dock-total').textContent = Store.settings ? money(subtotal()) : '';
  }
  function renderCounts(bump) {
    const u = units();
    const tier = TIERS[Math.min(3, u)];
    $('#closet-count').textContent = u;
    $('#halo-tier').textContent = tier;
    haloBtn.style.setProperty('--fill', Math.min(100, u / 3 * 100).toFixed(1));
    haloBtn.classList.toggle('is-saint', u >= 3);
    haloBtn.setAttribute('aria-label', u ? `Open your closet, ${u} ${u === 1 ? 'piece' : 'pieces'}, ${money(subtotal())}` : 'Open your closet, empty');
    if (bump && !Store.reduceMotion()) { haloBtn.classList.remove('bump'); void haloBtn.offsetWidth; haloBtn.classList.add('bump'); }
    renderDock();
    const on = lines.length > 0;
    if (on) { dock.classList.add('is-on'); dock.setAttribute('aria-hidden', 'false'); dockBtn.tabIndex = 0; }
    else { dock.classList.remove('is-on'); dock.setAttribute('aria-hidden', 'true'); dockBtn.tabIndex = -1; }
    document.body.classList.toggle('has-dock', on);
  }

  function announce(msg) { const el = $('#live'); el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 40); }
  let toastTimer = 0;
  function toast(msg) {
    let el = $('#toast');
    if (!el) { el = document.createElement('p'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
    clearTimeout(toastTimer); el.textContent = msg; el.classList.add('show');
    toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
  }

  /* ── Adding: the flight onto the rail ────────────── */
  /** Hangs one piece. Returns a message when it cannot, so the card can say why. */
  function add(id, size, fromEl) {
    const p = Store.product(id), variant = Store.variant(id, size);
    if (!p || !variant) return 'That size is no longer available.';
    const k = id + '|' + size;
    let l = find(k);
    const inBag = l ? l.quantity : 0;
    if (inBag >= Store.maxQuantityPerLine) return `You can order up to ${Store.maxQuantityPerLine} of each size.`;
    if (inBag >= variant.available) return 'That size has no more available stock.';
    const isNew = !l;
    if (l) l.quantity += 1; else lines.push(l = { id, size, quantity: 1, priceSeen: variant.price });
    save();
    dock.classList.add('is-on');                     // the dock slides up first so the flight has somewhere to land
    dockRail.sync(isNew ? k : null);
    renderDock();
    if (dlg.open) { closetRail.sync(); renderLines(); }
    announce(`${p.name}, size ${size}, hung in your closet. ${units()} ${units() === 1 ? 'piece' : 'pieces'}, ${money(subtotal())}.`);
    if (Store.reduceMotion() || !fromEl) { dockRail.show(k); land(k); return null; }
    fly(p, fromEl, k);
    return null;
  }

  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function fly(p, fromEl, k) {
    const r0 = fromEl.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'flyer';
    el.innerHTML = `<span class="flyer-wire">${WIRE}</span><span class="flyer-item" style="${esc(lookStyle(p))}"></span>`;
    document.body.appendChild(el);
    const wire = el.firstElementChild, item = el.lastElementChild;
    const w0 = Math.min(r0.width, 300);
    const wireH = w => w * 44 / 60, overlap = w => w * .12;
    const x0 = r0.left + (r0.width - w0) / 2, y0 = r0.top + (r0.height - w0 * 4 / 3) / 2 - (wireH(w0) - overlap(w0));
    const D = 1050, t0 = performance.now();
    const place = (x, y, w, rot, wo) => {
      const ih = w * 4 / 3, h = wireH(w) - overlap(w) + ih;
      el.style.width = w + 'px'; el.style.height = h + 'px';
      item.style.height = ih + 'px';
      wire.style.opacity = wo;
      el.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg)`;
      el.style.transformOrigin = `50% ${wireH(w) * .25}px`;
    };
    place(x0, y0, w0, 0, 0);
    const step = now => {
      const k1 = Math.min(1, (now - t0) / D), e = easeIO(k1);
      const tr = dockRail.rect(k);
      if (!tr) { el.remove(); land(k); return; }
      const x2 = tr.left, y2 = tr.top;
      const cx = x0 + (x2 - x0) * .32, cy = Math.max(70, Math.min(y0, y2) - Math.min(220, window.innerHeight * .22));
      const u = 1 - e;
      const x = u * u * x0 + 2 * u * e * cx + e * e * x2;
      const y = u * u * y0 + 2 * u * e * cy + e * e * y2;
      const w = w0 + (tr.width - w0) * e;
      const rot = Math.sin(e * Math.PI) * -16 + Math.sin(e * Math.PI * 3) * 4 * (1 - e);
      place(x, y, w, rot, Math.min(1, Math.max(0, (k1 - .22) / .22)));
      if (k1 < 1) requestAnimationFrame(step);
      else { el.remove(); dockRail.show(k); land(k); }
    };
    requestAnimationFrame(step);
  }

  function land(k) {
    renderCounts(true);
    dockRail.layout();
    dockRail.swing(k, 16);
    dockRail.jostle(k);
    dockRail.dip();
    const r = dockRail.rect(k);
    if (r && !Store.reduceMotion()) sparks(r.left + r.width / 2, r.top + r.width * 0.14);
  }

  function sparks(x, y) {
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span'); s.className = 'spark';
      document.body.appendChild(s);
      const a = (i / 12) * Math.PI * 2 + Math.random() * .4, d = 22 + Math.random() * 38, sc = .6 + Math.random() * .9;
      s.animate([
        { transform: `translate(${x}px,${y}px) scale(${sc}) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d - 10}px) scale(0) rotate(180deg)`, opacity: 0 }
      ], { duration: 620 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
    }
  }

  /* ── The closet drawer ───────────────────────────── */
  const linesEl = $('#lines'), form = $('#checkout'), placed = $('#placed');
  function renderLines(animate) {
    const empty = lines.length === 0;
    $('#wardrobe-empty').hidden = !empty || !placed.hidden;
    $('#empty-cta').hidden = !empty || !placed.hidden;
    $('#totals').hidden = empty;
    form.hidden = empty || !placed.hidden;
    linesEl.classList.toggle('still', !animate);
    linesEl.innerHTML = lines.map((l, i) => {
      const p = Store.product(l.id), k = lkey(l), max = Store.maxQuantity(l.id, l.size);
      return `<li class="line" data-key="${esc(k)}" style="${animate ? `animation-delay:${.35 + i * .06}s` : 'animation:none'}">
        <span class="line-thumb" style="${esc(lookStyle(p))}"></span>
        <div>
          <p class="line-name">${esc(p.name)}</p>
          <p class="line-meta">${p.colour ? `${esc(p.colour)} · ` : ''}Size ${esc(l.size)}</p>
          <p class="line-price">${p.compareAt > unitPrice(l) ? `<s>${money(p.compareAt * l.quantity)}</s> ` : ''}${money(unitPrice(l) * l.quantity)}</p>
        </div>
        <div class="line-ctl">
          <div class="qty-ctl" role="group" aria-label="Quantity for ${esc(p.name)}, size ${esc(l.size)}"><button type="button" data-dec aria-label="One less ${esc(p.name)}, size ${esc(l.size)}">−</button><output aria-live="polite">${l.quantity}</output><button type="button" data-inc aria-label="One more ${esc(p.name)}, size ${esc(l.size)}"${l.quantity >= max ? ' disabled' : ''}>+</button></div>
          <button type="button" class="rm" data-rm aria-label="Remove ${esc(p.name)}, size ${esc(l.size)}">Remove</button>
        </div>
      </li>`;
    }).join('');
    renderTotals();
  }
  function method() { return new FormData(form).get('fulfilment') || ''; }
  function zone() { return Store.settings.zones.find(z => z.id === $('#checkout-zone').value); }
  /** Draws the totals and returns the delivery fee the customer sees, in minor units. */
  function renderTotals() {
    const sub = subtotal(), delivery = method() === 'delivery', fee = delivery ? (zone()?.fee || 0) : 0;
    $('#t-sub').textContent = money(sub);
    const saved = forgiven();
    // reads top-down: what it would have cost, what is forgiven, what is left to pay
    $('#t-was-row').hidden = saved <= 0;
    $('#t-was').textContent = saved > 0 ? money(sub + saved) : '';
    $('#t-saved-row').hidden = saved <= 0;
    $('#t-saved').textContent = saved > 0 ? `−${money(saved)}` : '';
    $('#t-del').textContent = method() === 'pickup' ? 'Pick up' : delivery ? money(fee) : 'Choose at checkout';
    $('#t-total').textContent = money(sub + fee);
    form.classList.toggle('pickup', !delivery);
    $('#checkout-zone').disabled = !delivery;
    form.elements.address.disabled = !delivery;
    form.elements.address.required = delivery;
    return fee;
  }

  /** Sets up the delivery/pickup choice, areas, payment text and button from the shop's settings. */
  function prepareCheckout() {
    const shop = Store.settings;
    const offers = { delivery: shop.zones.length > 0, pickup: shop.pickup };
    for (const label of $$('[data-method]', form)) label.hidden = !offers[label.dataset.method];
    $('#checkout-methods').hidden = !(offers.delivery || offers.pickup);
    const current = method();
    if (!offers[current]) {
      const first = offers.delivery ? 'delivery' : offers.pickup ? 'pickup' : '';
      for (const input of $$('[name="fulfilment"]', form)) input.checked = input.value === first;
    }
    const chosenZone = $('#checkout-zone').value;
    $('#checkout-zone').innerHTML = shop.zones.map(z => `<option value="${esc(z.id)}">${esc(z.name)} · ${esc(money(z.fee))}</option>`).join('');
    if (shop.zones.some(z => z.id === chosenZone)) $('#checkout-zone').value = chosenZone;
    const request = shop.orderChannel === 'whatsapp-request';
    $('#submit-order span').textContent = 'Order on WhatsApp';
    $('#submit-order').disabled = !(offers.delivery || offers.pickup) || checkoutBusy;
    $('#checkout-note').textContent = [
      shop.demoMode ? 'Test mode: orders are tests.' : '',
      offers.delivery || offers.pickup ? '' : 'Ordering is not open yet.',
      'WhatsApp opens with your order typed out. Send it, and the shop confirms availability and delivery there.',
      shop.paymentMethod,
    ].filter(Boolean).join(' ');
    renderTotals();
  }

  let closing = 0;
  function openCloset() {
    if (dlg.open || !Store.settings) return;
    clearTimeout(closing);
    if (!pendingShown) { placed.hidden = true; $('#placed-wa').hidden = true; $('#retry-checkout').hidden = true; }
    prepareCheckout();
    closetRail.reset();
    renderLines(true);
    dlg.showModal();
    document.documentElement.style.overflow = 'hidden';
    closetRail.sync();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      dlg.classList.add('is-open');
      setTimeout(() => {
        dlg.classList.add('doors-open');
        // the rail settles as the doors open, like a rail that has just been moved
        closetRail.order.forEach((k, i) => closetRail.swing(k, i % 2 ? -5 : 6, 420 + i * 70));
      }, Store.reduceMotion() ? 0 : 380);
    }));
  }
  function closeCloset() {
    if (!dlg.open) return;
    dlg.classList.remove('doors-open', 'is-open');
    document.documentElement.style.overflow = '';
    closing = setTimeout(() => { dlg.close(); if (!placed.hidden && !lines.length) { placed.hidden = true; pendingShown = false; } haloBtn.focus({ preventScroll: true }); }, Store.reduceMotion() ? 0 : 650);
  }
  haloBtn.addEventListener('click', openCloset);
  dockBtn.addEventListener('click', openCloset);
  dlg.addEventListener('cancel', e => { e.preventDefault(); closeCloset(); });
  dlg.addEventListener('click', e => {
    if (e.target === dlg) { closeCloset(); return; }
    if (e.target.closest('[data-close]')) { closeCloset(); return; }
    const li = e.target.closest('.line'); if (!li) return;
    const l = find(li.dataset.key); if (!l) return;
    if (e.target.closest('[data-inc]')) l.quantity = Math.min(Store.maxQuantity(l.id, l.size), l.quantity + 1);
    else if (e.target.closest('[data-dec]')) l.quantity -= 1;
    else if (e.target.closest('[data-rm]')) l.quantity = 0;
    else return;
    const which = e.target.closest('[data-inc]') ? '[data-inc]' : '[data-dec]';
    if (l.quantity <= 0) lines.splice(lines.indexOf(l), 1);
    save(); afterChange(li.dataset.key);
    const again = $$('.line', linesEl).find(el => el.dataset.key === li.dataset.key);
    (again?.querySelector(which) || $('#empty-cta a') || $('.x', dlg))?.focus({ preventScroll: true });
  });
  function afterChange(k) {
    closetRail.sync(); dockRail.sync();
    if (k && find(k)) { closetRail.swing(k, 7); }
    renderLines(false); renderCounts(true);
  }
  form.addEventListener('change', e => { if (e.target.name === 'fulfilment' || e.target.name === 'zoneId') renderTotals(); });
  form.addEventListener('input', e => { const f = e.target.closest('.f'); if (f) { f.classList.remove('bad'); const error = f.querySelector('.f-error'); if (error) error.textContent = ''; e.target.removeAttribute('aria-invalid'); } });

  /* ── Checkout: a WhatsApp message to the shop, and a copy to the Google Sheet ── */
  // Everything below runs synchronously inside the tap on "Send order", so the browser lets WhatsApp open.
  let checkoutBusy = false;
  let pendingShown = false;
  const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  /** A short reference the customer, the WhatsApp chat and the Sheet all share, e.g. SC-1113-4F7K. */
  function reference(now) {
    const pad = n => String(n).padStart(2, '0');
    const random = [...crypto.getRandomValues(new Uint8Array(4))].map(b => ALPHABET[b % ALPHABET.length]).join('');
    return `SC-${pad(now.getMonth() + 1)}${pad(now.getDate())}-${random}`;
  }
  const major = minor => Number((minor / 10 ** Store.settings.exponent).toFixed(Store.settings.exponent));
  const whatsappReady = () => /^\d{10,15}$/.test(Store.settings.whatsapp) && !/^9610+$/.test(Store.settings.whatsapp);

  function clearCheckoutErrors() {
    for (const element of $$('.f-error', form)) element.textContent = '';
    for (const f of $$('.f.bad', form)) f.classList.remove('bad');
    for (const input of $$('[aria-invalid]', form)) input.removeAttribute('aria-invalid');
    $('#checkout-problem').textContent = '';
  }
  function fieldError(name, message) {
    const error = $(`#error-${name}`);
    if (error) { error.textContent = message; error.closest('.f')?.classList.add('bad'); }
    const input = form.elements[name];
    if (input && input.setAttribute) input.setAttribute('aria-invalid', 'true');
    return input && input.focus ? input : error;
  }
  /** Reads and checks the form. Returns the customer, or null after showing what to fix. */
  function readCustomer() {
    const f = new FormData(form);
    const customer = {
      name: String(f.get('name') || '').trim().replace(/\s+/g, ' '),
      phone: String(f.get('phone') || '').trim(),
      fulfilment: String(f.get('fulfilment') || ''),
      zone: null,
      address: '',
    };
    const problems = [];
    if (customer.fulfilment !== 'delivery' && customer.fulfilment !== 'pickup') problems.push(['fulfilment', 'Choose delivery or pick up.']);
    if (customer.name.length < 2) problems.push(['name', 'Enter your name.']);
    const digits = customer.phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15 || /[^\d\s+().-]/.test(customer.phone)) problems.push(['phone', 'Enter a phone number we can reach on WhatsApp.']);
    if (customer.fulfilment === 'delivery') {
      customer.zone = zone() || null;
      customer.address = String(f.get('address') || '').trim();
      if (!customer.zone) problems.push(['zoneId', 'Choose your area.']);
      if (customer.address.length < 5) problems.push(['address', 'Enter the address: building, street and area.']);
    }
    if (!problems.length) return customer;
    let first = null;
    for (const [name, message] of problems) { const target = fieldError(name, message); first = first || target; }
    $('#checkout-problem').textContent = 'Check the highlighted details.';
    first?.focus?.({ preventScroll: false });
    return null;
  }

  function buildOrder(customer) {
    const now = new Date();
    const fee = customer.fulfilment === 'delivery' ? customer.zone.fee : 0;
    const items = lines.map(l => {
      const p = Store.product(l.id), price = unitPrice(l);
      return { id: l.id, sku: Store.variant(l.id, l.size)?.sku || '', name: p.name, colour: p.colour, size: l.size, quantity: l.quantity, unitPrice: price, lineTotal: price * l.quantity };
    });
    const sub = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return { reference: reference(now), createdAt: now.toISOString(), customer, items, subtotal: sub, saved: forgiven(), deliveryFee: fee, total: sub + fee };
  }

  function whatsappText(order) {
    const c = order.customer;
    return [
      'Hello Saints Closet! I would like to order:',
      '',
      `Order ${order.reference}`,
      ...order.items.map(item => `• ${item.quantity} × ${item.name}${item.colour ? ` (${item.colour})` : ''} · Size ${item.size} · ${money(item.lineTotal)}${item.sku ? `\n   SKU ${item.sku}` : ''}`),
      '',
      `Subtotal: ${money(order.subtotal)}`,
      ...(order.saved > 0 ? [`Discount already applied: ${money(order.saved)}`] : []),
      c.fulfilment === 'delivery' ? `Delivery (${c.zone.name}): ${money(order.deliveryFee)}` : 'Pick up',
      `Total: ${money(order.total)}`,
      '',
      `Name: ${c.name}`,
      `Phone: ${c.phone}`,
      ...(c.fulfilment === 'delivery' ? [`Area: ${c.zone.name}`, `Address: ${c.address}`] : []),
      ...(Store.settings.paymentMethod ? ['', `Payment: ${Store.settings.paymentMethod}`] : []),
      ...(Store.settings.demoMode ? ['', '(Test order)'] : []),
    ].join('\n');
  }

  /** Sends the order to the Google Apps Script web app. Fire-and-forget: WhatsApp never waits for the Sheet. */
  function sendToSheet(order, honeypot) {
    const url = Store.settings.sheetUrl;
    if (!url) return;
    const c = order.customer;
    const body = JSON.stringify({
      reference: order.reference,
      createdAt: order.createdAt,
      name: c.name,
      phone: c.phone,
      fulfilment: c.fulfilment,
      zone: c.zone ? c.zone.name : '',
      address: c.address,
      items: order.items.map(item => ({ id: item.id, sku: item.sku, name: item.name, colour: item.colour, size: item.size, quantity: item.quantity, unitPrice: major(item.unitPrice), lineTotal: major(item.lineTotal) })),
      subtotal: major(order.subtotal),
      deliveryFee: major(order.deliveryFee),
      total: major(order.total),
      currency: Store.settings.currency,
      test: Store.settings.demoMode,
      website: honeypot,
    });
    // text/plain keeps this a "simple" request: no CORS preflight, which Apps Script cannot answer.
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return; }
    catch { /* fall through to fetch */ }
    fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'content-type': 'text/plain;charset=UTF-8' }, body }).catch(() => {});
  }

  function showPanel() {
    placed.hidden = false;
    form.hidden = true;
    $('#empty-cta').hidden = true;
    $('#wardrobe-empty').hidden = true;
    dlg.querySelector('.closet-panel').scrollTo({ top: 0, behavior: Store.reduceMotion() ? 'auto' : 'smooth' });
  }
  function showOrderResult(order, link) {
    $('#placed-title').textContent = 'Blessed.';
    $('#placed-body').innerHTML = `<p>Your order reference is <b>${esc(order.reference)}</b>.</p>`
      + `<p>Total <b>${esc(money(order.total))}</b>${order.saved > 0 ? ` · <span class="placed-saved">${esc(money(order.saved))} forgiven</span>` : ''}</p>`
      + (link
        ? '<p><b>One last step:</b> press send in WhatsApp. Your order reaches the shop only when that message is sent. If WhatsApp did not open, use the button below.</p>'
        : '<p>WhatsApp ordering is not set up yet, so this order was not sent.</p>')
      + (Store.settings.paymentMethod ? `<p class="fine">${esc(Store.settings.paymentMethod)}</p>` : '');
    $('#placed-wa').hidden = !link;
    if (link) $('#placed-wa').href = link;
    $('#retry-checkout').hidden = true;
    // the closet empties: every piece lifts off the rail
    lines = []; storedBag = []; save();
    closetRail.sync(); dockRail.sync(); renderLines(false); renderCounts(false);
    showPanel();
    announce(`Order ${order.reference} ready. Send it on WhatsApp.`);
    ($('#placed-wa').hidden ? placed.querySelector('[data-close]') : $('#placed-wa')).focus({ preventScroll: true });
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (checkoutBusy || !lines.length) return;
    clearCheckoutErrors();
    if (!whatsappReady()) { $('#checkout-problem').textContent = 'Ordering opens soon. The shop has not set its WhatsApp number yet.'; return; }
    const customer = readCustomer();
    if (!customer) return;
    checkoutBusy = true; $('#submit-order').disabled = true;
    try {
      const order = buildOrder(customer);
      const honeypot = String(new FormData(form).get('website') || '');
      const link = `https://wa.me/${Store.settings.whatsapp}?text=${encodeURIComponent(whatsappText(order))}`;
      sendToSheet(order, honeypot);
      window.open(link, '_blank', 'noopener');
      showOrderResult(order, link);
    } finally {
      checkoutBusy = false;
      $('#submit-order').disabled = !lines.length;
    }
  });

  /* ── Every tab shares one closet ─────────────────── */
  window.addEventListener('storage', e => {
    if (e.key !== KEY || !Store.settings) return;
    restore(readStored());
    dockRail.sync(); if (dlg.open) { closetRail.sync(); renderLines(false); }
    renderCounts(false);
  });
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { dockRail.layout(); if (dlg.open) closetRail.layout(); }, 120); });

  /* ── Boot ────────────────────────────────────────── */
  Store.ready.then(() => {
    const changed = restore(storedBag);
    if (changed) { save(); toast('Your closet was updated: unavailable pieces or sizes were removed, and quantities now match stock.'); }
    dockRail.sync();
    renderCounts(false);
  }, () => { /* site.js reports a failed load where the products would be. */ });

  window.Closet = { add, open: openCloset, close: closeCloset, has: () => lines.length, quantity: (id, size) => find(id + '|' + size)?.quantity || 0 };
})();
