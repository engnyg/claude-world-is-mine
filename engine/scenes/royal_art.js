/* scenes/royal_art.js — procedural prop art for ワールドイズマイン (no image files).
 *
 * Every prop is a vector drawing rendered ONCE into an offscreen canvas and cached, then used like any image:
 *   'prop:<kind>'  or  'prop:<kind>:<variant>'      e.g. 'prop:queen:pink', 'prop:knight:white', 'prop:cake'
 * The asset loader is extended so Z.preload / Z.imgSync / illust chars accept these keys; D.sprite anchors them at the
 * bottom centre (the piece's foot), so `{ img: 'prop:queen:pink', x, y, h }` stands the piece on (x, y).
 * Style: flat paper cut-outs, ink outline, one cel shade on the right, one highlight on the left.
 * Kinds: pawn rook knight bishop queen king (variants pink cream navy white mint gold lilac), crown, tiara, heart,
 *        cake, pudding, shoe, glove, candy, macaron, lollipop, strawberry, bow, cloche, bubble, star, hanko, horse.
 * Exposes Z.royal.{PAL, art(kind, variant), lathe, heartPath, crownPath, starPath, roundRect}.
 */
(() => {
  'use strict';
  const Z = window.Z;
  const PAL = {
    ink: '#2B1A3F', ink2: '#4A2F63', cream: '#FFF6EA', paper: '#FFF1DF', pink: '#FF7EB0', hot: '#FF2E7E', rose: '#FFB8D2',
    red: '#E8173F', mint: '#6FE3CF', teal: '#1FA99A', gold: '#FFC83D', goldD: '#E39A12', lilac: '#B9A6FF', sky: '#9FD8FF',
    night: '#140F33', night2: '#231B55', yellow: '#FFD400', white: '#FFFFFF', caramel: '#B5651D', custard: '#FFD978',
  };
  const VARIANTS = {
    pink: { fill: '#FF86B6', shade: '#E4528F', hi: '#FFD6E8', line: PAL.ink },
    cream: { fill: '#FFF4E4', shade: '#E9CFB4', hi: '#FFFFFF', line: PAL.ink },
    navy: { fill: '#3D4384', shade: '#272B5C', hi: '#7880CC', line: '#15122E' },
    white: { fill: '#FFFFFF', shade: '#D9D8F0', hi: '#FFFFFF', line: PAL.ink },
    mint: { fill: '#86E8D6', shade: '#3FBFAA', hi: '#DAFFF7', line: '#16383A' },
    gold: { fill: '#FFD24A', shade: '#E3A21E', hi: '#FFF3B5', line: '#6B3E00' },
    lilac: { fill: '#C3B2FF', shade: '#8F79E6', hi: '#EEE8FF', line: PAL.ink },
    ink: { fill: '#2B1A3F', shade: '#1A0F28', hi: '#4A2F63', line: '#120A1C' },
  };

  // ------------------------------------------------------------------ path helpers
  const roundRect = (x, y, w, h, r, c) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  // lathe profile: right-hand outline points [x, y] (unit: height 1, y up = negative) from the foot centre to the top centre;
  // smooth: quadratic curves through the midpoints; the left half is the mirror image
  const lathe = (c, prof, s, cx = 0, cy = 0) => {
    const P = prof.map(([x, y, f]) => [cx + x * s, cy + y * s, f]);
    const M = P.slice().reverse().map(([x, y, f]) => [2 * cx - x, y, f]);
    const all = P.concat(M.slice(1));
    c.beginPath(); c.moveTo(all[0][0], all[0][1]);
    for (let i = 1; i < all.length - 1; i++) {
      const [x0, y0, f] = all[i], [x1, y1] = all[i + 1];
      if (f === 'c') c.lineTo(x0, y0); else c.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    c.lineTo(all[all.length - 1][0], all[all.length - 1][1]); c.closePath();
  };
  const heartPath = (c, x, y, s) => {            // centre (x, y), width ≈ 2s
    c.beginPath(); c.moveTo(x, y + s * 0.95);
    c.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 1.05, y - s * 0.95, x, y - s * 0.38);
    c.bezierCurveTo(x + s * 1.05, y - s * 0.95, x + s * 1.25, y + s * 0.1, x, y + s * 0.95); c.closePath();
  };
  const starPath = (c, x, y, r, n = 4, inner = 0.32, rot = 0) => {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = rot - Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? r * inner : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath();
  };
  // crown: band from (x - w/2, y) to (x + w/2, y - bh), n points rising to y - h
  const crownPath = (c, x, y, w, h, n = 5) => {
    const bh = h * 0.32, x0 = x - w / 2;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + w, y); c.lineTo(x0 + w, y - bh);
    for (let i = n; i >= 0; i--) {
      const px = x0 + (w * i) / n;
      if (i < n) { const vx = x0 + (w * (i + 0.5)) / n; c.lineTo(vx, y - bh - h * 0.12); }
      c.lineTo(px, y - h);
    }
    c.lineTo(x0, y - bh); c.closePath();
  };

  // ink outline + flat fill + right-side cel shade + left highlight, for any path builder fn(c)
  const paint = (c, build, v, o = {}) => {
    const lw = o.lw ?? 6;
    build(c); c.fillStyle = v.fill; c.fill();
    c.save(); build(c); c.clip();
    if (o.shade !== false) { c.fillStyle = v.shade; c.beginPath(); const sx = o.shadeX ?? 0.12, W2 = c.canvas.width;
      c.moveTo(W2 * (0.5 + sx), 0); c.bezierCurveTo(W2 * (0.5 + sx + 0.06), c.canvas.height * 0.4, W2 * (0.5 + sx - 0.02), c.canvas.height * 0.7, W2 * (0.5 + sx + 0.04), c.canvas.height);
      c.lineTo(W2, c.canvas.height); c.lineTo(W2, 0); c.closePath(); c.fill(); }
    if (o.hi !== false) { c.fillStyle = Z.rgba(v.hi, 0.85); const hx = c.canvas.width * (o.hiX ?? 0.36);
      c.fillRect(hx - (o.hiW ?? 9) / 2, 0, o.hiW ?? 9, c.canvas.height); }
    c.restore();
    if (lw > 0) { build(c); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = lw; c.strokeStyle = v.line; c.stroke(); }
  };

  // ------------------------------------------------------------------ chess pieces (lathe profiles, unit height)
  const BASE = [[0, 0], [0.36, 0], [0.37, -0.05], [0.34, -0.09], [0.28, -0.11], [0.3, -0.15], [0.24, -0.17]];
  const PROF = {
    pawn: BASE.concat([[0.2, -0.24], [0.15, -0.36], [0.11, -0.47], [0.19, -0.5], [0.19, -0.54], [0.1, -0.56], [0.16, -0.6], [0.2, -0.7], [0.18, -0.8], [0.1, -0.87], [0, -0.89]]),
    bishop: BASE.concat([[0.2, -0.26], [0.15, -0.4], [0.12, -0.52], [0.2, -0.55], [0.2, -0.59], [0.11, -0.61], [0.17, -0.67], [0.2, -0.76], [0.15, -0.86], [0.07, -0.92], [0.06, -0.94], [0.09, -0.97], [0.05, -1.01], [0, -1.02]]),
    queen: BASE.concat([[0.2, -0.27], [0.14, -0.45], [0.12, -0.6], [0.22, -0.63], [0.22, -0.67], [0.13, -0.69], [0.18, -0.74], [0.26, -0.86], [0.26, -0.88], [0, -0.88]]),
    king: BASE.concat([[0.2, -0.27], [0.14, -0.45], [0.12, -0.6], [0.22, -0.63], [0.22, -0.67], [0.13, -0.69], [0.17, -0.74], [0.23, -0.84], [0.2, -0.88], [0, -0.88]]),
    rook: BASE.concat([[0.24, -0.22], [0.19, -0.3], [0.18, -0.6], [0.22, -0.63], [0.25, -0.66], [0.25, -0.86, 'c'], [0, -0.86]]),
  };
  const knightPath = (c, s, cx, cy) => {         // side view, facing left; unit height, foot centre at (cx, cy)
    const pts = [[-0.37, 0], [0.37, 0], [0.38, -0.05], [0.33, -0.1], [0.27, -0.12], [0.29, -0.17], [0.25, -0.2],
      [0.28, -0.32], [0.3, -0.5], [0.27, -0.66], [0.2, -0.8], [0.12, -0.9], [0.1, -0.98], [0.05, -1.03], [0.01, -0.95],
      [-0.06, -0.92], [-0.15, -0.88], [-0.24, -0.78], [-0.32, -0.66], [-0.37, -0.58], [-0.36, -0.52], [-0.3, -0.49],
      [-0.2, -0.52], [-0.1, -0.56], [-0.05, -0.53], [-0.1, -0.44], [-0.17, -0.34], [-0.22, -0.25], [-0.26, -0.2],
      [-0.29, -0.15], [-0.27, -0.12], [-0.33, -0.1], [-0.38, -0.05]];
    const P = pts.map(([x, y]) => [cx + x * s, cy + y * s]);
    c.beginPath(); c.moveTo(P[0][0], P[0][1]); c.lineTo(P[1][0], P[1][1]);
    for (let i = 1; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    c.closePath();
  };

  function drawPiece(type, v) {
    const Hh = 760, s = 680, Wc = 600, c = Z.canvas(Wc, Hh).getContext('2d'), cx = Wc / 2, cy = Hh - 24;
    const L = (k) => k;  // eslint helper
    if (type === 'knight') {
      paint(c, x => knightPath(x, s, cx, cy), v, { shadeX: 0.1, hiX: 0.42 });
      // mane ridge + eye + nostril
      c.strokeStyle = v.line; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx + 0.2 * s, cy - 0.78 * s); c.quadraticCurveTo(cx + 0.28 * s, cy - 0.55 * s, cx + 0.22 * s, cy - 0.3 * s); c.stroke();
      c.fillStyle = v.line; c.beginPath(); c.ellipse(cx - 0.1 * s, cy - 0.78 * s, 0.028 * s, 0.022 * s, -0.3, 0, Z.TAU); c.fill();
      c.beginPath(); c.arc(cx - 0.3 * s, cy - 0.6 * s, 0.014 * s, 0, Z.TAU); c.fill();
      c.lineWidth = 5; c.beginPath(); c.moveTo(cx - 0.33 * s, cy - 0.53 * s); c.quadraticCurveTo(cx - 0.27 * s, cy - 0.51 * s, cx - 0.22 * s, cy - 0.53 * s); c.stroke();
      return c.canvas;
    }
    const prof = PROF[type];
    paint(c, x => lathe(x, prof, s, cx, cy), v);
    // collar lines
    c.strokeStyle = v.line; c.lineWidth = 5;
    const ring = (y, hw) => { c.beginPath(); c.moveTo(cx - hw * s, cy + y * s); c.lineTo(cx + hw * s, cy + y * s); c.stroke(); };
    ring(-0.11, 0.28); ring(-0.17, 0.24);
    if (type === 'queen' || type === 'king') { ring(-0.63, 0.21); ring(-0.67, 0.21); }
    if (type === 'pawn') { ring(-0.5, 0.18); ring(-0.54, 0.18); }
    if (type === 'bishop') { ring(-0.55, 0.19); ring(-0.59, 0.19);
      c.lineWidth = 7; c.beginPath(); c.moveTo(cx + 0.02 * s, cy - 0.86 * s); c.lineTo(cx + 0.14 * s, cy - 0.74 * s); c.stroke(); }
    if (type === 'rook') { ring(-0.63, 0.22);
      c.fillStyle = v.line; for (const dx of [-0.13, 0.13]) c.fillRect(cx + dx * s - 0.035 * s, cy - 0.86 * s - 1, 0.07 * s, 0.075 * s); }
    if (type === 'queen') {             // coronet: a zigzag of 5 points with balls
      const y0 = cy - 0.86 * s;
      const build = x => crownPath(x, cx, y0 + 6, 0.52 * s, 0.2 * s, 5);
      paint(c, build, VARIANTS.gold, { lw: 5, shade: false, hi: false });
      for (let i = 0; i <= 5; i++) { const px = cx - 0.26 * s + (0.52 * s * i) / 5; c.beginPath(); c.arc(px, y0 - 0.2 * s + 6, 0.034 * s, 0, Z.TAU); c.fillStyle = i % 2 ? PAL.mint : PAL.hot; c.fill(); c.lineWidth = 4; c.strokeStyle = VARIANTS.gold.line; c.stroke(); }
    }
    if (type === 'king') {              // cross on a small dome
      const y0 = cy - 0.88 * s;
      paint(c, x => { x.beginPath(); x.ellipse(cx, y0, 0.14 * s, 0.07 * s, 0, Math.PI, 0); x.closePath(); }, v, { lw: 5, hi: false });
      paint(c, x => { const w = 0.055 * s, h = 0.2 * s; x.beginPath(); x.rect(cx - w / 2, y0 - 0.07 * s - h, w, h); x.rect(cx - 0.09 * s, y0 - 0.07 * s - h * 0.72, 0.18 * s, w); }, VARIANTS.gold, { lw: 5, shade: false, hi: false });
    }
    void L;
    return c.canvas;
  }

  // ------------------------------------------------------------------ props
  function drawCrown(w = 900, h = 560, small = false) {
    const c = Z.canvas(w, h).getContext('2d'), cx = w / 2, y = h - 30, cw = w * 0.86, ch = h * 0.8;
    paint(c, x => crownPath(x, cx, y, cw, ch, small ? 3 : 5), VARIANTS.gold, { lw: 9, shadeX: 0.16, hiX: 0.3, hiW: 16 });
    const n = small ? 3 : 5, bh = ch * 0.32;
    for (let i = 0; i <= n; i++) {     // balls on the tips
      const px = cx - cw / 2 + (cw * i) / n; c.beginPath(); c.arc(px, y - ch, w * 0.035, 0, Z.TAU); c.fillStyle = PAL.cream; c.fill(); c.lineWidth = 7; c.strokeStyle = VARIANTS.gold.line; c.stroke();
    }
    // band jewels: heart in the middle, round gems either side
    c.lineWidth = 6; c.strokeStyle = VARIANTS.gold.line;
    heartPath(c, cx, y - bh / 2, bh * 0.36); c.fillStyle = PAL.hot; c.fill(); c.stroke();
    for (const dx of [-0.3, 0.3]) { c.beginPath(); c.arc(cx + dx * cw, y - bh / 2, bh * 0.22, 0, Z.TAU); c.fillStyle = PAL.mint; c.fill(); c.stroke(); }
    c.beginPath(); c.moveTo(cx - cw / 2 + 6, y - bh); c.lineTo(cx + cw / 2 - 6, y - bh); c.stroke();
    return c.canvas;
  }
  function drawHeart(color = PAL.hot, line = PAL.ink) {
    const s = 600, c = Z.canvas(s, s).getContext('2d');
    const v = { fill: color, shade: Z.rgba('#000000', 0) , hi: '#FFFFFF', line };
    paint(c, x => heartPath(x, s / 2, s * 0.5, s * 0.4), v, { lw: 12, shade: false, hi: false });
    c.save(); heartPath(c, s / 2, s * 0.5, s * 0.4); c.clip();
    c.fillStyle = 'rgba(0,0,0,0.16)'; c.beginPath(); c.arc(s * 0.72, s * 0.72, s * 0.42, 0, Z.TAU); c.fill(); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(s * 0.33, s * 0.33, s * 0.07, s * 0.035, -0.7, 0, Z.TAU); c.fill();
    return c.canvas;
  }
  function drawCake() {   // strawberry shortcake slice, 3/4 view: cut face left, top face going back right
    const w = 1000, h = 820, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink;
    const fx0 = 120, fx1 = 560, fy0 = 360, fy1 = 760, bx = 900, by = 250;  // front face rect + back tip
    c.lineJoin = 'round'; c.lineWidth = 9; c.strokeStyle = ln;
    // side face (frosting) to the back tip
    c.beginPath(); c.moveTo(fx1, fy0); c.lineTo(bx, by); c.lineTo(bx, by + 330); c.lineTo(fx1, fy1); c.closePath(); c.fillStyle = '#FFF8EE'; c.fill(); c.stroke();
    c.save(); c.clip(); c.fillStyle = '#EADFD0'; c.fillRect(fx1, 0, 400, h); c.restore();
    c.beginPath(); c.moveTo(fx1, fy0); c.lineTo(bx, by); c.lineTo(bx, by + 330); c.lineTo(fx1, fy1); c.closePath(); c.stroke();
    // top face
    c.beginPath(); c.moveTo(fx0, fy0); c.lineTo(fx1, fy0); c.lineTo(bx, by); c.lineTo(fx0 + 260, by - 10); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill(); c.stroke();
    // cut face with layers
    c.save(); c.beginPath(); c.rect(fx0, fy0, fx1 - fx0, fy1 - fy0); c.clip();
    const layers = [['#FFFDF8', 0, 0.14], ['#FFD98A', 0.14, 0.42], ['#FFFDF8', 0.42, 0.52], ['#FFD98A', 0.52, 0.86], ['#FFFDF8', 0.86, 1]];
    for (const [col, a, b] of layers) { c.fillStyle = col; c.fillRect(fx0, fy0 + a * (fy1 - fy0), fx1 - fx0, (b - a) * (fy1 - fy0) + 1); }
    // strawberry slices in the cream layer
    for (let i = 0; i < 5; i++) { const x = fx0 + 50 + i * 90, y = fy0 + 0.47 * (fy1 - fy0);
      c.beginPath(); c.ellipse(x, y, 36, 22, 0, 0, Z.TAU); c.fillStyle = PAL.red; c.fill(); c.beginPath(); c.ellipse(x, y, 16, 9, 0, 0, Z.TAU); c.fillStyle = '#FF9DB0'; c.fill(); }
    // sponge pores
    c.fillStyle = 'rgba(200,140,40,0.35)';
    for (let i = 0; i < 70; i++) { const x = fx0 + Z.rnd(i, 3) * (fx1 - fx0), y = fy0 + (Z.rnd(i, 4) < 0.5 ? 0.16 + Z.rnd(i, 5) * 0.24 : 0.55 + Z.rnd(i, 5) * 0.28) * (fy1 - fy0); c.beginPath(); c.arc(x, y, 3 + Z.rnd(i, 6) * 4, 0, Z.TAU); c.fill(); }
    c.restore();
    c.beginPath(); c.rect(fx0, fy0, fx1 - fx0, fy1 - fy0); c.stroke();
    // cream piping along the top edge (zigzag rosettes = the crown motif)
    for (let i = 0; i < 5; i++) { const x = fx0 + 40 + i * 92, y = fy0 - 6;
      c.beginPath(); c.moveTo(x - 38, y); c.quadraticCurveTo(x - 30, y - 50, x, y - 74); c.quadraticCurveTo(x + 30, y - 50, x + 38, y); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = 7; c.stroke();
      c.beginPath(); c.moveTo(x - 14, y - 10); c.quadraticCurveTo(x - 6, y - 40, x, y - 62); c.lineWidth = 4; c.stroke(); }
    // the strawberry on top
    const sx = 520, sy = 250;
    c.lineWidth = 9; c.beginPath(); c.moveTo(sx, sy + 120); c.bezierCurveTo(sx - 120, sy + 60, sx - 110, sy - 60, sx, sy - 52); c.bezierCurveTo(sx + 110, sy - 60, sx + 120, sy + 60, sx, sy + 120); c.closePath(); c.fillStyle = PAL.red; c.fill(); c.stroke();
    c.fillStyle = '#FFE38A'; for (let i = 0; i < 14; i++) { const a = Z.rnd(i, 9) * Z.TAU, r = Z.rnd(i, 10) * 70; c.beginPath(); c.ellipse(sx + Math.cos(a) * r * 0.9, sy + 20 + Math.sin(a) * r * 0.8, 5, 8, a, 0, Z.TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(sx - 45, sy - 10, 14, 26, 0.5, 0, Z.TAU); c.fill();
    c.fillStyle = '#3FBF6A'; c.lineWidth = 7;
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.55; c.beginPath(); c.moveTo(sx, sy - 50); c.quadraticCurveTo(sx + Math.cos(a - 0.4) * 60, sy - 50 + Math.sin(a - 0.4) * 50, sx + Math.cos(a) * 80, sy - 50 + Math.sin(a) * 40 + 10); c.quadraticCurveTo(sx + Math.cos(a + 0.4) * 40, sy - 50 + Math.sin(a + 0.4) * 30, sx, sy - 50); c.fill(); c.stroke(); }
    return c.canvas;
  }
  function drawPudding() {   // custard pudding with caramel on a plate (the scene wobbles it with a shear)
    const w = 820, h = 760, c = Z.canvas(w, h).getContext('2d'), cx = w / 2, ln = PAL.ink;
    c.lineJoin = 'round'; c.lineWidth = 9; c.strokeStyle = ln;
    c.beginPath(); c.ellipse(cx, h - 70, 380, 52, 0, 0, Z.TAU); c.fillStyle = '#FFFFFF'; c.fill(); c.stroke();
    c.beginPath(); c.ellipse(cx, h - 78, 300, 34, 0, 0, Z.TAU); c.strokeStyle = 'rgba(43,26,63,0.25)'; c.lineWidth = 5; c.stroke(); c.strokeStyle = ln; c.lineWidth = 9;
    const top = 170, bot = h - 90, tw = 190, bw = 270;
    const body = x => { x.beginPath(); x.moveTo(cx - tw, top); x.quadraticCurveTo(cx - tw - 30, (top + bot) / 2, cx - bw, bot); x.quadraticCurveTo(cx, bot + 40, cx + bw, bot); x.quadraticCurveTo(cx + tw + 30, (top + bot) / 2, cx + tw, top); x.closePath(); };
    paint(c, body, { fill: PAL.custard, shade: '#F2B94C', hi: '#FFF3C4', line: ln }, { lw: 9, shadeX: 0.14, hiX: 0.33, hiW: 22 });
    // caramel cap with drips
    c.beginPath(); c.moveTo(cx - tw - 4, top + 6);
    const drips = [[-150, 70], [-80, 40], [-10, 95], [60, 50], [130, 80]];
    for (const [dx, d] of drips) { c.lineTo(cx + dx - 26, top + 40); c.quadraticCurveTo(cx + dx - 22, top + d, cx + dx, top + d + 8); c.quadraticCurveTo(cx + dx + 22, top + d, cx + dx + 26, top + 40); }
    c.lineTo(cx + tw + 4, top + 6); c.closePath(); c.fillStyle = PAL.caramel; c.fill(); c.stroke();
    c.beginPath(); c.ellipse(cx, top, tw + 2, 38, 0, 0, Z.TAU); c.fillStyle = '#8A4512'; c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(cx - 70, top - 6, 60, 12, -0.1, 0, Z.TAU); c.fill();
    return c.canvas;
  }
  function drawShoe() {    // pink pump, side view, toe to the left
    const w = 1000, h = 620, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink;
    const build = x => { x.beginPath(); x.moveTo(90, 470); x.bezierCurveTo(70, 400, 160, 360, 270, 352); x.bezierCurveTo(400, 345, 470, 380, 560, 300);
      x.bezierCurveTo(640, 220, 760, 170, 840, 160); x.bezierCurveTo(900, 155, 915, 200, 905, 250); x.lineTo(880, 300); x.lineTo(862, 560); x.lineTo(830, 562); x.lineTo(815, 330);
      x.bezierCurveTo(720, 350, 640, 420, 560, 470); x.bezierCurveTo(430, 545, 200, 545, 90, 470); x.closePath(); };
    paint(c, build, VARIANTS.pink, { lw: 10, shadeX: 0.2, hiX: 0.25, hiW: 0 });
    // inner opening
    c.beginPath(); c.moveTo(560, 300); c.bezierCurveTo(640, 250, 760, 205, 845, 200); c.bezierCurveTo(870, 205, 880, 235, 870, 262); c.bezierCurveTo(760, 270, 650, 320, 585, 360); c.closePath(); c.fillStyle = '#B83A70'; c.fill(); c.lineWidth = 8; c.strokeStyle = ln; c.stroke();
    // sole line
    c.beginPath(); c.moveTo(110, 485); c.bezierCurveTo(260, 548, 440, 530, 560, 476); c.lineWidth = 7; c.stroke();
    // bow on the toe
    const bx = 330, by = 352;
    for (const sgn of [-1, 1]) { c.beginPath(); c.moveTo(bx, by); c.bezierCurveTo(bx + sgn * 90, by - 80, bx + sgn * 110, by + 40, bx, by); c.fillStyle = PAL.mint; c.fill(); c.lineWidth = 7; c.stroke(); }
    c.beginPath(); c.arc(bx, by, 18, 0, Z.TAU); c.fillStyle = PAL.mint; c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.ellipse(250, 400, 70, 12, -0.15, 0, Z.TAU); c.fill();
    return c.canvas;
  }
  function drawGlove() {   // white cartoon glove, open palm to the viewer, four fanned fingers + thumb, cuff at the bottom
    const w = 760, h = 920, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink, cx = w / 2 + 40, top = 430;
    c.lineJoin = 'round'; c.lineCap = 'round';
    // each part: [translate x, translate y, rotation, local rect x, y, w, h, radius]
    const fingers = [[-104, -0.32, 200, 72], [-36, -0.11, 252, 74], [36, 0.09, 248, 74], [102, 0.30, 196, 70]];
    const parts = [{ tx: cx, ty: top + 150, r: 0, rx: -165, ry: -150, rw: 330, rh: 310, rr: 130 }];
    for (const [dx, rot, len, fw] of fingers) parts.push({ tx: cx + dx, ty: top + 40, r: rot, rx: -fw / 2, ry: -len, rw: fw, rh: len + 60, rr: fw / 2 });
    parts.push({ tx: cx - 150, ty: top + 200, r: -1.0, rx: -38, ry: -200, rw: 76, rh: 230, rr: 38 });
    const path = (x, p) => { x.save(); x.translate(p.tx, p.ty); x.rotate(p.r); x.beginPath(); roundRect(p.rx, p.ry, p.rw, p.rh, p.rr, x); x.restore(); };
    c.strokeStyle = ln; c.lineWidth = 20; for (const p of parts) { path(c, p); c.stroke(); }
    c.fillStyle = '#FFFFFF'; for (const p of parts) { path(c, p); c.fill(); }
    // soft lilac shade along the right edge of every part
    for (const p of parts) { c.save(); path(c, p); c.clip(); c.translate(p.tx, p.ty); c.rotate(p.r); c.fillStyle = 'rgba(170,160,225,0.32)'; c.fillRect(p.rx + p.rw - 24, p.ry - 10, 60, p.rh + 20); c.restore(); }
    // finger separations near the knuckles + a palm crease
    c.strokeStyle = ln; c.lineWidth = 6;
    for (const xx of [-72, 0, 72]) { c.beginPath(); c.moveTo(cx + xx, top + 6); c.lineTo(cx + xx * 1.05, top + 62); c.stroke(); }
    c.beginPath(); c.moveTo(cx - 95, top + 210); c.quadraticCurveTo(cx - 60, top + 250, cx - 10, top + 255); c.stroke();
    // cuff
    c.lineWidth = 10; roundRect(cx - 160, top + 270, 320, 150, 40, c); c.fillStyle = '#FFFFFF'; c.fill(); c.stroke();
    c.save(); roundRect(cx - 160, top + 270, 320, 150, 40, c); c.clip(); c.fillStyle = 'rgba(170,160,225,0.32)'; c.fillRect(cx + 120, top + 260, 60, 170); c.restore();
    roundRect(cx - 160, top + 270, 320, 150, 40, c); c.stroke();
    c.lineWidth = 7; for (const dx of [-75, 0, 75]) { c.beginPath(); c.moveTo(cx + dx, top + 300); c.lineTo(cx + dx, top + 392); c.stroke(); }
    return c.canvas;
  }
  function drawCandy(col = PAL.hot) {
    const w = 420, h = 220, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink, cx = w / 2, cy = h / 2;
    c.lineJoin = 'round'; c.lineWidth = 7; c.strokeStyle = ln;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 70, cy); c.lineTo(cx + s * 190, cy - 80); c.quadraticCurveTo(cx + s * 160, cy, cx + s * 190, cy + 80); c.closePath(); c.fillStyle = Z.rgba(col, 0.85); c.fill(); c.stroke(); }
    c.beginPath(); c.ellipse(cx, cy, 92, 72, 0, 0, Z.TAU); c.fillStyle = col; c.fill();
    c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 18; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(cx + i * 46 - 80, cy + 90); c.lineTo(cx + i * 46 + 80, cy - 90); c.stroke(); } c.restore();
    c.beginPath(); c.ellipse(cx, cy, 92, 72, 0, 0, Z.TAU); c.lineWidth = 7; c.strokeStyle = ln; c.stroke();
    return c.canvas;
  }
  function drawMacaron(col = PAL.mint) {
    const w = 380, h = 300, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink, cx = w / 2;
    c.lineWidth = 7; c.strokeStyle = ln; c.lineJoin = 'round';
    const shell = y => { c.beginPath(); c.ellipse(cx, y, 160, 62, 0, 0, Z.TAU); c.fillStyle = col; c.fill(); c.stroke(); };
    shell(196); c.beginPath(); c.rect(cx - 150, 140, 300, 34); c.fillStyle = '#FFFDF6'; c.fill(); c.stroke(); shell(118);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(cx - 60, 96, 44, 12, -0.15, 0, Z.TAU); c.fill();
    return c.canvas;
  }
  function drawLollipop() {
    const w = 420, h = 760, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink, cx = w / 2, cy = 210;
    c.lineWidth = 8; c.strokeStyle = ln; c.fillStyle = '#FFFFFF'; roundRect(cx - 14, cy, 28, 520, 12, c); c.fill(); c.stroke();
    c.beginPath(); c.arc(cx, cy, 180, 0, Z.TAU); c.fillStyle = PAL.pink; c.fill();
    c.save(); c.clip(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 26; c.beginPath();
    for (let a = 0; a < 4 * Z.TAU; a += 0.06) { const r = a * 9; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.stroke(); c.restore();
    c.beginPath(); c.arc(cx, cy, 180, 0, Z.TAU); c.lineWidth = 9; c.stroke();
    return c.canvas;
  }
  function drawStrawberry() {
    const s = 400, c = Z.canvas(s, s).getContext('2d'), ln = PAL.ink, sx = s / 2, sy = s * 0.52;
    c.lineWidth = 9; c.strokeStyle = ln; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(sx, sy + 150); c.bezierCurveTo(sx - 160, sy + 70, sx - 150, sy - 90, sx, sy - 80); c.bezierCurveTo(sx + 150, sy - 90, sx + 160, sy + 70, sx, sy + 150); c.closePath(); c.fillStyle = PAL.red; c.fill(); c.stroke();
    c.fillStyle = '#FFE38A'; for (let i = 0; i < 18; i++) { const a = Z.rnd(i, 19) * Z.TAU, r = Math.sqrt(Z.rnd(i, 20)) * 95; c.beginPath(); c.ellipse(sx + Math.cos(a) * r, sy + 15 + Math.sin(a) * r * 0.9, 6, 10, a, 0, Z.TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(sx - 60, sy - 20, 16, 32, 0.5, 0, Z.TAU); c.fill();
    c.fillStyle = '#3FBF6A'; c.lineWidth = 8;
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.62; c.beginPath(); c.moveTo(sx, sy - 78); c.quadraticCurveTo(sx + Math.cos(a - 0.4) * 80, sy - 78 + Math.sin(a - 0.4) * 60, sx + Math.cos(a) * 105, sy - 78 + Math.sin(a) * 50 + 14); c.quadraticCurveTo(sx + Math.cos(a + 0.4) * 50, sy - 78 + Math.sin(a + 0.4) * 36, sx, sy - 78); c.fill(); c.stroke(); }
    return c.canvas;
  }
  function drawBow(col = PAL.hot) {
    const w = 640, h = 440, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink, cx = w / 2, cy = 190;
    c.lineWidth = 9; c.strokeStyle = ln; c.lineJoin = 'round';
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx, cy + 20); c.lineTo(cx + s * 90, cy + 220); c.lineTo(cx + s * 150, cy + 190); c.lineTo(cx + s * 40, cy); c.closePath(); c.fillStyle = col; c.fill(); c.stroke(); }
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx, cy); c.bezierCurveTo(cx + s * 250, cy - 200, cx + s * 330, cy + 160, cx, cy); c.fillStyle = col; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(cx + s * 40, cy - 10); c.bezierCurveTo(cx + s * 160, cy - 90, cx + s * 200, cy + 40, cx + s * 60, cy + 20); c.strokeStyle = 'rgba(43,26,63,0.4)'; c.lineWidth = 6; c.stroke(); c.strokeStyle = ln; c.lineWidth = 9; }
    roundRect(cx - 40, cy - 46, 80, 92, 26, c); c.fillStyle = col; c.fill(); c.stroke();
    return c.canvas;
  }
  function drawCloche() {
    const w = 1000, h = 760, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink, cx = w / 2;
    c.lineWidth = 10; c.strokeStyle = ln; c.lineJoin = 'round';
    const dome = x => { x.beginPath(); x.moveTo(cx - 430, 640); x.bezierCurveTo(cx - 430, 230, cx + 430, 230, cx + 430, 640); x.closePath(); };
    paint(c, dome, { fill: '#E4E6F2', shade: '#B6B9D0', hi: '#FFFFFF', line: ln }, { lw: 10, shadeX: 0.12, hiX: 0.3, hiW: 40 });
    c.beginPath(); c.ellipse(cx, 230, 50, 30, 0, 0, Z.TAU); c.fillStyle = '#C9CCE0'; c.fill(); c.stroke();
    c.beginPath(); c.ellipse(cx, 660, 480, 46, 0, 0, Z.TAU); c.fillStyle = '#F4F5FB'; c.fill(); c.stroke();
    return c.canvas;
  }
  function drawBubble(col = '#FFFFFF') {
    const w = 900, h = 520, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink;
    c.lineJoin = 'round'; c.strokeStyle = ln;
    const parts = [x => { x.beginPath(); x.ellipse(w / 2, 220, 400, 190, 0, 0, Z.TAU); }, x => { x.beginPath(); x.moveTo(290, 360); x.lineTo(210, 500); x.lineTo(430, 390); x.closePath(); }];
    c.lineWidth = 22; for (const p of parts) { p(c); c.stroke(); }
    c.fillStyle = col; for (const p of parts) { p(c); c.fill(); }
    return c.canvas;
  }
  function drawHorse() {   // carousel white knight: the knight piece on a striped gold pole with a saddle ribbon
    const kn = drawPiece('knight', VARIANTS.white);
    const w = 600, h = 1080, c = Z.canvas(w, h).getContext('2d'), ln = PAL.ink, cx = w / 2;
    c.lineWidth = 8; c.strokeStyle = ln;
    roundRect(cx - 18, 0, 36, h, 12, c); c.fillStyle = PAL.gold; c.fill(); c.stroke();
    c.save(); roundRect(cx - 18, 0, 36, h, 12, c); c.clip(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 12; for (let y = -40; y < h + 40; y += 56) { c.beginPath(); c.moveTo(cx - 30, y); c.lineTo(cx + 30, y + 30); c.stroke(); } c.restore();
    c.drawImage(kn, 0, 160, 600, 760);
    // saddle ribbon
    c.lineWidth = 8; c.strokeStyle = ln; c.beginPath(); c.moveTo(cx + 40, 780); c.quadraticCurveTo(cx + 140, 760, cx + 170, 830); c.lineTo(cx + 120, 880); c.quadraticCurveTo(cx + 90, 820, cx + 30, 830); c.closePath(); c.fillStyle = PAL.hot; c.fill(); c.stroke();
    return c.canvas;
  }

  // ------------------------------------------------------------------ registry ('prop:<kind>[:<variant>]')
  const cache = new Map();
  function art(kind, variant) {
    const key = kind + ':' + (variant || '');
    if (cache.has(key)) return cache.get(key);
    let cv;
    if (['pawn', 'rook', 'knight', 'bishop', 'queen', 'king'].includes(kind)) cv = drawPiece(kind, VARIANTS[variant || 'pink'] || VARIANTS.pink);
    else if (kind === 'crown') cv = drawCrown();
    else if (kind === 'tiara') cv = drawCrown(700, 360, true);
    else if (kind === 'heart') cv = drawHeart(variant ? (PAL[variant] || variant) : PAL.hot);
    else if (kind === 'cake') cv = drawCake();
    else if (kind === 'pudding') cv = drawPudding();
    else if (kind === 'shoe') cv = drawShoe();
    else if (kind === 'glove') cv = drawGlove();
    else if (kind === 'candy') cv = drawCandy(variant ? (PAL[variant] || variant) : PAL.hot);
    else if (kind === 'macaron') cv = drawMacaron(variant ? (PAL[variant] || variant) : PAL.mint);
    else if (kind === 'lollipop') cv = drawLollipop();
    else if (kind === 'strawberry') cv = drawStrawberry();
    else if (kind === 'bow') cv = drawBow(variant ? (PAL[variant] || variant) : PAL.hot);
    else if (kind === 'cloche') cv = drawCloche();
    else if (kind === 'bubble') cv = drawBubble(variant ? (PAL[variant] || variant) : '#FFFFFF');
    else if (kind === 'horse') cv = drawHorse();
    else { cv = Z.canvas(4, 4); console.warn('royal_art: unknown prop ' + kind); }
    cache.set(key, cv); return cv;
  }
  const parse = p => { const [, kind, variant] = p.split(':'); return art(kind, variant); };
  // extend the loader: 'prop:*' keys never hit the network
  const img0 = Z.img;
  Z.img = p => (typeof p === 'string' && p.startsWith('prop:') ? Promise.resolve(parse(p)) : img0(p));
  const sync0 = Z.imgSync;
  Z.imgSync = p => (typeof p === 'string' && p.startsWith('prop:') ? (Z.loaded.get(p) || (Z.loaded.set(p, parse(p)), Z.loaded.get(p))) : sync0(p));

  Z.royal = Object.assign(Z.royal || {}, { PAL, VARIANTS, art, lathe, heartPath, crownPath, starPath, roundRect, paint });
})();
