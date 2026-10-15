/* engine/timeline.js -- THE EDIT for ワールドイズマイン (fan-made MV; Music / Lyrics: ryo (supercell), Vocal: 初音ミク).
 *
 * Concept (docs/CONCEPT.md): her word is law and the chessboard world obeys it. No character likeness: the story is
 * told by chess pieces (she is the pink Queen, he is the navy King, the white horse is the white Knight), props
 * (crown, shoe, glove, sweets, stopwatch, warning sign) and typography. All art is procedural (scenes/royal_art.js,
 * scenes/royal.js); JIZURA carries the running lyric with dark-ink plans (a bright film), one light-ink plan at night.
 * Every cue below is an absolute song time taken from analysis/audio.json (beats / bars) or analysis/lyrics_mv.lrc.
 * Storyboard: docs/STORYBOARD.md.
 */
(() => {
  'use strict';
  const Z = window.Z, D = Z.draw, E = Z.ease, R = Z.royal, P = R.PAL;
  const W = 1920, H = 1080;

  // ------------------------------------------------------------------ film identity
  Z.TITLE = 'ワールドイズマイン';
  Z.TITLE_SUB = 'WORLD IS MINE';
  Z.ARTIST = 'ryo (supercell) feat. 初音ミク';
  Z.CREDIT = 'Music / Lyrics：ryo (supercell)　Vocal：初音ミク';
  // rendered on software WebGL (no GPU in the render box) with a low bloom: start the bloom chain at quarter resolution
  Z.POST_BLOOM_SHIFT = 2;

  // ------------------------------------------------------------------ lyric onsets (analysis/lyrics_mv.lrc)
  const LY = {
    sekai0: 4.18, ohime0: 7.50, souiu: 9.64, kokoro: 13.11,
    sono1: 32.12, itsumo: 33.12, kami: 35.04, sono2: 38.87, chanto: 39.59, kutsu: 40.69, iine: 43.35, sono3: 44.15, watashi1: 45.07,
    mittsu: 47.25, henji: 48.91, wakattara: 50.70, migite: 52.70, nantoka: 54.70,
    betsu1: 56.88, wagamama1: 58.34, kimini: 62.69, omotte: 66.09, kawaii: 68.52, sekai1: 69.94, ohime1: 73.10, kigatsuite1: 75.42,
    neenee: 77.22, matase: 78.89, watashiwo: 81.63, dare: 83.97, mou: 87.05, amai: 90.59, imasugu: 94.23, int1: 95.37,
    ketten: 106.30, kawaiino: 107.22, monku: 110.12, anone: 113.11, chanto2: 115.41, chotto: 117.39, asoretone: 118.75, shiroi: 119.93,
    kimatteru: 121.59, mukae: 123.22, kashizu: 124.90, tewo: 127.77, ohime2: 128.51,
    betsu2: 131.04, wagamama2: 132.50, demone: 136.87, sukoshi: 138.31, shikatte: 140.47,
    sekai2: 144.10, ouji: 147.40, kigatsuite2: 149.56, horahora: 151.40, otete: 153.12, mukuchi: 155.77, buaiso: 158.33,
    moudoushite: 161.23, doushite: 161.95, kigatsuiteyo: 164.67,
    zettai: 168.69, kimiwa: 171.59, wakattenai: 172.90, wakattenaiwa: 176.16, int2: 179.60,
    ichigo: 185.14, kodawari: 187.94, minna: 191.07, gaman: 192.51, wagamamana: 193.97, watashidatte: 196.87, atode: 199.67, koukai: 200.51,
    gap: 202.52, touzen: 205.08, datte: 206.52, sekai3: 208.12, hit3: 208.53, ohime3: 211.48, chanto3: 213.59, dokoka: 217.07,
    fuini: 219.77, daki: 221.25, kyuuni: 222.69, e: 224.62, hikareru: 225.28, abunai1: 227.12, souitte: 228.70, soppo: 229.60,
    kocchi: 232.15, abunai2: 233.65, outro: 235.12,
  };

  // ------------------------------------------------------------------ colour script
  const SKY = {
    day: [[0, '#8FD3FF'], [0.55, '#D6F0FF'], [1, '#FFF3E4']],
    pink: [[0, '#FFB3D1'], [0.6, '#FFE3EE'], [1, '#FFF6EA']],
    stage: [[0, '#3A2470'], [0.6, '#7A3E8E'], [1, '#C25C93']],
    lilac: [[0, '#A996FF'], [0.55, '#E3D9FF'], [1, '#FFEAF3']],
    golden: [[0, '#B9A6FF'], [0.5, '#FFD0E4'], [1, '#FFE6BF']],
    grey: [[0, '#A8A4B8'], [0.6, '#D4D0DC'], [1, '#ECE8EE']],
    sunset: [[0, '#5B3B8C'], [0.45, '#FF7EA8'], [0.8, '#FFB36B'], [1, '#FFE0A8']],
    dusk: [[0, '#1B1448'], [0.45, '#4A2F7E'], [0.8, '#B04E88'], [1, '#F08A78']],
    night: [[0, '#0B0826'], [0.45, '#1D1550'], [0.8, '#2E2066'], [1, '#3B2A72']],
  };
  const BOARD = {
    pink: { a: '#FFE1EC', b: '#FF8DB8', side: '#C9457E', side2: '#A93469' },
    lilac: { a: '#F3EDFF', b: '#B9A6FF', side: '#7E66D6', side2: '#654CC0', frame: '#FFF8FF' },
    mint: { a: '#E9FFF9', b: '#86E8D6', side: '#2FA594', side2: '#20877A' },
    grey: { a: '#F1EFF4', b: '#B9B6C4', side: '#8A879A', side2: '#6E6B80', frame: '#F6F4F8' },
    gold: { a: '#FFF3D6', b: '#FFB84D', side: '#D7782A', side2: '#B65F1A' },
    night: { a: '#3C3274', b: '#FF6FA3', side: '#24194F', side2: '#1A1240', frame: '#4A3E86' },
  };

  // ------------------------------------------------------------------ helpers for the board world
  // the court: the queen (pink, crowned) on d4-ish, the king (navy), and their subjects. Square (c, r), 0..7.
  const Q = { c: 3, r: 4 }, K = { c: 5, r: 5 };
  const court = (o = {}) => {
    const bow = o.bow, list = [
      { type: 'pawn', v: 'cream', c: 1, r: 2 }, { type: 'pawn', v: 'cream', c: 2, r: 1 }, { type: 'pawn', v: 'cream', c: 5, r: 1 }, { type: 'pawn', v: 'cream', c: 6, r: 2 },
      { type: 'rook', v: 'mint', c: 0, r: 0 }, { type: 'rook', v: 'mint', c: 7, r: 0 }, { type: 'bishop', v: 'lilac', c: 1, r: 6, h: 1.75 }, { type: 'bishop', v: 'lilac', c: 6, r: 6, h: 1.75 },
      { type: 'knight', v: 'white', c: 6, r: 4, h: 1.7 },
    ].filter(p => !(o.only && !o.only.includes(p.type)));
    list.forEach((p, i) => {
      if (bow) p.bow = [bow[0] + (bow.stagger ?? 0.06) * i, bow[1], p.c < Q.c ? 1 : -1];
      if (o.hop) p.hop = [o.hop[0], o.hop[1], o.hop[2] ?? 0.3, o.hop[3] ?? 1];
      if (o.at != null) p.at = o.at + (o.stagger ?? 0.09) * i;
    });
    const out = [...list];
    if (o.queen !== false) out.push(Object.assign({ type: 'queen', v: 'pink', c: Q.c, r: Q.r, h: 1.95, crown: true, crownHop: !!o.crownHop }, o.queen || {}));
    if (o.king !== false) out.push(Object.assign({ type: 'king', v: 'navy', c: K.c, r: K.r, h: 1.95 }, o.king || {}));
    return out;
  };
  const sq = (c, r) => ({ c, r });
  void sq;

  // ------------------------------------------------------------------ setup
  Z.setup = async (audio) => {
    const lastBar = audio.bars.length ? audio.bars[audio.bars.length - 1].index : 0;
    const B = n => { const b = audio.bars.find(x => x.index === n); return b ? b.start : n > lastBar ? audio.music_cut : 0; };
    const nb = t => audio.beats.reduce((b, x) => (Math.abs(x - t) < Math.abs(b - t) ? x : b), audio.beats[0] ?? t);
    const beats = audio.beats, bi = t => beats.findIndex(b => Math.abs(b - nb(t)) < 1e-6);
    const bt = (t, n) => beats[bi(t) + n];                      // the n-th beat after (or before) the beat nearest t
    // the last chorus accents one beat after the analysed downbeats (docs/AUDIO_MAP.md): its own bar grid
    const k3 = bi(LY.hit3), LB = m => beats[k3 + 4 * m];
    const END = audio.music_cut;                               // dead stop (253.36 s)
    const TAIL = 3.2;
    const beatsBetween = (a, b, every = 1) => beats.filter(x => x >= a - 1e-6 && x < b - 1e-6).filter((x, i) => i % every === 0);

    // ---- sections -> looks
    const secs = audio.sections || [];
    for (const s of secs) s.look = s.label;
    Z.sectionAt = t => { let s = secs[0] || null; for (const x of secs) if (x.start <= t + 1e-6) s = x; return s; };
    // a bright film: low bloom with a high threshold (whites must not bloom), light grain, almost no vignette
    Z.LOOK_DEFAULT = { boil: 0.9, boilFps: 12, bloom: 0.12, bloomThreshold: 0.93, grain: 0.035, vignette: 0.06, lutMix: 0 };
    Z.LOOKS = {
      intro: { boil: 0.7 },
      verse: { boil: 0.9 },
      'pre-chorus': { boil: 1.0, beatCA: 1.2 },
      chorus: { boil: 1.1, bloom: 0.15, beatBloom: 0.05, beatCA: 1.6 },
      'post-chorus': { boil: 1.1, beatCA: 2.2 },
      bridge: { boil: 0.9 },
      'last-chorus': { boil: 1.2, bloom: 0.16, beatBloom: 0.06, beatCA: 2 },
      outro: { boil: 1.0, beatCA: 1.2 },
    };
    const NIGHT_POST = { bloom: 0.2, bloomThreshold: 0.86, vignette: 0.3, grain: 0.05 };   // pink pieces must not bloom to white

    // ---- global punctuation: a cream flash on the three chorus downbeats + the band entry; kick shake in choruses
    const FLASH = [[B(12), 0.5], [B(46), 0.75], [B(97), 0.75], [LY.hit3, 0.85], [nb(LY.touzen), 0.35]];
    const SHAKE = [[B(46), B(63)], [B(97), B(113)], [LY.hit3, B(159)]];
    Z.globalFX = (P2, t) => {
      for (const [ft, a] of FLASH) { const d = t - ft; if (d >= 0 && d < 0.4) { P2.flash = Math.max(P2.flash || 0, a * Math.exp(-d * 10)); P2.flashColor = [1, 0.97, 0.93]; } }
      if (SHAKE.some(([a, b]) => t >= a && t < b)) {
        const q = Math.floor(t * 24), amp = 3.2 * Math.pow(Z.env.low(t), 3);
        P2.shake = [(P2.shake ? P2.shake[0] : 0) + Z.rnds(q, 91) * amp, (P2.shake ? P2.shake[1] : 0) + Z.rnds(q, 92) * amp];
      }
    };

    // ---- JIZURA lyric plans
    let lrc = '';
    try { const r = await fetch(Z.ROOT + 'analysis/lyrics_mv.lrc'); if (r.ok) lrc = await r.text(); } catch (e) { /* no lyrics yet */ }
    lrc = lrc.replace(/^﻿/, '').replace(/^\[ti:.*\]\s*$/m, '');
    if (lrc.trim() && window.J) {
      JZ.setAudio({ duration: audio.duration, beats: audio.beats, energy: null, energyRate: 0 });
      const DENY = {
        layout: 'scatter ring wave labels pill knSeesaw knGearWords knTumble knPadGrid knPathRide zigzag arcTop gridCells bubble ticker searchBar chat notification ticket hanging wordCloud bounceLine elastic stickerBomb keycaps bubbles slotMachine flipBoard dotMatrix equalizer tape contents numbered poster ema ransom newspaper vinyl cassette bookSpine stampSheet calendar chochin routeMap stationSign noren tanzaku omikuji kakejiku shoji clapper warningLabel priceTag nameTag stickyNotes karuta cube flipCards accordion pile blocks balloons magnets tiles bulbs ledScroll billboard crowdBubbles crossword wordSearch puzzle dominoes burst fisheye origami zipper mosaicTiles stencil tyIndexTable tyStatCount typeSpecimen dictionary proofread magazine headlineDeck footnote ribbon flag pendulum knCollide knSlamStack halftoneBig tySquare tyRotBlock subtitleBar tile kaleido polaroid postcard letterPaper genkou panels splitScreen splitHalves wall cylinder cube shadowPlay glitchGrid stack tyErode circle swissGrid knSwapCenter rain filmstrip',
        fx: 'panelWipe irisTrans doors blindsTrans splitSlide gridRepeat whiteFrame blackFrame strobe colorBars mirrorFlash starGlint focusLines speedLines halftone duotone kaleido bulge squash snapshot loopScroll crtOff tvStatic zoomStutter negativeRing edgeDetect hueShift posterize ditherBit rotateSnap invert bandInvert flash bloomFlash',
        // pop film: hearts / stars, confetti, twinkles, zigzag ribbons, polka patches and starbursts stay ON (soap bubbles
        // render as grey discs on the light schemes: off)
        decor: 'dots arrows shapes qrBlock triangleSpin checkerStrip kamon seigaiha asanoha hanabi chochin shimenawa sensu momiji namiGashira memphis stripeCircle cursorClick windowChrome progressBar toggleSwitch notifBell likeCounter mediaControls volumeBars musicNotes dandelion vines cloudPuffs tapePieces staple paperClip indexTabs punchHoles swatches spinner tally bracketsJP loopArrows halfCircles decoCorners tyColophon dateStamp tyTypeScale tyTextRule dataColumns timecodeBar rainStreaks bubbles rainRipples zigzagRibbon polkaPatch starField',
        cam: 'knCardFlip jelly bounce knJumpCut knTiltKick knReadPan knShearKick knRushIn',
        treat: 'boxed marker knWordPlate circled sticker splitColor rainbow chrome',
        enter: 'bubbles stickerPeel crumple loadingBar tokoroten',
        exit: 'balloonOff crumpleOut peelOff sweepCover floodOut overexposeOut',
        bg: 'argyle tartan chevron houndstooth herringbone polka checker retroGrid eqBars kaleidoscope fireworks sunburst bigStripes isoCubes seigaiha asanoha tvBars splitDiag spiralArms squareTunnel moire',
        trans: 'knCornerSwing knStripSlam checker cubeTurn spinOut doorsOpen pixelate knStutterCut uncover cover inkBlob blockDissolve shatterTiles flashCross blinds tyGridCells',
      };
      const MOODS = ['pop', 'emotional', 'graphic', 'calm'];
      const enabled = {};
      for (const g of J.GROUP_KEYS) {
        enabled[g] = {}; const deny = new Set((DENY[g] || '').split(/\s+/).filter(Boolean));
        for (const k of J.order(g)) {
          const d = J.registry(g)[k] || {}, tags = Array.isArray(d.tags) ? d.tags : null;
          let ok = !deny.has(k) && !/^hr[A-Z]/.test(k) && d.set !== 'horror';
          if (ok && MOODS && tags && !tags.some(m => MOODS.includes(m))) ok = false;
          if (k === 'none') ok = true;
          enabled[g][k] = ok;
        }
      }
      const common = {
        enabled, lyrics: lrc, fps: 60, res: 1080, aspect: '16:9', seed: 1408, unify: true, typeset: true, extra: true, wa: false, horror: false,
        colors: { accentOn: true, accent: P.hot, ghostA: '#FF7EB0', ghostB: '#B9A6FF' }, schemes: 'light',
        fx: { motion: 0.75, glitch: 0.2, chroma: 0.4, decor: 0.5, density: 0.5, texture: 0.4, flash: false, koma: 12, hud: 'off', bgSwitch: 0.3 } };
      await JZ.addPlan('main', Object.assign({}, common, { style: 'candy' }));
      await JZ.addPlan('cf', Object.assign({}, common, { style: 'candy', centerFree: true }));
      await JZ.addPlan('pop', Object.assign({}, common, { style: 'sakura', seed: 1409, fx: Object.assign({}, common.fx, { motion: 0.85, decor: 0.6 }) }));
      await JZ.addPlan('popcf', Object.assign({}, common, { style: 'sakura', seed: 1409, centerFree: true, fx: Object.assign({}, common.fx, { motion: 0.85, decor: 0.6 }) }));
      const NIGHT_STYLE = new URLSearchParams(location.search).get('nightStyle') || 'gold';    // ivory text on the night shots (?nightStyle= for style probes)
      await JZ.addPlan('night', Object.assign({}, common, { style: NIGHT_STYLE, schemes: 'dark', seed: 1410, centerFree: true }));
    }
    // ---- on-screen lyric strings are read from analysis/lyrics_mv.lrc at run time: this public repo never stores the
    // lyric text (the LRC is local-only, see README). ly(t) = the row starting at t, markup (* / trailing !) stripped.
    const ROWS = lrc.split('\n').map(l => l.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/)).filter(Boolean)
      .map(m => ({ t: +m[1] * 60 + +m[2], text: m[3].replace(/\*/g, '').replace(/!$/, '').trim() })).filter(r => r.text && r.text !== '[間奏]');
    const ly = t => { const r = ROWS.find(x => Math.abs(x.t - t) < 0.02); return r ? r.text : ''; };
    const brk = (str, n) => str.slice(0, n) + '\n' + str.slice(n);
    // decree articles: [label row, text row(s), icon]
    const art = (n, t, dur) => ({ t, dur, label: ly([LY.sono1, LY.sono2, LY.sono3][n - 1]), icon: ['prop:bow', 'prop:shoe', 'prop:bubble'][n - 1],
      text: n < 3 ? ly([LY.itsumo, LY.chanto][n - 1]).replace('/', '\n') : ly(LY.watashi1).replace('/', '') + '\n' + ly(LY.henji) });
    R.GLYPHS = ROWS.map(r => r.text).join('');              // the scenes' init() preloads these glyphs
    const TXT = Z.TITLE + Z.TITLE_SUB + Z.CREDIT + 'ROYAL DECREE 第条♛0123456789:/.BAR SEC';
    await Promise.all(['400 17px "DotGothic16"', '500 24px "Zen Kaku Gothic New"', '400 80px "Dela Gothic One"', '800 60px "M PLUS Rounded 1c"', '900 80px "Zen Old Mincho"'].map(f => document.fonts.load(f, TXT + R.GLYPHS + '禁止！…WORLDISMINE')));

    // ================================================================== shots
    const S = [];
    const shot = (id, t0, t1, scene, args, extra = {}) => { if (t1 > t0 + 1e-3) S.push(Object.assign({ id, t0, t1, scene, args }, extra)); };
    const NONE = { lyric: 'none' };
    const confetti = (t0, o = {}) => Object.assign({ type: 'confetti', t0, n: 110, burst: true, speed: 520, size: 1.2 }, o);

    // ===== INTRO (bars 0-11): the hook sung over a pad. A spotlight on an empty board; the queen rises into it.
    shot('s01', 0, nb(LY.souiu), 'board', {
      sky: SKY.stage, bg: [{ type: 'sparkles', n: 18, color: '#FFE9F4', size: 18 }],
      board: Object.assign({}, BOARD.pink, { a: '#7A4E86', b: '#3E2456', frame: '#8A6496', side: '#2A1640', side2: '#1E0F30' }),
      cam: { from: { yaw: 0.5, pitch: 0.42, dist: 9.5, fov: 0.7, tx: -0.5, tz: 0.5 }, to: { yaw: 0.15, pitch: 0.3, dist: 7.2, fov: 0.7, tx: -0.5, tz: 0.5 }, ease: 'inOutSine' },
      pieces: [{ type: 'queen', v: 'pink', c: Q.c, r: Q.r, h: 1.95, crown: true, at: nb(LY.ohime0), glow: '#FFE3F0' }],
      spots: [{ c: Q.c, r: Q.r, rad: 0.85, a: 0.6, color: '#FFF4C8', t0: 3.8 }],
    }, { plan: 'night', post: S2 => Object.assign({}, NIGHT_POST, { bloom: 0.3, bloomThreshold: 0.8, vignette: 0.35, fade: 1 - E.inOutSine(Z.clamp((S2.t - 0.4) / 3.2)) }), hudColor: P.cream });
    shot('s02', nb(LY.souiu), B(9), 'board', {
      sky: SKY.stage, bg: [{ type: 'sparkles', n: 26, color: '#FFE9F4', size: 20 }],
      board: Object.assign({}, BOARD.pink, { a: '#8A5A94', b: '#46295E', frame: '#9A74A6', side: '#2A1640', side2: '#1E0F30' }),
      cam: { from: { yaw: -0.25, pitch: 0.5, dist: 11, fov: 0.75 }, to: { yaw: 0.25, pitch: 0.46, dist: 10, fov: 0.75 } },
      pieces: court({ at: nb(LY.souiu) + 0.1, stagger: 0.18, king: false }),
      spots: [{ c: Q.c, r: Q.r, rad: 0.9, a: 0.55, color: '#FFF4C8' }],
    }, { plan: 'night', trans: { type: 'checker', dur: 0.4, n: 10 }, post: Object.assign({}, NIGHT_POST, { bloom: 0.28, bloomThreshold: 0.8, vignette: 0.28 }), hudColor: P.cream });
    // the court bows on the bass, then hangs in the dead stop before the band
    shot('s03', B(9), B(12), 'board', {
      sky: SKY.stage, bg: [{ type: 'sparkles', n: 26, color: '#FFE9F4', size: 22 }],
      board: Object.assign({}, BOARD.pink, { a: '#8A5A94', b: '#46295E', frame: '#9A74A6', side: '#2A1640', side2: '#1E0F30' }),
      cam: { from: { yaw: 0.0, pitch: 0.36, dist: 8.5, fov: 0.75, tx: -0.5, tz: 0.5 }, to: { yaw: -0.05, pitch: 0.26, dist: 6.0, fov: 0.75, tx: -0.5, tz: 0.5 }, ease: 'inQuad' },
      pieces: court({ bow: [B(10), 20.52, ], king: false }),
      spots: [{ c: Q.c, r: Q.r, rad: 0.9, a: 0.6, color: '#FFF4C8' }],
    }, { plan: 'night', post: S2 => Object.assign({}, NIGHT_POST, { bloom: 0.28, bloomThreshold: 0.8, vignette: 0.3, fade: S2.t > 19.69 && S2.t < 20.86 ? 0.55 : 0 }), hudColor: P.cream });

    // ===== INTRO RIFF (bars 12-19): title sequence
    shot('s04', B(12), nb(LY.sono1), 'rtitle', { cues: { board: B(12), pieces: B(13), crown: B(15), title: B(15) + 0.06, sub: B(17), dance: B(17) }, fx: [{ type: 'sparkles', n: 22, color: '#FFFFFF', size: 26, line: P.ink }] },
      Object.assign({ hud: false, trans: { type: 'flash', dur: 0.12, color: '#FFF6EA' }, post: { boil: 0, bloom: 0.1 } }, NONE));

    // ===== VERSE 1 (bars 20-35): the decree, three numbered articles, a stamp, the empty right hand, a キメ slam
    shot('s05', nb(LY.sono1), nb(LY.kami), 'decree', { items: [art(1, LY.sono1, 1.6)] },
      Object.assign({ trans: { type: 'zigzag', dur: 0.35 }, post: { boil: 0.5 } }, NONE));
    // spot the difference: two queens, one with a new bow; the differences get circled on the beats
    shot('s06', nb(LY.kami), nb(LY.sono2), 'stage', {
      bg: [{ type: 'checker', size: 110, a1: '#FFE3EE', a2: '#FFF6EA', scroll: [30, 0] }, { type: 'grad', stops: [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,214,232,0.6)']] }],
      props: [
        { img: 'prop:queen:pink', x: 750, y: 940, h: 540, shadow: { a: 0.2 }, in: { t: nb(LY.kami), dur: 0.3, from: 'rise', dist: 500 } },
        { img: 'prop:queen:pink', x: 1170, y: 940, h: 540, shadow: { a: 0.2 }, in: { t: nb(LY.kami) + 0.1, dur: 0.3, from: 'rise', dist: 500 } },
        { img: 'prop:bow:hot', x: 750, y: 430, h: 130, rot: -0.15, in: { t: nb(LY.kami) + 0.3, dur: 0.3, from: 'pop' } },
        { img: 'prop:bow:mint', x: 1170, y: 430, h: 150, rot: 0.15, in: { t: nb(LY.kami) + 0.4, dur: 0.3, from: 'pop' }, jelly: { amp: 0.1 } },
      ],
      fx: [{ type: 'text', text: 'BEFORE', x: 750, y: 1015, size: 42, fam: 'round', weight: 800, color: P.cream }, { type: 'text', text: 'AFTER ♥', x: 1170, y: 1015, size: 46, fam: 'round', weight: 800, color: P.hot },
        { type: 'circles', items: [{ t: bt(LY.kami, 4), x: 1170, y: 380, r: 120 }, { t: bt(LY.kami, 6), x: 1170, y: 560, r: 95 }] }],
      cam: { zoom: 1.0, zoom2: 1.04, kick: 0.012 },
    }, { plan: 'cf', trans: { type: 'push', dur: 0.3, dx: -1 } });
    shot('s07', nb(LY.sono2), nb(LY.kutsu), 'decree', { items: [art(1, LY.sono1 - 30), art(2, LY.sono2, 1.2)],
      openDur: 0.01 }, Object.assign({ trans: { type: 'zigzag', dur: 0.3 }, post: { boil: 0.5 } }, NONE));
    // article 2 (shoes): the camera drops to her shoe under a spotlight
    shot('s08', nb(LY.kutsu), nb(LY.iine), 'stage', {
      bg: [{ type: 'grad', stops: [[0, '#FFD3E6'], [1, '#FFF4EA']] }, { type: 'stripes', color: 'rgba(255,255,255,0.45)', w: 60, angle: -0.5, speed: 60 },
        { type: 'spot', x: 960, y: 860, w: 520, a: 0.55, color: '#FFFFFF' }],
      props: [{ img: 'prop:shoe', x: 980, y: 860, h: 400, rot: -0.04, shadow: { a: 0.22, dx: 24, dy: 16 }, in: { t: nb(LY.kutsu), dur: 0.45, from: 'drop', dist: 700 }, bob: { amp: 8, f: 3 } }],
      fx: [{ type: 'sparkles', n: 22, color: '#FFFFFF', size: 30, line: P.ink }],
      cam: { zoom: 1.12, zoom2: 1.0, y: -80, y2: 0, ease: 'outCubic' },
    }, { plan: 'cf', trans: { type: 'push', dur: 0.25, dx: 0, dy: -1 } });
    // one pop slam
    shot('s09', nb(LY.iine), nb(LY.sono3), 'slam', { words: [{ t: LY.iine - 0.05, text: ly(LY.iine), size: 250, frame: 'heart', color: P.hot, burst: [P.rose, P.cream] }] },
      Object.assign({ hud: false, post: { boil: 0.4 } }, NONE));
    shot('s10', nb(LY.sono3), nb(LY.wakattara), 'decree', {
      items: [art(1, LY.sono1 - 30), art(2, LY.sono2 - 30), art(3, LY.sono3, 4.6)],
      stamps: [{ t: nb(LY.henji + 0.5), text: '可', item: 2, dx: 820, dy: 118, size: 150 }], openDur: 0.01,
    }, Object.assign({ trans: { type: 'zigzag', dur: 0.3 }, post: { boil: 0.5 } }, NONE));
    // the empty right hand: a glove in a spotlight, arrows blink on the beats
    shot('s11', nb(LY.wakattara), nb(LY.nantoka), 'stage', {
      bg: [{ type: 'dots', bg: '#FFF1F6', color: '#FFD1E3', r: 14, size: 80, scroll: [20, -10] }, { type: 'spot', x: 1080, y: 900, w: 420, a: 0.5, color: '#FFF6C8' }],
      props: [{ img: 'prop:glove', x: 1080, y: 930, h: 600, rot: 0.08, shadow: { a: 0.2 }, in: { t: nb(LY.wakattara), dur: 0.4, from: 'right' }, bob: { amp: 10, f: 2.6 } }],
      fx: [{ type: 'arrows', x: 1080, y: 620, dist: 380, sides: ['left', 'top'], t0: nb(LY.migite) }],
      cam: { zoom: 1.0, zoom2: 1.06 },
    }, { plan: 'cf', trans: { type: 'push', dur: 0.3, dx: -1 } });
    shot('s12', nb(LY.nantoka), nb(LY.betsu1), 'slam', { words: [{ t: LY.nantoka - 0.04, text: brk(ly(LY.nantoka), 4), size: 250, frame: 'crown', color: P.hot }] },
      Object.assign({ hud: false, post: { boil: 0.5, beatCA: 2 } }, NONE));

    // ===== PRE-CHORUS 1 (bars 36-45): sulky
    shot('s13', nb(LY.betsu1), nb(LY.kimini), 'board', {
      sky: SKY.pink, bg: [{ type: 'clouds', n: 6, y0: 40, yr: 260, color: '#FFFFFF' }],
      board: BOARD.pink,
      cam: { from: { yaw: -0.7, pitch: 0.5, dist: 11.5, fov: 0.75 }, to: { yaw: 0.35, pitch: 0.44, dist: 10.5, fov: 0.75 } },
      pieces: court({ bow: [nb(LY.wagamama1), nb(LY.kimini)], king: { turn: [nb(LY.wagamama1) + 1.2, 0.4] }, queen: { turn: [nb(LY.betsu1) + 0.2, 0.35], sway: 0.05 } }),
      fx: [{ type: 'sparkles', n: 14, color: '#FFFFFF', size: 22 }],
    }, { plan: 'main', trans: { type: 'checker', dur: 0.35 } });
    // a big heart beating between the queen and the king
    shot('s14', nb(LY.kimini), nb(LY.kawaii), 'stage', {
      bg: [{ type: 'burst', a1: '#FFDCEA', a2: '#FFF3F8', n: 28, speed: 0.08, y: 560 }, { type: 'hearts', n: 22, a: 0.8, size: 26 }],
      props: [{ img: 'prop:queen:pink', x: 480, y: 1000, h: 560, shadow: { a: 0.2 }, hop: { amp: 26, every: 2 } }, { img: 'prop:king:navy', x: 1440, y: 1000, h: 600, flip: true, shadow: { a: 0.2 } },
        { img: 'prop:heart', x: 960, y: 560, h: 420, anchor: [0.5, 0.5], beat: 0.12, in: { t: nb(LY.omotte), dur: 0.35, from: 'pop' } }],
      cam: { zoom: 1.04, zoom2: 1.0 },
    }, { plan: 'cf', trans: { type: 'heartIris', dur: 0.4, cx: 960, cy: 560 } });
    shot('s15', nb(LY.kawaii), B(46), 'slam', { words: [{ t: LY.kawaii - 0.04, text: ly(LY.kawaii).slice(0, 4), size: 270, frame: 'heart', color: P.hot }, { t: LY.sekai1, text: ly(LY.sekai1).slice(0, 3) + '…', size: 200, color: P.cream, bg: P.hot, burst: [P.hot, '#FF5C9A'] }] },
      Object.assign({ hud: false, post: S2 => ({ boil: 0.5, fade: S2.t > 70.19 ? 0.35 : 0 }) }, NONE));

    // ===== CHORUS 1 (bars 46-62)
    shot('s16', B(46), nb(LY.ohime1), 'board', {
      sky: SKY.day, bg: [{ type: 'burst', a1: 'rgba(255,255,255,0.35)', a2: 'rgba(0,0,0,0)', n: 30, speed: 0.15, y: 400 }, { type: 'clouds', n: 7, y0: 30, yr: 240 }],
      board: BOARD.pink,
      cam: { from: { yaw: -0.9, pitch: 0.75, dist: 14, fov: 0.75 }, to: { yaw: 0.2, pitch: 0.45, dist: 10, fov: 0.75 }, ease: 'outCubic', kick: 0.03 },
      pieces: court({ bow: [B(46), nb(LY.ohime1)], crownHop: true, king: { hop: [B(46), B(48), 0.25, 2] } }),
      spots: [{ c: Q.c, r: Q.r, rad: 0.9, a: 0.45 }],
      fx: [confetti(B(46))],
    }, { plan: 'pop', trans: { type: 'flash', dur: 0.1, color: '#FFF6EA' } });
    shot('s17', nb(LY.ohime1), nb(LY.kigatsuite1), 'slam', { words: [{ t: LY.ohime1 - 0.04, text: ly(LY.ohime1), size: 250, frame: 'crown', color: P.hot, sub: 'THE PRINCESS OF THE WORLD' }],
      fx: [{ type: 'sparkles', n: 30, color: '#FFFFFF', size: 34 }] }, Object.assign({ hud: false, post: { boil: 0.5 } }, NONE));
    // the queen hops beside a king who doesn't move
    shot('s18', nb(LY.kigatsuite1), nb(LY.matase), 'stage', {
      bg: [{ type: 'checker', size: 130, a1: '#FFCFE2', a2: '#FFF3F8', scroll: [60, 0], rot: -0.12 }],
      props: [{ img: 'prop:king:navy', x: 1250, y: 1020, h: 700, shadow: { a: 0.2 } },
        { img: 'prop:queen:pink', x: 640, y: 1020, h: 640, shadow: { a: 0.2 }, hop: { amp: 70, every: 1, t0: nb(LY.neenee) }, jelly: { amp: 0.06 } },
        { img: 'prop:crown', x: 640, y: 440, h: 160, hop: { amp: 110, every: 1, t0: nb(LY.neenee) } }],
      cam: { zoom: 1.0, zoom2: 1.05, kick: 0.015 },
    }, { plan: 'popcf', trans: { type: 'push', dur: 0.25, dx: -1 } });
    // waiting is out of the question: the stopwatch spins and gets crossed out
    shot('s19', nb(LY.matase), nb(LY.watashiwo), 'stage', {
      bg: [{ type: 'burst', a1: '#FFE9A8', a2: '#FFF7E1', n: 24, speed: -0.3, y: 540 }],
      fx: [{ type: 'clock', x: 960, y: 560, r: 300, speed: 2.5 }, { type: 'xmark', t: nb(LY.matase) + 1.2, x: 960, y: 560, size: 420 }],
      cam: { zoom: 1.0, zoom2: 1.08, kick: 0.02 },
    }, { plan: 'pop', trans: { type: 'zigzag', dur: 0.3 } });
    // low angle on the crowned queen, the court bowing around her
    shot('s20', nb(LY.watashiwo), nb(LY.mou), 'board', {
      sky: SKY.day, bg: [{ type: 'burst', a1: 'rgba(255,214,120,0.35)', a2: 'rgba(0,0,0,0)', n: 22, speed: 0.1, y: 200 }, { type: 'clouds', n: 5, y0: 20, yr: 200 }],
      board: BOARD.pink,
      cam: { from: { yaw: 0.6, pitch: 0.1, dist: 4.6, fov: 0.95, tx: -0.5, ty: 1.1, tz: 0.5 }, to: { yaw: 0.2, pitch: 0.06, dist: 4.0, fov: 0.95, tx: -0.5, ty: 1.2, tz: 0.5 } },
      pieces: court({ bow: [nb(LY.dare), nb(LY.mou)], crownHop: true }),
      fx: [{ type: 'sparkles', n: 24, color: '#FFF6C8', size: 30 }],
    }, { plan: 'popcf', trans: { type: 'checker', dur: 0.3 } });
    // she wants sweets: they arrive on the beats, candy rain
    shot('s21', nb(LY.mou), nb(LY.imasugu), 'stage', {
      bg: [{ type: 'burst', a1: '#FFE6B0', a2: '#FFF6E6', n: 30, speed: 0.12, y: 640 }, { type: 'dots', color: 'rgba(255,170,90,0.28)', r: 9, size: 70 }],
      props: [
        { img: 'prop:cake', x: 640, y: 960, h: 520, shadow: { a: 0.22 }, in: { t: nb(LY.amai), dur: 0.35, from: 'drop' }, jelly: { amp: 0.04 } },
        { img: 'prop:pudding', x: 1300, y: 980, h: 500, shadow: { a: 0.22 }, in: { t: bt(LY.amai, 2), dur: 0.35, from: 'drop' }, jelly: { amp: 0.12 } },
        { img: 'prop:lollipop', x: 210, y: 1000, h: 520, rot: -0.2, in: { t: bt(LY.amai, 4), dur: 0.3, from: 'left' } },
        { img: 'prop:macaron', x: 1720, y: 1000, h: 200, in: { t: bt(LY.amai, 5), dur: 0.3, from: 'right' } },
      ],
      fx: [{ type: 'rain', imgs: ['prop:candy', 'prop:candy:mint', 'prop:strawberry', 'prop:macaron:pink', 'prop:candy:gold'], n: 20, size: 110, speed: 300, t0: nb(LY.mou) }],
      cam: { zoom: 1.06, zoom2: 1.0, kick: 0.012 },
    }, { plan: 'pop', trans: { type: 'zigzag', dur: 0.3 } });
    shot('s22', nb(LY.imasugu), B(63), 'slam', { words: [{ t: LY.imasugu - 0.04, text: brk(ly(LY.imasugu), 4) + '！', size: 240, frame: 'crown', color: P.hot }] },
      Object.assign({ hud: false, post: { boil: 0.5, beatCA: 2 } }, NONE));

    // ===== INTERLUDE 1 (bars 63-70): the pieces dance; WORLD / IS / MINE
    shot('s23', B(63), B(67), 'board', {
      sky: SKY.day, bg: [{ type: 'clouds', n: 7, y0: 30, yr: 280 }],
      board: Object.assign({ wave: 0.16 }, BOARD.mint),
      cam: { from: { yaw: -0.4, pitch: 0.62, dist: 13, fov: 0.75 }, to: { yaw: 1.1, pitch: 0.5, dist: 11.5, fov: 0.75 }, kick: 0.02 },
      pieces: court({ hop: [B(63), B(67), 0.35, 1], crownHop: true, king: { hop: [B(63), B(67), 0.25, 2] } }),
      fx: [{ type: 'sparkles', n: 24, color: '#FFFFFF', size: 26 }],
    }, Object.assign({ trans: { type: 'checker', dur: 0.35 } }, NONE));
    shot('s24', B(67), nb(LY.ketten), 'slam', { words: [
      { t: B(67), text: 'WORLD', size: 300, fam: 'pop', color: P.cream, bg: P.hot, burst: [P.hot, '#FF5C9A'] },
      { t: B(68), text: 'IS', size: 360, fam: 'pop', color: P.hot, burst: [P.rose, P.cream] },
      { t: B(69), text: 'MINE!', size: 320, fam: 'pop', color: P.cream, frame: 'crown', burst: [P.mint, '#BFF6EC'], stroke: P.ink },
      { t: bt(B(69), 2), text: 'MINE!', size: 330, fam: 'pop', color: P.hot, frame: 'crown', burst: [P.gold, '#FFF0B8'] },
    ] }, Object.assign({ hud: false, post: { boil: 0.5, beatCA: 2 } }, NONE));

    // ===== VERSE 2 (bars 71-86): more demands: no flaws, no complaints, listen to me, the white horse, kneel, take my hand
    shot('s25', nb(LY.ketten), nb(LY.monku), 'slam', { words: [
      { t: LY.ketten - 0.04, text: ly(LY.ketten), size: 230, fam: 'royal', weight: 900, color: P.ink, stroke: P.cream, strokeW: 0.1, shadow: false, burst: ['#E7E3EE', '#F7F5FA'] },
      { t: LY.kawaiino, text: ly(LY.kawaiino).slice(0, 4), size: 260, frame: 'heart', color: P.hot, sub: ly(LY.kawaiino).slice(4) },
    ] }, Object.assign({ hud: false, post: { boil: 0.5 } }, NONE));
    // a complaint bubble gets crossed out
    shot('s26', nb(LY.monku), nb(LY.anone), 'stage', {
      bg: [{ type: 'stripes', bg: '#EFFFFA', color: '#C6F5EA', w: 70, angle: -0.6, speed: 80 }],
      props: [{ img: 'prop:bubble', x: 960, y: 820, h: 560, in: { t: nb(LY.monku), dur: 0.3, from: 'pop' }, jelly: { amp: 0.05 } }],
      fx: [{ type: 'text', at: nb(LY.monku) + 0.15, text: ly(LY.monku).slice(0, 2), x: 960, y: 520, size: 170, fam: 'royal', weight: 900, color: P.ink, stroke: false }, { type: 'xmark', t: nb(LY.monku) + 1.1, x: 960, y: 540, size: 520 },
        { type: 'text', at: nb(LY.monku) + 1.5, text: '禁止！', x: 1520, y: 260, size: 120, color: P.red, rot: 0.14 }],
      cam: { zoom: 1.0, zoom2: 1.05, kick: 0.015 },
    }, { plan: 'cf', trans: { type: 'push', dur: 0.25, dx: -1 } });
    // the king faces away across the board; the queen hops for attention
    shot('s27', nb(LY.anone), nb(LY.chotto), 'board', {
      sky: SKY.lilac, bg: [{ type: 'clouds', n: 6, y0: 40, yr: 260 }],
      board: BOARD.lilac,
      cam: { from: { yaw: 2.6, pitch: 0.38, dist: 8.5, fov: 0.75, tx: 0.5, tz: 0.5 }, to: { yaw: 2.85, pitch: 0.32, dist: 7.0, fov: 0.75, tx: 0.5, tz: 0.5 } },
      pieces: [{ type: 'queen', v: 'pink', c: Q.c, r: Q.r, h: 1.95, crown: true, hop: [nb(LY.anone), nb(LY.chotto), 0.4, 1] }, { type: 'king', v: 'navy', c: K.c, r: K.r, h: 1.95, flip: true },
        { type: 'pawn', v: 'cream', c: 1, r: 2 }, { type: 'bishop', v: 'lilac', c: 6, r: 6, h: 1.75 }, { type: 'knight', v: 'white', c: 6, r: 3, h: 1.7 }],
    }, { plan: 'main', trans: { type: 'checker', dur: 0.3 } });
    // a sulky close-up in a halftone burst (two micro-stops)
    shot('s28', nb(LY.chotto), nb(LY.asoretone), 'stage', {
      bg: [{ type: 'solid', color: '#FFD6E8' }, { type: 'halftone', x: 960, y: 560, step: 30, r: 1100, color: '#FF9CC4' }, { type: 'speed', x: 960, y: 560, color: 'rgba(255,255,255,0.85)', r0: 420, n: 60 }],
      props: [{ img: 'prop:queen:pink', x: 960, y: 1180, h: 1100, shadow: { a: 0.2 }, jelly: { amp: 0.05 } }],
      cam: { zoom: 1.0, zoom2: 1.1, ease: 'outCubic' },
    }, { plan: 'popcf', post: { boil: 0.8, beatCA: 2 } });
    // the white horse: a carousel knight
    shot('s29', nb(LY.asoretone), nb(LY.mukae), 'stage', {
      bg: [{ type: 'grad', stops: [[0, '#C9B8FF'], [1, '#FFE6F2']] }, { type: 'stripes', color: 'rgba(255,255,255,0.35)', w: 90, angle: 0, speed: 140 }, { type: 'canopy', n: 10, colors: [P.hot, P.cream] }, { type: 'sparkles', n: 28, color: '#FFFFFF', size: 26 }],
      props: [{ img: 'prop:horse', x: 960, y: 1200, h: 1040, shadow: { a: 0.18 }, in: { t: nb(LY.shiroi), dur: 0.45, from: 'rise', dist: 800 }, hop: { amp: 60, every: 2, t0: nb(LY.shiroi) + 0.45 } },
        { img: 'prop:crown', x: 1500, y: 420, h: 150, rot: 0.2, in: { t: nb(LY.kimatteru), dur: 0.3, from: 'pop' } }],
      cam: { zoom: 1.0, zoom2: 1.04 },
    }, { plan: 'cf', trans: { type: 'zigzag', dur: 0.3 } });
    // the white knight crosses the board to the queen; the whole court kneels
    shot('s30', nb(LY.mukae), nb(LY.tewo), 'board', {
      sky: SKY.golden, bg: [{ type: 'clouds', n: 6, y0: 40, yr: 240, color: '#FFF4FA' }],
      board: BOARD.lilac,
      cam: { from: { yaw: -0.3, pitch: 0.55, dist: 11, fov: 0.75 }, to: { yaw: 0.15, pitch: 0.48, dist: 9.5, fov: 0.75 } },
      pieces: court({ bow: [nb(LY.kashizu) + 0.5, nb(LY.tewo)], only: ['pawn', 'rook', 'bishop'] }).concat([
        { type: 'knight', v: 'white', c: 7, r: 7, h: 1.7, move: [[nb(LY.mukae) + 0.2, 6, 5, 0.35], [bt(LY.mukae, 2), 5, 3, 0.35], [bt(LY.mukae, 4), 4, 4, 0.35]], bow: [nb(LY.kashizu) + 0.5, nb(LY.tewo), -1] }]),
    }, { plan: 'main', trans: { type: 'checker', dur: 0.3 } });
    // the glove reaches in and offers a heart
    shot('s31', nb(LY.tewo), B(87), 'stage', {
      bg: [{ type: 'burst', a1: '#FFDCEA', a2: '#FFF4F9', n: 26, speed: 0.1, x: 960, y: 520 }, { type: 'hearts', n: 18, a: 0.7 }],
      props: [{ img: 'prop:glove', x: 1180, y: 1100, h: 640, rot: -0.35, shadow: { a: 0.18 }, in: { t: nb(LY.tewo), dur: 0.45, from: 'right', dist: 1000 } },
        { img: 'prop:heart', x: 980, y: 560, h: 260, anchor: [0.5, 0.5], beat: 0.15, in: { t: nb(LY.ohime2), dur: 0.35, from: 'pop' } }],
      cam: { zoom: 1.0, zoom2: 1.05 },
    }, { plan: 'cf', trans: { type: 'heartIris', dur: 0.35, cx: 960, cy: 540 } });

    // ===== PRE-CHORUS 2 (bars 87-96): softer
    shot('s32', B(87), nb(LY.demone), 'board', {
      sky: SKY.golden, bg: [{ type: 'clouds', n: 6, y0: 40, yr: 240, color: '#FFF4FA' }],
      board: BOARD.lilac,
      cam: { from: { yaw: 0.9, pitch: 0.5, dist: 11.5, fov: 0.75 }, to: { yaw: -0.2, pitch: 0.42, dist: 10.5, fov: 0.75 } },
      pieces: court({ bow: [nb(LY.wagamama2), nb(LY.demone)], queen: { turn: [nb(LY.betsu2) + 0.2, 0.35] } }),
    }, { plan: 'main', trans: { type: 'checker', dur: 0.35 } });
    shot('s33', nb(LY.demone), nb(LY.shikatte), 'stage', {
      bg: [{ type: 'grad', stops: [[0, '#FFD9EA'], [1, '#FFF2E8']] }, { type: 'dots', color: 'rgba(255,255,255,0.6)', r: 12, size: 90, scroll: [10, -16] }, { type: 'hearts', n: 12, a: 0.5, size: 20 }],
      props: [{ img: 'prop:queen:pink', x: 960, y: 1020, h: 700, shadow: { a: 0.18 }, bob: { amp: 8, f: 1.8 } }, { img: 'prop:heart', x: 1220, y: 360, h: 150, anchor: [0.5, 0.5], beat: 0.1, in: { t: nb(LY.sukoshi), dur: 0.3, from: 'pop' } }],
      cam: { zoom: 1.0, zoom2: 1.12, ease: 'inOutSine' },
    }, { plan: 'cf', trans: { type: 'xfade', dur: 0.4 } });
    shot('s34', nb(LY.shikatte), B(97), 'stage', {
      bg: [{ type: 'burst', a1: '#E6DCFF', a2: '#FAF7FF', n: 26, speed: 0.08, y: 600 }],
      props: [{ img: 'prop:queen:pink', x: 720, y: 1030, h: 660, shadow: { a: 0.2 }, hop: { amp: 30, every: 2 } }, { img: 'prop:king:navy', x: 1220, y: 1030, h: 700, shadow: { a: 0.2 }, flip: true },
        { img: 'prop:heart', x: 970, y: 380, h: 170, anchor: [0.5, 0.5], beat: 0.12, in: { t: nb(LY.shikatte) + 0.7, dur: 0.3, from: 'pop' } }],
      cam: { zoom: 1.0, zoom2: 1.06 },
    }, { plan: 'cf', trans: { type: 'push', dur: 0.25, dx: -1 }, post: S2 => ({ fade: S2.t > 144.34 && S2.t < 144.56 ? 0.4 : 0 }) });

    // ===== CHORUS 2 (bars 97-112): addressed to the prince
    shot('s35', B(97), nb(LY.ouji), 'board', {
      sky: SKY.golden, bg: [{ type: 'burst', a1: 'rgba(255,255,255,0.3)', a2: 'rgba(0,0,0,0)', n: 30, speed: -0.15, y: 400 }, { type: 'clouds', n: 7, y0: 30, yr: 240, color: '#FFF4FA' }],
      board: BOARD.lilac,
      cam: { from: { yaw: 0.9, pitch: 0.75, dist: 14, fov: 0.75, tx: 1.5, tz: 1.5 }, to: { yaw: -0.2, pitch: 0.4, dist: 8.5, fov: 0.75, tx: 1.5, tz: 1.5 }, ease: 'outCubic', kick: 0.03 },
      pieces: court({ bow: [B(97), nb(LY.ouji)], king: { glow: '#FFF0B0' } }),
      spots: [{ c: K.c, r: K.r, rad: 0.9, a: 0.5, color: '#FFF4C8' }],
      fx: [confetti(B(97), { colors: [P.lilac, P.mint, P.gold, P.hot, '#FFFFFF'] })],
    }, { plan: 'pop', trans: { type: 'flash', dur: 0.1, color: '#FFF6EA' } });
    shot('s36', nb(LY.ouji), nb(LY.kigatsuite2), 'slam', { words: [{ t: LY.ouji - 0.04, text: ly(LY.ouji), size: 250, frame: 'crown', color: '#7E66D6', burst: [P.lilac, '#F1EAFF'], sub: 'THE ONLY PRINCE OF MY WORLD' }] },
      Object.assign({ hud: false, post: { boil: 0.5 } }, NONE));
    // she hops, he stays put
    shot('s37', nb(LY.kigatsuite2), nb(LY.otete), 'stage', {
      bg: [{ type: 'checker', size: 130, a1: '#E3D9FF', a2: '#FAF7FF', scroll: [-60, 0], rot: 0.1 }],
      props: [{ img: 'prop:king:navy', x: 640, y: 1020, h: 700, shadow: { a: 0.2 } },
        { img: 'prop:queen:pink', x: 1280, y: 1020, h: 640, shadow: { a: 0.2 }, hop: { amp: 80, every: 1, t0: nb(LY.horahora) }, jelly: { amp: 0.06 } }],
      fx: [{ type: 'arrows', x: 640, y: 560, dist: 330, sides: ['right'], t0: nb(LY.horahora) }],
      cam: { zoom: 1.0, zoom2: 1.05, kick: 0.015 },
    }, { plan: 'popcf', trans: { type: 'push', dur: 0.25, dx: 1 } });
    // the glove callback, a heart bouncing in its palm
    shot('s38', nb(LY.otete), nb(LY.mukuchi), 'stage', {
      bg: [{ type: 'dots', bg: '#F4EEFF', color: '#DCCFFF', r: 14, size: 80, scroll: [-20, 10] }, { type: 'spot', x: 960, y: 920, w: 420, a: 0.5, color: '#FFF6C8' }],
      props: [{ img: 'prop:glove', x: 960, y: 960, h: 600, shadow: { a: 0.2 }, in: { t: nb(LY.otete), dur: 0.35, from: 'rise' }, bob: { amp: 10, f: 2.6 } },
        { img: 'prop:heart', x: 960, y: 520, h: 180, anchor: [0.5, 0.5], hop: { amp: 90, every: 1 }, in: { t: bt(LY.otete, 2), dur: 0.3, from: 'pop' } }],
      fx: [{ type: 'arrows', x: 960, y: 650, dist: 360, sides: ['left', 'right'] }],
    }, { plan: 'cf', trans: { type: 'zigzag', dur: 0.3 } });
    // the silent, unfriendly prince: the king alone, a slow push in a grey-lilac light
    shot('s39', nb(LY.mukuchi), nb(LY.moudoushite), 'board', {
      sky: [[0, '#8C86B8'], [0.6, '#C9C4E6'], [1, '#EEEAF6']], bg: [{ type: 'clouds', n: 5, y0: 40, yr: 220, color: '#F4F2FA' }],
      board: Object.assign({}, BOARD.lilac, { b: '#A99BE0' }),
      cam: { from: { yaw: -0.4, pitch: 0.2, dist: 6.5, fov: 0.8, tx: 1.5, ty: 0.9, tz: 1.5 }, to: { yaw: -0.3, pitch: 0.16, dist: 4.6, fov: 0.8, tx: 1.5, ty: 1.0, tz: 1.5 } },
      pieces: [{ type: 'king', v: 'navy', c: K.c, r: K.r, h: 1.95 }, { type: 'queen', v: 'pink', c: Q.c, r: Q.r, h: 1.95, crown: true, crownHop: true, hop: [nb(LY.buaiso), nb(LY.moudoushite), 0.2, 1] }],
      fx: [{ type: 'text', at: nb(LY.buaiso), text: '……', x: 1260, y: 300, size: 140, color: P.ink, stroke: false }],
    }, { plan: 'cf', trans: { type: 'checker', dur: 0.3 } });
    shot('s40', nb(LY.moudoushite), nb(LY.kigatsuiteyo), 'slam', { words: [
      { t: LY.moudoushite - 0.04, text: ly(LY.moudoushite).split(' ')[0], size: 300, color: P.cream, bg: P.hot, burst: [P.hot, '#FF5C9A'] },
      { t: LY.doushite - 0.02, text: ly(LY.moudoushite).split(' ')[1], size: 260, frame: 'heart', color: P.hot, burst: [P.rose, P.cream] },
    ] }, Object.assign({ hud: false, post: { boil: 0.5, beatCA: 2.4 } }, NONE));
    shot('s41', nb(LY.kigatsuiteyo), B(113), 'stage', {
      bg: [{ type: 'burst', a1: '#FFD6E6', a2: '#FFF3F8', n: 28, speed: -0.45, y: 540 }, { type: 'hearts', n: 16, a: 0.6 }],
      fx: [{ type: 'clock', x: 960, y: 560, r: 290, speed: 5, rim: '#B9A6FF' }],
      cam: { zoom: 1.0, zoom2: 1.15, kick: 0.025, rot: 0, rot2: 0.06 },
    }, { plan: 'pop', trans: { type: 'zigzag', dur: 0.3 } });

    // ===== POST-CHORUS (bars 113-120): three slams
    shot('s42', B(113), nb(LY.wakattenai), 'slam', { words: [
      { t: LY.zettai - 0.04, text: ly(LY.zettai), size: 270, color: P.cream, bg: P.ink, burst: ['#4A2F63', '#2B1A3F'], stroke: P.hot, speedColor: 'rgba(255,126,176,0.7)' },
      { t: LY.kimiwa - 0.04, text: ly(LY.kimiwa), size: 300, color: P.hot, burst: [P.rose, P.cream] },
    ] }, Object.assign({ hud: false, post: { boil: 0.5, beatCA: 2.4 } }, NONE));
    shot('s43', nb(LY.wakattenai), nb(LY.wakattenaiwa), 'slam', { words: [{ t: LY.wakattenai - 0.04, text: brk(ly(LY.wakattenai), 4), size: 260, frame: 'heart', color: P.hot, burst: [P.hot, '#FF5C9A'] }] },
      Object.assign({ hud: false, post: S2 => ({ boil: 0.6, beatCA: 3, glitch: 0.25 * Math.exp(-(S2.t - LY.wakattenai) * 3) }) }, NONE));
    shot('s44', nb(LY.wakattenaiwa), B(121), 'stage', {
      bg: [{ type: 'grad', stops: [[0, '#D7D2E4'], [1, '#F3EFF6']] }, { type: 'dots', color: 'rgba(160,150,190,0.25)', r: 10, size: 70, scroll: [0, 30] }],
      props: [{ img: 'prop:queen:pink', x: 960, y: 1000, h: 640, flip: true, shadow: { a: 0.18 }, to: { h: 520, y: 960 } }, { img: 'prop:crown', x: 990, y: 420, h: 140, rot: 0.25, to: { y: 500, h: 110 } }],
      cam: { zoom: 1.08, zoom2: 0.96 },
    }, { plan: 'cf', trans: { type: 'xfade', dur: 0.35 }, post: { saturation: 0.75 } });

    // ===== INTERLUDE 2 (bars 121-124): tea time. The sweets land on a checker tablecloth
    shot('s45', B(121), nb(LY.ichigo), 'stage', {
      bg: [{ type: 'checker', size: 150, a1: '#FFC9DC', a2: '#FFF5EC', scroll: [0, 40], rot: 0.2 }],
      props: [{ img: 'prop:cake', x: 560, y: 900, h: 430, shadow: { a: 0.25 }, in: { t: B(121), dur: 0.4, from: 'drop' } },
        { img: 'prop:pudding', x: 1360, y: 920, h: 430, shadow: { a: 0.25 }, in: { t: B(122), dur: 0.4, from: 'drop' }, jelly: { amp: 0.1 } },
        { img: 'prop:strawberry', x: 960, y: 460, h: 200, anchor: [0.5, 0.5], in: { t: B(123), dur: 0.3, from: 'pop' }, hop: { amp: 40, every: 1, t0: B(123) } },
        { img: 'prop:candy', x: 300, y: 300, h: 110, rot: 0.4, in: { t: bt(B(123), 2), dur: 0.3, from: 'spin' } }, { img: 'prop:candy:mint', x: 1640, y: 280, h: 110, rot: -0.3, in: { t: bt(B(123), 3), dur: 0.3, from: 'spin' } }],
      cam: { zoom: 1.0, zoom2: 1.05 },
    }, Object.assign({ trans: { type: 'zigzag', dur: 0.35 } }, NONE));

    // ===== BRIDGE (bars 125-137): the sweets she gives up
    shot('s46', nb(LY.ichigo), nb(LY.kodawari), 'stage', {
      bg: [{ type: 'burst', a1: '#FFE3D1', a2: '#FFF7EE', n: 28, speed: 0.1, y: 700 }, { type: 'sparkles', n: 18, color: '#FFFFFF', size: 26 }],
      props: [{ img: 'prop:cake', x: 960, y: 1040, h: 820, shadow: { a: 0.22 }, jelly: { amp: 0.025 }, in: { t: nb(LY.ichigo), dur: 0.35, from: 'rise', dist: 600 } }],
      cam: { zoom: 1.0, zoom2: 1.07 },
    }, { plan: 'cf', trans: { type: 'zigzag', dur: 0.3 } });
    shot('s47', nb(LY.kodawari), nb(LY.minna), 'stage', {
      bg: [{ type: 'burst', a1: '#FFE7A8', a2: '#FFF8E4', n: 28, speed: -0.1, y: 700 }, { type: 'dots', color: 'rgba(230,160,60,0.25)', r: 10, size: 74 }],
      props: [{ img: 'prop:pudding', x: 960, y: 1030, h: 780, shadow: { a: 0.22 }, jelly: { amp: 0.16, decay: 4 }, in: { t: nb(LY.kodawari), dur: 0.35, from: 'drop' } }],
      cam: { zoom: 1.0, zoom2: 1.06 },
    }, { plan: 'cf', trans: { type: 'push', dur: 0.25, dx: -1 } });
    // she gives the sweets up: the cloche comes down and the colour drains
    const gaman = nb(LY.gaman);
    shot('s48', nb(LY.minna), nb(LY.wagamamana), 'stage', {
      bg: [{ type: 'checker', size: 150, a1: '#FFD3E3', a2: '#FFF5EC', scroll: [0, 10], rot: 0.2 }],
      props: [{ img: 'prop:cake', x: 700, y: 900, h: 420, shadow: { a: 0.25 } }, { img: 'prop:pudding', x: 1220, y: 920, h: 420, shadow: { a: 0.25 }, jelly: { amp: 0.1 } },
        { img: 'prop:cloche', x: 960, y: 960, h: 760, shadow: { a: 0.25 }, in: { t: gaman, dur: 0.35, from: 'drop', dist: 1100 } }],
      cam: { zoom: 1.0, zoom2: 1.04 },
    }, { plan: 'cf', trans: { type: 'checker', dur: 0.3 }, post: S2 => ({ saturation: Z.lerp(1, 0.25, E.inOutSine(Z.inv(gaman, gaman + 0.8, S2.t))) }) });
    // the queen alone on a grey board, seen from high above
    shot('s49', nb(LY.wagamamana), nb(LY.watashidatte), 'board', {
      sky: SKY.grey, board: BOARD.grey,
      cam: { from: { yaw: 0.3, pitch: 1.15, dist: 12, fov: 0.7 }, to: { yaw: 0.45, pitch: 1.05, dist: 11, fov: 0.7 } },
      pieces: [{ type: 'queen', v: 'pink', c: Q.c, r: Q.r, h: 1.95, crown: true }],
      spots: [{ c: Q.c, r: Q.r, rad: 0.8, a: 0.4, color: '#FFFFFF' }],
    }, { plan: 'cf', trans: { type: 'xfade', dur: 0.3 }, post: { saturation: 0.35 } });
    // she puffs up, colour comes back
    shot('s50', nb(LY.watashidatte), nb(LY.atode), 'stage', {
      bg: [{ type: 'burst', a1: '#FFD6E6', a2: '#FFF3F8', n: 28, speed: 0.2, y: 620 }, { type: 'sparkles', n: 26, color: '#FFFFFF', size: 30, line: P.ink }],
      props: [{ img: 'prop:queen:pink', x: 960, y: 1030, h: 560, to: { h: 760 }, ease: 'outCubic', shadow: { a: 0.2 }, hop: { amp: 40, every: 2 } }, { img: 'prop:crown', x: 960, y: 420, h: 150, to: { y: 230, h: 210 }, ease: 'outCubic', hop: { amp: 60, every: 2 } }],
      cam: { zoom: 1.0, zoom2: 1.04 },
    }, { plan: 'cf', trans: { type: 'checker', dur: 0.3 }, post: S2 => ({ saturation: Z.lerp(0.35, 1, E.outCubic(Z.inv(S2.shot.t0, S2.shot.t1, S2.t))) }) });
    shot('s51', nb(LY.atode), nb(LY.gap), 'slam', { words: [
      { t: LY.atode - 0.04, text: ly(LY.atode).split('/')[0], size: 230, color: P.ink, stroke: P.cream, strokeW: 0.1, shadow: false, burst: ['#E7E3EE', '#F7F5FA'] },
      { t: LY.koukai - 0.04, text: brk(ly(LY.atode).split('/')[1], 2), size: 230, fam: 'royal', weight: 900, color: P.hot, frame: 'crown' },
    ] }, Object.assign({ hud: false, post: { boil: 0.5 } }, NONE));
    // the held breath (vocal gap 202.5-205.0): darkness, one spotlight, the crown floats down
    shot('s52', nb(LY.gap), nb(LY.touzen), 'board', {
      sky: SKY.stage, board: Object.assign({}, BOARD.pink, { a: '#D9B8CC', b: '#9E4B7C', frame: '#E9D1DE' }),
      cam: { from: { yaw: 0.1, pitch: 0.24, dist: 5.6, fov: 0.75, tx: -0.5, ty: 0.9, tz: 0.5 }, to: { yaw: 0.0, pitch: 0.2, dist: 4.4, fov: 0.75, tx: -0.5, ty: 1.0, tz: 0.5 }, ease: 'inQuad' },
      pieces: [{ type: 'queen', v: 'pink', c: Q.c, r: Q.r, h: 1.95, crown: true, crownHop: false, glow: '#FFE3F0' }],
      spots: [{ c: Q.c, r: Q.r, rad: 0.85, a: 0.65, color: '#FFF4C8' }],
      fx: [{ type: 'sparkles', n: 16, color: '#FFE9F4', size: 18 }],
    }, Object.assign({ trans: { type: 'black', dur: 0.25 }, post: Object.assign({}, NIGHT_POST, { bloom: 0.3, bloomThreshold: 0.8, vignette: 0.4 }), hudColor: P.cream }, NONE));
    shot('s53', nb(LY.touzen), nb(LY.datte), 'slam', { words: [{ t: LY.touzen - 0.04, text: ly(LY.touzen), size: 250, fam: 'royal', weight: 900, frame: 'crown', color: P.hot }] },
      Object.assign({ hud: false, post: { boil: 0.5, beatCA: 2 } }, NONE));
    // the camera rushes at the queen into the last chorus
    shot('s54', nb(LY.datte), LY.hit3, 'board', {
      sky: SKY.sunset, bg: [{ type: 'speed', x: 960, y: 520, color: 'rgba(255,255,255,0.75)', r0: 300, n: 70 }],
      board: BOARD.gold,
      cam: { from: { yaw: -0.3, pitch: 0.5, dist: 12, fov: 0.75, tx: -0.5, tz: 0.5 }, to: { yaw: 0.05, pitch: 0.18, dist: 4.2, fov: 0.85, tx: -0.5, ty: 1.0, tz: 0.5 }, ease: 'inCubic' },
      pieces: court({}),
    }, { plan: 'popcf', trans: { type: 'zoom', dur: 0.25 }, post: S2 => ({ zoomBlur: 0.06 * E.inQuad(S2.p), zoomCenter: [0.5, 0.45] }) });

    // ===== LAST CHORUS (accent 208.53, its own bar grid LB(m)): sunset -> night -> the road
    shot('s55', LY.hit3, nb(LY.ohime3), 'board', {
      sky: SKY.sunset, bg: [{ type: 'burst', a1: 'rgba(255,240,200,0.35)', a2: 'rgba(0,0,0,0)', n: 34, speed: 0.2, y: 640 }, { type: 'clouds', n: 6, y0: 40, yr: 260, color: '#FFE4D0' }],
      board: BOARD.gold,
      cam: { from: { yaw: 1.2, pitch: 0.8, dist: 15, fov: 0.75 }, to: { yaw: 0.0, pitch: 0.46, dist: 10, fov: 0.75 }, ease: 'outCubic', kick: 0.035 },
      pieces: court({ bow: [LY.hit3, nb(LY.ohime3)], crownHop: true, hop: undefined, king: { hop: [LY.hit3, nb(LY.ohime3), 0.3, 2] } }),
      spots: [{ c: Q.c, r: Q.r, rad: 0.95, a: 0.45 }],
      fx: [confetti(LY.hit3, { n: 140 }), { type: 'sparkles', n: 26, color: '#FFFFFF', size: 30 }],
    }, { plan: 'pop', trans: { type: 'flash', dur: 0.1, color: '#FFF6EA' } });
    shot('s56', nb(LY.ohime3), nb(LY.chanto3), 'slam', { words: [{ t: LY.ohime3 - 0.04, text: ly(LY.ohime3), size: 260, frame: 'crown', color: P.hot, burst: [P.gold, '#FFF0B8'], sub: 'THE PRINCESS OF THE WORLD' }],
      fx: [{ type: 'confetti', n: 70, speed: 300 }] }, Object.assign({ hud: false, post: { boil: 0.5, beatCA: 2.2 } }, NONE));
    // night falls on the board; she hops off toward its edge
    shot('s57', nb(LY.chanto3), nb(LY.dokoka), 'board', {
      bg: [{ type: 'skyLerp', from: SKY.sunset, to: SKY.dusk }],
      board: BOARD.gold,
      cam: { from: { yaw: -0.5, pitch: 0.45, dist: 10.5, fov: 0.75 }, to: { yaw: -0.9, pitch: 0.36, dist: 9.5, fov: 0.75 } },
      pieces: court({ queen: { move: [[bt(LY.chanto3, 4), 2, 5, 0.3], [bt(LY.chanto3, 6), 1, 6, 0.3], [bt(LY.chanto3, 8), 0, 7, 0.3]] } }),
    }, { plan: 'main', trans: { type: 'checker', dur: 0.3 } });
    // the night crossing: she walks off, headlights come, the king pulls her back as the car passes
    shot('s58', nb(LY.dokoka), nb(LY.kyuuni), 'road', { walkAt: nb(LY.dokoka), walkDur: 1.6, lightsAt: bt(LY.dokoka, 4), grabAt: nb(LY.fuini) + 0.02, passAt: nb(LY.daki) },
      { plan: 'night', trans: { type: 'black', dur: 0.3 }, post: Object.assign({}, NIGHT_POST, { bloom: 0.5, bloomThreshold: 0.7 }), hudColor: P.cream });
    // time stops, hearts burst; the two pieces close together, her crown slips
    shot('s59', nb(LY.kyuuni), nb(LY.hikareru), 'stage', {
      bg: [{ type: 'solid', color: '#2A1B5E' }, { type: 'halftone', x: 960, y: 560, step: 34, r: 900, color: '#FF5C9A', k: 0.9 }, { type: 'speed', x: 960, y: 560, color: 'rgba(255,214,232,0.7)', r0: 460, n: 70 }, { type: 'hearts', n: 26, a: 0.9, size: 34 }],
      props: [{ img: 'prop:king:navy', x: 1060, y: 1080, h: 820, shadow: { a: 0.3 } }, { img: 'prop:queen:pink', x: 860, y: 1080, h: 760, rot: 0.12, shadow: { a: 0.3 } },
        { img: 'prop:crown', x: 860, y: 340, h: 170, rot: 0.15, to: { rot: 0.5, x: 760, y: 380 }, ease: 'outBack' }],
      cam: { zoom: 1.0, zoom2: 1.08, kick: 0.03 },
    }, { plan: 'night', post: Object.assign({}, NIGHT_POST, { bloom: 0.16, bloomThreshold: 0.9 }), hudColor: P.cream });
    // the warning sign, hazard light
    shot('s60', nb(LY.hikareru), nb(LY.souitte), 'sign', { size: 280, labelBefore: 'DANGER' },
      { plan: 'night', trans: { type: 'zigzag', dur: 0.3, color: P.yellow }, post: Object.assign({}, NIGHT_POST, { bloom: 0.35, bloomThreshold: 0.75 }), hudColor: P.cream });
    // the king turns his back
    shot('s61', nb(LY.souitte), nb(LY.kocchi), 'board', {
      sky: SKY.night, bg: [{ type: 'sparkles', n: 30, color: '#FFFFFF', size: 14 }],
      board: BOARD.night,
      cam: { from: { yaw: -0.25, pitch: 0.2, dist: 5.4, fov: 0.8, tx: 0.5, ty: 0.9, tz: 1.0 }, to: { yaw: -0.15, pitch: 0.16, dist: 4.6, fov: 0.8, tx: 0.5, ty: 1.0, tz: 1.0 } },
      pieces: [{ type: 'queen', v: 'pink', c: 3, r: 5, h: 1.95, crown: true, crownTilt: 0.35 }, { type: 'king', v: 'navy', c: 5, r: 5, h: 1.95, flip: true, turn: [nb(LY.soppo), 0.4] }],
      spots: [{ c: 4, r: 5, rad: 1.4, a: 0.35, color: '#FFD6E8' }],
    }, { plan: 'night', trans: { type: 'checker', dur: 0.3 }, post: Object.assign({}, NIGHT_POST, { bloom: 0.3, bloomThreshold: 0.8 }), hudColor: P.cream });
    // the punchline: the sign turns into a heart; the crown lands on it, crooked
    shot('s62', nb(LY.kocchi), B(161), 'sign', { size: 280, flipAt: nb(LY.abunai2), crownAt: bt(LY.abunai2, 3), hitAt: bt(LY.abunai2, 3), line: ly(LY.kocchi).replace(/…/g, '') + ly(LY.abunai2), lineAt: LY.kocchi, lineDur: 2.4, labelBefore: 'DANGER', labelAfter: 'LOVE' },
      Object.assign({ trans: { type: 'heartIris', dur: 0.35, cx: 960, cy: 470 }, post: Object.assign({}, NIGHT_POST, { bloom: 0.4, bloomThreshold: 0.72 }), hudColor: P.cream }, NONE));

    // ===== OUTRO (bars 159-171): the whole court dances under the night sky, then the title and the dead stop
    shot('s63', B(161), B(166), 'board', {
      sky: SKY.night, bg: [{ type: 'sparkles', n: 40, color: '#FFFFFF', size: 16 }, { type: 'hearts', n: 16, a: 0.5, size: 22 }],
      board: Object.assign({ wave: 0.14 }, BOARD.night),
      cam: { from: { yaw: -0.6, pitch: 0.6, dist: 13, fov: 0.75 }, to: { yaw: 0.9, pitch: 0.5, dist: 11, fov: 0.75 }, kick: 0.02 },
      pieces: court({ hop: [B(161), B(166), 0.35, 1], king: { c: 4, r: 4, hop: [B(161), B(166), 0.3, 2] }, queen: { crownTilt: 0.3, hop: [B(161), B(166), 0.3, 2] } }),
      fx: [{ type: 'confetti', n: 60, speed: 220, colors: [P.hot, P.pink, P.gold, '#FFFFFF'] }],
    }, Object.assign({ trans: { type: 'checker', dur: 0.35 }, post: Object.assign({}, NIGHT_POST, { bloom: 0.35, bloomThreshold: 0.75 }), hudColor: P.cream }, NONE));
    shot('s64', B(166), END, 'rtitle', { cues: { board: B(166) - 2, pieces: B(166) - 1, crown: B(167), title: B(167) + 0.06, sub: B(168), dance: B(168) }, fx: [confetti(B(167), { n: 120 }), { type: 'confetti', n: 50, speed: 240, t0: B(168) }, { type: 'sparkles', n: 22, color: '#FFFFFF', size: 26, line: P.ink }] },
      Object.assign({ hud: false, trans: { type: 'flash', dur: 0.12, color: '#FFF6EA' }, post: { boil: 0 } }, NONE));
    // END CARD (after the dead stop): silence, the crown sits crooked now
    shot('s65', END, END + TAIL, 'endcard', { extra: ['fan-made lyric MV  ·  all art drawn in code', 'built with vocaloid-style-mv-pipeline (NikusonP)  ·  JIZURA 字面 (c) 2026 hakoniwa'] },
      Object.assign({ hud: false, post: { boil: 0, grain: 0.03 } }, NONE));

    Z.SHOTS = S;
    window.__zankoMeta.duration = END + TAIL;

    // ---- HUD: a royal-decree counter, ink on the bright shots, cream at night
    const SEC_NAME = { intro: 'PROLOGUE', verse: 'DECREE', 'pre-chorus': 'BETSUNI', chorus: 'PRINCESS', interlude: 'COURT DANCE', 'post-chorus': 'WAKATTENAI', bridge: 'TEA TIME', break: 'TOUZEN', 'last-chorus': 'PRINCESS', outro: 'CURTAIN', tail: '—' };
    Z.hud = (ctx, St) => {
      const t = St.t, fade = Z.clamp((t - B(1)) / 0.6) * Z.clamp((END - t) / 0.3);
      if (fade <= 0) return;
      const sec = Z.sectionAt(t), si = Math.max(0, secs.indexOf(sec)), col = St.shot.hudColor || P.ink;
      ctx.globalAlpha = 0.62 * fade; ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.textBaseline = 'top';
      D.font(ctx, 17, 'dot', 400); ctx.textAlign = 'left';
      ctx.fillText(`♛ ${Z.TITLE} / ${Z.TITLE_SUB}`, 44, 34);
      ctx.beginPath(); ctx.moveTo(44, 60); for (let i = 0; i < 9; i++) { ctx.lineTo(44 + i * 18 + 9, 60 - 6 * (1 + St.clock.pulse(t, 6))); ctx.lineTo(44 + (i + 1) * 18, 60); } ctx.stroke();
      if (sec) ctx.fillText(`ROYAL DECREE 第${String(si + 1).padStart(2, '0')}条  ${SEC_NAME[sec.label] || String(sec.label).toUpperCase()}`, 44, 70);
      ctx.textAlign = 'right';
      const f = Math.floor(t * 60), tc = [Math.floor(t / 60) % 60, Math.floor(t) % 60, f % 60].map(n => String(n).padStart(2, '0')).join(':');
      ctx.fillText(tc, W - 44, 34);
      ctx.fillText(`BAR ${String(Math.max(0, St.clock.bar(t) + 1)).padStart(3, '0')} / ${String(lastBar).padStart(3, '0')}  ♩=165`, W - 44, 58);
      ctx.textBaseline = 'alphabetic';
      const ib = St.clock.inBar(t);
      for (let i = 0; i < 4; i++) { const x = W - 44 - (4 - i) * 22; ctx.save(); ctx.translate(x + 6, H - 46); ctx.beginPath(); R.heartPath(ctx, 0, 0, 7); if (i === ib) ctx.fill(); else ctx.stroke(); ctx.restore(); }
      ctx.globalAlpha = 0.35 * fade; ctx.fillRect(44, H - 30, (W - 88) * Z.clamp(t / END), 2);
    };

    // ---- 9:16 vertical build
    Z.VERTICAL_CFG = {
      full: ['s04', 's05', 's07', 's09', 's10', 's12', 's15', 's17', 's22', 's24', 's25', 's36', 's40', 's42', 's43', 's51', 's53', 's56', 's62', 's64', 's65'],
      planMap: { main: 'v_main', cf: 'v_main', pop: 'v_pop', popcf: 'v_pop', night: 'v_night' },
      title: Z.TITLE, sub: Z.TITLE_SUB, artist: Z.ARTIST, credits: [B(12), END],
      schemes: 'light', ambience: [255, 232, 242],
    };
  };
})();
