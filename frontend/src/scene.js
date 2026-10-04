// 8-bit beach scene drawn behind the courts: ocean, surf, sand, lifeguard towers, palms,
// running path, bike path (with lane icons and moving people), grass and Perry's Cafe.
// It reads court positions from the page ([data-court] cells) so its landmarks line up with the cards.

export function startScene(canvas, scene, wrap) {
  let P = 4; // one art pixel = 4 screen pixels (2 on narrower screens, so small strips still have room for detail)
  const ctx = canvas.getContext('2d');
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const C = {
    ocean: ['#1d4f73', '#235f86', '#2b7598', '#3a8eab', '#56a9ba', '#77c3c6'].map(hex),
    crest: hex('#a9e2e0'), foam: hex('#f6fbf8'), foamEdge: hex('#c7ece9'),
    wet: hex('#c9b089'), wet2: hex('#d6c09a'), sand: hex('#ece2cf'), sandDot: hex('#dccbab'), sandHi: hex('#f7f0e2'),
    run: hex('#cfc8ba'), runJoint: hex('#b8af9e'), runDot: hex('#c2baa9'),
    bike: hex('#c9cccf'), bikeDot: hex('#bcbfc3'), bikeEdge: hex('#ffffff'), bikeLine: hex('#ffffff'), laneGreen: hex('#4fae4a'),
    grass: hex('#6f9f4b'), grass2: hex('#78aa52'), blade: hex('#a2cc6c'), bladeDark: hex('#557f39'), grassEdge: hex('#4b7533'),
    outline: hex('#2a2118'), shadow: hex('#cdbb98'),
    roof: hex('#dfe2e4'), roofSeam: hex('#c6cacd'), vent: hex('#8e9397'), awning: hex('#d9473b'), sign: hex('#f8f4ea'), signText: hex('#c0392b'),
    patio: hex('#dcb796'), patioDot: hex('#cfa784'), umb: hex('#e2533f'), umbEdge: hex('#b93a2a'), umbHi: hex('#f08a74'), umbPole: hex('#7a2a1e'), umbShadow: hex('#a98668'),
  };
  // Lifeguard tower, ramp down to the west (toward the water), painted sky blue.
  const TOWER = [
    '........BBBBBBBBBB....',
    '.......BBBBBBBBBBBB...',
    '......BBBBBBBBBBBBBB..',
    '.......WWWWWWWWWWWW...',
    '.......KKKKKWWWWWWW...',
    '.......KKKKKWWWWWWW...',
    '.......KKKKKWWWWWWW...',
    '.......WWWWWWWWWWWW...',
    '....TTBBBBBBBBBBBBBB..',
    '....TT..D.........D...',
    '...TT...D.........D...',
    '..TT....D.........D...',
    '.TT.....D.........D...',
    'TT......D.........D...',
  ];
  // Bike-lane symbol: rider and bicycle, seen from above as painted on the path.
  const BIKE = [
    '......XX.....',
    '.....XXXX....',
    '......XX.....',
    '.....XXX.....',
    '...XXXXX.....',
    '......XXX....',
    '.....XX.XX...',
    '..XXX..X.XXX.',
    '.X...X.XX...X',
    '.X...XX.X...X',
    '.X...X..X...X',
    '..XXX....XXX.',
  ];
  // People on the bike path, drawn heading north (up); southbound ones are flipped.
  // H hair/helmet, S shirt, a skin, L leg, k bike frame, t tire, D dog, e leash
  const PEOPLE = {
    bike: [[
      '..t..', '..t..', 'akkka', '.SHS.', '.SSS.', '..S..', '..k..', '..t..', '..t..',
    ]],
    walk: [
      ['.H.', 'aSa', '.S.', 'L..'],
      ['.H.', 'aSa', '.S.', '..L'],
    ],
    dog: [
      ['...D.', '..DDD', '..DDD', '...D.', '...e.', '..e..', '.H...', 'aSa..', '.S...', 'L....'],
      ['...D.', '..DDD', '..DDD', '...D.', '...e.', '..e..', '.H...', 'aSa..', '.S...', '..L..'],
    ],
  };
  const SHIRTS = ['#e4572e', '#2e86ab', '#f3a712', '#7b2d8b', '#3bb273', '#ef476f', '#118ab2', '#222222'].map(hex);
  const HAIR = ['#2b1d14', '#6b4226', '#e0c070', '#111111', '#d9473b', '#f2f2f2'].map(hex);
  const DOGS = ['#8b5a2b', '#2a2a2a', '#e9e2d0', '#c8a165'].map(hex);
  const SKIN = ['#f1c27d', '#c68642', '#8d5524', '#ffdbac'].map(hex);
  const BIKE_SMALL = [
    '...XX..',
    '..XX...',
    '.XXXXX.',
    'X.X.X.X',
    '.X...X.',
  ];
  const UMBRELLA = [
    '..rrrrr..',
    '.rhhRRRr.',
    'rhhRRRRRr',
    'rhRRRRRRr',
    'rRRRpRRRr',
    'rRRRRRRRr',
    'rRRRRRRRr',
    '.rRRRRRr.',
    '..rrrrr..',
  ];
  // Tiny 3x5 pixel font for the cafe sign.
  const FONT = {
    P: ['XX.', 'X.X', 'XX.', 'X..', 'X..'], E: ['XXX', 'X..', 'XX.', 'X..', 'XXX'], R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
    Y: ['X.X', 'X.X', '.X.', '.X.', '.X.'], S: ['.XX', 'X..', '.X.', '..X', 'XX.'], "'": ['X', 'X', '.', '.', '.'],
  };
  // Letters stacked top to bottom, each centred in a 3-pixel column.
  function pixelWordV(s) {
    const px = []; let y = 0;
    for (const ch of s) {
      const g = FONT[ch], off = Math.floor((3 - g[0].length) / 2);
      g.forEach((row, cy) => [...row].forEach((c, i) => { if (c === 'X') px.push([off + i, y + cy]); }));
      y += g.length + 1;
    }
    return { px, w: 3, h: y - 1 };
  }
  const PALM = [
    '....gg...gg....',
    '..gGGg.gGGGg...',
    '.gGGGGgGGGGGGg.',
    'gGGg.gGGGg.gGGg',
    'Gg..gGGcGGg..gG',
    'g..gGg.cc.gGg.g',
    '...Gg..TT..gG..',
    '...g...Tt...g..',
    '.......Tt......',
    '......Tt.......',
    '......Tt.......',
    '......tT.......',
    '......Tt.......',
    '.......Tt......',
    '.......Tt......',
    '.......tT......',
    '......TTtt.....',
  ];
  const PP = { G: hex('#4f9a3c'), g: hex('#2f6e2a'), c: hex('#7a4a22'), T: hex('#a57a4c'), t: hex('#7d5a36') };
  const TP = { B: hex('#5aaedb'), W: hex('#8fd0f0'), K: hex('#3a86b4'), D: hex('#6fbde6'), T: hex('#7cc6ea') };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const rnd = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  let W, H, img, t = 0, frame = 0, people = [];
  const gap = px => Math.round(px / P); // keep spacing the same on screen whatever the pixel size
  function cols() {
    const vw = document.documentElement.clientWidth, S = Math.max(20, (vw - 640) / 2) / P, Sr = Math.max(44, (vw - 640) / 2) / P, R = W - Sr;
    // Right side: palms, running path, bike path, grass. The bike lane never gets narrower than 11 art pixels.
    const runW = Math.max(Sr * .1, 2), bikeW = Math.max(Sr * .19, 11), grassW = Math.max(Sr * .46, 9);
    const palmsW = Math.max(0, Sr - runW - bikeW - grassW);
    return { ocean: S * .55, beach: S, palms: R, run: R + palmsW, bike: R + palmsW + runW, grass: R + palmsW + runW + bikeW, S };
  }
  function draw() {
    const k = cols(), d = img.data;
    const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    for (let y = 0; y < H; y++) {
      const shore = Math.round(k.ocean + 1.5 * Math.sin(y * .13 + t * .6) + Math.sin(y * .41 + 1));
      for (let x = 0; x < W; x++) {
        let c;
        if (x < shore - 3) {
          const lv = (x / Math.max(1, shore - 3)) * (C.ocean.length - 1) + BAYER[y & 3][x & 3] / 16 - .5;
          c = C.ocean[Math.max(0, Math.min(C.ocean.length - 1, Math.round(lv)))];
          const crest = (shore - 3 - x + t) % 7 === 0 && rnd(x, y >> 2) > .35;
          if (crest && x > 1) c = C.crest;
        } else if (x < shore) c = x === shore - 3 ? C.foamEdge : C.foam;
        else if (x < k.beach) {
          const f = (x - shore) / Math.max(1, k.beach - shore);
          c = f < .35 ? (BAYER[y & 3][x & 3] / 16 < .5 - f ? C.wet : C.wet2) : f < .6 ? (BAYER[y & 3][x & 3] / 16 < .6 - f ? C.wet2 : C.sand) : C.sand;
          if (c === C.sand && rnd(x, y) > .93) c = C.sandDot;
        } else if (x < k.run) {
          c = rnd(x, y) > .978 ? C.sandDot : rnd(y, x) > .992 ? C.sandHi : C.sand;
        } else if (x < k.bike) {
          c = x === Math.floor(k.run) ? C.runJoint : y % 12 === 0 ? C.runJoint : rnd(x, y) > .9 ? C.runDot : C.run;
        } else if (x < k.grass) {
          const bl = Math.ceil(k.bike), br = Math.ceil(k.grass) - 1, mid = Math.floor((bl + br) / 2);
          c = x === bl || x === br ? C.bikeEdge : (x === mid && (y % 8) < 4 && br - bl >= 4) ? C.bikeLine : rnd(x, y) > .85 ? C.bikeDot : C.bike;
        } else {
          c = x === Math.ceil(k.grass) ? C.grassEdge : (Math.floor(y / 6) % 2 ? C.grass : C.grass2);
          if (rnd(x, y) > .93) c = C.blade;
          else if (rnd(x, y - 1) > .93) c = C.bladeDark;
        }
        put(x, y, c);
      }
    }
    // Green bike-lane markings with a white rider, spaced down the bike path.
    const bl = Math.ceil(k.bike), br = Math.ceil(k.grass) - 1;
    const icon = br - bl - 1 >= BIKE[0].length + 2 ? BIKE : BIKE_SMALL, bw = icon[0].length, bh = icon.length;
    if (br - bl - 1 >= bw + 2) {
      for (let y0 = gap(120); y0 + bh + 4 < H; y0 += gap(340)) {
        for (let y = y0; y < y0 + bh + 4; y++) for (let x = bl + 1; x < br; x++) put(x, y, C.laneGreen);
        const bx = Math.round((bl + br - bw) / 2);
        icon.forEach((row, cy) => [...row].forEach((ch, cx) => { if (ch === 'X') put(bx + cx, y0 + 2 + cy, C.bikeEdge); }));
      }
    }
    // Perry's Cafe on the grass beside the bike path, lined up with the rows holding courts #14 and #11.
    const c14 = document.querySelector('[data-court="North14"]'), c11 = document.querySelector('[data-court="North11"]');
    // On narrow screens the cafe keeps its full size and runs off the right edge, so only its front peeks out.
    const word = pixelWordV("PERRY'S"), fits = W - 2 - (Math.ceil(k.grass) + 2) >= 20;
    const gx0 = Math.ceil(k.grass) + (fits ? 2 : 1), gx1 = fits ? W - 2 : gx0 + 30;
    const sw = word.w + 4, sh = word.h + 4;
    if (c14 && c11) {
      const top = Math.round((c14.getBoundingClientRect().top + scrollY) / P), bot = Math.round((c11.getBoundingClientRect().bottom + scrollY) / P);
      const split = Math.max(top + Math.round((bot - top) * .42), top + sh + 5); // building is always tall enough for the sign
      // building roof with seams, vents and a red awning along its bottom edge
      for (let y = top; y < split; y++) for (let x = gx0; x <= gx1; x++) {
        const edge = y === top || x === gx0 || x === gx1;
        put(x, y, edge ? C.outline : y >= split - 3 ? C.awning : (x - gx0) % 9 === 0 ? C.roofSeam : rnd(x, y) > .985 ? C.vent : C.roof);
      }
      // vertical sign on the building's left edge (the side facing the bike path), reading top to bottom
      const sx = gx0 + 1, sy = top + Math.max(2, Math.round((split - 3 - top - sh) / 2));
      for (let y = sy; y < sy + sh; y++) for (let x = sx; x < sx + sw; x++) put(x, y, y === sy || y === sy + sh - 1 || x === sx || x === sx + sw - 1 ? C.outline : C.sign);
      word.px.forEach(([x, y]) => put(sx + 2 + x, sy + 2 + y, C.signText));
      // patio with red umbrellas
      for (let y = split; y < bot; y++) for (let x = gx0; x <= gx1; x++) put(x, y, rnd(x, y) > .95 ? C.patioDot : C.patio);
      for (let row = 0, uy = split + 3; uy + 9 < bot - 1; row++, uy += 8) {
        for (let ux = gx0 + 2 + (row % 2) * 5; ux + 9 <= gx1 - 1; ux += 10) {
          UMBRELLA.forEach((line, cy) => [...line].forEach((ch, cx) => { if (ch !== '.') put(ux + cx + 2, uy + cy + 2, C.umbShadow); }));
          UMBRELLA.forEach((line, cy) => [...line].forEach((ch, cx) => { if (ch !== '.') put(ux + cx, uy + cy, ch === 'r' ? C.umbEdge : ch === 'h' ? C.umbHi : ch === 'p' ? C.umbPole : C.umb); }));
        }
      }
    }
    // Walkers, bikers and dog walkers: northbound on the right half of the bike path, southbound on the left.
    {
      const mid = Math.floor((bl + br) / 2), lanes = { up: (mid + br) / 2, down: (bl + mid) / 2 };
      for (const pp of people) {
        let rows = PEOPLE[pp.kind][(frame >> 1) % PEOPLE[pp.kind].length];
        if (pp.dir > 0) rows = [...rows].reverse();
        const w = rows[0].length, x0 = Math.round((pp.dir < 0 ? lanes.up : lanes.down) - w / 2), y0 = Math.round(pp.y);
        const pal = { H: pp.hair, S: pp.shirt, a: pp.skin, L: C.outline, k: hex('#6c7177'), t: C.outline, D: pp.dog, e: C.outline };
        rows.forEach((row, cy) => [...row].forEach((ch, cx) => { if (ch !== '.') put(x0 + cx, y0 + cy, pal[ch]); }));
      }
    }
    // Palms on the sand between the courts and the running path.
    const pw = PALM[0].length, ph = PALM.length, proom = k.run - k.palms;
    if (proom >= pw + 2) {
      for (let i = 0, y0 = gap(32); y0 + ph < H; i++, y0 += gap(232)) {
        const x0 = Math.round(k.palms + (proom - pw) / 2 + (i % 2 ? 2 : -2));
        for (let sx = 3; sx < 12; sx++) put(x0 + sx, y0 + ph, C.shadow);
        sprite(PALM, PP, x0, y0);
      }
    }
    // Two towers in the open sand beside the rows of two: left of #16 (below the date, above #14)
    // and left of #2 (below #5, above the South heading).
    const tw = TOWER[0].length, th = TOWER.length;
    for (const id of ['North16', 'North2']) {
      const cell = document.querySelector(`[data-court="${id}"]`);
      if (!cell) continue;
      const c = cell.getBoundingClientRect(), g = cell.parentElement.getBoundingClientRect();
      if (c.left - g.left < (tw + 2) * P) continue;
      const x0 = Math.round(((g.left + c.left) / 2) / P - tw / 2), y0 = Math.round(((c.top + c.bottom) / 2 + scrollY) / P - th / 2);
      for (let i = 3; i < 19; i++) put(x0 + tw - 1 - i, y0 + th, C.shadow);
      sprite(TOWER, TP, x0, y0);
    }
    ctx.putImageData(img, 0, 0);

    // Draws a sprite with a 1-pixel dark outline, 8-bit style.
    function sprite(rows, pal, x0, y0) {
      const h = rows.length, w = rows[0].length;
      const solid = (cx, cy) => cy >= 0 && cy < h && cx >= 0 && cx < w && rows[cy][cx] !== '.';
      for (let cy = -1; cy <= h; cy++) for (let cx = -1; cx <= w; cx++) {
        if (solid(cx, cy)) put(x0 + cx, y0 + cy, pal[rows[cy][cx]]);
        else if (solid(cx - 1, cy) || solid(cx + 1, cy) || solid(cx, cy - 1) || solid(cx, cy + 1)) put(x0 + cx, y0 + cy, C.outline);
      }
    }
  }
  // A walker, biker or dog walker every ~220px of page, each with its own look, direction and speed.
  function spawn() {
    const n = Math.max(4, Math.round(H * P / 220));
    people = Array.from({ length: n }, (_, i) => {
      const r = rnd(i, 7), kind = r < .45 ? 'bike' : r < .8 ? 'walk' : 'dog', pick = (arr, s) => arr[Math.floor(rnd(i, s) * arr.length)];
      return {
        kind, dir: rnd(i, 3) < .5 ? -1 : 1, y: rnd(i, 5) * H,
        speed: (kind === 'bike' ? 1.4 + rnd(i, 9) * .6 : .45 + rnd(i, 11) * .15) * 4 / P,
        shirt: pick(SHIRTS, 13), hair: pick(HAIR, 17), skin: pick(SKIN, 19), dog: pick(DOGS, 23),
      };
    });
  }
  function step() {
    for (const pp of people) pp.y = (((pp.y + pp.dir * pp.speed) + 12) % (H + 24) + (H + 24)) % (H + 24) - 12;
  }
  function size() {
    P = document.documentElement.clientWidth >= 1000 ? 4 : 2;
    const pageH = Math.max(innerHeight, wrap.getBoundingClientRect().bottom + scrollY);
    scene.style.height = pageH + 'px';
    W = Math.ceil(document.documentElement.clientWidth / P); H = Math.ceil(pageH / P);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W * P + 'px'; canvas.style.height = H * P + 'px';
    img = ctx.createImageData(W, H);
    spawn();
    draw();
  }
  addEventListener('resize', size);
  const ro = new ResizeObserver(size);
  ro.observe(wrap); // the page grows or shrinks when the date changes
  size();
  // People move every 150ms; waves step every third tick (450ms).
  const timer = matchMedia('(prefers-reduced-motion: reduce)').matches ? null
    : setInterval(() => { frame++; if (frame % 3 === 0) t++; step(); draw(); }, 150);
  return () => { removeEventListener('resize', size); ro.disconnect(); clearInterval(timer); };
}
