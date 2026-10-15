/* scenes/royal.js — scenes, fx and transitions for ワールドイズマイン (procedural; art from scenes/royal_art.js).
 *
 * ALL cue times inside these scenes' args are ABSOLUTE song times (seconds), like the timeline's beats.
 *
 * Scenes
 *   stage   graphic stage: bg layers + animated props + fx. args { bg: [layer…], props: [prop…], fx: [layer…], cam }
 *           bg/fx layer: { type: solid|grad|burst|checker|dots|stripes|zigzag|confetti|sparkles|rain|hearts|halftone|
 *                          spot|speed|clouds|canopy|vignette|custom, …opts }
 *           prop: { img, x, y, h, rot, flip, alpha, anchor, to:{x,y,h,rot}, ease, in:{t,dur,from}, out:{t,dur,to},
 *                   hop:{amp,t0,t1,every}, bob:{amp,f}, jelly:{amp}, beat, spin, shadow:{dx,dy,a,color}, front, q }
 *           cam: { zoom, zoom2, x, y, x2, y2, rot, rot2, ease, kick (beat zoom), shake }
 *   board   the chessboard kingdom in perspective. args { sky, bgLayers, board:{n, a, b, edge, side}, cam:{from,to,ease},
 *           pieces:[{type, v, c, r, h, hop, bow:[t0,t1,dir], at, move:[[t,c,r]…], crown, spot}], fx }
 *   decree  royal edict scroll: header, numbered articles typed in, hanko stamps slammed. args { items, stamps, icons }
 *   slam    pop kinetic typography: one word per cue, colour flips, burst, speed lines. args { words:[{t,text,…}] }
 *   rtitle  title sequence: board unrolls, crown drops, title + sub + credit. args { cues:{board,crown,title,sub,out} }
 *   road    night crosswalk, headlights approach, the king pulls the queen back. args { grabAt, passAt, lightsAt }
 *   sign    yellow warning diamond turns into a heart, closing line. args { flipAt, line, lineAt, crownAt }
 *   endcard credits on cream. args { title, sub, credit, extra }
 * Transitions: zigzag (crown-teeth wipe), checker (squares flip in), heartIris (heart-shaped iris), stamp (ink press)
 */
