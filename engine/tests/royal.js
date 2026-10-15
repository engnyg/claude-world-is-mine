/* engine/tests/royal.js — one shot per royal scene, for stills / timing checks:
 *   node tools/stills.mjs --url "engine/index.html?tl=tests/royal.js" --times 24,28,33,36,40,44.6,48.5,51.5,55 --out render/tests/royal --sheet royal */
(() => {
  const Z = window.Z, P = Z.royal.PAL, W = 1920, H = 1080;
  Z.TITLE = 'ワールドイズマイン'; Z.TITLE_SUB = 'WORLD IS MINE'; Z.ARTIST = 'ryo (supercell) feat. 初音ミク'; Z.CREDIT = 'Music / Lyrics：ryo (supercell)　Vocal：初音ミク';
  Z.setup = async () => {
    Z.LOOK_DEFAULT = { boil: 0.8, bloom: 0.12, bloomThreshold: 0.93, grain: 0.035, vignette: 0.08, lutMix: 0 };
    const S = [];
    const shot = (id, t0, t1, scene, args, extra = {}) => S.push(Object.assign({ id, t0, t1, scene, args, lyric: 'none' }, extra));
    shot('title', 20, 26, 'rtitle', { cues: { board: 20.2, pieces: 21.2, crown: 23.0, title: 23.2, sub: 24.0 } }, { post: { boil: 0 } });
    shot('board', 26, 30, 'board', {
      sky: [[0, '#9FD8FF'], [0.6, '#DDF1FF'], [1, '#FFF1DF']],
      bg: [{ type: 'clouds', n: 7, y0: 60, yr: 300 }],
      board: { n: 8, a: '#FFE1EC', b: '#FF8DB8' },
      cam: { from: { yaw: -0.5, pitch: 0.55, dist: 12, fov: 0.75 }, to: { yaw: 0.3, pitch: 0.48, dist: 10, fov: 0.75 } },
      pieces: [{ type: 'queen', v: 'pink', c: 3, r: 4, h: 1.9, crown: true, hop: [26, 30, 0.25, 2] }, { type: 'king', v: 'navy', c: 4, r: 6, h: 1.9 },
        { type: 'pawn', v: 'cream', c: 1, r: 2, bow: [27, 29.5, 1] }, { type: 'pawn', v: 'cream', c: 2, r: 2, bow: [27.2, 29.5, 1] }, { type: 'knight', v: 'white', c: 6, r: 3, h: 1.7 },
        { type: 'rook', v: 'mint', c: 0, r: 7 }, { type: 'bishop', v: 'lilac', c: 7, r: 6, h: 1.7 }],
      spots: [{ c: 3, r: 4, rad: 0.8, a: 0.5 }],
      fx: [{ type: 'sparkles', n: 20, color: '#FFFFFF' }],
    });
    shot('decree', 30, 34, 'decree', { items: [
      { t: 30.6, label: 'その一', text: '一つめの決まり', icon: 'prop:bow' },
      { t: 31.6, label: 'その二', text: '二つめの決まり', icon: 'prop:shoe' },
      { t: 32.6, label: 'その三', text: '三つめの決まり\nを守ること', icon: 'prop:bubble' }],
      stamps: [{ t: 33.2, text: '可' }] }, { post: { boil: 0.4 } });
    shot('slam', 34, 38, 'slam', { words: [{ t: 34, text: 'テスト\nです！', size: 230 }, { t: 35.5, text: 'ためし', size: 260, frame: 'crown' }, { t: 36.8, text: '見本です！', size: 220, frame: 'heart' }] }, { post: { boil: 0.5 } });
    shot('sweets', 38, 42, 'stage', {
      bg: [{ type: 'burst', a1: '#FFE9B8', a2: '#FFF6E6', n: 30, speed: 0.1, y: 620 }, { type: 'dots', color: 'rgba(255,190,120,0.35)', r: 8, size: 70 }],
      props: [{ img: 'prop:cake', x: 680, y: 920, h: 560, jelly: { amp: 0.04 }, shadow: { a: 0.25 } }, { img: 'prop:pudding', x: 1300, y: 940, h: 520, jelly: { amp: 0.12 }, shadow: { a: 0.25 } }],
      fx: [{ type: 'rain', imgs: ['prop:candy', 'prop:macaron', 'prop:strawberry', 'prop:candy:mint'], n: 18, size: 110, speed: 260 }],
      cam: { zoom: 1.0, zoom2: 1.08, kick: 0.02 },
    });
    shot('road', 42, 46, 'road', { lightsAt: 42.3, grabAt: 44.4, passAt: 45.0 }, { post: { boil: 0.6, bloom: 0.45, bloomThreshold: 0.7 } });
    shot('sign', 46, 50, 'sign', { flipAt: 47.0, crownAt: 48.0, hitAt: 48.0, line: 'テストの一行です', lineAt: 48.3 }, { post: { boil: 0.5, bloom: 0.3, bloomThreshold: 0.8 } });
    shot('end', 50, 53, 'endcard', { extra: ['fan-made MV', 'made with vocaloid-style-mv-pipeline (NikusonP) + JIZURA 字面 (hakoniwa)'] }, { post: { boil: 0 } });
    shot('horse', 53, 57, 'stage', {
      bg: [{ type: 'grad', stops: [[0, '#C9B8FF'], [1, '#FFE6F2']] }, { type: 'canopy', n: 10 }, { type: 'sparkles', n: 30 }],
      props: [{ img: 'prop:horse', x: 960, y: 1180, h: 1000, hop: { amp: 50, every: 2 }, shadow: { a: 0.2 } }],
      cam: { zoom: 1.0, zoom2: 1.05 },
    });
    Z.SHOTS = S;
    window.__zankoMeta.duration = 57;
  };
})();
