/* ═══════════════════════════════════════════════════════════════
   HERO · "The Ascension"
   · a beam strikes the dark: flash, shake, shockwave, and a vortex of
     gold dust spirals in to build the Saints logo (sampled from the real logo)
   · every grain has depth: the logo turns in 3D with the cursor, and a halo
     of dust orbits it
   · the dust resurrects: the logo bursts and re-forms as the money cherub
     (sampled from the artwork), halo and all, then bursts back
   · move to stir · click to bless (shockwave)
   · HOLD to open a black hole that swallows the dust · release → supernova
   · scroll and the dust ascends and dissolves
   Performance: fewer, larger grains grouped by colour and brightness so
   the canvas state changes a few dozen times a frame, not once per grain;
   no full-canvas trail fade; the canvas at 1x on large screens; 30 frames
   a second once the form has settled and nobody is touching it; gentler
   bursts than the first concept; fast grains trail squares, not stroked
   lines, which stalled the GPU on every burst.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const hero = document.getElementById('hero');
  const cv = document.getElementById('hero-canvas');
  if (!hero || !cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const copy = hero.querySelector('.hero-copy');
  const sky = hero.querySelector('.hero-sky');
  const flashEl = hero.querySelector('.hero-flash');
  const spotEl = hero.querySelector('.spot');
  // Still when the visitor's system asks for less motion or the page's pause button is on (store.js).
  let reduce = Store.reduceMotion();

  // timeline (ms after the beam starts)
  const BURST = 650, GATHER = 760, HALO_AT = 1650, LIT_AT = 2100;
  const HOLD = [6500, 4600];            // how long each form holds: [logo, cherub]
  const PERSP = 900;                    // camera distance for the 3D projection

  const PAL = ['#6e5120', '#9a7530', '#c49a42', '#ddb75c', '#f0d48a', '#fff0c4'];
  const NB = PAL.length;
  const STEP_ALPHA = [0.22, 0.45, 0.7, 0.95];   // the brightness steps grains are grouped into
  const stepCount = new Uint32Array(4);
  // fast grains: a head and a fading tail of squares, as fractions of the tail length
  const TRAIL_AT = [0, 0.35, 0.75], TRAIL_SZ = [1.15, 0.85, 0.6], TRAIL_ALPHA = [0.95, 0.5, 0.2];
  let stepIdx = [], streakIdx = null;           // per-frame scratch, sized in build()

  let W = 0, H = 0, DPR = 1, mobile = false, topSafe = 110;
  let box = null;
  const F = [null, null];               // the two forms: 0 logo, 1 cherub
  let hasCherub = false;
  let N = 0, NH = 0, n = 0;
  let X, Y, VX, VY, TX, TY, DZ, DL, PH, SZ, R1, R2, AX, AY, AZ, BX, BY, BZ, CA, CB;
  let bucketsF = [[], []];
  let form = 0, formAt = 0;
  let start = 0, raf = 0, onScreen = true, lit = false, impacted = false;
  let scrollP = 0, energyUntil = 0, shakeAmp = 0;
  const mouse = { x: -1e4, y: -1e4, on: false, sx: 0, sy: 0 };
  const hole = { down: false, on: false, x: 0, y: 0, t0: 0, power: 0, id: null, timer: 0 };
  const glints = [];
  const dust = [];

  const logo = new Image(); logo.decoding = 'async'; logo.src = 'site/img/logo-gold.png';
  const cherub = new Image(); cherub.decoding = 'async'; cherub.src = 'site/img/cherub-cutout.png';
  const loaded = img => new Promise(res => { if (img.complete && img.naturalWidth) res(); else { img.onload = res; img.onerror = res; } });

  /* ── Sizing ─────────────────────────────────────────── */
  function measure() {
    const r = hero.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    // capped: full-screen canvases at 2× cost four times the pixels for grains a few pixels wide
    DPR = W * H > 1200000 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    mobile = W < 700;
    const css = getComputedStyle(document.documentElement);
    topSafe = (parseFloat(css.getPropertyValue('--announce')) || 32) + (parseFloat(css.getPropertyValue('--nav')) || 72) + 18;
    const aspect = (logo.naturalHeight || 316) / (logo.naturalWidth || 526);
    const Lw = mobile ? Math.min(W * 0.92, H * 0.62 / aspect) : Math.min(W * 0.62, H * 0.85, 980);
    const Lh = Lw * aspect;
    const cy = Math.max(H * (mobile ? 0.36 : 0.40), topSafe + Lh / 2);
    box = { x: W / 2 - Lw / 2, y: cy - Lh / 2, w: Lw, h: Lh };
    F[0] = { cx: W / 2, cy, w: Lw, h: Lh, ring: { x: Lw * 0.01, y: -Lh * 0.31, rx: Lw * 0.15, tilt: 0.24 } };
    // the cherub stands in the same space: from under the nav down to the bottom of the logo
    const chH = Math.max(160, (box.y + box.h - topSafe + 10) * 0.92);
    const chW = chH * ((cherub.naturalWidth || 854) / (cherub.naturalHeight || 948));
    F[1] = { cx: W / 2, cy: box.y + box.h + 4 - chH / 2, w: chW, h: chH, ring: { x: 0, y: -chH * 0.47, rx: chW * 0.16, tilt: 0.24 } };
    hero.style.setProperty('--lb', Math.round(box.y + box.h + (mobile ? 6 : 12)) + 'px');
  }

  /* ── Sampling images into points (relative to the form's centre) ── */
  function pixels(img, w, h, fallbackText) {
    const oc = document.createElement('canvas'); oc.width = w; oc.height = h;
    const o = oc.getContext('2d', { willReadFrequently: true });
    if (img && img.complete && img.naturalWidth) {
      o.drawImage(img, 0, 0, w, h);
      try { return o.getImageData(0, 0, w, h).data; } catch (e) { /* file:// taints the canvas */ }
    }
    if (!fallbackText) return null;
    o.clearRect(0, 0, w, h);
    const g = o.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#8a6a2c'); g.addColorStop(.45, '#f6e2a6'); g.addColorStop(1, '#a8812f');
    o.fillStyle = g; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.font = `${Math.round(h * 0.78)}px "UnifrakturMaguntia", "Old English Text MT", serif`;
    o.fillText('Saints', w / 2, h * 0.55);
    return o.getImageData(0, 0, w, h).data;
  }
  // weighted: keep each pixel with a probability based on its brightness (gives engraved shading)
  function sample(data, w, h, target, alphaMin, weighted) {
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > alphaMin) count++;
    const step = weighted ? Math.max(1, Math.sqrt(count / (target * 3.2))) : Math.max(1.4, Math.sqrt(count / target));
    const pts = [];
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      const xi = Math.min(w - 1, Math.max(0, Math.round(x + (Math.random() - .5) * step * .7)));
      const yi = Math.min(h - 1, Math.max(0, Math.round(y + (Math.random() - .5) * step * .7)));
      const k = (yi * w + xi) * 4;
      if (data[k + 3] > alphaMin && (!weighted || Math.random() < 0.06 + 0.94 * Math.pow((data[k] + data[k + 1] + data[k + 2]) / 765, 2.4))) pts.push({ x: xi - w / 2, y: yi - h / 2, lum: data[k] * .45 + data[k + 1] * .4 + data[k + 2] * .15 });
    }
    return { pts, step };
  }
  function fit(pts, count) { // shuffle, then trim or pad so both forms have the same number of grains
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    if (pts.length >= count) return pts.slice(0, count);
    const out = pts.slice();
    while (out.length < count) { const p = pts[(Math.random() * pts.length) | 0]; out.push({ x: p.x + (Math.random() - .5) * 2, y: p.y + (Math.random() - .5) * 2, lum: p.lum }); }
    return out;
  }

  /* ── Build particle arrays ─────────────────────────── */
  function build(intro) {
    const lw = Math.max(1, Math.round(F[0].w)), lh = Math.max(1, Math.round(F[0].h));
    const target = mobile ? 1300 : (W > 1700 ? 3400 : 2900);
    const A = sample(pixels(logo, lw, lh, true), lw, lh, target, 120);
    N = A.pts.length;
    const cw = Math.max(1, Math.round(F[1].w)), ch = Math.max(1, Math.round(F[1].h));
    const cdata = pixels(cherub, cw, ch, false);
    hasCherub = !!cdata;
    const B = hasCherub ? fit(sample(cdata, cw, ch, N, 140, true).pts, N) : null;
    NH = mobile ? 150 : 280;
    n = N + NH;
    const f32 = () => new Float32Array(n);
    stepIdx = [0, 1, 2, 3].map(() => new Uint32Array(n)); streakIdx = new Uint32Array(n);
    X = f32(); Y = f32(); VX = f32(); VY = f32(); TX = f32(); TY = f32(); DZ = f32(); DL = f32(); PH = f32(); SZ = f32(); R1 = f32(); R2 = f32();
    AX = f32(); AY = f32(); AZ = f32(); BX = f32(); BY = f32(); BZ = f32(); CA = new Uint8Array(n); CB = new Uint8Array(n);
    const c0 = F[0];
    for (let i = 0; i < n; i++) {
      R1[i] = Math.random(); R2[i] = Math.random(); PH[i] = Math.random() * Math.PI * 2;
      if (i < N) {
        const a = A.pts[i];
        AX[i] = a.x; AY[i] = a.y; AZ[i] = (Math.random() - .5) * 38;
        CA[i] = Math.min(NB - 1, Math.max(0, Math.floor((a.lum - 70) / 185 * NB)));
        if (B) {
          const b = B[i];
          BX[i] = b.x; BY[i] = b.y; BZ[i] = (b.lum / 255 - .5) * 60;   // brightness becomes relief: a 3D marble cherub
          CB[i] = Math.min(NB - 1, Math.max(0, Math.floor((b.lum - 90) / 150 * NB)));
        } else { BX[i] = AX[i]; BY[i] = AY[i]; BZ[i] = AZ[i]; CB[i] = CA[i]; }
        SZ[i] = A.step * (0.55 + Math.random() * 0.35);
        DL[i] = GATHER + ((AX[i] + c0.w / 2) / c0.w) * 700 + Math.random() * 420;
      } else {
        CA[i] = CB[i] = 4 + (Math.random() < .5 ? 1 : 0);
        SZ[i] = (mobile ? 1.3 : 1.6) + Math.random() * 1.2;
        DL[i] = HALO_AT + ((i - N) / NH) * 600;
      }
      if (intro) { // a vortex: out from the impact, spinning
        const a = Math.random() * Math.PI * 2, sp = 4 + Math.pow(Math.random(), 1.5) * 30, spin = 10 + Math.random() * 12;
        X[i] = c0.cx + (Math.random() - .5) * 10; Y[i] = box.y + box.h * .5 + (Math.random() - .5) * 10;
        VX[i] = Math.cos(a) * sp - Math.sin(a) * spin; VY[i] = (Math.sin(a) * sp + Math.cos(a) * spin) * 0.8 - 2;
      } else DL[i] = 0;
    }
    bucketsF = [CA, CB].map(C => {
      const b = Array.from({ length: NB }, () => []);
      for (let i = 0; i < n; i++) b[C[i]].push(i);
      return b.map(l => Uint32Array.from(l));
    });
    if (!intro) { form = 0; project(0); for (let i = 0; i < n; i++) { X[i] = TX[i]; Y[i] = TY[i]; } }
    dust.length = 0;
    const nd = mobile ? 50 : 130;
    for (let i = 0; i < nd; i++) dust.push({ x: Math.random() * W, y: Math.random() * H, s: .6 + Math.random() * 1.6, v: .15 + Math.random() * .5, p: Math.random() * 6.28 });
  }

  /* ── 3D: rotate every target with the view, then project ── */
  function project(t) {
    const f = F[form], ring = f.ring;
    const ry = mouse.sx * 0.6 + Math.sin(t * 0.00042) * 0.14;
    const rx = -mouse.sy * 0.45 + Math.sin(t * 0.00031) * 0.06;
    const cY = Math.cos(ry), sY = Math.sin(ry), cX = Math.cos(rx), sX = Math.sin(rx);
    const PX = form ? BX : AX, PY = form ? BY : AY, PZ = form ? BZ : AZ;
    const spin = t * 0.0011;
    for (let i = 0; i < n; i++) {
      let dx, dy, dz;
      if (i < N) { dx = PX[i]; dy = PY[i]; dz = PZ[i]; }
      else {
        const a = PH[i] + spin, w = 1 + Math.sin(PH[i] * 7 + t * 0.002) * 0.04;
        dx = ring.x + Math.cos(a) * ring.rx * w; dz = Math.sin(a) * ring.rx * w; dy = ring.y + dz * ring.tilt;
      }
      const x1 = dx * cY + dz * sY, z1 = -dx * sY + dz * cY;
      const y1 = dy * cX - z1 * sX, z2 = dy * sX + z1 * cX;
      const p = PERSP / (PERSP - z2);
      TX[i] = f.cx + x1 * p; TY[i] = f.cy + y1 * p; DZ[i] = z2;
    }
  }

  /* ── Effects ───────────────────────────────────────── */
  function flash(power, x, y) {
    if (!flashEl || reduce) return;
    flashEl.style.setProperty('--fx', (x != null ? x : W / 2) + 'px');
    flashEl.style.setProperty('--fy', (y != null ? y : H * .45) + 'px');
    flashEl.animate([{ opacity: Math.min(1, power) }, { opacity: 0 }], { duration: 500 + power * 600, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }
  function shake(a) { shakeAmp = Math.max(shakeAmp, a); }
  function ring(x, y, big) {
    const r = cv.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'shock' + (big ? ' shock--big' : '');
    el.style.left = (r.left + x) + 'px'; el.style.top = (r.top + y) + 'px';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1300);
  }
  function energize(ms) { energyUntil = Math.max(energyUntil, performance.now() + ms); }
  function burstGlints(k) { for (let g = 0; g < k; g++) glints.push({ i: (Math.random() * n) | 0, life: 1, len: 10 + Math.random() * 16 }); }

  function morph() {
    const now = performance.now(), t = now - start;
    const f = F[form];
    form = 1 - form; formAt = now;
    hero.classList.toggle('is-cherub', form === 1);
    for (let i = 0; i < n; i++) { // detonate from the centre, with spin, then re-form in a ragged wave
      const dx = X[i] - f.cx, dy = Y[i] - f.cy, d = Math.sqrt(dx * dx + dy * dy) + 1;
      const s = 4 + R1[i] * 8, sw = 4 + R2[i] * 5;   // a dissolve with a swirl rather than a detonation
      VX[i] += dx / d * s - dy / d * sw; VY[i] += dy / d * s + dx / d * sw;
      DL[i] = t + 160 + R2[i] * 650 + (i >= N ? 500 : 0);
    }
    energize(1100); flash(.2); ring(f.cx, f.cy, false); burstGlints(10);
  }

  function supernova() {
    const p = hole.power;
    hole.on = false; hole.power = 0;
    hero.classList.remove('is-hole');
    const R = Math.max(W, H);
    for (let i = 0; i < n; i++) {
      const dx = X[i] - hole.x, dy = Y[i] - hole.y, d = Math.sqrt(dx * dx + dy * dy) + .5;
      const f = (10 + p * 26) * (0.55 + R1[i] * 0.9) * (1 / (1 + d / (R * 0.35)));
      VX[i] += dx / d * f; VY[i] += dy / d * f;
      DL[i] = (performance.now() - start) + 120 + R2[i] * 500;
    }
    energize(1300); flash(.3 + p * .35, hole.x, hole.y); shake(3 + p * 6); ring(hole.x, hole.y, true); burstGlints(16);
    formAt = performance.now();   // give the form a full beat before it morphs again
  }

  function bless(x, y) {
    const R = mobile ? 220 : 360;
    for (let i = 0; i < n; i++) {
      const dx = X[i] - x, dy = Y[i] - y, d = Math.sqrt(dx * dx + dy * dy) + .01;
      if (d < R) { const f = (1 - d / R) * 22; VX[i] += dx / d * f; VY[i] += dy / d * f - f * 0.25; }
    }
    ring(x, y, false); burstGlints(8); energize(600);
  }

  /* ── The loop ──────────────────────────────────────── */
  let last = 0, lastPx = '', lastPy = '';
  const cherubs = hero.querySelectorAll('.hero-cherub');
  let lastDrawn = 0, lastPointer = 0;
  function frame(now) {
    raf = 0;
    if (!onScreen || document.hidden) return;
    // Settled (formed, nobody stirring, nothing exploding): 30 frames a second is plenty for a slow twinkle.
    const settled = lit && !hole.on && !hole.down && now > energyUntil && now - lastPointer > 900 && now - formAt > 2600 && scrollP === 0;
    if (settled && now - lastDrawn < 30) { raf = requestAnimationFrame(frame); return; }
    lastDrawn = now;
    const t = now - start;
    const dt = Math.min(2.2, (now - (last || now)) / 16.667 || 1); last = now;

    if (!impacted && t >= BURST) {
      impacted = true;
      flash(.6, F[0].cx, box.y + box.h * .5); shake(5); ring(F[0].cx, box.y + box.h * .5, true); energize(1100);
    }
    if (!lit && t > LIT_AT) light();
    if (lit && hasCherub && !hole.on && !hole.down && scrollP < 0.2 && now - formAt > HOLD[form]) morph();

    mouse.sx += ((mouse.on ? (mouse.x / W - .5) : 0) - mouse.sx) * 0.06 * dt;
    mouse.sy += ((mouse.on ? (mouse.y / H - .5) : 0) - mouse.sy) * 0.06 * dt;
    const px = (mouse.sx * -36).toFixed(1), py = (mouse.sy * -24).toFixed(1);
    if (px !== lastPx || py !== lastPy) { // only the cherubs read these: no restyle of the whole hero every frame
      lastPx = px; lastPy = py;
      for (const el of cherubs) { el.style.setProperty('--px', px + 'px'); el.style.setProperty('--py', py + 'px'); }
    }

    // screen shake
    if (shakeAmp > 0.2) {
      const sx = (Math.random() - .5) * shakeAmp, sy = (Math.random() - .5) * shakeAmp;
      cv.style.transform = sky.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
      shakeAmp *= Math.pow(0.86, dt);
    } else if (shakeAmp) { shakeAmp = 0; cv.style.transform = sky.style.transform = ''; }

    if (hole.on) hole.power = Math.min(1, (now - hole.t0) / 1600);

    project(t);
    const hp = hole.power;
    const k = 0.055 * dt * (hole.on ? (1 - hp * 0.97) : 1), damp = Math.pow(hole.on ? 0.9 : 0.835, dt);
    const R = mobile ? 70 : 120, RR = R * R;
    const asc = scrollP;
    if (t >= BURST) {
      for (let i = 0; i < n; i++) {
        if (t < DL[i]) { // flying free
          X[i] += VX[i] * dt; Y[i] += VY[i] * dt;
          const fr = Math.pow(0.935, dt); VX[i] *= fr; VY[i] *= fr; VY[i] += 0.015 * dt;
          if (!hole.on) continue;
        }
        let gx = TX[i], gy = TY[i];
        if (asc > 0) {
          gy -= asc * (H * 0.35 + R1[i] * H * 1.0);
          gx += (R2[i] - .5) * asc * W * 0.7 + Math.sin(PH[i] + t * 0.001) * asc * 30;
        }
        VX[i] += (gx - X[i]) * k; VY[i] += (gy - Y[i]) * k;
        if (hole.on) { // gravity well with a swirl: an accretion disk forms
          const dx = hole.x - X[i], dy = hole.y - Y[i], d = Math.sqrt(dx * dx + dy * dy) + 1;
          const g = hp * (2.4 + R1[i] * 1.2) * dt * (1 / (1 + d / 260));
          VX[i] += dx / d * g - dy / d * g * 1.15;
          VY[i] += dy / d * g + dx / d * g * 1.15;
        } else if (mouse.on) {
          const dx = X[i] - mouse.x, dy = Y[i] - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < RR) {
            const d = Math.sqrt(d2) + .01, f = (1 - d / R) * 5.2 * dt;
            VX[i] += (dx / d) * f - (dy / d) * f * 0.55;
            VY[i] += (dy / d) * f + (dx / d) * f * 0.55;
          }
        }
        VX[i] *= damp; VY[i] *= damp;
        if (t >= DL[i]) { X[i] += VX[i] * dt; Y[i] += VY[i] * dt; }
      }
    }
    draw(t, now);
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  function draw(t, now) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const energetic = !reduce && (now || 0) < energyUntil;
    // A plain clear: fast grains draw as streaks, which carry the motion the old full-canvas trail fade gave.
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const fade = Math.max(0, 1 - scrollP * 1.15);

    ctx.fillStyle = '#e8c97a';
    for (const d of dust) {
      if (!reduce) { d.y -= d.v; d.x += Math.sin(t * 0.0006 + d.p) * 0.2; if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W; } }
      ctx.globalAlpha = (0.12 + 0.18 * Math.sin(t * 0.002 + d.p) ** 2) * (0.6 + fade * 0.4);
      ctx.fillRect(d.x, d.y, d.s, d.s);
    }
    if (t < BURST || fade <= 0 || !n) { ctx.globalAlpha = 1; return; }

    // Grouped: each colour's grains are sorted into four brightness steps, then drawn with plain fillRect, so the
    // canvas state changes a few dozen times a frame instead of once per grain.
    const tw = t * 0.0032, buckets = bucketsF[form], tail = energetic ? 2.6 : 1.8;
    for (let b = 0; b < NB; b++) {
      const list = buckets[b]; if (!list || !list.length) continue;
      const counts = stepCount; counts.fill(0);
      let streakCount = 0;
      for (let j = 0; j < list.length; j++) {
        const i = list[j];
        const vx = VX[i], vy = VY[i];
        if (vx * vx + vy * vy > 10 && !reduce) { streakIdx[streakCount++] = i; continue; } // fast grains draw as streaks
        let a = 0.62 + 0.38 * Math.sin(tw * (0.6 + R1[i]) + PH[i]);
        if (i >= N) { a *= DZ[i] > 0 ? 1 : 0.32; if (t < DL[i]) a *= 0.4; }
        else {
          a *= 0.78 + Math.max(-0.3, Math.min(0.22, DZ[i] / 160));   // nearer grains glow brighter
          if (t < DL[i]) a *= 0.8;
        }
        const step = a < 0.3 ? 0 : a < 0.55 ? 1 : a < 0.8 ? 2 : 3;
        stepIdx[step][counts[step]++] = i;
      }
      ctx.fillStyle = PAL[b];
      for (let k = 0; k < 4; k++) {
        const c = counts[k]; if (!c) continue;
        ctx.globalAlpha = STEP_ALPHA[k] * fade;
        const idx = stepIdx[k];
        for (let j = 0; j < c; j++) {
          const i = idx[j], s = SZ[i] * (1 + Math.max(-.25, Math.min(.35, DZ[i] / 240)));
          ctx.fillRect(X[i] - s / 2, Y[i] - s / 2, s, s);
        }
      }
      if (streakCount) { // a comet tail of small squares: stroked lines here stalled the GPU for a second on every burst
        const hs = mobile ? 1.3 : 1.7;
        for (let m = 0; m < TRAIL_AT.length; m++) {
          const back = TRAIL_AT[m] * tail, s = hs * TRAIL_SZ[m], h = s / 2;
          ctx.globalAlpha = TRAIL_ALPHA[m] * fade;
          for (let j = 0; j < streakCount; j++) { const i = streakIdx[j]; ctx.fillRect(X[i] - VX[i] * back - h, Y[i] - VY[i] * back - h, s, s); }
        }
      }
    }

    // the black hole
    if (hole.on) {
      const p = hole.power, r = 6 + p * 22, x = hole.x, y = hole.y;
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, r * .6, x, y, r * 4.2);
      g.addColorStop(0, 'rgba(255,230,170,.75)'); g.addColorStop(.25, 'rgba(255,190,90,.28)'); g.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.globalAlpha = 0.5 + p * 0.5; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff3cf'; ctx.lineWidth = 1.5 + p * 1.5;
      ctx.shadowColor = '#ffcf70'; ctx.shadowBlur = 18 + p * 24;
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.08, r * 1.08, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // glints
    if (!reduce && t > GATHER + 900 && glints.length < (mobile ? 5 : 12) && Math.random() < 0.4) {
      glints.push({ i: (Math.random() * n) | 0, life: 1, len: 6 + Math.random() * 12 });
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#fff6dc';
    for (let g = glints.length - 1; g >= 0; g--) {
      const gl = glints[g]; gl.life -= 0.035;
      if (gl.life <= 0) { glints.splice(g, 1); continue; }
      const kk = Math.sin(gl.life * Math.PI), L = gl.len * kk, x = X[gl.i], y = Y[gl.i];
      ctx.globalAlpha = kk * fade;
      ctx.fillRect(x - L, y - 0.5, L * 2, 1);
      ctx.fillRect(x - 0.5, y - L, 1, L * 2);
      ctx.globalAlpha = kk * 0.5 * fade;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function kick() { if (!raf && onScreen && !reduce && n) { last = 0; raf = requestAnimationFrame(frame); } }

  function light() {
    lit = true; formAt = performance.now();
    hero.classList.add('is-lit');
    document.body.classList.add('intro-done');
  }

  /* ── Interaction ───────────────────────────────────── */
  function local(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  hero.addEventListener('pointermove', e => {
    const p = local(e); mouse.x = p.x; mouse.y = p.y; mouse.on = true; lastPointer = performance.now();
    if (hole.down) { hole.x = p.x; hole.y = p.y; }
    if (spotEl) { spotEl.style.setProperty('--mx', p.x + 'px'); spotEl.style.setProperty('--my', p.y + 'px'); }
    kick();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { mouse.on = false; if (hole.on) supernova(); endHold(); });
  hero.addEventListener('pointerdown', e => {
    if (e.target.closest('a,button') || reduce || !n || e.button > 0) return;
    const p = local(e);
    hole.down = true; hole.id = e.pointerId; hole.x = p.x; hole.y = p.y;
    clearTimeout(hole.timer);
    hole.timer = setTimeout(() => { // held: open the black hole
      if (!hole.down) return;
      hole.on = true; hole.t0 = performance.now(); hole.power = 0;
      hero.classList.add('is-hole');
      kick();
    }, 200);
  });
  function endHold() { hole.down = false; clearTimeout(hole.timer); }
  hero.addEventListener('pointerup', e => {
    if (!hole.down) return;
    const p = local(e);
    if (hole.on) supernova(); else bless(p.x, p.y);
    endHold();
    if (e.pointerType !== 'mouse') mouse.on = false;
    kick();
  });
  hero.addEventListener('pointercancel', () => { // the page started scrolling under a finger
    if (hole.on) { hole.on = false; hole.power = 0; hero.classList.remove('is-hole'); }
    endHold(); mouse.on = false;
  });
  hero.addEventListener('contextmenu', e => { if (hole.down) e.preventDefault(); });

  function onScroll() {
    const h = hero.offsetHeight || 1;
    scrollP = Math.min(1, Math.max(0, window.scrollY / (h * 0.85)));
    if (copy) { copy.style.opacity = String(Math.max(0, 1 - scrollP * 1.7)); copy.style.translate = `0 ${(-scrollP * 80).toFixed(1)}px`; }
    if (!n) return;
    if (reduce) draw(LIT_AT + 5000, 0); else kick();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) kick(); }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  let rt = 0, lastW = 0, lastH = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const r = hero.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 120) return; // ignore mobile URL-bar jiggle
      lastW = r.width; lastH = r.height;
      measure(); build(false); hero.classList.remove('is-cherub'); if (!lit) light();
      formAt = performance.now();
      if (reduce) draw(LIT_AT + 5000, 0); else kick();
    }, 180);
  });

  /* ── Go ───────────────────────────────────────────── */
  let begun = false;
  function begin() {
    if (begun) return; begun = true;
    measure(); lastW = W; lastH = H;
    if (reduce) { build(false); light(); hero.classList.add('go'); draw(LIT_AT + 5000, 0); return; }
    build(true);
    hero.classList.add('go');
    start = performance.now();
    kick();
  }
  // Pausing freezes the dust into the finished logo; playing picks the animation up again.
  document.addEventListener('saints:motion', e => {
    reduce = e.detail.paused;
    if (!begun) return;
    if (reduce) {
      cancelAnimationFrame(raf); raf = 0;
      hole.on = false; hole.power = 0; endHold();
      hero.classList.remove('is-hole', 'is-cherub');
      measure(); build(false); form = 0; impacted = true; if (!lit) light(); hero.classList.add('go');
      draw(LIT_AT + 5000, 0);
    } else { formAt = performance.now(); kick(); }
  });

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all([loaded(logo), loaded(cherub), fontsReady]).then(begin);
  setTimeout(begin, 2800); // never leave the hero dark
})();