(() => {
  'use strict';
  const Z = window.Z, D = Z.draw, E = Z.ease, R = Z.royal, P = R.PAL;
  const W = 1920, H = 1080;
  const ease = n => (typeof n === 'function' ? n : E[n] || E.inOutSine);
  const mixHex = (a, b, k) => { const x = Z.hex(a), y = Z.hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`; };
  const FONT = {
    royal: '"Zen Old Mincho"', pop: '"Dela Gothic One"', round: '"M PLUS Rounded 1c"', hand: '"Klee One"', dot: '"DotGothic16"',
    gothic: '"Zen Kaku Gothic New"', rampart: '"Rampart One"', reggae: '"Reggae One"', mincho: '"Shippori Mincho B1"',
  };
  const font = (c, size, fam = 'pop', weight = 400) => { c.font = `${weight} ${size}px ${FONT[fam] || fam}, "Noto Sans JP", sans-serif`; };
  R.FONT = FONT; R.font = font;

  // beat helpers (absolute time)
  const beatsIn = (t0, t1) => Z.clock.beats.filter(b => b >= t0 - 1e-6 && b < t1 - 1e-6);
  const lastBeat = (t, t0 = -1e9) => { const i = Z.clock.idx(t); return i < 0 ? null : (Z.clock.beats[i] >= t0 ? Z.clock.beats[i] : null); };
  R.beatsIn = beatsIn;

  // ================================================================== background / fx layers
  const LAYER = {};
  LAYER.solid = (c, S, o) => D.fill(c, o.color || P.cream, o.a ?? 1);
  LAYER.grad = (c, S, o) => D.vgrad(c, o.stops, o.a ?? 1, o.comp || 'source-over');
  // rotating sunburst: n rays alternating two colours around (x, y)
  LAYER.burst = (c, S, o) => {
    const x = o.x ?? W / 2, y = o.y ?? H / 2, n = o.n ?? 24, rot = (o.rot ?? 0) + (o.speed ?? 0.15) * S.t + (o.kick ? o.kick * E.outExpo(Z.clamp(Z.clock.since(S.t) * 4)) * 0 : 0);
    c.save(); c.fillStyle = o.a2 || P.cream; c.fillRect(0, 0, W, H); c.fillStyle = o.a1 || P.rose; c.globalAlpha = o.a ?? 1;
    c.beginPath(); const R0 = 2600;
    for (let i = 0; i < n; i += 2) { const a0 = rot + (i / n) * Z.TAU, a1 = rot + ((i + 1) / n) * Z.TAU; c.moveTo(x, y); c.lineTo(x + Math.cos(a0) * R0, y + Math.sin(a0) * R0); c.lineTo(x + Math.cos(a1) * R0, y + Math.sin(a1) * R0); c.closePath(); }
    c.fill(); c.restore();
  };
  // scrolling checker (flat, screen space): size, colours, scroll [vx, vy] px/s, rot
  LAYER.checker = (c, S, o) => {
    const s = o.size ?? 120, vx = (o.scroll || [40, 20])[0], vy = (o.scroll || [40, 20])[1];
    c.save(); c.fillStyle = o.a2 || P.cream; c.fillRect(0, 0, W, H);
    c.translate(W / 2, H / 2); c.rotate(o.rot ?? 0); c.globalAlpha = o.a ?? 1; c.fillStyle = o.a1 || '#FFDDEB';
    const ox = Z.fract((vx * S.t) / (2 * s)) * 2 * s, oy = Z.fract((vy * S.t) / (2 * s)) * 2 * s;
    c.beginPath();
    for (let j = -8; j < 8; j++) for (let i = -10; i < 10; i++) if (((i + j) & 1) === 0) c.rect(i * s + ox - s * 2, j * s + oy - s * 2, s, s);
    c.fill(); c.restore();
  };
  // polka dots drifting
  LAYER.dots = (c, S, o) => {
    const s = o.size ?? 90, r = o.r ?? 16, vx = (o.scroll || [30, -20])[0], vy = (o.scroll || [30, -20])[1];
    if (o.bg) D.fill(c, o.bg);
    c.save(); c.fillStyle = o.color || P.rose; c.globalAlpha = o.a ?? 1;
    const ox = Z.fract((vx * S.t) / s) * s, oy = Z.fract((vy * S.t) / s) * s;
    c.beginPath();
    for (let j = -1; j < H / s + 2; j++) for (let i = -1; i < W / s + 2; i++) { const x = i * s + ox + (j & 1) * s / 2, y = j * s + oy; c.moveTo(x + r, y); c.arc(x, y, r * (1 + (o.beat || 0) * Z.clock.pulse(S.t, 9)), 0, Z.TAU); }
    c.fill(); c.restore();
  };
  // diagonal stripes scrolling
  LAYER.stripes = (c, S, o) => {
    const w = o.w ?? 70, ang = o.angle ?? -0.6, sp = o.speed ?? 80;
    if (o.bg) D.fill(c, o.bg);
    c.save(); c.translate(W / 2, H / 2); c.rotate(ang); c.fillStyle = o.color || P.rose; c.globalAlpha = o.a ?? 1;
    const off = Z.fract((sp * S.t) / (2 * w)) * 2 * w; c.beginPath();
    for (let x = -1400; x < 1400; x += 2 * w) c.rect(x + off, -1400, w, 2800);
    c.fill(); c.restore();
  };
  // zigzag (crown-teeth) band along the top and/or bottom edge
  LAYER.zigzag = (c, S, o) => {
    const tooth = o.tooth ?? 60, hgt = o.h ?? 46, col = o.color || P.gold, off = Z.fract(((o.speed ?? 30) * S.t) / tooth) * tooth;
    c.save(); c.fillStyle = col; c.strokeStyle = o.line || P.ink; c.lineWidth = o.lw ?? 0;
    for (const edge of o.edges || ['top', 'bottom']) {
      const top = edge === 'top', y0 = top ? (o.y ?? 0) : H - (o.y ?? 0), dir = top ? 1 : -1, band = o.band ?? 18;
      c.beginPath(); c.moveTo(-tooth, y0);
      for (let x = -tooth + (top ? off : -off); x < W + 2 * tooth; x += tooth) { c.lineTo(x, y0 + dir * band); c.lineTo(x + tooth / 2, y0 + dir * (band + hgt)); c.lineTo(x + tooth, y0 + dir * band); }
      c.lineTo(W + 2 * tooth, y0); c.closePath(); c.fill(); if (o.lw) c.stroke();
    }
    c.restore();
  };
  // confetti: closed-form falling paper bits (rect + ribbon), colours cycle
  LAYER.confetti = (c, S, o) => {
    const n = o.n ?? 90, seed = o.seed ?? 3, cols = o.colors || [P.hot, P.mint, P.gold, P.sky, P.lilac, P.red], sp = o.speed ?? 260;
    const t = S.t - (o.t0 ?? 0); if (t < 0) return;
    c.save();
    for (let i = 0; i < n; i++) {
      const life = (H + 200) / (sp * (0.7 + 0.6 * Z.rnd(i, seed))), ph = Z.rnd(i, seed + 1) * life;
      const k = o.burst ? Z.clamp(t / life * (0.6 + Z.rnd(i, seed + 9))) : Z.fract((t + ph) / life);
      if (o.burst && k >= 1) continue;
      const x = Z.rnd(i, seed + 2) * W + Math.sin(t * (1 + Z.rnd(i, seed + 3) * 2) + i) * 60;
      const y = o.burst ? (o.y0 ?? -60) + k * (H + 140) : -60 + k * (H + 140);
      const rot = t * (2 + 4 * Z.rnd(i, seed + 4)) + i, sx = Math.cos(t * (3 + 5 * Z.rnd(i, seed + 5)) + i);
      c.save(); c.translate(x, y); c.rotate(rot); c.scale(sx, 1); c.fillStyle = cols[i % cols.length]; c.globalAlpha = o.a ?? 1;
      const sz = (o.size ?? 1) * (10 + 10 * Z.rnd(i, seed + 6));
      if (i % 3 === 0) { c.beginPath(); c.arc(0, 0, sz * 0.6, 0, Z.TAU); c.fill(); } else c.fillRect(-sz, -sz * 0.45, sz * 2, sz * 0.9);
      c.restore();
    }
    c.restore();
  };
  // 4-point sparkles twinkling on 12 fps
  LAYER.sparkles = (c, S, o) => {
    const n = o.n ?? 26, seed = o.seed ?? 5, tq = Z.quant(S.t, 12), [x0, y0, x1, y1] = o.area || [0, 0, W, H];
    c.save(); c.fillStyle = o.color || '#FFFFFF';
    for (let i = 0; i < n; i++) {
      const life = 0.8 + 1.4 * Z.rnd(i, seed), k = Z.fract((tq + Z.rnd(i, seed + 1) * life) / life), cyc = Math.floor((tq + Z.rnd(i, seed + 1) * life) / life);
      const x = Z.lerp(x0, x1, Z.rnd(i, seed + 2, cyc)), y = Z.lerp(y0, y1, Z.rnd(i, seed + 3, cyc));
      const r = (o.size ?? 26) * (0.5 + Z.rnd(i, seed + 4)) * Math.sin(k * Math.PI);
      if (r < 1) continue;
      c.globalAlpha = o.a ?? 1; R.starPath(c, x, y, r, 4, 0.22, 0); c.fill();
      if (o.line) { c.strokeStyle = o.line; c.lineWidth = 3; c.stroke(); }
    }
    c.restore();
  };
  // falling props (candies / hearts / strawberries): imgs list, closed form
  LAYER.rain = (c, S, o) => {
    const n = o.n ?? 24, seed = o.seed ?? 7, imgs = (o.imgs || ['prop:candy']).map(p => Z.imgSync(p)), sp = o.speed ?? 320;
    const t = S.t - (o.t0 ?? 0); if (t < 0) return;
    for (let i = 0; i < n; i++) {
      const img = imgs[i % imgs.length], hh = (o.size ?? 120) * (0.6 + 0.8 * Z.rnd(i, seed));
      const life = (H + 400) / (sp * (0.7 + 0.6 * Z.rnd(i, seed + 1))), ph = o.once ? 0 : Z.rnd(i, seed + 2) * life;
      const delay = o.once ? Z.rnd(i, seed + 8) * (o.spread ?? 1.2) : 0;
      let k = (t - delay + ph) / life; if (o.once) { if (k < 0 || k > 1) continue; } else k = Z.fract(k);
      const x = Z.rnd(i, seed + 3) * (W + 200) - 100 + Math.sin(t * 1.3 + i) * 40, y = -200 + k * (H + 400);
      const rot = (Z.rnds(i, seed + 4) * 0.8) + t * Z.rnds(i, seed + 5) * 2;
      D.sprite(c, img, x, y, hh, { anchor: [0.5, 0.5], rot, alpha: o.a ?? 1 });
    }
  };
  // floating hearts rising
  LAYER.hearts = (c, S, o) => {
    const n = o.n ?? 20, seed = o.seed ?? 9, cols = o.colors || [P.hot, P.pink, P.rose];
    c.save();
    for (let i = 0; i < n; i++) {
      const life = 3 + 3 * Z.rnd(i, seed), k = Z.fract((S.t + Z.rnd(i, seed + 1) * life) / life);
      const x = Z.rnd(i, seed + 2) * W + Math.sin(S.t * 1.7 + i) * 50, y = H + 80 - k * (H + 200), s = (o.size ?? 30) * (0.6 + Z.rnd(i, seed + 3));
      c.globalAlpha = (o.a ?? 1) * Math.sin(k * Math.PI); c.fillStyle = cols[i % cols.length];
      R.heartPath(c, x, y, s); c.fill(); if (o.line) { c.strokeStyle = o.line; c.lineWidth = 3; c.stroke(); }
    }
    c.restore();
  };
  // manga halftone burst from a point
  LAYER.halftone = (c, S, o) => {
    const x = o.x ?? W / 2, y = o.y ?? H / 2, step = o.step ?? 34, rad = o.r ?? 900;
    D.halftone(c, [0, 0, W, H], step, (px, py) => Z.clamp((Math.hypot(px - x, py - y) / rad) * (o.k ?? 1)), o.color || P.rose);
  };
  // spotlight cone from top
  LAYER.spot = (c, S, o) => {
    const x = o.x ?? W / 2, y = o.y ?? 900, w = o.w ?? 300, top = o.top ?? -100;
    c.save(); c.globalCompositeOperation = o.comp || 'source-over';
    const g = c.createLinearGradient(0, top, 0, y);
    g.addColorStop(0, Z.rgba(o.color || '#FFFFFF', 0)); g.addColorStop(1, Z.rgba(o.color || '#FFFFFF', o.a ?? 0.55));
    c.fillStyle = g; c.beginPath(); c.moveTo(x - w * 0.18, top); c.lineTo(x + w * 0.18, top); c.lineTo(x + w, y); c.lineTo(x - w, y); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(x, y, w, w * 0.22, 0, 0, Z.TAU); c.fillStyle = Z.rgba(o.color || '#FFFFFF', (o.a ?? 0.55) * 1.2); c.fill();
    c.restore();
  };
  // radial speed lines (manga focus lines)
  LAYER.speed = (c, S, o) => {
    const x = o.x ?? W / 2, y = o.y ?? H / 2, n = o.n ?? 70, seed = Math.floor(S.t * 12) + (o.seed ?? 0);
    c.save(); c.fillStyle = o.color || P.ink; c.globalAlpha = o.a ?? 0.85; c.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Z.TAU + Z.rnds(i, seed) * 0.05, w = 0.004 + 0.012 * Z.rnd(i, seed + 1), r0 = (o.r0 ?? 380) * (0.8 + 0.5 * Z.rnd(i, seed + 2));
      c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a - w) * 2400, y + Math.sin(a - w) * 2400); c.lineTo(x + Math.cos(a + w) * 2400, y + Math.sin(a + w) * 2400); c.closePath();
    }
    c.fill(); c.restore();
  };
  // puffy flat clouds drifting
  LAYER.clouds = (c, S, o) => {
    const n = o.n ?? 6, seed = o.seed ?? 11, sp = o.speed ?? 18;
    c.save(); c.fillStyle = o.color || '#FFFFFF'; c.strokeStyle = o.line || 'rgba(43,26,63,0.0)'; c.lineWidth = 6; c.globalAlpha = o.a ?? 1;
    for (let i = 0; i < n; i++) {
      const s = (o.size ?? 1) * (90 + 80 * Z.rnd(i, seed)), x = Z.fract(Z.rnd(i, seed + 1) + (sp * S.t) / (W + 800) * (0.6 + Z.rnd(i, seed + 2))) * (W + 800) - 400;
      const y = (o.y0 ?? 80) + Z.rnd(i, seed + 3) * (o.yr ?? 380);
      c.beginPath(); c.arc(x, y, s, Math.PI, 0); c.arc(x + s * 1.1, y + s * 0.15, s * 0.75, Math.PI * 1.1, 0.3); c.arc(x - s * 1.1, y + s * 0.15, s * 0.7, Math.PI * 0.75, 0);
      c.lineTo(x + s * 1.85, y + s * 0.5); c.lineTo(x - s * 1.8, y + s * 0.5); c.closePath(); c.fill(); if (o.line) c.stroke();
    }
    c.restore();
  };
  // carousel canopy: scalloped striped awning across the top + bulbs blinking per beat
  LAYER.canopy = (c, S, o) => {
    const n = o.n ?? 12, h = o.h ?? 190, cols = o.colors || [P.hot, P.cream], sw = W / n, rot = Z.fract((o.speed ?? 0.12) * S.t) * 2;
    c.save();
    for (let i = -1; i <= n; i++) {
      const x = (i + rot) * sw; c.fillStyle = cols[(i + 100) % cols.length];
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + sw, 0); c.lineTo(x + sw, h); c.arc(x + sw / 2, h, sw / 2, 0, Math.PI); c.closePath(); c.fill();
    }
    c.strokeStyle = P.ink; c.lineWidth = 6; c.beginPath(); c.moveTo(0, h - 30); c.lineTo(W, h - 30); c.stroke();
    const on = Math.floor(Z.clock.beat(S.t)) & 1;
    for (let i = 0; i < 24; i++) { const x = (i + 0.5) * W / 24; D.disc(c, x, h - 30, 11, (i & 1) === on ? '#FFF6B0' : '#D9A23A'); if ((i & 1) === on) D.glow(c, x, h - 30, 40, '#FFE07A', 0.6); }
    c.restore();
  };
  LAYER.vignette = (c, S, o) => { const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, Z.rgba(o.color || P.ink, o.a ?? 0.35)); c.fillStyle = g; c.fillRect(0, 0, W, H); };
  // stopwatch: cream face, 12 ticks, hands spinning (speed = minute-hand turns per second); ticks pulse on beats
  LAYER.clock = (c, S, o) => {
    const x = o.x ?? W / 2, y = o.y ?? H / 2, r = (o.r ?? 260) * (1 + 0.04 * Z.clock.pulse(S.t, 9)), t = S.t - S.shot.t0;
    c.save(); c.translate(x, y); c.rotate(o.rot ?? -0.08);
    c.fillStyle = Z.rgba(P.ink, 0.22); c.beginPath(); c.arc(16, 18, r * 1.08, 0, Z.TAU); c.fill();
    c.fillStyle = o.rim || P.gold; c.beginPath(); c.arc(0, 0, r * 1.08, 0, Z.TAU); c.fill(); c.lineWidth = 9; c.strokeStyle = P.ink; c.stroke();
    c.fillStyle = P.gold; R.roundRect(-r * 0.14, -r * 1.32, r * 0.28, r * 0.2, 8, c); c.fill(); c.stroke();
    c.fillStyle = P.cream; c.beginPath(); c.arc(0, 0, r, 0, Z.TAU); c.fill(); c.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Z.TAU; c.lineWidth = i % 3 ? 5 : 10; c.beginPath(); c.moveTo(Math.sin(a) * r * 0.8, -Math.cos(a) * r * 0.8); c.lineTo(Math.sin(a) * r * 0.92, -Math.cos(a) * r * 0.92); c.stroke(); }
    const am = (o.speed ?? 1.2) * t * Z.TAU, ah = am / 12;
    c.lineCap = 'round'; c.lineWidth = 16; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(ah) * r * 0.5, -Math.cos(ah) * r * 0.5); c.stroke();
    c.lineWidth = 10; c.strokeStyle = P.hot; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(am) * r * 0.78, -Math.cos(am) * r * 0.78); c.stroke();
    D.disc(c, 0, 0, r * 0.07, P.ink);
    c.restore();
  };
  // hand-drawn red circles (spot-the-difference): items [{ t, x, y, r, ry }]
  LAYER.circles = (c, S, o) => {
    c.save(); c.strokeStyle = o.color || P.red; c.lineWidth = o.lw ?? 12; c.lineCap = 'round';
    for (const it of o.items || []) {
      if (S.t < it.t) continue;
      const k = E.outCubic(Z.clamp((S.t - it.t) / 0.22)), rx = it.r ?? 120, ry = it.ry ?? rx * 0.85, a0 = -2.2;
      c.beginPath();
      for (let i = 0; i <= 40 * k; i++) { const a = a0 + (i / 40) * (Z.TAU + 0.5), w = 1 + 0.06 * Math.sin(a * 3 + 1); c.lineTo(it.x + Math.cos(a) * rx * w, it.y + Math.sin(a) * ry * w); }
      c.stroke();
    }
    c.restore();
  };
  // blinking arrows pointing at (x, y) from the given side(s), on beats
  LAYER.arrows = (c, S, o) => {
    const on = (Math.floor(Z.clock.beat(S.t)) & 1) === 0, x = o.x ?? W / 2, y = o.y ?? H / 2, d = o.dist ?? 260;
    c.save(); c.fillStyle = o.color || P.hot; c.strokeStyle = P.ink; c.lineWidth = 7; c.lineJoin = 'round';
    for (const side of o.sides || ['left', 'right']) {
      const ang = { left: 0, right: Math.PI, top: Math.PI / 2, bottom: -Math.PI / 2 }[side], bob = (on ? 1 : 0) * 26;
      c.save(); c.translate(x - Math.cos(ang) * (d + bob), y - Math.sin(ang) * (d + bob)); c.rotate(ang);
      c.beginPath(); c.moveTo(60, 0); c.lineTo(0, -46); c.lineTo(0, -20); c.lineTo(-80, -20); c.lineTo(-80, 20); c.lineTo(0, 20); c.lineTo(0, 46); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
    c.restore();
  };
  // big red X slashed in two strokes at t
  LAYER.xmark = (c, S, o) => {
    if (S.t < o.t) return;
    const k1 = E.outExpo(Z.clamp((S.t - o.t) / 0.12)), k2 = E.outExpo(Z.clamp((S.t - o.t - 0.12) / 0.12)), s2 = o.size ?? 300, x = o.x ?? W / 2, y = o.y ?? H / 2;
    c.save(); c.strokeStyle = o.color || P.red; c.lineWidth = s2 * 0.16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - s2 / 2, y - s2 / 2); c.lineTo(x - s2 / 2 + s2 * k1, y - s2 / 2 + s2 * k1); c.stroke();
    if (k2 > 0) { c.beginPath(); c.moveTo(x + s2 / 2, y - s2 / 2); c.lineTo(x + s2 / 2 - s2 * k2, y - s2 / 2 + s2 * k2); c.stroke(); }
    c.restore();
  };
  // a line of text popping in at t: { t, text, x, y, size, fam, weight, color, stroke, strokeW, rot, align, out }
  LAYER.text = (c, S, o) => {
    if (S.t < (o.at ?? -1e9)) return;
    if (o.out != null && S.t >= o.out) return;
    const k = o.at != null ? E.outBack(Z.clamp((S.t - o.at) / 0.22), 2.2) : 1, size = o.size ?? 80;
    c.save(); c.translate(o.x ?? W / 2, o.y ?? H / 2); c.rotate(o.rot ?? 0); c.scale(k, k); c.globalAlpha = o.a ?? 1;
    font(c, size, o.fam || 'pop', o.weight ?? 400); c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (o.stroke !== false) { c.lineWidth = size * (o.strokeW ?? 0.16); c.strokeStyle = o.stroke || P.ink; c.strokeText(o.text, 0, 0); }
    c.fillStyle = o.color || P.cream; c.fillText(o.text, 0, 0); c.restore();
  };
  // sky gradient interpolated from `from` to `to` stops (same count) over [t0, t1] (default: the shot)
  LAYER.skyLerp = (c, S, o) => {
    const k = ease(o.ease || 'inOutSine')(Z.inv(o.t0 ?? S.shot.t0, o.t1 ?? S.shot.t1, S.t));
    D.vgrad(c, o.from.map(([kk, col], i) => [kk, mixHex(col, o.to[i][1], k)]));
  };
  LAYER.custom = (c, S, o) => o.fn(c, S, o);
  const layer = (c, S, o) => {
    if (!o) return;
    if (o.t0 != null && S.t < o.t0 && o.type !== 'confetti' && o.type !== 'rain') return;
    if (o.t1 != null && S.t >= o.t1) return;
    const f = LAYER[o.type]; if (!f) return;
    c.save(); f(c, S, o); c.restore();
  };
  R.layer = layer; R.LAYER = LAYER;

  // ================================================================== animated prop (cut-out sprite)
  function prop(ctx, S, p) {
    const img = typeof p.img === 'string' ? Z.imgSync(p.img) : p.img; if (!img) return;
    if (p.front && S.fg) ctx = S.fg;
    const t = p.q ? Z.quant(S.t, p.q) : S.t, sh = S.shot;
    const k = ease(p.ease || 'inOutSine')(Z.clamp((t - sh.t0) / (sh.t1 - sh.t0)));
    const to = p.to || {};
    let x = Z.lerp(p.x, to.x ?? p.x, k), y = Z.lerp(p.y, to.y ?? p.y, k), h = Z.lerp(p.h, to.h ?? p.h, k), rot = Z.lerp(p.rot || 0, to.rot ?? (p.rot || 0), k);
    let alpha = p.alpha ?? 1, sx = 1, sy = 1, skew = 0;
    if (p.in) {
      const d = Z.clamp((t - p.in.t) / (p.in.dur ?? 0.4));
      if (d <= 0) return;
      const from = p.in.from || 'pop';
      if (from === 'pop') { const e = E.outBack(d, 2.2); sx *= e; sy *= e; }
      else if (from === 'drop') { const e = E.outBack(d, 1.4); y -= (1 - e) * (p.in.dist ?? 900); }
      else if (from === 'rise') { const e = E.outBack(d, 1.2); y += (1 - e) * (p.in.dist ?? 900); }
      else if (from === 'left' || from === 'right') { const e = E.outExpo(d); x += (1 - e) * (from === 'left' ? -1 : 1) * (p.in.dist ?? 1400); }
      else if (from === 'spin') { const e = E.outBack(d, 1.6); sx *= e; sy *= e; rot += (1 - e) * 3; }
      else if (from === 'stamp') { const e = E.outExpo(d); sx *= Z.lerp(2.4, 1, e); sy *= Z.lerp(2.4, 1, e); alpha *= Z.clamp(d * 3); }
      else if (from === 'fade') alpha *= d;
    }
    if (p.out) {
      const d = Z.clamp((t - p.out.t) / (p.out.dur ?? 0.35));
      if (d >= 1) return;
      const to2 = p.out.to || 'fade';
      if (d > 0) {
        if (to2 === 'fade') alpha *= 1 - d;
        else if (to2 === 'drop') y += E.inBack(d, 1.6) * 1200;
        else if (to2 === 'fly') { y -= E.inExpo(d) * 1400; rot += d * 0.6; }
        else if (to2 === 'pop') { const e = 1 - E.inBack(d, 2); sx *= e; sy *= e; }
        else if (to2 === 'left' || to2 === 'right') x += E.inExpo(d) * (to2 === 'left' ? -1 : 1) * 1800;
      }
    }
    if (p.hop) {                                    // bounce on every beat (or every n beats) inside [t0, t1]
      const a0 = p.hop.t0 ?? sh.t0, a1 = p.hop.t1 ?? sh.t1;
      if (t >= a0 && t < a1) {
        const ph = Z.clock.phase(t), bi = Z.clock.beat(t), ev = p.hop.every ?? 1;
        const along = ((bi % ev) + ph) / ev, u = Z.clamp(along);
        y -= (p.hop.amp ?? 60) * 4 * u * (1 - u);
        const land = Math.exp(-Z.clock.since(t) * 18) * ((bi % ev) === 0 ? 1 : 0);
        sx *= 1 + 0.12 * land; sy *= 1 - 0.12 * land;
      }
    }
    if (p.bob) y += (p.bob.amp ?? 14) * Math.sin(t * (p.bob.f ?? 2.2) + (p.bob.ph ?? 0));
    if (p.jelly) {                                  // squash + shear wobble from the last beat
      const s = Z.clock.since(t), a = p.jelly.amp ?? 0.08;
      if (s < 2) { const w = Math.exp(-s * (p.jelly.decay ?? 5)); sx *= 1 + a * Math.sin(s * 26) * w; sy *= 1 - a * Math.sin(s * 26) * w; skew = a * 1.6 * Math.sin(s * 19 + 1) * w; }
    }
    if (p.beat) { const b = 1 + p.beat * Z.clock.pulse(t, 10); sx *= b; sy *= b; }
    if (p.spin) sx *= Math.cos(t * p.spin);
    if (alpha <= 0.001) return;
    const [ax, ay] = p.anchor || [0.5, 1], ww = (img.width / img.height) * h;
    const drawIt = (c2, ox, oy, tint) => {
      c2.save(); c2.translate(x + ox, y + oy); c2.rotate(rot); c2.transform(1, 0, -skew, 1, 0, 0); c2.scale(sx * (p.flip ? -1 : 1), sy); c2.globalAlpha *= alpha;
      c2.drawImage(tint || img, -ww * ax, -h * ay, ww, h); c2.restore();
    };
    if (p.shadow) { ctx.save(); ctx.globalAlpha = p.shadow.a ?? 0.25; drawIt(ctx, p.shadow.dx ?? 18, p.shadow.dy ?? 18, Z.tinted(img, p.shadow.color || P.ink, 'shd' + (typeof p.img === 'string' ? p.img : 'x'))); ctx.restore(); }
    drawIt(ctx, 0, 0, null);
  }
  R.prop = prop;
  R.preloadProps = list => (list || []).map(p => p.img).filter(x => typeof x === 'string');

  // camera wrapper for 2-D scenes: zoom / pan / roll + beat kick + shake around the frame centre
  function withCam(ctx, S, cam, fn) {
    if (!cam) return fn();
    const k = ease(cam.ease || 'inOutSine')(S.p);
    let z = Z.lerp(cam.zoom ?? 1, cam.zoom2 ?? cam.zoom ?? 1, k);
    if (cam.kick) z *= 1 + cam.kick * Z.clock.pulse(S.t, 9);
    const x = Z.lerp(cam.x ?? 0, cam.x2 ?? cam.x ?? 0, k), y = Z.lerp(cam.y ?? 0, cam.y2 ?? cam.y ?? 0, k), r = Z.lerp(cam.rot ?? 0, cam.rot2 ?? cam.rot ?? 0, k);
    let shx = 0, shy = 0; if (cam.shake) [shx, shy] = D.shake(S.t, cam.shake * (cam.shakeEnv ? Math.pow(Z.env.low(S.t), 2) : 1), 24, 3);
    for (const c of [ctx, S.fg]) { if (!c) continue; c.save(); c.translate(W / 2 + x + shx, H / 2 + y + shy); c.rotate(r); c.scale(z, z); c.translate(-W / 2, -H / 2); }
    try { fn(); } finally { for (const c of [ctx, S.fg]) if (c) c.restore(); }
  }
  R.withCam = withCam;

  // ================================================================== stage
  Z.scene('stage', {
    preload: a => R.preloadProps(a.props).concat(...(a.bg || []).concat(a.fx || []).filter(l => l && l.imgs).map(l => l.imgs)),
    draw(ctx, S) {
      const a = S.args;
      for (const L of a.bg || []) if (!L.cam) layer(ctx, S, L);
      withCam(ctx, S, a.cam, () => {
        for (const L of a.bg || []) if (L.cam) layer(ctx, S, L);
        for (const p of a.props || []) prop(ctx, S, p);
        for (const L of a.fx || []) if (L.cam !== false) layer(ctx, S, L);
      });
      for (const L of a.fx || []) if (L.cam === false) layer(ctx, S, L);
    },
  });

  // ================================================================== board: the chessboard kingdom in perspective
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function camera(c) {
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch), cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    const tgt = [c.tx ?? 0, c.ty ?? 0, c.tz ?? 0], pos = [tgt[0] + c.dist * sy * cp, tgt[1] + c.dist * sp, tgt[2] + c.dist * cy * cp];
    const fwd = [-sy * cp, -sp, -cy * cp], right = [cy, 0, -sy], up = [-right[2] * fwd[1], right[2] * fwd[0] - right[0] * fwd[2], right[0] * fwd[1]];
    const f = (H / 2) / Math.tan((c.fov ?? 0.75) / 2), roll = c.roll ?? 0, cr = Math.cos(roll), srl = Math.sin(roll), cx0 = W / 2 + (c.sx ?? 0), cy0 = H / 2 + (c.sy ?? 0);
    return {
      f, pos,
      p(x, y, z) {
        const d = vsub([x, y, z], pos), X = vdot(d, right), Y = vdot(d, up), Zc = vdot(d, fwd);
        if (Zc < 0.05) return null;
        const u = (f * X) / Zc, v = (-f * Y) / Zc;
        return [cx0 + u * cr - v * srl, cy0 + u * srl + v * cr, Zc];
      },
    };
  }
  const lerpCam = (a, b, k) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) o[key] = Z.lerp(a[key] ?? b[key], b[key] ?? a[key], k); return o; };
  R.camera = camera;
  function drawBoard(ctx, cam, o, t) {
    const n = o.n ?? 8, half = n / 2, colA = o.a || '#FFE1EC', colB = o.b || '#FF8DB8', th = o.thick ?? 0.35;
    const q = (pts, fill, stroke) => { if (pts.some(p => !p)) return; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = o.lw ?? 4; ctx.stroke(); } };
    const P3 = (x, y, z) => cam.p(x, y, z);
    const m = o.margin ?? 0.4, e = half + m;
    // slab sides (drawn back to front by centre depth)
    const sides = [[[-e, 0, e], [e, 0, e], [e, -th, e], [-e, -th, e]], [[e, 0, e], [e, 0, -e], [e, -th, -e], [e, -th, e]], [[e, 0, -e], [-e, 0, -e], [-e, -th, -e], [e, -th, -e]], [[-e, 0, -e], [-e, 0, e], [-e, -th, e], [-e, -th, -e]]];
    const sideCols = [o.side || '#C9457E', o.side2 || '#A93469', o.side || '#C9457E', o.side2 || '#A93469'];
    const order = sides.map((s, i) => [i, vdot(vsub([(s[0][0] + s[1][0]) / 2, 0, (s[0][2] + s[1][2]) / 2], cam.pos), vsub([0, 0, 0], cam.pos))]).sort((x, y) => y[1] - x[1]);
    for (const [i] of order) q(sides[i].map(v => P3(...v)), sideCols[i], P.ink);
    q([[-e, 0, -e], [e, 0, -e], [e, 0, e], [-e, 0, e]].map(v => P3(...v)), o.frame || P.cream, P.ink);
    // squares
    const wave = o.wave || 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x0 = i - half, z0 = j - half, lift = wave ? wave * Math.sin(t * 6 - (i + j) * 0.7) : 0;
      const pts = [[x0, lift, z0], [x0 + 1, lift, z0], [x0 + 1, lift, z0 + 1], [x0, lift, z0 + 1]].map(v => P3(...v));
      let col = (i + j) & 1 ? colB : colA;
      if (o.light && o.light.some(([c, r]) => c === i && r === j)) col = o.lightCol || P.gold;
      q(pts, col, null);
    }
    // grid lines
    ctx.save(); ctx.strokeStyle = Z.rgba(P.ink, 0.35); ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= n; i++) { const a1 = P3(i - half, 0, -half), b1 = P3(i - half, 0, half), a2 = P3(-half, 0, i - half), b2 = P3(half, 0, i - half);
      if (a1 && b1) { ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]); } if (a2 && b2) { ctx.moveTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); } }
    ctx.stroke(); ctx.restore();
  }
  R.drawBoard = drawBoard;
  // piece state at time t: position (c, r) with move hops, bow tilt, appear scale
  function pieceAt(pc, t) {
    let c = pc.c, r = pc.r, y = 0, rot = 0, sc = 1;
    for (const [mt, mc, mr, dur = 0.3] of pc.move || []) {
      if (t >= mt + dur) { c = mc; r = mr; }
      else if (t > mt) { const k = E.inOutCubic((t - mt) / dur); y = Math.max(y, Math.sin(Math.PI * k) * (pc.moveHop ?? 0.9)); c = Z.lerp(c, mc, k); r = Z.lerp(r, mr, k); break; }
    }
    if (pc.hop) { const [a0, a1, amp = 0.35, ev = 1] = pc.hop; if (t >= a0 && t < a1) { const bi = Z.clock.beat(t), u = ((bi % ev) + Z.clock.phase(t)) / ev; y += amp * 4 * u * (1 - u); } }
    if (pc.bow) { const [b0, b1, dir = 1] = pc.bow; const k = t < b0 ? 0 : t < b1 ? E.outBack(Z.clamp((t - b0) / 0.35)) : Math.max(0, 1 - (t - b1) / 0.3); rot = dir * 0.42 * k; }
    if (pc.at != null) { const k = Z.clamp((t - pc.at) / 0.35); if (k <= 0) return null; sc = E.outBack(k, 2.2); y += (1 - E.outQuad(k)) * 1.5; }
    if (pc.gone != null && t >= pc.gone) { const k = Z.clamp((t - pc.gone) / 0.3); if (k >= 1) return null; sc *= 1 - E.inBack(k); }
    if (pc.sway) rot += pc.sway * Math.sin(t * 2.4 + c);
    let fx = 1; if (pc.turn) { const [t0, dur = 0.4] = pc.turn; fx = Math.cos(Math.PI * E.inOutCubic(Z.clamp((t - t0) / dur))); }
    return { c, r, y, rot, sc, fx };
  }
  Z.scene('board', {
    preload: a => (a.pieces || []).map(p => `prop:${p.type}:${p.v || 'pink'}`).concat((a.pieces || []).some(p => p.crown) ? ['prop:crown'] : [], R.preloadProps(a.props)),
    draw(ctx, S) {
      const a = S.args, t = S.t;
      if (a.sky) D.vgrad(ctx, a.sky); else if (!a.bg) D.fill(ctx, P.sky);
      for (const L of a.bg || []) layer(ctx, S, L);
      const cf = a.cam || {}, k = ease(cf.ease || 'inOutSine')(S.p);
      const cv = lerpCam(cf.from || { yaw: 0, pitch: 0.6, dist: 13, fov: 0.75 }, cf.to || cf.from || {}, k);
      if (cf.kick) cv.dist *= 1 - cf.kick * Z.clock.pulse(t, 8);
      if (cf.orbit) cv.yaw += cf.orbit * (t - S.shot.t0);
      const cam = camera(cv);
      drawBoard(ctx, cam, a.board || {}, t);
      // spotlights on squares
      const half = (a.board && a.board.n ? a.board.n : 8) / 2;
      for (const sp of a.spots || []) {
        if (sp.t0 != null && t < sp.t0) continue;
        const ctr = cam.p(sp.c - half + 0.5, 0.01, sp.r - half + 0.5); if (!ctr) continue;
        const pts = []; for (let i = 0; i < 24; i++) { const an = (i / 24) * Z.TAU, pp = cam.p(sp.c - half + 0.5 + Math.cos(an) * (sp.rad ?? 0.7), 0.01, sp.r - half + 0.5 + Math.sin(an) * (sp.rad ?? 0.7)); if (pp) pts.push(pp); }
        ctx.save(); ctx.globalAlpha = sp.a ?? 0.55; ctx.fillStyle = sp.color || '#FFF6C8'; ctx.beginPath(); pts.forEach((pp, i) => (i ? ctx.lineTo(pp[0], pp[1]) : ctx.moveTo(pp[0], pp[1]))); ctx.closePath(); ctx.fill();
        const g = ctx.createLinearGradient(0, 0, 0, ctr[1]); g.addColorStop(0, Z.rgba(sp.color || '#FFF6C8', 0)); g.addColorStop(1, Z.rgba(sp.color || '#FFF6C8', (sp.a ?? 0.55) * 0.6));
        ctx.fillStyle = g; ctx.beginPath(); const rx = Math.abs(pts[0][0] - ctr[0]) || 80; ctx.moveTo(ctr[0] - rx * 0.25, -50); ctx.lineTo(ctr[0] + rx * 0.25, -50); ctx.lineTo(ctr[0] + rx, ctr[1]); ctx.lineTo(ctr[0] - rx, ctr[1]); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      // pieces, far to near
      const list = [];
      for (const pc of a.pieces || []) {
        const st = pieceAt(pc, t); if (!st) continue;
        const wx = st.c - half + 0.5, wz = st.r - half + 0.5, base = cam.p(wx, 0, wz), top = cam.p(wx, (pc.h ?? 1.5), wz);
        if (!base || !top) continue;
        list.push({ pc, st, base, hpx: Math.hypot(top[0] - base[0], top[1] - base[1]), lift: cam.p(wx, st.y, wz) });
      }
      list.sort((u, v) => v.base[2] - u.base[2]);
      for (const it of list) {
        const { pc, st, base, hpx, lift } = it, img = Z.imgSync(`prop:${pc.type}:${pc.v || 'pink'}`);
        const c2 = pc.front && S.fg ? S.fg : ctx;
        // contact shadow
        ctx.save(); ctx.fillStyle = Z.rgba(P.ink, 0.22 / (1 + st.y)); ctx.beginPath(); ctx.ellipse(base[0], base[1], hpx * 0.24 * st.sc, hpx * 0.07 * st.sc, 0, 0, Z.TAU); ctx.fill(); ctx.restore();
        const x = lift ? lift[0] : base[0], y = lift ? lift[1] : base[1], h = hpx * st.sc;
        c2.save(); c2.translate(x, y); c2.rotate(st.rot); c2.scale((pc.flip ? -1 : 1) * (Math.abs(st.fx) < 0.04 ? 0.04 * Math.sign(st.fx || 1) : st.fx), 1);
        if (pc.glow) D.glow(c2, 0, -h * 0.5, h * 0.9, pc.glow, 0.5);
        c2.drawImage(img, -(img.width / img.height) * h / 2, -h * 0.968, (img.width / img.height) * h, h);
        c2.restore();
        if (pc.crown) {
          const cimg = Z.imgSync('prop:crown'), ch = h * 0.42, bob = Math.sin(t * 3) * h * 0.02 + (pc.crownHop ? -h * 0.15 * Z.clock.pulse(t, 7) : 0);
          c2.save(); c2.translate(x, y - h * 1.02 + bob); c2.rotate(st.rot + (pc.crownTilt || 0)); c2.drawImage(cimg, -(cimg.width / cimg.height) * ch / 2, -ch, (cimg.width / cimg.height) * ch, ch); c2.restore();
        }
      }
      for (const p of a.props || []) prop(ctx, S, p);
      for (const L of a.fx || []) layer(ctx, S, L);
    },
  });

  // ================================================================== decree: royal edict scroll
  // items: [{ t, label: 'その一', text, dur (typing seconds), icon: 'prop:bow' }], stamps: [{ t, text: '可', x, y, size, color, rot }]
  Z.scene('decree', {
    preload: a => (a.items || []).map(i => i.icon).filter(Boolean).concat(['prop:crown']),
    init: async () => { await Promise.all(['900 80px "Zen Old Mincho"', '700 60px "Zen Old Mincho"', '400 30px "DotGothic16"', '400 80px "Dela Gothic One"'].map(f => document.fonts.load(f, (R.GLYPHS || '') + 'その一二三勅令可承認'))); },
    draw(ctx, S) {
      const a = S.args, t = S.t, sh = S.shot;
      // table: pink checker cloth
      LAYER.checker(ctx, S, { size: 150, a1: '#FFD3E3', a2: '#FFEFF5', scroll: [12, 6], rot: -0.12 });
      LAYER.vignette(ctx, S, { a: 0.18 });
      const open = E.outCubic(Z.clamp((t - sh.t0) / (a.openDur ?? 0.5)));
      const items = a.items || [];
      const pw = a.w ?? 1520, ph = (a.h ?? 920) * open, x0 = (W - pw) / 2, y0 = (H - ph) / 2, y0f = (H - (a.h ?? 920)) / 2;
      // article rows (same layout as the drawing below) -> the camera pushes in on the newest one
      const rowY = []; { let yy = y0f + (a.firstY ?? 350); for (const it of items) { rowY.push(yy); yy += (a.lineH ?? 128) + (String(it.text).split('\n').length - 1) * (it.size ?? 56) * 1.15; } }
      let fi = -1; items.forEach((it, i) => { if (t >= it.t - 0.15) fi = i; });
      const headY = y0f + 200, yA = fi > 0 ? rowY[fi - 1] + 30 : headY, yB = fi >= 0 ? rowY[fi] + 30 : headY;
      const fk = fi >= 0 ? E.inOutCubic(Z.clamp((t - items[fi].t + 0.15) / 0.45)) : 1, fyAbs = Z.lerp(yA, yB, fk);
      const zoom = (a.zoom ?? 1.3) * (1 + 0.012 * Z.clock.pulse(t, 8)), zk = a.zoom === 1 ? 0 : 1;
      const kick = (a.stamps || []).reduce((m, s) => Math.max(m, t >= s.t ? Math.exp(-(t - s.t) * 14) : 0), 0);
      ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.scale(zoom * (1 + 0.03 * kick), zoom * (1 + 0.03 * kick)); ctx.rotate((a.rot ?? -0.015) + 0.01 * kick * Math.sin(t * 60));
      ctx.translate(-W / 2 + (a.focusX ?? 140) * zk, -(zk ? fyAbs : H * 0.55));
      // paper with drop shadow
      ctx.fillStyle = Z.rgba(P.ink, 0.25); ctx.fillRect(x0 + 22, y0 + 26, pw, ph);
      ctx.fillStyle = '#FFF8EC'; ctx.fillRect(x0, y0, pw, ph);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 8; ctx.strokeRect(x0 + 26, y0 + 26, pw - 52, Math.max(0, ph - 52));
      ctx.strokeStyle = Z.rgba(P.goldD, 0.7); ctx.lineWidth = 2; ctx.strokeRect(x0 + 40, y0 + 40, pw - 80, Math.max(0, ph - 80));
      // rolled ends
      for (const yy of [y0, y0 + ph]) { const g = ctx.createLinearGradient(0, yy - 26, 0, yy + 26); g.addColorStop(0, '#E9C99A'); g.addColorStop(0.5, '#FFF3DA'); g.addColorStop(1, '#C9A06A');
        ctx.fillStyle = g; R.roundRect(x0 - 40, yy - 26, pw + 80, 52, 26, ctx); ctx.fill(); ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke(); }
      if (open > 0.6) {
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0 + 30, pw, ph - 60); ctx.clip();
        const al = Z.clamp((open - 0.6) / 0.4);
        ctx.globalAlpha = al;
        // header: crown + 勅令 + ROYAL DECREE
        const cimg = Z.imgSync('prop:crown'); ctx.drawImage(cimg, W / 2 - 70, y0 + 60, 140, 140 * cimg.height / cimg.width);
        ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        font(ctx, 66, 'royal', 900); ctx.fillText(a.title || '勅　令', W / 2, y0 + 205);
        font(ctx, 24, 'dot', 400); ctx.fillStyle = P.red; ctx.fillText(a.sub || 'ROYAL DECREE  ·  THE PRINCESS OF THE WORLD', W / 2, y0 + 252);
        ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 120, y0 + 282); ctx.lineTo(x0 + pw - 120, y0 + 282); ctx.stroke();
        // articles
        let yy = y0 + (a.firstY ?? 350);
        items.forEach((it, i) => {
          const lines = String(it.text).split('\n'), all = [...lines.join('')], dur = it.dur ?? Math.min(1.2, all.length * 0.07), size = it.size ?? 56;
          const y = yy; yy += (a.lineH ?? 128) + (lines.length - 1) * size * 1.15;
          if (t < it.t - 0.05) return;
          const lk = E.outBack(Z.clamp((t - it.t + 0.05) / 0.25));
          ctx.save(); ctx.translate(x0 + 110, y); ctx.scale(lk, lk);
          ctx.fillStyle = P.red; R.roundRect(0, -38, 150, 76, 14, ctx); ctx.fill();
          font(ctx, 40, 'royal', 900); ctx.fillStyle = '#FFF8EC'; ctx.textAlign = 'center'; ctx.fillText(it.label, 75, 2); ctx.restore();
          const shown = Z.clamp((t - it.t) / dur) * all.length;
          font(ctx, size, 'royal', 900); ctx.textAlign = 'left'; ctx.fillStyle = P.ink;
          let ci = 0, xEnd = 0;
          lines.forEach((ln, li) => {
            let xx = x0 + 290 + (li ? size * 0.6 : 0); const ly = y + li * size * 1.15;
            for (const ch of [...ln]) { const kk = Z.clamp(shown - ci); const w = ctx.measureText(ch).width;
              if (kk > 0) { ctx.save(); ctx.globalAlpha = al * kk; ctx.translate(xx + w / 2, ly + (1 - E.outBack(kk)) * -24); ctx.textAlign = 'center'; ctx.fillText(ch, 0, 0); ctx.restore(); }
              xx += w; ci++; }
            xEnd = Math.max(xEnd, xx);
          });
          if (it.icon && t >= it.t + dur * 0.6) { const im = Z.imgSync(it.icon), k2 = E.outBack(Z.clamp((t - it.t - dur * 0.6) / 0.3), 2), ih = (it.iconH ?? 100) * k2;
            const ix = Math.min(xEnd + 30 + (im.width / im.height) * (it.iconH ?? 100) / 2, x0 + pw - 70);
            ctx.save(); ctx.translate(ix, y + 40); ctx.rotate(0.12 * Math.sin(t * 3 + i)); ctx.drawImage(im, -(im.width / im.height) * ih / 2, -ih, (im.width / im.height) * ih, ih); ctx.restore(); }
        });
        ctx.restore();
      }
      // stamps (hanko) slam on
      for (const st of a.stamps || []) {
        if (t < st.t) continue;
        const d = Z.clamp((t - st.t) / 0.16), e = E.outExpo(d), sz = (st.size ?? 220) * Z.lerp(2.6, 1, e);
        const sx0 = st.item != null ? x0 + (st.dx ?? 950) : st.x ?? W / 2 + 420, sy0 = st.item != null ? rowY[st.item] + (st.dy ?? 75) : st.y ?? H / 2 + 230;
        ctx.save(); ctx.translate(sx0, sy0); ctx.rotate(st.rot ?? -0.18); ctx.globalAlpha = Z.clamp(d * 2) * 0.92;
        ctx.strokeStyle = st.color || P.red; ctx.fillStyle = st.color || P.red; ctx.lineWidth = sz * 0.07;
        if (st.shape === 'square') { ctx.strokeRect(-sz / 2, -sz / 2, sz, sz); } else { ctx.beginPath(); ctx.arc(0, 0, sz / 2, 0, Z.TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, sz * 0.42, 0, Z.TAU); ctx.lineWidth = sz * 0.02; ctx.stroke(); }
        font(ctx, sz * (st.textScale ?? 0.58), 'royal', 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(st.text, 0, sz * 0.03);
        // ink speckles
        for (let i = 0; i < 14; i++) { const an = Z.rnd(i, 5, st.t) * Z.TAU, r = sz * (0.55 + 0.25 * Z.rnd(i, 6, st.t)); D.disc(ctx, Math.cos(an) * r, Math.sin(an) * r, 2 + 5 * Z.rnd(i, 7, st.t), st.color || P.red, e); }
        ctx.restore();
      }
      ctx.restore();
    },
  });

  // ================================================================== slam: pop kinetic typography, one word per cue
  // words: [{ t, text, size, fam, color, bg, burst:[c1,c2], x, y, rot, frame: 'crown'|'heart'|'box', sub, out }], holdLast
  Z.scene('slam', {
    preload: a => ['prop:crown', 'prop:heart'].concat(...(a.words || []).map(w => w.props ? R.preloadProps(w.props) : [])),
    init: async () => { await Promise.all(['400 200px "Dela Gothic One"', '900 200px "Zen Old Mincho"', '800 200px "M PLUS Rounded 1c"', '400 200px "Rampart One"', '400 200px "Reggae One"'].map(f => document.fonts.load(f, (R.GLYPHS || '') + Z.TITLE + '！？!?…WORLDISMINE'))); },
    draw(ctx, S) {
      const a = S.args, t = S.t, words = a.words || [];
      let i = -1; words.forEach((w, j) => { if (t >= w.t) i = j; });
      const w = words[Math.max(0, i)] || {}, dt = i < 0 ? 0 : t - w.t;
      const bgc = w.bg || (i % 2 ? P.hot : P.cream), burst = w.burst || (i % 2 ? [P.pink, P.hot] : [P.rose, P.cream]);
      LAYER.burst(ctx, S, { a1: burst[0], a2: burst[1], n: w.rays ?? 28, speed: w.spin ?? 0.25, x: w.bx ?? W / 2, y: w.by ?? H / 2 });
      if (w.dots) LAYER.dots(ctx, S, Object.assign({ color: Z.rgba('#FFFFFF', 0.35), r: 10, size: 60 }, w.dots));
      for (const L of a.bg || []) layer(ctx, S, L);
      if (w.speed !== false) LAYER.speed(ctx, S, { color: w.speedColor || Z.rgba('#FFFFFF', 0.8), a: 0.6 * Math.exp(-dt * 3), r0: 520, n: 60 });
      void bgc;
      if (i < 0) return;
      for (const p of w.props || []) prop(ctx, S, p);
      const k = E.outBack(Z.clamp(dt / 0.18), 2.6), kick = Math.exp(-dt * 10);
      const size = w.size ?? 260, x = w.x ?? W / 2, y = w.y ?? H / 2, rot = (w.rot ?? (i % 2 ? 0.05 : -0.05)) + kick * 0.08 * (i % 2 ? 1 : -1);
      const tgt = w.front && S.fg ? S.fg : ctx;
      tgt.save(); tgt.translate(x + D.shake(t, 10 * kick, 30, 4)[0], y + D.shake(t, 10 * kick, 30, 4)[1]); tgt.rotate(rot); tgt.scale(Z.lerp(2.2, 1, k), Z.lerp(2.2, 1, k));
      if (w.frame === 'heart') { tgt.fillStyle = w.frameColor || P.cream; R.heartPath(tgt, 0, size * 0.05, size * 1.9); tgt.fill(); tgt.lineWidth = 14; tgt.strokeStyle = P.ink; tgt.stroke(); }
      if (w.frame === 'crown') { const im = Z.imgSync('prop:crown'), ch = size * 1.1; tgt.drawImage(im, -(im.width / im.height) * ch / 2, -size * 0.55 - ch + E.outBack(Z.clamp(dt / 0.3)) * 0, (im.width / im.height) * ch, ch); }
      const lines = String(w.text).split('\n');
      font(tgt, size, w.fam || 'pop', w.weight ?? 400); tgt.textAlign = 'center'; tgt.textBaseline = 'middle';
      lines.forEach((ln, li) => {
        const yy = (li - (lines.length - 1) / 2) * size * (w.lh ?? 1.05);
        tgt.lineJoin = 'round'; tgt.lineWidth = size * (w.strokeW ?? 0.16); tgt.strokeStyle = w.stroke || P.ink; tgt.strokeText(ln, 0, yy);
        if (w.shadow !== false) { tgt.fillStyle = w.shadowColor || P.ink; tgt.fillText(ln, size * 0.05, yy + size * 0.06); }
        tgt.fillStyle = w.color || (i % 2 ? P.cream : P.hot); tgt.fillText(ln, 0, yy);
      });
      if (w.sub) { font(tgt, size * 0.2, 'dot', 400); tgt.fillStyle = w.subColor || P.ink; tgt.fillText(w.sub, 0, size * (0.55 + (lines.length - 1) * 0.52) + size * 0.18); }
      tgt.restore();
      for (const L of a.fx || []) layer(ctx, S, L);
    },
  });

  // ================================================================== rtitle: title sequence on the intro riff
  Z.scene('rtitle', {
    preload: a => R.preloadProps(a.props).concat(['prop:crown', 'prop:queen:pink', 'prop:king:navy', 'prop:knight:white', 'prop:pawn:cream', 'prop:rook:cream', 'prop:bishop:mint']),
    init: async () => { await Promise.all(['900 160px "Zen Old Mincho"', '400 160px "Dela Gothic One"', '400 30px "DotGothic16"', '500 30px "Zen Kaku Gothic New"', '800 60px "M PLUS Rounded 1c"'].map(f => document.fonts.load(f, Z.TITLE + Z.TITLE_SUB + Z.CREDIT + 'ROYAL DECREE PRESENTS 0123456789'))); },
    draw(ctx, S) {
      const a = S.args, t = S.t, cu = a.cues || {}, sh = S.shot;
      // background: cream with slow pink checker + burst once the crown lands
      LAYER.checker(ctx, S, { size: 135, a1: '#FFE3EE', a2: P.cream, scroll: [20, 10], rot: -0.1 });
      const land = cu.crown != null ? Z.clamp((t - cu.crown) / 0.45) : 1;
      if (cu.crown != null && t >= cu.crown) { ctx.save(); ctx.globalAlpha = Z.clamp((t - cu.crown) / 0.3) * 0.9; LAYER.burst(ctx, S, { a1: '#FFC2D9', a2: P.cream, n: 32, speed: 0.12, y: 470 }); ctx.restore(); }
      // the board slides up from the bottom (perspective)
      const bk = cu.board != null ? E.outCubic(Z.clamp((t - cu.board) / 1.2)) : 1;
      const cam = camera({ yaw: 0.0 + 0.04 * Math.sin(t * 0.4), pitch: 0.38, dist: 14, fov: 0.7, ty: 0, tz: 0, sy: Z.lerp(900, 420, bk) });
      drawBoard(ctx, cam, { n: 8, a: '#FFE1EC', b: '#FF8DB8' }, t);
      // pieces pop up on beats after the board
      const pcs = [['pawn', 'cream', 1, 1], ['rook', 'cream', 6, 1], ['bishop', 'mint', 2, 3], ['knight', 'white', 5, 3], ['king', 'navy', 4, 5], ['queen', 'pink', 3, 5]];
      const pb = cu.pieces != null ? beatsIn(cu.pieces, cu.pieces + 4) : [];
      const list = [];
      pcs.forEach(([ty, v, c, r], i) => {
        const at = pb[i] ?? (cu.pieces != null ? cu.pieces + i * 0.18 : -1); if (t < at) return;
        let hy = 0; if (cu.dance != null && t >= cu.dance) { const u = Z.clock.phase(t), odd = (Z.clock.beat(t) + i) & 1; hy = (odd ? 0.28 : 0.14) * 4 * u * (1 - u); }
        const kk = E.outBack(Z.clamp((t - at) / 0.3), 2.4), b = cam.p(c - 4 + 0.5, hy, r - 4 + 0.5), tp = cam.p(c - 4 + 0.5, 1.6 + hy, r - 4 + 0.5); if (!b || !tp) return;
        list.push([b[2], () => { const img = Z.imgSync(`prop:${ty}:${v}`), h = (b[1] - tp[1]) * kk; ctx.drawImage(img, b[0] - (img.width / img.height) * h / 2, b[1] - h * 0.968, (img.width / img.height) * h, h); }]);
      });
      list.sort((u, v) => v[0] - u[0]).forEach(([, f]) => f());
      // crown drops onto the title
      const cimg = Z.imgSync('prop:crown');
      if (cu.crown != null && t >= cu.crown - 0.5) {
        const dk = Z.clamp((t - (cu.crown - 0.5)) / 0.5), y = Z.lerp(-300, 300, E.inQuad(dk)), bounce = t > cu.crown ? Math.exp(-(t - cu.crown) * 7) * Math.sin((t - cu.crown) * 22) * 26 : 0;
        const dpul = cu.dance != null && t >= cu.dance ? Z.clock.downPulse(t, 7) : 0;
        const ch = 230 * (1 + 0.06 * dpul), sq = t > cu.crown ? 1 + 0.15 * Math.exp(-(t - cu.crown) * 10) : 1;
        ctx.save(); ctx.translate(W / 2, y - bounce + 200); ctx.scale(sq, 1 / sq); ctx.rotate(t > cu.crown ? 0.04 * Math.sin((t - cu.crown) * 9) * Math.exp(-(t - cu.crown) * 3) : 0); ctx.drawImage(cimg, -(cimg.width / cimg.height) * ch / 2, -ch, (cimg.width / cimg.height) * ch, ch); ctx.restore();
        if (land > 0 && land < 1) { for (let i = 0; i < 10; i++) { const an = -Math.PI + (i / 9) * Math.PI, r = 160 + 220 * E.outExpo(land); ctx.save(); ctx.globalAlpha = 1 - land; ctx.fillStyle = P.gold; R.starPath(ctx, W / 2 + Math.cos(an) * r, 430 + Math.sin(an) * r * 0.6, 22, 4, 0.3); ctx.fill(); ctx.restore(); } }
      }
      // title text + sub + credit
      if (cu.title != null && t >= cu.title) {
        const chars = [...(a.title || Z.TITLE)], fs = a.titleSize ?? 150; font(ctx, fs, 'pop', 400);
        const widths = chars.map(ch => ctx.measureText(ch).width), total = widths.reduce((x, y) => x + y, 0);
        let xx = W / 2 - total / 2;
        chars.forEach((ch, i) => {
          const kk = Z.clamp((t - cu.title - i * 0.045) / 0.22); if (kk <= 0) { xx += widths[i]; return; }
          const e = E.outBack(kk, 2.4), yy = 520 + (1 - e) * -60 + Math.sin(t * 5 + i * 0.8) * 4 * Z.clamp((t - cu.title - 1) / 0.5);
          ctx.save(); ctx.translate(xx + widths[i] / 2, yy); ctx.scale(e, e); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round'; ctx.lineWidth = 26; ctx.strokeStyle = P.ink; ctx.strokeText(ch, 0, 0); ctx.fillStyle = P.ink; ctx.fillText(ch, 7, 9);
          ctx.fillStyle = i % 2 ? P.hot : '#FF5C9A'; ctx.fillText(ch, 0, 0); ctx.restore();
          xx += widths[i];
        });
      }
      if (cu.sub != null && t >= cu.sub) {
        const kk = Z.clamp((t - cu.sub) / 0.4); ctx.save(); ctx.globalAlpha = kk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        font(ctx, 46, 'round', 800); ctx.fillStyle = P.ink; ctx.fillText((a.sub || Z.TITLE_SUB).split('').join(' '), W / 2, 650);
        font(ctx, 26, 'gothic', 500); ctx.fillStyle = P.ink2; ctx.fillText(a.credit || Z.CREDIT, W / 2, 712);
        ctx.restore();
      }
      for (const L of a.fx || []) layer(ctx, S, L);
      // exit: everything flies up
      if (cu.out != null && t > cu.out) { const k = E.inExpo(Z.clamp((t - cu.out) / Math.max(0.2, sh.t1 - cu.out))); D.fill(ctx, P.hot, k); }
    },
  });

  // ================================================================== road: the night crosswalk climax
  Z.scene('road', {
    preload: () => ['prop:queen:pink', 'prop:king:navy', 'prop:crown'],
    draw(ctx, S) {
      const a = S.args, t = S.t, sh = S.shot;
      D.vgrad(ctx, a.sky || [[0, '#0B0826'], [0.55, '#2A1B5E'], [0.62, '#5B3B8C'], [1, '#140F33']]);
      // stars
      ctx.save(); ctx.fillStyle = '#FFFFFF'; for (let i = 0; i < 90; i++) { const x = Z.rnd(i, 71) * W, y = Z.rnd(i, 72) * H * 0.5; ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(Z.quant(t, 12) * (1 + 2 * Z.rnd(i, 73)) + i)); ctx.fillRect(x, y, 2.4, 2.4); } ctx.restore();
      // skyline
      const hor = a.horizon ?? 600;
      ctx.save(); for (let L = 0; L < 2; L++) { ctx.fillStyle = L ? '#1A1240' : '#2C1E5C'; const R2 = Z.rng(40 + L); let x = -50;
        while (x < W + 50) { const bw = R2.range(80, 190), bh = R2.range(80, 300) * (L ? 0.8 : 1.15); ctx.fillRect(x, hor - bh, bw, bh + 5);
          if (L) { ctx.fillStyle = '#FFE38A'; for (let wy = hor - bh + 18; wy < hor - 14; wy += 30) for (let wx = x + 12; wx < x + bw - 16; wx += 28) if (Z.rnd(Math.floor(wx), Math.floor(wy), 5) < 0.35) ctx.fillRect(wx, wy, 12, 14); ctx.fillStyle = '#1A1240'; }
          x += bw + R2.range(4, 30); } } ctx.restore();
      // road in perspective
      const cam = camera(a.cam || { yaw: 0.1, pitch: 0.2, dist: 7.5, fov: 0.8, tz: 2.0, ty: 0.6, sy: 40 });
      const road = (x0, x1, z0, z1, col) => { const p = [cam.p(x0, 0, z0), cam.p(x1, 0, z0), cam.p(x1, 0, z1), cam.p(x0, 0, z1)]; if (p.some(v => !v)) return; ctx.beginPath(); p.forEach((v, i) => (i ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]))); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
      road(-60, 60, -60, 12, '#221A45');
      road(-60, 60, -2.4, 3.2, '#2E2560');          // the crossing road band
      for (let i = -14; i <= 14; i++) road(i * 0.9 - 0.3, i * 0.9 + 0.3, -1.8, 2.6, '#F2EEF8');   // zebra stripes (the board's rhyme)
      road(-60, 60, 3.2, 3.5, '#6B5CA8'); road(-60, 60, -2.7, -2.4, '#6B5CA8');
      // headlights: from the right, approaching across the crossing
      const la = a.lightsAt ?? sh.t0, pa = a.passAt ?? sh.t1, k = Z.clamp((t - la) / (pa - la));
      const carX = Z.lerp(40, -4, E.inCubic(k)), carZ = 0.4;
      if (t >= la && t < pa + 0.6) {
        const after = Math.max(0, t - pa), cx2 = t < pa ? carX : Z.lerp(-4, -60, E.outCubic(Z.clamp(after / 0.5)));
        for (const dz of [-0.55, 0.55]) {
          const hp = cam.p(cx2, 0.55, carZ + dz); if (!hp) continue;
          const rr = 60 + 900 / Math.max(1, hp[2]) * 6;
          // beam on the road toward -x
          const b0 = cam.p(cx2, 0.02, carZ + dz), b1 = cam.p(cx2 - 9, 0.02, carZ + dz - 1.6), b2 = cam.p(cx2 - 9, 0.02, carZ + dz + 1.6);
          if (b0 && b1 && b2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(b0[0], b0[1], b1[0], b1[1]); g.addColorStop(0, 'rgba(255,250,220,0.55)'); g.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.closePath(); ctx.fill(); ctx.restore(); }
          D.glow(ctx, hp[0], hp[1], rr * 2.2, '#FFF6D0', 0.9); D.disc(ctx, hp[0], hp[1], rr * 0.18, '#FFFFFF');
        }
      }
      // pieces on the crossing: queen in the road, king at the kerb; grab = king slides in and both hop back
      const ga = a.grabAt ?? Infinity;
      const gk = Z.clamp((t - ga) / 0.32), ge = E.inOutCubic(gk);
      const wk = a.walkAt != null ? E.inOutSine(Z.clamp((t - a.walkAt) / (a.walkDur ?? 1.4))) : 1, qz0 = Z.lerp(4.0, 0.6, wk);
      const qPos = [Z.lerp(0.2 + (1 - wk) * 1.2, 0.2, ge), Z.lerp(qz0, 3.9, ge)], kPos = [Z.lerp(-1.2, 0.0, ge), Z.lerp(3.9, 4.3, ge)];
      const hopY = Math.sin(Math.PI * gk) * 0.8;
      const pieces = [['king', 'navy', kPos, hopY * 0.6], ['queen', 'pink', qPos, hopY]];
      pieces.map(([ty, v, [x, z], y]) => { const b = cam.p(x, 0, z), lb = cam.p(x, y, z), tp = cam.p(x, a.ph ?? 1.9, z); return { ty, v, b, lb, tp }; }).filter(o => o.b && o.tp).sort((u, v) => v.b[2] - u.b[2]).forEach(o => {
        const img = Z.imgSync(`prop:${o.ty}:${o.v}`), h = o.b[1] - o.tp[1];
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(o.b[0], o.b[1], h * 0.25, h * 0.07, 0, 0, Z.TAU); ctx.fill(); ctx.restore();
        const lit = t >= la && t < pa ? 0.35 + 0.65 * k : 0.25;
        ctx.save(); ctx.translate(o.lb[0], o.lb[1]); ctx.rotate(o.ty === 'queen' && gk > 0 ? -0.25 * Math.sin(Math.PI * gk) : 0);
        const iw = (img.width / img.height) * h;
        ctx.drawImage(img, -iw / 2, -h * 0.968, iw, h);
        ctx.globalAlpha = 0.6 * (1 - lit); ctx.drawImage(Z.tinted(img, '#1A1240', 'night' + o.ty), -iw / 2, -h * 0.968, iw, h);
        ctx.restore();
        if (o.ty === 'queen') { const ci = Z.imgSync('prop:crown'), cw = h * 0.45; ctx.save(); ctx.translate(o.lb[0], o.lb[1] - h * 1.0); ctx.rotate(gk > 0 ? -0.5 * E.outBack(gk) : 0); ctx.drawImage(ci, -cw * (ci.width / ci.height) / 2, -cw, cw * (ci.width / ci.height), cw); ctx.restore(); }
      });
      // street lamp glow
      for (const L of a.fx || []) layer(ctx, S, L);
    },
  });

  // ================================================================== sign: the warning diamond becomes a heart
  Z.scene('sign', {
    preload: () => ['prop:crown'],
    init: async () => { await Promise.all(['900 90px "Zen Old Mincho"', '400 90px "Dela Gothic One"', '800 60px "M PLUS Rounded 1c"', '400 30px "DotGothic16"'].map(f => document.fonts.load(f, (R.GLYPHS || '') + '……DANGER注意LOVE!'))); },
    draw(ctx, S) {
      const a = S.args, t = S.t;
      D.vgrad(ctx, a.sky || [[0, '#0B0826'], [0.7, '#231B55'], [1, '#3A2470']]);
      // hazard blink on the beat (amber) — slow and soft
      const blink = Math.floor(Z.clock.beat(t)) & 1;
      D.glow(ctx, W / 2, 470, 760, blink ? '#FFB300' : '#FF2E7E', 0.25 + 0.15 * Z.clock.pulse(t, 6));
      LAYER.hearts(ctx, S, { n: 26, a: Z.clamp((t - (a.flipAt ?? 1e9)) / 0.8) * 0.8, size: 26, colors: [P.hot, P.pink, '#FF9CC4'] });
      // pole
      ctx.fillStyle = '#9A9BB8'; ctx.fillRect(W / 2 - 16, 470, 32, 700); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(W / 2 + 4, 470, 12, 700);
      // the diamond, turning (scaleX) at flipAt; symbol: ! (before) → heart (after)
      const fa = a.flipAt ?? 1e9, fk = Z.clamp((t - fa) / 0.5), sx = Math.cos(fk * Math.PI), after = fk >= 0.5;
      const sway = 0.04 * Math.sin(t * 1.6) + (a.hitAt != null && t > a.hitAt ? 0.18 * Math.exp(-(t - a.hitAt) * 4) * Math.sin((t - a.hitAt) * 18) : 0);
      const sz = a.size ?? 300 * (1 + 0.025 * Z.clock.pulse(t, 8));
      ctx.save(); ctx.translate(W / 2, 470); ctx.rotate(sway); ctx.scale(Math.max(0.02, Math.abs(sx)), 1);
      ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz, 0); ctx.closePath();
      ctx.fillStyle = after ? '#FFD6E6' : P.yellow; ctx.fill(); ctx.lineWidth = 18; ctx.strokeStyle = P.ink; ctx.stroke();
      ctx.beginPath(); const in2 = sz * 0.86; ctx.moveTo(0, -in2); ctx.lineTo(in2, 0); ctx.lineTo(0, in2); ctx.lineTo(-in2, 0); ctx.closePath(); ctx.lineWidth = 8; ctx.stroke();
      if (!after) { font(ctx, sz * 0.95, 'pop', 400); ctx.fillStyle = P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('！', 0, sz * 0.04); }
      else { const hb = 1 + 0.12 * Z.clock.pulse(t, 7); ctx.fillStyle = P.hot; R.heartPath(ctx, 0, sz * 0.02, sz * 0.42 * hb); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = P.ink; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-sz * 0.17, -sz * 0.12, sz * 0.06, sz * 0.03, -0.7, 0, Z.TAU); ctx.fill(); }
      ctx.restore();
      // the crown lands crooked on the sign
      if (a.crownAt != null && t >= a.crownAt - 0.4) {
        const ci = Z.imgSync('prop:crown'), dk = Z.clamp((t - (a.crownAt - 0.4)) / 0.4), y = Z.lerp(-260, 470 - sz - 8, E.inQuad(dk)), ch = 120;
        ctx.save(); ctx.translate(W / 2 + 20, y); ctx.rotate(t > a.crownAt ? 0.32 + 0.1 * Math.exp(-(t - a.crownAt) * 5) * Math.sin((t - a.crownAt) * 20) : 0.1); ctx.drawImage(ci, -(ci.width / ci.height) * ch / 2, -ch, (ci.width / ci.height) * ch, ch); ctx.restore();
      }
      // label plate under the diamond
      const lab = after ? (a.labelAfter || 'LOVE') : (a.labelBefore || 'DANGER');
      ctx.save(); ctx.translate(W / 2, 470 + sz + 70); ctx.rotate(sway * 0.5); ctx.fillStyle = after ? P.hot : P.yellow; R.roundRect(-150, -40, 300, 80, 12, ctx); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = P.ink; ctx.stroke();
      font(ctx, 52, 'pop', 400); ctx.fillStyle = after ? P.cream : P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, 0, 4); ctx.restore();
      // closing line typed in (hand)
      if (a.line && a.lineAt != null && t >= a.lineAt) {
        const chars = [...a.line], k2 = Z.clamp((t - a.lineAt) / (a.lineDur ?? 1.4)) * chars.length;
        font(ctx, a.lineSize ?? 76, 'round', 800); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const ws = chars.map(c => ctx.measureText(c).width), tot = ws.reduce((x, y) => x + y, 0); let xx = W / 2 - tot / 2;
        const ly = a.lineY ?? 990;
        chars.forEach((ch, i) => { const kk = Z.clamp(k2 - i); if (kk > 0) { ctx.save(); ctx.translate(xx + ws[i] / 2, ly - (1 - E.outBack(kk)) * 20); ctx.globalAlpha = kk; ctx.textAlign = 'center'; ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.strokeStyle = P.ink; ctx.strokeText(ch, 0, 0); ctx.fillStyle = '#FFE1EE'; ctx.fillText(ch, 0, 0); ctx.restore(); } xx += ws[i]; });
      }
    },
  });

  // ================================================================== endcard
  Z.scene('endcard', {
    preload: () => ['prop:crown', 'prop:heart'],
    init: async () => { await Promise.all(['400 120px "Dela Gothic One"', '800 40px "M PLUS Rounded 1c"', '500 28px "Zen Kaku Gothic New"', '400 22px "DotGothic16"'].map(f => document.fonts.load(f, Z.TITLE + Z.TITLE_SUB + Z.CREDIT + 'fan-made MV · JIZURA vocaloid-style-mv-pipeline ()'))); },
    draw(ctx, S) {
      const a = S.args, t = S.t, lt = S.lt;
      LAYER.checker(ctx, S, { size: 120, a1: '#FFE6F0', a2: P.cream, scroll: [10, 5], rot: -0.1 });
      LAYER.zigzag(ctx, S, { color: P.hot, h: 34, tooth: 54, band: 10, speed: 20 });
      const k = E.outBack(Z.clamp(lt / 0.5), 1.8);
      const ci = Z.imgSync('prop:crown'), ch = 150;
      ctx.save(); ctx.translate(W / 2 + 160, 360 - 8 * Math.sin(t * 2)); ctx.rotate(0.28); ctx.scale(k, k); ctx.drawImage(ci, -(ci.width / ci.height) * ch / 2, -ch, (ci.width / ci.height) * ch, ch); ctx.restore();
      ctx.save(); ctx.translate(W / 2, 450); ctx.scale(k, k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      font(ctx, a.size ?? 130, 'pop', 400); ctx.lineJoin = 'round'; ctx.lineWidth = 24; ctx.strokeStyle = P.ink; ctx.strokeText(a.title || Z.TITLE, 0, 0); ctx.fillStyle = P.ink; ctx.fillText(a.title || Z.TITLE, 6, 8); ctx.fillStyle = P.hot; ctx.fillText(a.title || Z.TITLE, 0, 0);
      ctx.restore();
      const k2 = Z.clamp((lt - 0.4) / 0.5);
      ctx.save(); ctx.globalAlpha = k2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      font(ctx, 42, 'round', 800); ctx.fillStyle = P.ink; ctx.fillText((a.sub || Z.TITLE_SUB).split('').join(' '), W / 2, 580);
      font(ctx, 30, 'gothic', 500); ctx.fillStyle = P.ink2; ctx.fillText(a.credit || Z.CREDIT, W / 2, 660);
      font(ctx, 20, 'dot', 400); ctx.fillStyle = Z.rgba(P.ink, 0.7);
      (a.extra || []).forEach((ln, i) => ctx.fillText(ln, W / 2, 740 + i * 34));
      ctx.restore();
    },
  });

  // ================================================================== transitions
  // zigzag: a band of crown teeth sweeps down, B revealed above it
  Z.transition('zigzag', (ctx, A, B, k, o) => {
    const e = E.inOutCubic(k), y = Z.lerp(-160, H + 160, e), tooth = o.tooth ?? 120, hgt = o.h ?? 90;
    ctx.drawImage(A, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, -10);
    for (let x = 0; x <= W + tooth; x += tooth) { ctx.lineTo(x, y); ctx.lineTo(x + tooth / 2, y + hgt); }
    ctx.lineTo(W + tooth, -10); ctx.closePath(); ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
    ctx.save(); ctx.strokeStyle = o.color || P.gold; ctx.lineWidth = 22; ctx.lineJoin = 'miter'; ctx.beginPath();
    for (let x = 0; x <= W + tooth; x += tooth) { ctx.lineTo(x, y); ctx.lineTo(x + tooth / 2, y + hgt); } ctx.stroke(); ctx.restore();
  });
  // checker: board squares flip in diagonally
  Z.transition('checker', (ctx, A, B, k, o) => {
    const n = o.n ?? 12, s = W / n, rows = Math.ceil(H / s);
    ctx.drawImage(A, 0, 0);
    for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
      const d = Z.clamp(k * 1.8 - ((i + j) / (n + rows)) * 0.8 - (((i + j) & 1) ? 0.08 : 0)); if (d <= 0) continue;
      const e = E.outBack(d, 1.4), w = s * Math.min(1, e);
      ctx.save(); ctx.beginPath(); ctx.rect(i * s + (s - w) / 2, j * s + (s - w) / 2, w, w); ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
    }
  });
  // heart-shaped iris
  Z.transition('heartIris', (ctx, A, B, k, o) => {
    ctx.drawImage(A, 0, 0);
    const cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, r = E.inOutExpo(k) * 1500;
    ctx.save(); R.heartPath(ctx, cx, cy, Math.max(0.1, r)); ctx.clip(); ctx.drawImage(B, 0, 0); ctx.restore();
    if (k > 0 && k < 1) { ctx.save(); R.heartPath(ctx, cx, cy, r); ctx.strokeStyle = Z.rgba(o.color || P.hot, 1 - k); ctx.lineWidth = 16 * (1 - k) + 4; ctx.stroke(); ctx.restore(); }
  });
})();
