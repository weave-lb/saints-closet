/* ═══════════════════════════════════════════════════════════════
   Page: product cards, sizes, tilt, reveals, nav state, motion control
   Cards are drawn from shop-data.js through store.js. A product with no
   sizes yet is shown as "Coming soon" and cannot be added.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const esc = Store.escape;

  /* ── Product cards ─────────────────────────────── */
  const HANGER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.2V6.4c0-.6.4-1 .9-1.3.7-.4 1.1-1 1.1-1.8A2 2 0 0 0 12 1.3a2 2 0 0 0-2 2M12 7.2 2.6 13.6c-.9.6-.5 2 .6 2h17.6c1.1 0 1.5-1.4.6-2L12 7.2Z"/></svg>';
  // A discounted price reads: old price struck through (the sin), new price in gold (the absolution).
  function priceHTML(p, price) {
    const was = p.compareAt && p.compareAt > price ? `<s class="was" aria-label="was ${esc(Store.money(p.compareAt))}">${esc(Store.money(p.compareAt))}</s>` : '';
    return `${was}<b class="now"${was ? ` aria-label="now ${esc(Store.money(price))}"` : ''}>${esc(Store.money(price))}</b>`;
  }
  function seal(p) {
    const [low] = Store.priceRange(p);
    if (!p.compareAt || p.compareAt <= low || p.comingSoon) return '';
    return `<span class="seal" aria-label="${esc(Store.money(p.compareAt - low))} off"><b>−${esc(Store.money(p.compareAt - low))}</b><i>forgiven</i></span>`;
  }
  function priceLabel(p) {
    const [low, high] = Store.priceRange(p);
    return low === high ? Store.money(low) : `From ${Store.money(low)}`;
  }
  // A coming-soon piece with no photo is sealed: nothing about the design is shown, only that something waits.
  const ROMAN = n => [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((out, [v, r]) => { while (n >= v) { out += r; n -= v; } return out; }, '');
  const VEILED = [
    'Even the saints haven&#8217;t seen this one.',
    'Name withheld. Print unknown. Prayers accepted.',
    'Locked in the vault until the drop.',
    'Revealed only to the faithful.',
  ];
  const SILHOUETTE = '<svg class="sealed-hoodie" viewBox="0 0 200 222" aria-hidden="true"><path d="M70 40C76 18 124 18 130 40L160 55C172 61 178 71 181 85L196 170C197 176 193 181 187 181L172 183C167 183 164 180 163 175L152 114V206C152 212 148 216 142 216H58C52 216 48 212 48 206V114L37 175C36 180 33 183 28 183L13 181C7 181 3 176 4 170L19 85C22 71 28 61 40 55Z"/><path d="M80 44C86 64 114 64 120 44M93 60 91 88M107 60 109 88M70 160H130L137 190H63ZM48 202H152"/></svg>';
  function sealedCard(p, i) {
    const n = ROMAN(i + 1);
    return `<article class="card soon sealed" data-id="${esc(p.id)}" style="transition-delay:${(i % 4) * 0.08}s">
      <div class="card-media">
        <span class="sealed-glow" aria-hidden="true"></span>
        ${SILHOUETTE}
        <span class="wax" aria-hidden="true"><b>${n}</b></span>
        <span class="sheen" aria-hidden="true"></span>
        <span class="card-tag">Sealed</span>
      </div>
      <div class="card-body">
        <div class="card-title"><h3><span class="redact" aria-hidden="true" style="--w:${[6.2, 4.4, 7.4, 5.3][i % 4]}ch"></span><span class="sr-only">Sealed piece ${n}, name withheld</span></h3><span class="price redact-price" aria-hidden="true">$&thinsp;??</span></div>
        <p class="card-blurb">${VEILED[i % VEILED.length]}</p>
        <p class="soon-note">Revealed at the drop</p>
      </div>
    </article>`;
  }
  function card(p, i) {
    const look = p.look, soon = p.comingSoon;
    if (soon && !look.image) return sealedCard(p, i);
    const soldOut = !soon && p.variants.every(v => v.available < 1);
    const tagText = p.tag || (soon ? 'Coming soon' : p.colour ? `${p.colour} hoodie` : p.drop === 'd02' ? 'Drop 02' : 'Drop 01');
    const tag = `<span class="card-tag${p.tag ? ' hot' : ''}">${esc(tagText)}</span>`;
    const flips = look.split || look.separate;
    const other = look.startsOnBack ? 'front' : 'back';
    const face = flips ? `<button class="face" type="button" data-flip aria-pressed="false" aria-label="Show the ${other} of ${esc(p.name)}"><i></i><span>${other === 'front' ? 'Front' : 'Back'}</span></button>` : '';
    const blurb = p.description || p.subtitle;
    const sizes = soon ? '' : `<div class="sizes" role="radiogroup" aria-label="Size for ${esc(p.name)}">
          ${p.variants.map(v => {
            const out = v.available < 1;
            return `<button type="button" class="size${out ? ' out' : ''}" role="radio" aria-checked="false" data-size="${esc(v.size)}"${out ? ` disabled aria-label="${esc(v.size)}, sold out"` : ''}>${esc(v.size)}</button>`;
          }).join('')}
        </div>`;
    const action = soon
      ? '<p class="soon-note">Coming soon</p>'
      : `<button type="button" class="add" data-add${soldOut ? ' disabled' : ''}>${HANGER}<span>${soldOut ? 'Sold out' : 'Add to closet'}</span></button><p class="card-msg" role="status"></p>`;
    return `<article class="card${look.split ? ' split' : ''}${look.cutout ? ' cutout' : ''}${soon ? ' soon' : ''}" data-id="${esc(p.id)}" style="transition-delay:${(i % 4) * 0.08}s">
      <div class="card-media" style="--bg:${esc(look.bg)}"${look.separate ? ` data-front-src="${esc(look.image)}" data-back-src="${esc(look.backImage)}"` : ''}>
        ${look.image ? `<img src="${esc(look.image)}" alt="${esc(p.name)}${look.split ? ', front and back' : ''}" loading="lazy" decoding="async">` : ''}
        <span class="sheen" aria-hidden="true"></span>
        ${tag}${seal(p)}${face}
      </div>
      <div class="card-body">
        <div class="card-title"><h3>${esc(p.name)}</h3><span class="price">${soon ? '' : p.compareAt ? priceHTML(p, Store.priceRange(p)[0]) : esc(priceLabel(p))}</span></div>
        ${blurb ? `<p class="card-blurb">${esc(blurb)}</p>` : ''}
        ${sizes}
        ${action}
      </div>
    </article>`;
  }

  let observer = null;
  function reveal(elements) {
    if (observer && !Store.reduceMotion()) elements.forEach(el => observer.observe(el));
    else elements.forEach(el => el.classList.add('in'));
  }
  function renderGrids() {
    const d01 = Store.products.filter(p => p.drop === 'd01'), d02 = Store.products.filter(p => p.drop === 'd02');
    $('#grid-d01').innerHTML = d01.length ? d01.map(card).join('') : '<p class="grid-empty">The first drop is being hung. Check back soon.</p>';
    $('#grid-d02').innerHTML = d02.map(card).join('');
    $('#drop-02').hidden = d02.length === 0;
    // one launch line when every piece shares the same price and old price
    const sale = d01.filter(p => !p.comingSoon && p.compareAt);
    const kicker = $('#shop-kicker');
    if (kicker && sale.length && sale.length === d01.length && sale.every(p => p.compareAt === sale[0].compareAt && Store.priceRange(p)[0] === Store.priceRange(sale[0])[0])) {
      const now = Store.priceRange(sale[0])[0];
      kicker.innerHTML = `<span>Drop 01</span> · Every hoodie <s>${esc(Store.money(sale[0].compareAt))}</s> <b>${esc(Store.money(now))}</b>`;
    }
    document.querySelectorAll('a[href="#drop-02"]').forEach(a => { a.hidden = d02.length === 0; });
    reveal(document.querySelectorAll('.card'));
    swipeRow();
  }
  function renderSizeGuide() {
    const rows = Store.settings.sizeGuide;
    $('#size-guide').innerHTML = rows.length ? `<details class="size-guide"><summary>Size guide</summary><table><caption>Garment measurements (cm)</caption><thead><tr><th scope="col">Size</th><th scope="col">Chest width</th><th scope="col">Length</th></tr></thead><tbody>${rows.map(row => `<tr><th scope="row">${esc(row.size)}</th><td>${esc(row.chest)}</td><td>${esc(row.length)}</td></tr>`).join('')}</tbody></table></details>` : '';
  }
  function renderContact() {
    const digits = Store.settings.whatsapp;
    const ready = /^\d{10,15}$/.test(digits) && !/^9610+$/.test(digits);
    document.querySelectorAll('[data-wa]').forEach(a => {
      // the placeholder number is not real, so the link waits for the shop's own
      a.hidden = !ready;
      a.href = `https://wa.me/${digits}?text=${encodeURIComponent('Hello Saints Closet!')}`; a.target = '_blank'; a.rel = 'noopener';
    });
  }
  function renderShopInformation() {
    const shop = Store.settings;
    const block = (title, value) => value ? `<div><h3>${esc(title)}</h3><p>${esc(value).replace(/\n/g, '<br>')}</p></div>` : '';
    const html = (shop.demoMode ? '<p class="form-note">Test mode · orders are tests</p>' : '')
      + block('Contact', shop.contact)
      + block('Delivery', shop.zones.map(z => `${z.name}: ${Store.money(z.fee)}`).join('\n'))
      + (shop.pickup ? block('Pick up', shop.pickupDetails) : '')
      + block('Payment', shop.paymentMethod)
      + block('Returns', shop.returns)
      + block('Exchanges', shop.exchanges);
    $('#store-information').innerHTML = `<section class="shop-information section-pad" aria-label="Shop information">${html}</section>`;
  }

  function showMessage(c, text) {
    const msg = c.querySelector('.card-msg'); if (!msg) return;
    msg.textContent = text;
    clearTimeout(msg._t); msg._t = setTimeout(() => { msg.textContent = ''; }, 4000);
  }
  function flip(c) {
    const back = c.classList.toggle('show-back');
    const media = c.querySelector('.card-media'), img = media.querySelector('img');
    if (media.dataset.frontSrc && img) img.src = back ? media.dataset.backSrc : media.dataset.frontSrc;
    const f = c.querySelector('[data-flip]');
    // "back" here means the card shows its second photo; for cutouts the first photo is the back of the hoodie
    const first = Store.product(c.dataset.id)?.look.startsOnBack ? 'back' : 'front', second = first === 'back' ? 'front' : 'back';
    const next = back ? first : second;
    if (f) { f.setAttribute('aria-pressed', String(back)); f.querySelector('span').textContent = next[0].toUpperCase() + next.slice(1); f.setAttribute('aria-label', `Show the ${next} of ${Store.product(c.dataset.id)?.name || 'this piece'}`); }
  }

  document.addEventListener('click', e => {
    const c = e.target.closest('.card'); if (!c) return;
    const size = e.target.closest('.size');
    if (size) {
      if (size.disabled) return;
      c.querySelectorAll('.size').forEach(b => b.setAttribute('aria-checked', String(b === size)));
      showMessage(c, '');
      const variant = Store.variant(c.dataset.id, size.dataset.size);
      if (variant) c.querySelector('.price').innerHTML = priceHTML(Store.product(c.dataset.id), variant.price);
      return;
    }
    if (e.target.closest('[data-flip]') || (e.target.closest('.card-media') && (c.classList.contains('split') || c.querySelector('[data-flip]')) && !fine.matches)) { flip(c); return; }
    const add = e.target.closest('[data-add]');
    if (add && !add.disabled) {
      const picked = c.querySelector('.size[aria-checked="true"]');
      const sizes = c.querySelector('.sizes');
      if (!picked) {
        sizes.classList.remove('nudge'); void sizes.offsetWidth; sizes.classList.add('nudge');
        setTimeout(() => sizes.classList.remove('nudge'), 2000);
        showMessage(c, 'Pick a size first.');
        sizes.querySelector('.size:not([disabled])')?.focus({ preventScroll: true });
        return;
      }
      const problem = window.Closet.add(c.dataset.id, picked.dataset.size, c.querySelector('.card-media'));
      if (problem) { showMessage(c, problem); return; }
      showMessage(c, '');
      const label = add.querySelector('span'), was = label.textContent;
      add.classList.add('done'); label.textContent = 'Hung in your closet';
      clearTimeout(add._t); add._t = setTimeout(() => { add.classList.remove('done'); label.textContent = was; }, 1700);
    }
  });
  // arrow keys inside a size group skip sold-out sizes
  document.addEventListener('keydown', e => {
    const s = e.target.closest && e.target.closest('.size'); if (!s) return;
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const all = [...s.parentElement.querySelectorAll('.size:not([disabled])')], i = all.indexOf(s);
    if (!all.length) return;
    const nxt = all[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length];
    nxt.focus(); nxt.click();
  });

  /* tilt + sheen follows the pointer */
  if (fine.matches) {
    document.addEventListener('pointermove', e => {
      if (Store.reduceMotion()) return;
      const m = e.target.closest && e.target.closest('.card-media'); if (!m) return;
      const r = m.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      m.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
      m.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
      m.style.setProperty('--sx', (120 - x * 140).toFixed(1) + '%');
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      const m = e.target.closest && e.target.closest('.card-media');
      if (m && !m.contains(e.relatedTarget)) { m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg'); m.style.setProperty('--sx', '120%'); }
    });
  }

  /* ── Reveals ───────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  reveal(document.querySelectorAll('.reveal'));

  /* ── Nav state + manifesto parallax ────────────── */
  const art = $('.manifesto-art img'), artBox = $('.manifesto');
  let ticking = false;
  function onScroll() {
    ticking = false;
    document.body.classList.toggle('scrolled', window.scrollY > 40);
    if (art && !Store.reduceMotion()) {
      const r = artBox.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) art.style.setProperty('--par', ((r.top + r.height / 2 - innerHeight / 2) * -0.12).toFixed(1) + 'px');
    }
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ── Motion: a pause button beside the system setting ── */
  const motionBtn = $('#motion-toggle');
  function drawMotion() {
    const paused = document.documentElement.classList.contains('motion-off');
    motionBtn.setAttribute('aria-pressed', String(paused));
    motionBtn.textContent = paused ? 'Play motion' : 'Pause motion';
  }
  motionBtn.addEventListener('click', () => {
    Store.setMotionPaused(!document.documentElement.classList.contains('motion-off'));
    if (Store.reduceMotion()) document.querySelectorAll('.reveal,.card').forEach(el => el.classList.add('in'));
    drawMotion();
  });
  drawMotion();

  /* ── Drop 01 on phones: one swipe row ──────────────
     Up to 700px the grid is a sideways scroller (site.css). Here: the "1 / 13 · Swipe ›››" bar above it,
     the gold meter below it, the region labels, and a one-time nudge that shows the row moves. */
  const phone = matchMedia('(max-width: 700px)');
  const row = $('#grid-d01');
  const CHEV = '<svg viewBox="0 0 8 12" aria-hidden="true"><path d="M2 1.5 6.5 6 2 10.5"/></svg>';
  const bar = document.createElement('div'), meter = document.createElement('div');
  bar.className = 'swipe-bar'; bar.hidden = true; bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = `<span class="swipe-count"><b>1</b><span> / </span><span>0</span></span><span class="swipe-hint">Swipe<span class="swipe-chev">${CHEV}${CHEV}${CHEV}</span></span>`;
  meter.className = 'swipe-meter'; meter.hidden = true; meter.setAttribute('aria-hidden', 'true');
  meter.innerHTML = '<i></i>';
  row.before(bar); row.after(meter);
  const [countNow, , countAll] = bar.querySelector('.swipe-count').children;
  const rowCards = () => [...row.querySelectorAll(':scope > .card')];

  function drawRow() {
    if (!phone.matches || bar.hidden) return;
    const list = rowCards(), max = row.scrollWidth - row.clientWidth;
    const step = list.length > 1 ? list[1].offsetLeft - list[0].offsetLeft : 1;
    // the card snapped at the left; at the very end the last card counts, even though it cannot reach the left edge
    let index = max > 0 && row.scrollLeft >= max - 2 ? list.length - 1 : Math.round(row.scrollLeft / step);
    index = Math.min(Math.max(index, 0), list.length - 1);
    if (countNow.textContent !== String(index + 1)) countNow.textContent = index + 1;
    meter.firstChild.style.setProperty('--fill', row.scrollWidth ? Math.min(1, (row.scrollLeft + row.clientWidth) / row.scrollWidth).toFixed(4) : '1');
  }
  function swipeRow() {
    const n = rowCards().length, on = phone.matches && n > 0;
    bar.hidden = meter.hidden = !on;
    if (on) {
      row.setAttribute('role', 'region');
      row.setAttribute('aria-label', `Drop 01, ${n} ${n === 1 ? 'hoodie' : 'hoodies'}, scroll sideways`);
      row.tabIndex = 0;
      countAll.textContent = n;
      drawRow();
    } else {
      row.removeAttribute('role'); row.removeAttribute('aria-label'); row.removeAttribute('tabindex');
    }
  }

  let swiped = false, rowTicking = false;
  row.addEventListener('scroll', () => {
    if (!swiped && row.scrollLeft > 8) { swiped = true; bar.classList.add('is-swiped'); }
    if (!rowTicking) { rowTicking = true; requestAnimationFrame(() => { rowTicking = false; drawRow(); }); }
  }, { passive: true });
  let rowResize = 0;
  addEventListener('resize', () => { clearTimeout(rowResize); rowResize = setTimeout(drawRow, 120); });
  phone.addEventListener('change', () => { row.classList.remove('is-nudging'); swipeRow(); if (phone.matches) tryNudge(); });

  /* the nudge: once per visit, the first time the row is seen on a phone, after the cards have revealed */
  const NUDGE_KEY = 'saints:d01-nudged';
  let nudged = false, nudgeWait = 0, rowInView = false;
  const nudgeSeen = () => { try { return sessionStorage.getItem(NUDGE_KEY) === '1'; } catch { return false; } };
  function stopNudge() { clearTimeout(nudgeWait); nudgeWait = 0; row.classList.remove('is-nudging'); }
  function tryNudge() {
    if (nudged || nudgeWait || !rowInView || !phone.matches || Store.reduceMotion()) return;
    if (nudgeSeen() || swiped) { nudged = true; return; }
    const first = rowCards().slice(0, 2);
    if (first.length < 2) return;
    // wait until the first cards have .in, then let their reveal (.9s plus its small stagger) finish
    const revealed = first.every(c => c.classList.contains('in'));
    nudgeWait = setTimeout(() => {
      nudgeWait = 0;
      if (!revealed) { tryNudge(); return; }
      if (nudged || swiped || !rowInView || !phone.matches || Store.reduceMotion()) return;
      nudged = true;
      try { sessionStorage.setItem(NUDGE_KEY, '1'); } catch { /* private mode: once per page load */ }
      row.classList.add('is-nudging');
      first[0].addEventListener('animationend', () => row.classList.remove('is-nudging'), { once: true });
      setTimeout(() => row.classList.remove('is-nudging'), 1800);
    }, revealed ? 1100 : 250);
  }
  // a finger on the row means they have found it: no nudge, or stop the one that is playing
  row.addEventListener('pointerdown', () => { if (phone.matches) { nudged = true; stopNudge(); } }, { passive: true });
  document.addEventListener('saints:motion', () => { if (Store.reduceMotion()) stopNudge(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      rowInView = es[es.length - 1].isIntersecting;
      if (rowInView) tryNudge(); else if (nudgeWait) stopNudge();
    }, { threshold: 0.35 }).observe(row);
  }

  /* ── Boot ──────────────────────────────────────── */
  document.addEventListener('saints:catalogue', () => { renderGrids(); });
  Store.ready.then(() => { renderGrids(); renderSizeGuide(); renderContact(); renderShopInformation(); }, error => {
    const message = document.createElement('p');
    message.className = 'grid-empty'; message.setAttribute('role', 'alert');
    message.textContent = error instanceof Error ? error.message : 'The collection could not load.';
    $('#grid-d01').replaceChildren(message);
    $('#drop-02').hidden = true;
    swipeRow();
  });
})();
