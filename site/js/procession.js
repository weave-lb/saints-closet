/* ═══════════════════════════════════════════════════════════════
   THE PROCESSION · the real pieces on mannequins, out on the street
   · desktop: the section pins and the line of stations walks sideways
     as you scroll down; the station nearest the centre lights its halo
   · phones, reduced motion or "Pause motion": a plain swipe row
   · a colour filter (Black / White / Pink) and a full-size view with
     a WhatsApp "ask about this piece" button
   Photos are shown uncropped, in their own proportions.
   Data: window.SHOP.procession (shop-data.js).
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = Store.escape;
  const stations = (window.SHOP && Array.isArray(window.SHOP.procession) ? window.SHOP.procession : [])
    .filter(s => s && typeof s.image === 'string')
    .map((s, i) => ({ ...s, n: i + 1, colour: String(s.colour || ''), view: String(s.view || ''), alt: String(s.alt || '') }));
  const section = $('#procession');
  if (!section) return;
  if (!stations.length) { section.hidden = true; document.querySelectorAll('a[href="#procession"]').forEach(a => { a.hidden = true; }); return; }

  const roman = n => [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((out, [v, r]) => { while (n >= v) { out += r; n -= v; } return out; }, '');
  const file = name => encodeURIComponent(name);
  const label = s => `${s.colour} hoodie · ${s.view}`;
  const productOf = s => (s.product && Store.product(s.product)) || null;
  const title = s => productOf(s)?.name || `${s.colour} hoodie`;
  const HALO = '<svg class="station-halo" viewBox="0 0 64 20" aria-hidden="true"><ellipse cx="32" cy="10" rx="27" ry="6.5"/></svg>';

  const viewport = $('#procession-viewport'), rail = $('#procession-rail'), track = $('#procession-track');
  const rosary = $('#rosary'), now = $('#station-now'), total = $('#station-total');

  track.innerHTML = stations.map(s => `<li class="station" data-n="${s.n}" data-colour="${esc(s.colour)}">
      ${HALO}
      <button type="button" class="station-frame" data-open="${s.n}" aria-label="Station ${roman(s.n)}: ${esc(label(s))}. ${esc(s.alt)}. Open full size">
        <img src="assets/street/m/${file(s.image)}" alt="${esc(label(s))}: ${esc(s.alt)}" width="${Number(s.w) || 675}" height="${Number(s.h) || 900}" loading="lazy" decoding="async">
      </button>
      <p class="station-plate"><span class="station-numeral">${roman(s.n)}</span><span data-station-name="${s.n}">${esc(s.colour)} · ${esc(s.view)}</span></p>
    </li>`).join('');
  const items = [...track.children];

  /* ── Which stations are showing (colour filter) ── */
  let colour = '';
  const visible = () => items.filter(li => !li.hidden);
  function drawRosary() {
    const shown = visible();
    total.textContent = roman(shown.length);
    rosary.innerHTML = shown.map(() => '<i></i>').join('');
  }
  $('#vestments').addEventListener('click', e => {
    const b = e.target.closest('button[data-colour]'); if (!b) return;
    colour = b.dataset.colour;
    for (const other of $('#vestments').querySelectorAll('button')) other.setAttribute('aria-pressed', String(other === b));
    for (const li of items) li.hidden = !!colour && li.dataset.colour !== colour;
    drawRosary();
    layout();
    // start the walk again from the first station of this colour
    if (pinned) { const top = section.getBoundingClientRect().top + scrollY; if (scrollY > top) scrollTo({ top, behavior: 'auto' }); }
    else track.scrollTo({ left: 0, behavior: 'auto' });
    light();
  });

  /* ── Pinned (desktop) or swipe (everything else) ── */
  const wide = matchMedia('(min-width: 900px) and (min-height: 560px) and (hover: hover) and (pointer: fine)');
  // 1 px of scrolling down moves the line 1/SPEED px sideways (shorter walk than 1:1)
  const SPEED = 0.75;
  let pinned = false, distance = 0;
  function layout() {
    pinned = wide.matches && !Store.reduceMotion();
    section.classList.toggle('is-pinned', pinned);
    $('#procession-how').textContent = pinned ? 'Keep scrolling to walk the line' : 'Swipe to walk the line';
    rail.style.transform = '';
    if (!pinned) { section.style.height = ''; distance = 0; return; }
    distance = Math.max(0, rail.scrollWidth - viewport.clientWidth);
    section.style.height = `${innerHeight + distance * SPEED}px`;
    walk();
  }
  function walk() {
    if (!pinned) return;
    const top = section.getBoundingClientRect().top;
    const progress = distance ? Math.min(1, Math.max(0, -top / (distance * SPEED))) : 0;
    rail.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px,0,0)`;
  }

  /* ── The station nearest the middle lights its halo ── */
  let lit = null;
  function light() {
    const shown = visible(); if (!shown.length) return;
    const centre = innerWidth / 2;
    let best = shown[0], gap = Infinity;
    for (const li of shown) {
      const r = li.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - centre);
      if (d < gap) { gap = d; best = li; }
    }
    if (best === lit) return;
    lit?.classList.remove('is-lit'); best.classList.add('is-lit'); lit = best;
    const index = shown.indexOf(best);
    now.textContent = roman(index + 1);
    [...rosary.children].forEach((bead, i) => bead.classList.toggle('on', i <= index));
  }

  let ticking = false;
  function frame() { ticking = false; walk(); light(); }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  track.addEventListener('scroll', request, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layout(); light(); }, 120); });
  wide.addEventListener('change', () => { layout(); light(); });
  document.addEventListener('saints:motion', () => { layout(); light(); });
  // images arrive lazily; the rail's width is known from their width/height attributes, but re-measure once loaded
  addEventListener('load', () => { layout(); light(); });

  /* ── The reliquary: one station, full size ── */
  const dlg = $('#reliquary'), img = $('#reliquary-img'), shop = $('#reliquary-shop');
  let current = 0;
  function show(n) {
    const shown = visible().map(li => Number(li.dataset.n));
    if (!shown.includes(n)) n = shown[0];
    current = n;
    const s = stations[n - 1];
    img.src = `assets/street/${file(s.image)}`;
    img.alt = `${label(s)}: ${s.alt}`;
    img.width = Number(s.w) || 675; img.height = Number(s.h) || 900;
    $('#reliquary-numeral').textContent = `Station ${roman(n)}`;
    const product = productOf(s);
    $('#reliquary-title').textContent = title(s);
    $('#reliquary-alt').textContent = `${label(s)}. ${s.alt}.`;
    // the piece's own card, or the drop for a front view (every hoodie of that colour shares the chest)
    shop.dataset.target = product ? product.id : '';
    shop.querySelector('span').textContent = product ? 'Shop this piece' : `Shop ${s.colour.toLowerCase()} hoodies`;
    shop.hidden = false;
    const i = shown.indexOf(n);
    dlg.querySelector('.reliquary-prev').disabled = i <= 0;
    dlg.querySelector('.reliquary-next').disabled = i >= shown.length - 1;
  }
  function step(by) {
    const shown = visible().map(li => Number(li.dataset.n));
    const next = shown[shown.indexOf(current) + by];
    if (next) show(next);
  }
  let opener = null;
  track.addEventListener('click', e => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    opener = b;
    show(Number(b.dataset.open));
    dlg.showModal();
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => dlg.classList.add('is-open'));
  });
  function close(then) {
    dlg.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    setTimeout(() => { dlg.close(); if (then) then(); else opener?.focus({ preventScroll: true }); }, Store.reduceMotion() ? 0 : 280);
  }
  shop.addEventListener('click', e => {
    e.preventDefault();
    const id = shop.dataset.target;
    close(() => {
      const card = id ? document.querySelector(`.card[data-id="${CSS.escape(id)}"]`) : $('#shop');
      if (!card) return;
      card.scrollIntoView({ behavior: Store.reduceMotion() ? 'auto' : 'smooth', block: id ? 'center' : 'start' });
      if (id) {
        card.classList.remove('is-called'); void card.offsetWidth; card.classList.add('is-called');
        setTimeout(() => card.classList.remove('is-called'), 2600);
        card.querySelector('.size:not([disabled])')?.focus({ preventScroll: true });
      }
    });
  });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-reliquary-close]')) { close(); return; }
    const nav = e.target.closest('[data-step]'); if (nav) step(Number(nav.dataset.step));
  });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  // swipe between stations in the full-size view
  let touchX = null;
  dlg.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // product names arrive with the shop data
  Store.ready.then(() => {
    for (const s of stations) {
      const product = productOf(s), plate = track.querySelector(`[data-station-name="${s.n}"]`);
      if (product && plate) plate.textContent = product.name;
      const button = track.querySelector(`[data-open="${s.n}"]`);
      if (product && button) button.setAttribute('aria-label', `Station ${roman(s.n)}: ${product.name}, ${label(s)}. Open full size`);
    }
    layout();
  }, () => {});

  drawRosary();
  layout();
  light();
})();
