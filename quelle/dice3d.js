/* ==== Würfel: räumliche Würfel (SVG, ohne Bibliothek), 10 Designs + Klassik + Spielleitung, eigene Effekte, Geräusche ====
   Leistung: pro Würfel höchstens 20 Flächen, nur sichtbare werden gezeichnet; Animation ≤ 1 s mit requestAnimationFrame;
   Leuchten über Farbverläufe statt Filter; Partikel sind wenige CSS-animierte Elemente. */
const D3_SETS = {
  klassik: { name: 'Heldenbuch', desc: 'Dunkles Holz mit Goldkanten – der Würfel, mit dem alles begann.', face: ['#2a1d12', '#7a5634'], edge: '#e2ae52', num: '#ffe2a0', glow: 'rgba(226,174,82,.55)', pat: null, free: true,
    fx20: { big: 'sparks', col: ['#ffe08a', '#fff6d6'], shape: 'spark', move: 'burst', n: 14, ray: '#ffd36b' }, fx1: { crack: '#ff9b7a', tint: '#5a1418', extra: 'dim' } },
  koenigsgold: { name: 'Königsgold', desc: 'Tiefschwarzer Obsidian mit polierten Goldkanten, eingravierten Zahlen und filigranen königlichen Ornamenten.', face: ['#030303', '#2a2622'], edge: '#f2c85b', num: '#ffd77a', glow: 'rgba(242,200,91,.55)', pat: 'ornate', patOp: 0.85, style: '', extras: ['crown'], gloss: 1,
    roll: { col: ['#ffd36b', '#fff3c4'], shape: 'spark' },
    fx20: { big: 'crown', col: ['#ffd36b', '#fff6d6', '#f2c85b'], shape: 'spark', move: 'burst', n: 16, ray: '#ffd36b' }, fx1: { crack: '#f2c85b', tint: '#000000', extra: 'dim' } },
  drachenfeuer: { name: 'Drachenfeuer', desc: 'Halbtransparenter, dunkelroter Kristall mit glühenden Lavaadern; im Inneren pulsiert Magma.', face: ['#2a0402', '#a3200c'], edge: '#ff9a3a', num: '#ffc25a', glow: 'rgba(255,110,30,.6)', pat: 'lava', patOp: 0.9, style: 'spikes', extras: ['horns'], glass: 'magma',
    roll: { col: ['#ff8a2a', '#ffd36b', '#ff4a1a'], shape: 'ember' },
    fx20: { big: 'flames', col: ['#ff8a2a', '#ffd36b', '#ff4a1a'], shape: 'ember', move: 'rise', n: 18, ray: '#ff8a2a' }, fx1: { crack: '#ff6a1a', tint: '#1a0a06', extra: 'smoke' } },
  frostherz: { name: 'Frostherz', desc: 'Durchsichtiger, eisblauer Kristall mit eingeschlossenen Luftblasen, Froststrukturen und silbernen Zahlen.', face: ['#5b9cc4', '#e8f8ff'], edge: '#ffffff', num: '#ffffff', numStroke: '#1d4a66', numStrokeW: 1.1, glow: 'rgba(160,225,255,.6)', pat: 'bubbles', patOp: 0.8, style: 'crystal', extras: ['shards2'], glass: 'frost',
    roll: { col: ['#ffffff', '#c8f0ff'], shape: 'flake' },
    fx20: { big: 'flake', col: ['#ffffff', '#c8f0ff'], shape: 'flake', move: 'burst', n: 14, ray: '#d8f6ff' }, fx1: { crack: '#ffffff', tint: '#1d4a66', extra: 'shards' } },
  arkanum: { name: 'Arkanum', desc: 'Tiefvioletter Kristall mit schwebendem Sternenstaub, magischen Runen und leuchtenden Zeichen.', face: ['#14042e', '#5a22a8'], edge: '#d29bff', num: '#f2e2ff', glow: 'rgba(170,90,255,.6)', pat: 'runesv', patOp: 0.9, style: '', extras: ['orbitrunes', 'energy'], glass: 'arcane',
    roll: { col: ['#d29bff', '#ffffff', '#7a3cff'], shape: 'star' },
    fx20: { big: 'runecircle', col: ['#d29bff', '#ffffff', '#7a3cff'], shape: 'rune', move: 'swirl', n: 16, ray: '#c08aff' }, fx1: { crack: '#d29bff', tint: '#000000', extra: 'shrink' } },
  totenbein: { name: 'Totenbein', desc: 'Vergilbter Knochen mit dunklen Rissen, verwitterten Gravuren und schwarzen Zahlen; grünlicher Geisternebel.', face: ['#8a7a52', '#e8dbb4'], edge: '#4a3f28', num: '#141008', glow: 'rgba(90,230,140,.45)', pat: 'cracks', patOp: 0.85, style: 'round', extras: ['knobs', 'mist'],
    roll: { col: ['#6dff9e', '#b8ffcf'], shape: 'ember' },
    fx20: { big: 'ghost', col: ['#6dff9e', '#c8ffd9'], shape: 'ember', move: 'rise', n: 16, ray: '#6dff9e' }, fx1: { crack: '#3a2f1e', tint: '#4a4232', extra: 'dust' } },
  weltenhain: { name: 'Weltenhain', desc: 'Dunkelgrüner Smaragd mit eingeschlossenen Wurzeln, feinen Blattadern und goldenen Naturornamenten.', face: ['#022a14', '#178a4c'], edge: '#e9cf6a', num: '#fff6c8', glow: 'rgba(120,230,150,.5)', pat: 'roots', patOp: 0.8, style: 'wavy', extras: ['vines', 'flowers'], glass: 'leaf',
    roll: { col: ['#c8ff8a', '#fff1a0', '#7aff9e'], shape: 'petal' },
    fx20: { big: 'petals', col: ['#c8ff8a', '#fff1a0', '#7aff9e', '#ffb7e0'], shape: 'petal', move: 'swirl', n: 16, ray: '#d8ffb0' }, fx1: { crack: '#3a2a10', tint: '#4a3a1a', extra: 'wilt' } },
  eisenwerk: { name: 'Eisenwerk', desc: 'Massiver, gebürsteter Stahl mit Messingkanten, mechanischen Gravuren, Zahnrädern und eingestanzten Zahlen.', face: ['#3a3e44', '#c8ccd2'], edge: '#d9a54a', num: '#1a1c20', numStroke: '#e8e8e8', glow: 'rgba(230,150,70,.45)', pat: 'brushed', patOp: 0.7, style: 'plates', extras: ['gear'], gloss: 1,
    roll: { col: ['#ff9a4a', '#ffd08a'], shape: 'spark' },
    fx20: { big: 'gears', col: ['#ff9a4a', '#ffd08a', '#ffffff'], shape: 'gear', move: 'burst', n: 12, ray: '#ffb070' }, fx1: { crack: '#1a1c20', tint: '#2a2c30', extra: 'steam' } },
  blutmond: { name: 'Blutmond', desc: 'Tiefschwarzer Kristall mit dunkelroten Einschlüssen, silbernen Zahlen und blutroten Adern.', face: ['#050102', '#3a0610'], edge: '#ff4a5a', num: '#e8e8ee', glow: 'rgba(230,30,50,.55)', pat: 'bloodveins', patOp: 0.9, style: 'thorns', extras: ['drips'], glass: 'blood',
    roll: { col: ['#ff3a4a', '#8a0010'], shape: 'drop' },
    fx20: { big: 'moon', col: ['#ff3a4a', '#ffb0b0', '#ffffff'], shape: 'drop', move: 'burst', n: 14, ray: '#ff2a3a', rings: 3 }, fx1: { crack: '#ffb0b0', tint: '#120102', extra: 'shards' } },
  himmelslicht: { name: 'Himmelslicht', desc: 'Weissgoldener Marmor mit feinen Goldadern, strahlenden Zahlen und heiligen Symbolen.', face: ['#c9bfa6', '#fffdf4'], edge: '#d4a73a', num: '#b07a10', glow: 'rgba(255,230,160,.7)', pat: 'marblegold', patOp: 0.8, style: 'halo', extras: ['wings'],
    roll: { col: ['#fff6c8', '#ffd36b'], shape: 'spark' },
    fx20: { big: 'pillar', col: ['#fff6c8', '#ffd36b', '#ffffff'], shape: 'feather', move: 'fall', n: 12, ray: '#fff1b0' }, fx1: { crack: '#6a5a40', tint: '#5f5a50', extra: 'dim' } },
  chaosprisma: { name: 'Chaosprisma', desc: 'Schwarzer Opal mit irisierenden Kristallflächen – die Farben verändern sich beim Drehen.', face: ['#050508', '#2a2a3a'], edge: '#ffffff', num: '#ffffff', numStroke: '#000', glow: 'rgba(200,160,255,.55)', pat: 'opal', patOp: 0.8, style: 'jagged', extras: ['prismrays'], iris: true,
    roll: { col: ['#ff5a5a', '#ffd35a', '#5aff8a', '#5ad8ff', '#b05aff'], shape: 'spark' },
    fx20: { big: 'prism', col: ['#ff5a5a', '#ffd35a', '#5aff8a', '#5ad8ff', '#b05aff', '#ff5ae0'], shape: 'star', move: 'burst', n: 20, ray: '#ffffff' }, fx1: { crack: '#ffffff', tint: '#000000', extra: 'flicker' } },
  schatten: { name: 'Schatten der Spielleitung', desc: 'Rauchgraues Glas, die Zahlen in dunklem Rot. Nur für die Spielleitung.', face: ['#0c0c0e', '#3a3a40'], edge: '#8a2a2a', num: '#ff6a6a', glow: 'rgba(200,40,40,.45)', pat: 'smoke', patOp: 0.45, dm: true, style: 'wavy', extras: ['wisps'],
    fx20: { big: 'vortex', col: ['#ff4a4a', '#2a2a2a'], shape: 'spark', move: 'swirl', n: 14, ray: '#ff5a5a' }, fx1: { crack: '#ff6a6a', tint: '#000000', extra: 'smoke' } }
};
const D3_PLAYER = ['koenigsgold', 'drachenfeuer', 'frostherz', 'arkanum', 'totenbein', 'weltenhain', 'eisenwerk', 'blutmond', 'himmelslicht', 'chaosprisma'];
const D3_OLD = { drachenglut: 'drachenfeuer', gebein: 'totenbein', feenhain: 'weltenhain', aether: 'eisenwerk', himmelsglanz: 'himmelslicht', leere: 'arkanum', sternenmeer: 'arkanum', sturmauge: 'chaosprisma' };

/* ---- Einstellungen ---- */
function d3get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function d3set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function d3fx() {
  const v = d3get('hb_dice_fx', '');
  if (v) return v;
  let weak = false; try { weak = matchMedia('(prefers-reduced-motion: reduce)').matches || ((navigator.hardwareConcurrency || 8) <= 4 && (navigator.deviceMemory || 8) <= 3); } catch (e) {}
  return weak ? 'ruhig' : 'voll';
}
const d3sound = () => d3get('hb_dice_snd', '0') === '1';
const d3vol = () => Math.max(0, Math.min(1, +d3get('hb_dice_vol', '0.6')));

/* ---- Vektor- und Quaternion-Rechnung ---- */
const V = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
const Q = { axis: (ax, an) => { const a = V.norm(ax), s = Math.sin(an / 2); return [Math.cos(an / 2), a[0] * s, a[1] * s, a[2] * s]; },
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]],
  rot: (q, v) => { const [w, x, y, z] = q; const t = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])]; return [v[0] + w * t[0] + (y * t[2] - z * t[1]), v[1] + w * t[1] + (z * t[0] - x * t[2]), v[2] + w * t[2] + (x * t[1] - y * t[0])]; },
  fromTo: (a, b) => { a = V.norm(a); b = V.norm(b); const d = V.dot(a, b); if (d > 0.99999) return [1, 0, 0, 0]; if (d < -0.99999) { let ax = V.cross([1, 0, 0], a); if (V.len(ax) < 1e-4) ax = V.cross([0, 1, 0], a); return Q.axis(ax, Math.PI); } const c = V.cross(a, b); const q = [1 + d, c[0], c[1], c[2]]; const l = Math.hypot(...q); return q.map((x) => x / l); } };

/* ---- Körper: Ecken → konvexe Hülle → Flächen mit Zahlen ---- */
const D3_GEO = {};
function d3hull(P) {
  const faces = []; const seen = new Set(); const n = P.length; const eps = 1e-6;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    let nm = V.cross(V.sub(P[j], P[i]), V.sub(P[k], P[i])); if (V.len(nm) < 1e-9) continue; nm = V.norm(nm);
    let d = V.dot(nm, P[i]); let pos = 0, neg = 0; const on = [];
    for (let m = 0; m < n; m++) { const s = V.dot(nm, P[m]) - d; if (s > 1e-4) pos++; else if (s < -1e-4) neg++; else on.push(m); }
    if (pos && neg) continue; if (pos) { nm = V.mul(nm, -1); d = -d; }
    const key = on.slice().sort((a, b) => a - b).join(','); if (seen.has(key)) continue; seen.add(key);
    const c = V.mul(on.reduce((s, m) => V.add(s, P[m]), [0, 0, 0]), 1 / on.length);
    const u = V.norm(V.sub(P[on[0]], c)); const w = V.cross(nm, u);
    on.sort((a, b) => { const pa = V.sub(P[a], c), pb = V.sub(P[b], c); return Math.atan2(V.dot(pa, w), V.dot(pa, u)) - Math.atan2(V.dot(pb, w), V.dot(pb, u)); });
    faces.push({ v: on, n: nm, c });
  }
  return faces;
}
function d3geo(sides) {
  if (D3_GEO[sides]) return D3_GEO[sides];
  const g = (1 + Math.sqrt(5)) / 2; let P;
  if (sides === 4) P = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  else if (sides === 6) { P = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) P.push([x, y, z]); }
  else if (sides === 8) P = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  else if (sides === 12) { P = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) P.push([x, y, z]); for (const a of [-1, 1]) for (const b of [-1, 1]) { P.push([0, a / g, b * g]); P.push([a / g, b * g, 0]); P.push([a * g, 0, b / g]); } }
  else if (sides === 10) {
    const h = 1; const f = (c) => { const T = [0, 0, h], U0 = [1, 0, c], U1 = [Math.cos(2 * Math.PI / 5), Math.sin(2 * Math.PI / 5), c], L0 = [Math.cos(Math.PI / 5), Math.sin(Math.PI / 5), -c]; const nm = V.norm(V.cross(V.sub(U0, T), V.sub(U1, T))); return V.dot(nm, V.sub(L0, T)); };
    let lo = 0.01, hi = 0.9; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Math.sign(f(m)) === Math.sign(f(lo))) lo = m; else hi = m; } const c = (lo + hi) / 2;
    P = [[0, 0, h], [0, 0, -h]]; for (let i = 0; i < 5; i++) { P.push([Math.cos(2 * Math.PI * i / 5), Math.sin(2 * Math.PI * i / 5), c]); P.push([Math.cos(2 * Math.PI * i / 5 + Math.PI / 5), Math.sin(2 * Math.PI * i / 5 + Math.PI / 5), -c]); }
  } else { sides = 20; P = []; for (const a of [-1, 1]) for (const b of [-1, 1]) { P.push([0, a, b * g]); P.push([a, b * g, 0]); P.push([a * g, 0, b]); } }
  const r = Math.max(...P.map(V.len)); P = P.map((p) => V.mul(p, 1 / r));
  const F = d3hull(P);
  /* Zahlen: Gegenseiten ergeben zusammen sides + 1 */
  const val = new Array(F.length).fill(0); let k = 1;
  for (let i = 0; i < F.length; i++) { if (val[i]) continue; let best = -1, bd = 2; for (let j = 0; j < F.length; j++) if (j !== i && !val[j]) { const d = V.dot(F[i].n, F[j].n); if (d < bd) { bd = d; best = j; } } val[i] = k; if (best >= 0 && bd < -0.9 && sides !== 4) val[best] = F.length + 1 - k; k++; while (val.includes(k) && k <= F.length) k++; }
  F.forEach((f, i) => { f.val = val[i]; let far = f.v[0], fd = 0; f.v.forEach((m) => { const d = V.len(V.sub(P[m], f.c)); if (d > fd + 1e-6) { fd = d; far = m; } }); f.up = V.norm(V.sub(P[far], f.c)); if (sides === 6) f.up = V.norm(V.sub(V.mul(V.add(P[f.v[0]], P[f.v[1]]), 0.5), f.c));
    let ri = 1; for (let a = 0; a < f.v.length; a++) { const p = P[f.v[a]], q = P[f.v[(a + 1) % f.v.length]]; const mid = V.mul(V.add(p, q), 0.5); ri = Math.min(ri, V.len(V.sub(mid, f.c))); } f.ri = ri; });
  return (D3_GEO[sides] = { P, F, sides });
}

/* ---- Zeichnen ---- */
const D3_L = V.norm([-0.45, 0.65, 0.75]);
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function shade(set, nz, ndl, n) { const t = Math.max(0, Math.min(1, 0.18 + 0.82 * Math.max(0, ndl))); const sp = set.gloss ? Math.pow(Math.max(0, nz), 10) * 0.42 : Math.pow(Math.max(0, nz), 18) * 0.25;
  if (set.iris && n) { const h = (Math.atan2(n[1], n[0]) * 180 / Math.PI + n[2] * 220 + 720) % 360; return 'hsl(' + h.toFixed(0) + ',' + (55 + 25 * t).toFixed(0) + '%,' + (5 + 30 * t * t + sp * 70).toFixed(0) + '%)'; }
  const a = hex(set.face[0]), b = hex(set.face[1]); return 'rgb(' + a.map((x, i) => Math.round(Math.min(255, x + (b[i] - x) * t + 255 * sp))).join(',') + ')'; }
function d3target(geo, value, tilt) {
  let f = geo.F.find((x) => x.val === value); if (!f) f = geo.F[0];
  let q = Q.fromTo(f.n, [0, 0, 1]); const up = Q.rot(q, f.up); q = Q.mul(Q.axis([0, 0, 1], Math.atan2(up[0], up[1])), q);
  if (tilt) q = Q.mul(Q.axis([1, -0.6, 0], tilt), q);
  return { q, f };
}
/* liefert SVG-Inhalt für Lage q */
/* Kantenform je Design: glatt, Hörner, Ring, Kristall, hohl, Knochen, Dornen, wellig, gezackt, Heiligenschein, Platten */
const f1 = (n) => n.toFixed(1);
function d3outline(pts, c, st, sc) {
  const n = pts.length; let d = '';
  if (st === 'wavy') { d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]); for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; const ex = b[0] - a[0], ey = b[1] - a[1]; const L = Math.hypot(ex, ey) || 1; let px = -ey / L, py = ex / L; const mx = (a[0] + b[0]) / 2 - c[0], my = (a[1] + b[1]) / 2 - c[1]; if (px * mx + py * my < 0) { px = -px; py = -py; } const k = L * 0.16;
      d += ' C' + f1(a[0] + ex * 0.3 + px * k) + ' ' + f1(a[1] + ey * 0.3 + py * k) + ' ' + f1(a[0] + ex * 0.7 - px * k * 0.7) + ' ' + f1(a[1] + ey * 0.7 - py * k * 0.7) + ' ' + f1(b[0]) + ' ' + f1(b[1]); } return d + 'Z'; }
  if (st === 'jagged') { d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]); for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; const ex = b[0] - a[0], ey = b[1] - a[1]; const L = Math.hypot(ex, ey) || 1; const px = -ey / L, py = ex / L; const k = Math.min(2.4, L * 0.07) * sc;
      for (let s2 = 1; s2 < 4; s2++) { const t = [0.3, 0.5, 0.72][s2 - 1], o = (s2 === 2 ? -1.4 : 1) * k; d += ' L' + f1(a[0] + ex * t + px * o) + ' ' + f1(a[1] + ey * t + py * o); } d += ' L' + f1(b[0]) + ' ' + f1(b[1]); } return d + 'Z'; }
  if (st === 'round') { const r = 0.24; const P1 = (i) => { const v = pts[i], a = pts[(i + n - 1) % n]; return [v[0] + (a[0] - v[0]) * r, v[1] + (a[1] - v[1]) * r]; }; const P2 = (i) => { const v = pts[i], b = pts[(i + 1) % n]; return [v[0] + (b[0] - v[0]) * r, v[1] + (b[1] - v[1]) * r]; };
    let p = P2(0); d = 'M' + f1(p[0]) + ' ' + f1(p[1]); for (let k = 1; k <= n; k++) { const i = k % n; const a = P1(i), b = P2(i); d += ' L' + f1(a[0]) + ' ' + f1(a[1]) + ' Q' + f1(pts[i][0]) + ' ' + f1(pts[i][1]) + ' ' + f1(b[0]) + ' ' + f1(b[1]); } return d + 'Z'; }
  return 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + 'Z';
}
function d3draw(geo, set, q, opt) {
  opt = opt || {}; const R = 43, cx = 50, cy = 50 + (opt.dy || 0); const sc = opt.scale || 1; const st = set.style || '';
  const P = geo.P.map((p) => Q.rot(q, p)); const out = []; const back = []; const front = [];
  const vis = geo.F.map((f, i) => { const n = Q.rot(q, f.n); return { f, i, n, z: V.dot(Q.rot(q, f.c), [0, 0, 1]) }; }).filter((x) => x.n[2] > 0.02).sort((a, b) => a.z - b.z);
  let ox = 0, oy = 0; if (opt.main) { const mc = Q.rot(q, opt.main.c); const k = 0.6 * (opt.shift == null ? 1 : opt.shift); ox = -mc[0] * R * sc * k; oy = mc[1] * R * sc * k; }
  const prn = (p) => [cx + ox + p[0] * R * sc, cy + oy - p[1] * R * sc]; const pr = (p) => { const a = prn(p); return [a[0].toFixed(1), a[1].toFixed(1)]; };
  const sw = opt.thin ? 0.9 : 1.3;
  /* Hörner / Kristalle / Dornen an den Ecken */
  if (st === 'spikes' || st === 'crystal' || st === 'thorns') {
    const len = st === 'crystal' ? 1.42 : st === 'thorns' ? 1.26 : 1.3, wid = (st === 'crystal' ? 2.2 : st === 'thorns' ? 2.6 : 3.4) * sc;
    P.forEach((p) => { const a = prn(p), t = prn(V.mul(p, len)); const dx = t[0] - a[0], dy = t[1] - a[1]; const L = Math.hypot(dx, dy); if (L < 2) return; const px = -dy / L * wid, py = dx / L * wid;
      const col = p[2] >= 0 ? set.edge : shade(set, 0.2, 0.1); let sp;
      if (st === 'thorns') sp = '<path d="M' + f1(a[0] + px) + ' ' + f1(a[1] + py) + ' Q' + f1(a[0] + dx * 0.6 + px * 1.2) + ' ' + f1(a[1] + dy * 0.6 + py * 1.2) + ' ' + f1(t[0] + px * 1.6) + ' ' + f1(t[1] + py * 1.6) + ' Q' + f1(a[0] + dx * 0.55) + ' ' + f1(a[1] + dy * 0.55) + ' ' + f1(a[0] - px) + ' ' + f1(a[1] - py) + 'Z" fill="' + col + '"/>';
      else sp = '<path d="M' + f1(a[0] + px) + ' ' + f1(a[1] + py) + ' L' + f1(t[0]) + ' ' + f1(t[1]) + ' L' + f1(a[0] - px) + ' ' + f1(a[1] - py) + 'Z" fill="' + col + '"' + (st === 'crystal' ? ' fill-opacity=".85" stroke="#fff" stroke-width=".4"' : '') + '/>';
      (p[2] >= 0 ? front : back).push(sp); });
  }
  /* Ring (Sternenmeer) / Heiligenschein (Himmelsglanz) */
  if (st === 'ring' || st === 'halo') {
    const axis = st === 'ring' ? V.norm([0.35, 1, 0.25]) : [0, 1, 0]; const rq = st === 'ring' ? q : Q.axis([1, 0, 0], -1.15);
    const u = V.norm(V.cross(axis, [1, 0, 0])), w = V.cross(axis, u); const rad = st === 'ring' ? 1.42 : 0.95; const off = st === 'halo' ? V.mul(axis, 1.25) : [0, 0, 0];
    let segB = '', segF = ''; let prevF = null; const N = 48;
    for (let k = 0; k <= N; k++) { const a = (k / N) * Math.PI * 2; let p3 = V.add(off, V.add(V.mul(u, Math.cos(a) * rad), V.mul(w, Math.sin(a) * rad))); p3 = st === 'ring' ? Q.rot(rq, p3) : Q.rot(rq, p3); const pp = prn(p3); const f = p3[2] >= 0;
      if (f !== prevF) { if (f) segF += ' M'; else segB += ' M'; } else { if (f) segF += ' L'; else segB += ' L'; } if (f) segF += f1(pp[0]) + ' ' + f1(pp[1]); else segB += f1(pp[0]) + ' ' + f1(pp[1]); prevF = f; }
    const rc = st === 'ring' ? '#b8c8ff' : '#ffe08a'; const rw = (st === 'ring' ? 3 : 2.4) * sc;
    if (segB) back.push('<path d="' + segB + '" stroke="' + rc + '" stroke-width="' + rw + '" fill="none" opacity=".45" stroke-linecap="round"/>');
    if (segF) front.push('<path d="' + segF + '" stroke="' + rc + '" stroke-width="' + rw + '" fill="none" opacity=".95" stroke-linecap="round"/><path d="' + segF + '" stroke="#fff" stroke-width="' + rw * 0.3 + '" fill="none" opacity=".8" stroke-linecap="round"/>');
    if (st === 'ring') { const mo = Q.rot(q, V.add(V.mul(u, 1.42), [0, 0, 0])); const mp = prn(mo); (mo[2] >= 0 ? front : back).push('<circle cx="' + f1(mp[0]) + '" cy="' + f1(mp[1]) + '" r="' + (2.6 * sc).toFixed(1) + '" fill="#fff" opacity=".9"/>'); }
  }
  /* Zusätze für wildere Formen (drehen mit dem Würfel) */
  const X = set.extras || []; const sil = P.map((p, k) => ({ p, k, s: prn(p) }));
  const outward = (p, f) => prn(V.mul(p, f));
  if (X.includes('horns')) { const top = sil.slice().sort((a, b) => a.s[1] - b.s[1]).slice(0, 2); top.forEach((v) => { const a = v.s; const side = (a[0] < cx + ox ? -1 : 1); const w = 6 * sc;
      const tip = [a[0] + side * 20 * sc, a[1] - 26 * sc]; const c1 = [a[0] + side * 22 * sc, a[1] - 4 * sc]; const c2 = [a[0] + side * 2 * sc, a[1] - 18 * sc];
      const d = 'M' + f1(a[0] - side * w) + ' ' + f1(a[1] + 3 * sc) + ' Q' + f1(c2[0] - side * 4 * sc) + ' ' + f1(c2[1]) + ' ' + f1(tip[0]) + ' ' + f1(tip[1]) + ' Q' + f1(c1[0]) + ' ' + f1(c1[1]) + ' ' + f1(a[0] + side * w) + ' ' + f1(a[1] + 3 * sc) + 'Z';
      back.push('<path d="' + d + '" fill="' + shade(set, 0.7, 0.75) + '" stroke="' + set.edge + '" stroke-width="' + sw + '"/><path d="M' + f1(a[0]) + ' ' + f1(a[1]) + ' Q' + f1((c1[0] + c2[0]) / 2) + ' ' + f1((c1[1] + c2[1]) / 2) + ' ' + f1(tip[0]) + ' ' + f1(tip[1]) + '" stroke="' + set.edge + '" stroke-width=".6" fill="none" opacity=".6"/>'); }); }
  if (X.includes('shards2')) sil.forEach((v) => { if (v.p[2] < -0.2) return; [-0.35, 0.35].forEach((tw) => { const a = v.s; const t = outward(v.p, 1.3); const dx = t[0] - a[0], dy = t[1] - a[1]; const rx = dx * Math.cos(tw) - dy * Math.sin(tw), ry = dx * Math.sin(tw) + dy * Math.cos(tw); const L = Math.hypot(rx, ry) || 1; const px = -ry / L * 1.4 * sc, py = rx / L * 1.4 * sc;
      front.push('<path d="M' + f1(a[0] + px) + ' ' + f1(a[1] + py) + ' L' + f1(a[0] + rx) + ' ' + f1(a[1] + ry) + ' L' + f1(a[0] - px) + ' ' + f1(a[1] - py) + 'Z" fill="#e8fbff" fill-opacity=".8" stroke="#fff" stroke-width=".3"/>'); }); });
  if (X.includes('drips')) sil.slice().sort((a, b) => b.s[1] - a.s[1]).slice(0, 3).forEach((v, i) => { const a = v.s; const h = (10 + i * 5) * sc; const w = 2.6 * sc;
      front.push('<path d="M' + f1(a[0] - w) + ' ' + f1(a[1]) + ' Q' + f1(a[0] - w) + ' ' + f1(a[1] + h * 0.6) + ' ' + f1(a[0]) + ' ' + f1(a[1] + h) + ' Q' + f1(a[0] + w) + ' ' + f1(a[1] + h * 0.6) + ' ' + f1(a[0] + w) + ' ' + f1(a[1]) + 'Z" fill="#a3121d" stroke="#ff8a8a" stroke-width=".4"/><circle cx="' + f1(a[0] - w * 0.3) + '" cy="' + f1(a[1] + h * 0.7) + '" r="' + (0.7 * sc).toFixed(2) + '" fill="#ffd0d0"/>'); });
  if (X.includes('orbit')) for (let k = 0; k < 6; k++) { const ang = k * Math.PI / 3 + 0.3; const p3 = Q.rot(q, [Math.cos(ang) * 1.45, Math.sin(ang) * 0.35, Math.sin(ang) * 1.45]); const pp = prn(p3); const z = 2.6 + (k % 3);
      (p3[2] >= 0 ? front : back).push('<path d="M' + f1(pp[0]) + ' ' + f1(pp[1] - z * sc) + ' L' + f1(pp[0] + z * 0.9 * sc) + ' ' + f1(pp[1] + z * 0.6 * sc) + ' L' + f1(pp[0] - z * 0.8 * sc) + ' ' + f1(pp[1] + z * 0.5 * sc) + 'Z" fill="#12061f" stroke="#b06bff" stroke-width=".7"/>'); }
  if (X.includes('knobs')) sil.forEach((v) => { if (v.p[2] < 0) return; front.push('<circle cx="' + f1(v.s[0]) + '" cy="' + f1(v.s[1]) + '" r="' + (2.8 * sc).toFixed(1) + '" fill="#f1e7cf" stroke="#5c5240" stroke-width=".6"/>'); });
  if (X.includes('vines')) { const pts = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2.2; const p3 = Q.rot(q, [Math.cos(a) * 1.08, (k / 40 - 0.5) * 1.6, Math.sin(a) * 1.08]); pts.push([prn(p3), p3[2]]); }
      let dB = '', dF = '', pf = null; pts.forEach(([pp, z]) => { const f = z >= 0; const c = (f !== pf ? ' M' : ' L') + f1(pp[0]) + ' ' + f1(pp[1]); if (f) dF += c; else dB += c; pf = f; });
      if (dB) back.push('<path d="' + dB + '" stroke="#1f6a3a" stroke-width="' + 1.8 * sc + '" fill="none" opacity=".7"/>'); if (dF) front.push('<path d="' + dF + '" stroke="#3fbf6a" stroke-width="' + 1.8 * sc + '" fill="none"/>');
      pts.forEach(([pp, z], k) => { if (z < 0 || k % 5) return; front.push('<ellipse cx="' + f1(pp[0] + 2.5 * sc) + '" cy="' + f1(pp[1]) + '" rx="' + (3.6 * sc).toFixed(1) + '" ry="' + (1.7 * sc).toFixed(1) + '" transform="rotate(' + (k * 37 % 180) + ' ' + f1(pp[0]) + ' ' + f1(pp[1]) + ')" fill="#4fd17a" stroke="#e9cf6a" stroke-width=".35"/>'); }); }
  if (X.includes('flowers')) sil.filter((v) => v.p[2] > 0.3).slice(0, 3).forEach((v) => { const a = v.s; let h = ''; for (let k = 0; k < 5; k++) { const an = k * 72 * Math.PI / 180; h += '<circle cx="' + f1(a[0] + Math.cos(an) * 2.2 * sc) + '" cy="' + f1(a[1] + Math.sin(an) * 2.2 * sc) + '" r="' + (1.6 * sc).toFixed(1) + '" fill="#ffb7e0"/>'; } front.push(h + '<circle cx="' + f1(a[0]) + '" cy="' + f1(a[1]) + '" r="' + (1.2 * sc).toFixed(1) + '" fill="#fff1a0"/>'); });
  if (X.includes('arcs')) sil.slice().sort((a, b) => Math.abs(a.p[2]) - Math.abs(b.p[2])).slice(0, 5).forEach((v, k) => { const a = v.s, t = outward(v.p, 1.5 + (k % 2) * 0.12); const dx = t[0] - a[0], dy = t[1] - a[1]; const L = Math.hypot(dx, dy) || 1; const px = -dy / L, py = dx / L;
      const c = [[a[0], a[1]]]; for (let st2 = 1; st2 <= 4; st2++) { const u = st2 / 4, j2 = st2 < 4 ? (st2 % 2 ? 3 : -3) * sc : 0; c.push([a[0] + dx * u + px * j2, a[1] + dy * u + py * j2]); }
      const bolt = (w0) => { const l = [], r = []; c.forEach((p, i) => { const w = w0 * (1 - i / (c.length - 1) * 0.85); l.push(f1(p[0] + px * w) + ' ' + f1(p[1] + py * w)); r.unshift(f1(p[0] - px * w) + ' ' + f1(p[1] - py * w)); }); return 'M' + l.join(' L') + ' L' + r.join(' L') + 'Z'; };
      front.push('<path d="' + bolt(2.6 * sc) + '" fill="#7fe0ff" opacity=".28"/><path d="' + bolt(0.9 * sc) + '" fill="#effdff"/>'); });
  if (X.includes('wings')) [-1, 1].forEach((sd) => { const bx = cx + ox + sd * 30 * sc, by = cy + oy - 4 * sc; let d = 'M' + f1(cx + ox + sd * 14 * sc) + ' ' + f1(by + 6 * sc) + ' Q' + f1(bx + sd * 18 * sc) + ' ' + f1(by - 34 * sc) + ' ' + f1(bx + sd * 34 * sc) + ' ' + f1(by - 26 * sc);
      for (let k = 0; k < 5; k++) { const fx = bx + sd * (34 - k * 7) * sc, fy = by - (26 - k * 9) * sc; d += ' Q' + f1(fx + sd * 6 * sc) + ' ' + f1(fy + 8 * sc) + ' ' + f1(fx - sd * 3 * sc) + ' ' + f1(fy + 9 * sc); } d += ' Q' + f1(bx) + ' ' + f1(by + 14 * sc) + ' ' + f1(cx + ox + sd * 14 * sc) + ' ' + f1(by + 6 * sc) + 'Z';
      back.push('<path d="' + d + '" fill="#fffaf0" fill-opacity=".92" stroke="#d4a73a" stroke-width="' + sw * 0.7 + '"/>'); });
  if (X.includes('rays')) sil.filter((v) => v.p[2] > -0.1).slice(0, 8).forEach((v) => { const a = v.s, t = outward(v.p, 1.55); back.push('<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + ' L' + f1(t[0]) + ' ' + f1(t[1]) + '" stroke="#e8eeff" stroke-width="' + 1.1 * sc + '" stroke-linecap="round" opacity=".85"/><circle cx="' + f1(t[0]) + '" cy="' + f1(t[1]) + '" r="' + (1.3 * sc).toFixed(1) + '" fill="#fff"/>'); });
  if (X.includes('gear')) { const ex = Q.rot(q, [1, 0, 0]); const rot = Math.atan2(-ex[1], ex[0]); const N = 14, r1 = R * sc * 1.12, r2 = R * sc * 1.3; let d = ''; for (let k = 0; k < N; k++) { const a0 = rot + k * 2 * Math.PI / N; const pts2 = [[a0, r1], [a0 + 0.08, r2], [a0 + 0.28, r2], [a0 + 0.36, r1]]; pts2.forEach(([a, r], i) => { d += (k === 0 && i === 0 ? 'M' : ' L') + f1(cx + ox + Math.cos(a) * r) + ' ' + f1(cy + oy + Math.sin(a) * r); }); }
      back.push('<path d="' + d + 'Z" fill="#7a4a1a" stroke="#ffd08a" stroke-width="' + sw * 0.7 + '"/><circle cx="' + f1(cx + ox) + '" cy="' + f1(cy + oy) + '" r="' + (r1 * 0.98).toFixed(1) + '" fill="#2a1a08" stroke="#4ff0d0" stroke-width=".8"/>'); }
  if (X.includes('wisps')) sil.slice().sort((a, b) => b.s[1] - a.s[1]).slice(0, 4).forEach((v, i) => { const a = v.s; const d = 'M' + f1(a[0]) + ' ' + f1(a[1]) + ' q' + f1(-6 * sc) + ' ' + f1(8 * sc) + ' ' + f1(0) + ' ' + f1(14 * sc) + ' t' + f1((i % 2 ? 5 : -5) * sc) + ' ' + f1(12 * sc); back.push('<path d="' + d + '" stroke="#5a5a62" stroke-width="' + (3.2 - i * 0.4) * sc + '" fill="none" stroke-linecap="round" opacity=".6"/>'); });
  if (X.includes('crown')) { const tv = sil.slice().sort((a, b) => a.s[1] - b.s[1])[0]; const a = [tv.s[0], tv.s[1] - 3 * sc]; const w = 11 * sc, h = 9 * sc;
      front.push('<path d="M' + f1(a[0] - w) + ' ' + f1(a[1]) + ' L' + f1(a[0] - w * 1.1) + ' ' + f1(a[1] - h) + ' L' + f1(a[0] - w * 0.45) + ' ' + f1(a[1] - h * 0.45) + ' L' + f1(a[0]) + ' ' + f1(a[1] - h * 1.25) + ' L' + f1(a[0] + w * 0.45) + ' ' + f1(a[1] - h * 0.45) + ' L' + f1(a[0] + w * 1.1) + ' ' + f1(a[1] - h) + ' L' + f1(a[0] + w) + ' ' + f1(a[1]) + 'Z" fill="#f2c85b" stroke="#fff3c4" stroke-width=".6"/>' +
        [[-w * 1.1, -h], [0, -h * 1.25], [w * 1.1, -h]].map(([dx, dy], k) => '<circle cx="' + f1(a[0] + dx) + '" cy="' + f1(a[1] + dy) + '" r="' + (1.5 * sc).toFixed(1) + '" fill="' + ['#d11a3a', '#3a8aff', '#d11a3a'][k] + '" stroke="#fff3c4" stroke-width=".4"/>').join('')); }
  if (X.includes('orbitrunes')) for (let k = 0; k < 6; k++) { const ang = k * Math.PI / 3 + 0.2; const p3 = Q.rot(q, [Math.cos(ang) * 1.42, Math.sin(ang) * 0.3, Math.sin(ang) * 1.42]); const pp = prn(p3);
      (p3[2] >= 0 ? front : back).push('<text x="' + f1(pp[0]) + '" y="' + f1(pp[1]) + '" text-anchor="middle" dominant-baseline="central" font-size="' + (8 * sc).toFixed(1) + '" style="fill:#e8c8ff;stroke:#7a3cff;stroke-width:.8px;paint-order:stroke" opacity="' + (p3[2] >= 0 ? 1 : 0.45) + '">' + D3_RUNES[k * 4 % D3_RUNES.length] + '</text>'); }
  if (X.includes('energy')) { const fv = sil.filter((v) => v.p[2] > 0.15); for (let k = 0; k + 1 < fv.length && k < 4; k += 2) { const a = fv[k].s, b = fv[k + 1].s; const m = [(a[0] + b[0]) / 2 + (cx + ox - (a[0] + b[0]) / 2) * 0.6, (a[1] + b[1]) / 2 + (cy + oy - (a[1] + b[1]) / 2) * 0.6];
      front.push('<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + ' Q' + f1(m[0]) + ' ' + f1(m[1]) + ' ' + f1(b[0]) + ' ' + f1(b[1]) + '" stroke="#e2b8ff" stroke-width="' + (0.9 * sc).toFixed(2) + '" fill="none" opacity=".75"/>'); } }
  if (X.includes('mist')) back.push('<ellipse cx="' + f1(cx + ox) + '" cy="' + f1(cy + oy + R * sc * 0.75) + '" rx="' + (R * sc * 1.2).toFixed(1) + '" ry="' + (R * sc * 0.32).toFixed(1) + '" fill="url(#d3mist)"/>');
  if (X.includes('prismrays')) sil.filter((v) => v.p[2] > -0.1).slice(0, 7).forEach((v, k) => { const a = v.s, t = outward(v.p, 1.5); back.push('<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + ' L' + f1(t[0]) + ' ' + f1(t[1]) + '" stroke="' + ['#ff5a5a', '#ffd35a', '#5aff8a', '#5ad8ff', '#b05aff', '#ff5ae0', '#ffffff'][k] + '" stroke-width="' + 1.3 * sc + '" stroke-linecap="round" opacity=".9"/>'); });
  /* Leere: leuchtender Kern hinter hohlen Flächen */
  if (set.glass) { geo.F.forEach((f) => { const n = Q.rot(q, f.n); if (n[2] >= 0) return; back.push('<path d="M' + f.v.map((m) => { const pp = prn(P[m]); return f1(pp[0]) + ' ' + f1(pp[1]); }).join(' L') + 'Z" fill="' + shade(set, 0.05, -0.3) + '" stroke="' + set.edge + '" stroke-width="' + (sw * 0.45) + '" opacity=".8"/>'); });
    back.push('<circle class="d3core" cx="' + f1(cx + ox) + '" cy="' + f1(cy + oy) + '" r="' + (R * sc * 0.62).toFixed(1) + '" fill="url(#d3c-' + set.glass + ')"/>'); }
  if (st === 'hollow') geo.F.forEach((f) => { const n = Q.rot(q, f.n); if (n[2] >= 0) return; back.push('<path d="M' + f.v.map((m) => { const pp = prn(P[m]); return f1(pp[0]) + ' ' + f1(pp[1]); }).join(' L') + 'Z" fill="#0a0414" stroke="' + set.edge + '" stroke-width="' + (sw * 0.5) + '" opacity=".75"/>'); });
  if (st === 'hollow') back.push('<circle cx="' + f1(cx + ox) + '" cy="' + f1(cy + oy) + '" r="' + (R * sc * 0.5).toFixed(1) + '" fill="url(#d3core)"/>');
  out.push(back.join(''));
  for (const x of vis) {
    const p2 = x.f.v.map((m) => prn(P[m])); const c2 = prn(Q.rot(q, x.f.c));
    const dd = d3outline(p2, c2, st === 'wavy' || st === 'jagged' || st === 'round' ? st : '', sc);
    const fill = shade(set, x.n[2], V.dot(x.n, D3_L), x.n);
    if (st === 'hollow') { const hole = p2.map((p) => [c2[0] + (p[0] - c2[0]) * 0.58, c2[1] + (p[1] - c2[1]) * 0.58]); const hd = 'M' + hole.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + 'Z';
      out.push('<path d="' + dd + ' ' + hd + '" fill-rule="evenodd" fill="' + fill + '" stroke="' + set.edge + '" stroke-width="' + sw + '" stroke-linejoin="round"/><path d="' + hd + '" fill="none" stroke="' + set.edge + '" stroke-width="' + sw * 0.6 + '" opacity=".7"/>'); }
    else out.push('<path d="' + dd + '" fill="' + fill + '"' + (set.glass ? ' fill-opacity=".74"' : st === 'crystal' ? ' fill-opacity=".9"' : '') + ' stroke="' + set.edge + '" stroke-width="' + sw + '" stroke-linejoin="round"/>');
    if (set.pat && !opt.nopat && st !== 'hollow') out.push('<path d="' + dd + '" fill="url(#d3p-' + set.pat + ')" opacity="' + (set.patOp || 0.5) * Math.min(1, x.n[2] * 1.4) + '"/>');
    if (st === 'plates' && x.n[2] > 0.3) { const ins = p2.map((p) => [c2[0] + (p[0] - c2[0]) * 0.76, c2[1] + (p[1] - c2[1]) * 0.76]); out.push('<path d="M' + ins.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + 'Z" fill="none" stroke="' + set.edge + '" stroke-width="' + sw * 0.55 + '" opacity=".75"/>' + ins.map((p) => '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + (1.1 * sc).toFixed(2) + '" fill="#ffd08a" opacity=".85"/>').join('')); }
    if (x.n[2] > 0.55 && !opt.nonum) {
      const c = Q.rot(q, x.f.c), up = Q.rot(q, x.f.up), rt = V.cross(up, x.n); const s3 = R * sc * x.f.ri * ({ 4: 0.95, 6: 0.9, 8: 1.15, 10: 1.05, 12: 1.12, 20: 1.45 }[geo.sides] || 1) / 10 * (st === 'hollow' ? 0.8 : 1);
      const [ex, ey] = pr(c); const lab = (opt.label && x.f.val === opt.labelFor) ? opt.label : String(x.f.val) + ((x.f.val === 6 || x.f.val === 9) && geo.sides >= 8 ? '.' : '');
      const fs = lab.length > 2 ? 7.2 : lab.length > 1 ? 9 : 10.5;
      out.push('<text transform="matrix(' + (rt[0] * s3).toFixed(3) + ',' + (-rt[1] * s3).toFixed(3) + ',' + (-up[0] * s3).toFixed(3) + ',' + (up[1] * s3).toFixed(3) + ',' + ex + ',' + ey + ')" text-anchor="middle" dominant-baseline="central" font-size="' + fs + '" style="fill:' + (opt.numCol || set.num) + (set.numStroke && !opt.numCol ? ';stroke:' + set.numStroke + ';stroke-width:' + (set.numStrokeW || 0.55) + 'px' : '') + '" opacity="' + (opt.main && opt.emph !== false ? (x.f === opt.main ? 1 : 0.22) : Math.min(1, (x.n[2] - 0.55) * 3)).toFixed(2) + '">' + lab + '</text>');
    }
  }
  if (st === 'wavy' && set.leaves && !opt.thin && !X.includes('vines')) P.forEach((p, k) => { if (p[2] < 0.2 || k % 3) return; const a = prn(p), t = prn(V.mul(p, 1.22)); const ang = Math.atan2(t[1] - a[1], t[0] - a[0]) * 180 / Math.PI; front.push('<ellipse cx="' + f1((a[0] + t[0]) / 2) + '" cy="' + f1((a[1] + t[1]) / 2) + '" rx="' + (5 * sc).toFixed(1) + '" ry="' + (2.2 * sc).toFixed(1) + '" transform="rotate(' + ang.toFixed(0) + ' ' + f1((a[0] + t[0]) / 2) + ' ' + f1((a[1] + t[1]) / 2) + ')" fill="#3fbf6a" stroke="#e9cf6a" stroke-width=".5"/>'); });
  out.push(front.join(''));
  return out.join('');
}
function d3defs() {
  if (document.getElementById('d3defs')) return;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.id = 'd3defs'; s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true'); s.style.position = 'absolute';
  const pat = (id, w, body) => '<pattern id="d3p-' + id + '" width="' + w + '" height="' + w + '" patternUnits="userSpaceOnUse">' + body + '</pattern>';
  const cg = (id, stops) => '<radialGradient id="d3c-' + id + '">' + stops.map(([o, c, a]) => '<stop offset="' + o + '" stop-color="' + c + '"' + (a != null ? ' stop-opacity="' + a + '"' : '') + '/>').join('') + '</radialGradient>';
  s.innerHTML = '<defs>' + cg('magma', [[0, '#fff2a0'], [0.3, '#ff8a1a'], [0.65, '#c81e06', 0.75], [1, '#300400', 0]]) + cg('frost', [[0, '#ffffff'], [0.4, '#bfefff', 0.7], [1, '#5b9cc4', 0]]) + cg('arcane', [[0, '#ffffff'], [0.25, '#e2b8ff'], [0.6, '#7a3cff', 0.75], [1, '#1a0040', 0]]) + cg('blood', [[0, '#ff6a6a'], [0.35, '#a3001a', 0.85], [1, '#000', 0]]) + cg('leaf', [[0, '#e8ffb0'], [0.4, '#4fd17a', 0.7], [1, '#022a14', 0]]) +
    '<radialGradient id="d3mist"><stop offset="0" stop-color="#6dff9e" stop-opacity=".55"/><stop offset="1" stop-color="#6dff9e" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="d3core"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#d9b8ff"/><stop offset=".6" stop-color="#7a3cff" stop-opacity=".8"/><stop offset="1" stop-color="#1a0030" stop-opacity="0"/></radialGradient>' +
    pat('stars', 34, '<circle cx="4" cy="6" r=".7" fill="#fff"/><circle cx="17" cy="3" r=".45" fill="#cfe0ff"/><circle cx="27" cy="11" r=".9" fill="#fff"/><circle cx="9" cy="19" r=".4" fill="#ffe9a8"/><circle cx="22" cy="24" r=".6" fill="#fff"/><circle cx="31" cy="30" r=".35" fill="#cfe0ff"/><circle cx="13" cy="30" r=".75" fill="#fff"/><ellipse cx="20" cy="15" rx="9" ry="3" fill="#8a6bff" opacity=".18" transform="rotate(-25 20 15)"/>') +
    pat('embers', 26, '<circle cx="5" cy="7" r="1" fill="#ff8a2a"/><circle cx="18" cy="4" r=".6" fill="#ffd36b"/><circle cx="12" cy="17" r=".8" fill="#ff5a1a"/><circle cx="22" cy="21" r=".5" fill="#ffb347"/><path d="M2 24 Q8 18 6 12" stroke="#ff6a1a" stroke-width=".5" fill="none" opacity=".6"/>') +
    pat('frost', 30, '<path d="M2 15 L28 15 M15 2 L15 28 M5 5 L25 25 M25 5 L5 25" stroke="#fff" stroke-width=".35" opacity=".7"/><path d="M15 9 l-2 -2 M15 9 l2 -2 M15 21 l-2 2 M15 21 l2 2 M9 15 l-2 -2 M9 15 l-2 2 M21 15 l2 -2 M21 15 l2 2" stroke="#fff" stroke-width=".35"/>') +
    pat('void', 30, '<circle cx="6" cy="8" r=".5" fill="#b06bff"/><circle cx="21" cy="19" r=".35" fill="#d9b8ff"/><circle cx="14" cy="26" r=".25" fill="#fff"/><path d="M0 22 Q15 10 30 20" stroke="#5a2a9a" stroke-width="1.2" fill="none" opacity=".35"/>') +
    pat('cracks', 32, '<path d="M2 4 L9 10 L7 16 L13 22 M9 10 L16 8 L22 13 M22 13 L28 11 M13 22 L18 30 M24 20 L30 26 L26 31" stroke="#4a3d28" stroke-width=".45" fill="none"/>') +
    pat('smoke', 36, '<path d="M0 28 Q9 18 18 26 T36 22" stroke="#000" stroke-width="2.2" fill="none" opacity=".35"/><path d="M0 10 Q12 4 20 12 T36 8" stroke="#000" stroke-width="1.4" fill="none" opacity=".25"/>') +
    pat('veins', 34, '<path d="M0 30 Q8 22 14 24 Q22 26 26 16 Q30 8 34 6" stroke="#e9cf6a" stroke-width=".55" fill="none"/><path d="M14 24 Q12 30 16 34 M26 16 Q20 12 18 4" stroke="#e9cf6a" stroke-width=".35" fill="none"/>') +
    pat('bolts', 34, '<path d="M8 2 L13 12 L9 13 L16 26" stroke="#7fe0ff" stroke-width=".6" fill="none"/><path d="M26 10 L22 18 L26 19 L21 30" stroke="#bdf2ff" stroke-width=".4" fill="none" opacity=".7"/>') +
    pat('marble', 40, '<path d="M0 30 C10 26 14 34 24 28 S36 18 40 22" stroke="#8a8478" stroke-width=".6" fill="none" opacity=".6"/><path d="M0 8 C12 14 20 2 40 10" stroke="#a49c8e" stroke-width=".35" fill="none" opacity=".5"/>') +
    pat('rivets', 24, '<circle cx="4" cy="4" r="1.1" fill="#ffd08a" opacity=".7"/><circle cx="4" cy="4" r=".5" fill="#4a2c10"/><path d="M0 12 H24" stroke="#4ff0d0" stroke-width=".5" opacity=".6"/><path d="M12 12 V24" stroke="#4ff0d0" stroke-width=".4" opacity=".5"/>') +
    pat('runes', 30, '<path d="M5 5 v8 l4 -4 M5 9 l4 4 M18 4 l5 0 l-5 8 l5 0 M8 20 l4 6 l4 -6 M22 18 v8 M20 20 h4" stroke="#ffb347" stroke-width=".55" fill="none"/>') +
    pat('ornate', 28, '<path d="M4 14 C4 8 10 6 12 10 C13 13 9 14 9 12 M24 14 C24 20 18 22 16 18 C15 15 19 14 19 16 M14 2 C18 4 18 8 14 9 C10 8 10 4 14 2 Z M14 26 C10 24 10 20 14 19 C18 20 18 24 14 26 Z" stroke="#f2c85b" stroke-width=".5" fill="none"/>') +
    pat('lava', 30, '<path d="M0 22 Q6 18 10 20 T20 14 T30 10" stroke="#ff8a1a" stroke-width="1.1" fill="none"/><path d="M4 0 Q8 6 6 10 M20 14 Q24 20 22 30" stroke="#ffd36b" stroke-width=".6" fill="none"/><circle cx="14" cy="26" r=".9" fill="#ffd36b"/>') +
    pat('bubbles', 30, '<circle cx="6" cy="7" r="2" fill="none" stroke="#fff" stroke-width=".4"/><circle cx="6.6" cy="6.3" r=".5" fill="#fff"/><circle cx="20" cy="18" r="1.2" fill="none" stroke="#fff" stroke-width=".35"/><circle cx="25" cy="5" r=".8" fill="none" stroke="#fff" stroke-width=".3"/><circle cx="11" cy="24" r="1.5" fill="none" stroke="#fff" stroke-width=".35"/><path d="M15 2 L15 10 M11 6 L19 6" stroke="#fff" stroke-width=".25" opacity=".7"/>') +
    pat('runesv', 30, '<path d="M5 5 v8 l4 -4 M5 9 l4 4 M18 4 l5 0 l-5 8 l5 0 M8 20 l4 6 l4 -6 M22 18 v8 M20 20 h4" stroke="#d29bff" stroke-width=".6" fill="none"/><circle cx="26" cy="12" r=".6" fill="#fff"/><circle cx="13" cy="15" r=".4" fill="#fff"/>') +
    pat('roots', 34, '<path d="M17 0 Q15 8 18 14 Q22 20 16 26 Q12 30 14 34 M18 14 Q24 16 30 12 M16 26 Q10 24 4 28" stroke="#c8a24a" stroke-width=".55" fill="none"/><path d="M4 6 Q8 4 10 8 Q6 10 4 6Z" fill="#7aff9e" opacity=".5"/>') +
    pat('brushed', 12, '<path d="M0 2 H12 M0 5 H12 M0 8.5 H12 M0 11 H12" stroke="#ffffff" stroke-width=".25" opacity=".35"/><path d="M0 3.5 H12 M0 7 H12" stroke="#000" stroke-width=".25" opacity=".25"/>') +
    pat('marblegold', 40, '<path d="M0 30 C10 26 14 34 24 28 S36 18 40 22" stroke="#d4a73a" stroke-width=".7" fill="none"/><path d="M0 8 C12 14 20 2 40 10" stroke="#e8c870" stroke-width=".4" fill="none" opacity=".8"/><path d="M20 15 l2 4 l-2 4 l-2 -4z" fill="#d4a73a" opacity=".5"/>') +
    pat('bloodveins', 34, '<path d="M0 28 Q8 22 12 24 Q20 26 24 16 Q28 8 34 6" stroke="#c8102a" stroke-width=".9" fill="none"/><path d="M12 24 Q10 30 14 34 M24 16 Q18 12 16 4" stroke="#ff4a5a" stroke-width=".45" fill="none"/><ellipse cx="26" cy="27" rx="4" ry="2" fill="#5a0010" opacity=".6"/>') +
    pat('opal', 24, '<circle cx="4" cy="5" r="1.4" fill="#5ad8ff" opacity=".7"/><circle cx="15" cy="3" r="1" fill="#ff5ae0" opacity=".7"/><circle cx="20" cy="14" r="1.6" fill="#5aff8a" opacity=".6"/><circle cx="8" cy="17" r="1.1" fill="#ffd35a" opacity=".7"/><circle cx="14" cy="22" r=".8" fill="#ff5a5a" opacity=".8"/>') +
    '</defs>';
  document.body.appendChild(s);
}
/* statisches Würfelbild (fertig gefallen) */
function d3svg(sides, value, setId, opt) {
  opt = opt || {}; const set = D3_SETS[setId] || D3_SETS.klassik; const real = sides === 100 ? 10 : sides; const geo = d3geo([4, 6, 8, 10, 12, 20].includes(real) ? real : 20);
  const v = sides === 100 ? 1 : Math.max(1, Math.min(geo.F.length, value | 0));
  const t = d3target(geo, v, opt.tilt == null ? 0.34 : opt.tilt); d3defs();
  const s2 = opt.gold ? Object.assign({}, set, { face: ['#6a4508', '#ffe38f'], edge: '#fff4c8', num: '#4a2c00', pat: set.pat, patOp: (set.patOp || 0.5) * 0.35 }) : opt.dead ? Object.assign({}, set, { face: [set.fx1.tint, set.face[0]], num: set.fx1.crack }) : set;
  return '<svg viewBox="0 0 100 100" class="d3s" aria-hidden="true">' + d3draw(geo, s2, t.q, { label: sides === 100 ? String(value === 100 ? '00' : value) : null, labelFor: 1, thin: opt.thin, main: t.f }) + (opt.cracks ? d3cracks(set) : '') + '</svg>';
}
function d3cracks(set) { const c = set.fx1.crack; return '<g class="d3crk" stroke="' + c + '" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M50 14 L46 30 L54 38 L44 52 L52 63 L47 82" stroke-width="1.8"/><path d="M46 30 L33 34 M54 38 L68 34 L74 42 M44 52 L30 58 M52 63 L66 70" stroke-width="1.1"/><path d="M33 34 L26 30 M74 42 L80 40 M30 58 L24 64" stroke-width=".7"/></g>'; }

/* ---- Animation ---- */
function d3roll(holder, sides, value, setId, opt) {
  opt = opt || {}; const set = D3_SETS[setId] || D3_SETS.klassik; const real = sides === 100 ? 10 : sides; const geo = d3geo([4, 6, 8, 10, 12, 20].includes(real) ? real : 20); d3defs();
  const v = sides === 100 ? 1 : Math.max(1, Math.min(geo.F.length, value | 0)); const T = d3target(geo, v, 0.34);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'd3s'); svg.setAttribute('aria-hidden', 'true');
  holder.innerHTML = ''; holder.appendChild(svg);
  const ax = V.norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]); const A = (2.2 + Math.random() * 1.6) * Math.PI * 2;
  const D = opt.dur || 820; const t0 = performance.now(); let raf = 0, done = false;
  if (set.roll) { const box = document.createElement('div'); box.className = 'd3fx d3rollfx'; let h = ''; for (let k = 0; k < 9; k++) { const a = Math.random() * Math.PI * 2, dist = 26 + Math.random() * 26; const sh = D3_SHAPE[set.roll.shape] || D3_SHAPE.spark; h += '<span class="d3p" style="--dx:' + (Math.cos(a) * dist).toFixed(0) + 'px;--dy:' + (Math.sin(a) * dist).toFixed(0) + 'px;--c:' + set.roll.col[k % set.roll.col.length] + ';--d:' + (k * D / 10).toFixed(0) + 'ms;--r:' + ((Math.random() - 0.5) * 360).toFixed(0) + 'deg">' + sh + '</span>'; } box.innerHTML = h; holder.appendChild(box); setTimeout(() => box.remove(), D + 1300); }
  const lab = sides === 100 ? String(value === 100 ? '00' : value) : null;
  const frame = (now) => {
    const t = Math.min(1, (now - t0) / D); const e = 1 - Math.pow(1 - t, 3);
    const q = Q.mul(Q.axis(ax, A * (1 - e)), T.q); const hop = Math.abs(Math.sin(Math.PI * t * 2.2)) * (1 - t) * 10;
    svg.innerHTML = d3draw(geo, set, q, { dy: -hop, scale: 0.7 + 0.3 * Math.min(1, t * 4), label: t > 0.85 ? lab : null, labelFor: 1, main: T.f, shift: e, emph: false });
    if (t < 1) raf = requestAnimationFrame(frame); else finish();
  };
  const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); svg.innerHTML = d3draw(geo, set, T.q, { label: lab, labelFor: 1, main: T.f }); if (opt.onDone) opt.onDone(); };
  raf = requestAnimationFrame(frame);
  return { skip: finish };
}

/* ---- Effekte natürliche 20 / 1 (je Design) ---- */
const D3_SHAPE = { spark: '<i class="ps"></i>', ember: '<i class="pe"></i>', star: '<i class="pst">✦</i>', flake: '<i class="pfl">❄</i>', drop: '<i class="pdr"></i>', petal: '<i class="ppt"></i>', bolt: '<i class="pbo">ϟ</i>', feather: '<i class="pfe"></i>', gear: '<i class="pge">⚙</i>', rune: '<i class="pru">ᚱ</i>' };
const D3_RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
function d3effect(dieEl, setId, kind, level) {
  if (!dieEl || level === 'aus') return; const set = D3_SETS[setId] || D3_SETS.klassik;
  const box = document.createElement('div'); box.className = 'd3fx ' + kind + ' fx-' + setId; box.setAttribute('aria-hidden', 'true');
  if (kind === 'n20') {
    d3stage20(dieEl, set, setId, level);
    const f = set.fx20; let h = '<div class="d3ray" style="--rc:' + f.ray + '"></div>';
    if (f.flash) h += '<div class="d3flash"></div>';
    if (level === 'voll') { for (let i = 0; i < f.n; i++) { const a = (i / f.n) * Math.PI * 2 + Math.random() * 0.4; const dist = 38 + Math.random() * 34; let dx = Math.cos(a) * dist, dy = Math.sin(a) * dist;
      if (f.move === 'rise') { dx = (Math.random() - 0.5) * 50; dy = -(30 + Math.random() * 50); } if (f.move === 'fall') { dx = (Math.random() - 0.5) * 70; dy = 25 + Math.random() * 40; }
      const col = f.col[i % f.col.length]; let sh = D3_SHAPE[f.shape] || D3_SHAPE.spark; if (f.shape === 'rune') sh = '<i class="pru">' + D3_RUNES[Math.floor(Math.random() * D3_RUNES.length)] + '</i>';
      h += '<span class="d3p ' + f.move + '" style="--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px;--c:' + col + ';--d:' + (Math.random() * 160).toFixed(0) + 'ms;--r:' + ((Math.random() - 0.5) * 540).toFixed(0) + 'deg">' + sh + '</span>'; } }
    box.innerHTML = h;
  } else {
    d3stage1(dieEl, level); box.innerHTML = '<div class="d3dim" style="--tc:#3a0508"></div>'; dieEl.classList.add('n1-hit');
  }
  dieEl.appendChild(box); setTimeout(() => { box.remove(); }, 2600);
}

/* Grosser Auftritt der natürlichen 20: Bühne über dem ganzen Bildschirm, nur transform/opacity-Animationen */
function d3stage20(dieEl, set, id, level) {
  const r = dieEl.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const f = set.fx20; const c = f.ray; const W = window.innerWidth, H = window.innerHeight;
  const st = document.createElement('div'); st.className = 'd3stage big-' + f.big; st.setAttribute('aria-hidden', 'true'); st.style.cssText = '--x:' + x + 'px;--y:' + y + 'px;--c:' + c + ';--c2:' + f.col[0];
  let h = '<div class="sg-vig"></div><div class="sg-aura"></div><div class="sg-ring"></div>';
  if (level === 'voll') {
    h += '<div class="sg-ring r2"></div>';
    const B = f.big;
    if (B === 'pillar' || B === 'nova') h += '<div class="sg-pillar" style="height:' + y + 'px"></div>';
    if (B === 'bolt') { let pts = [[x + (Math.random() - 0.5) * 80, 0]]; const n = 7; for (let i = 1; i < n; i++) pts.push([x + (Math.random() - 0.5) * 70 * (1 - i / n), (y * i) / n]); pts.push([x, y]); const d = 'M' + pts.map((p) => p[0].toFixed(0) + ' ' + p[1].toFixed(0)).join(' L');
      h += '<svg class="sg-bolt" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '"><path d="' + d + '" stroke="#fff" stroke-width="3.5" fill="none" stroke-linejoin="bevel"/><path d="' + d + '" stroke="' + c + '" stroke-width="12" fill="none" opacity=".45" stroke-linejoin="bevel"/></svg><div class="d3flash"></div>'; }
    if (B === 'moon') h += '<div class="sg-moon"></div>';
    if (B === 'vortex') h += '<div class="sg-vortex"></div>';
    if (B === 'flake') h += '<div class="sg-big">❄</div><div class="sg-frost"></div>';
    if (B === 'gears') h += '<div class="sg-big gear a">⚙</div><div class="sg-big gear b">⚙</div>';
    if (B === 'flames' || B === 'ghost') for (let i = 0; i < 7; i++) h += '<span class="sg-flame" style="--fx:' + ((i - 3) * 16) + 'px;--d:' + (i * 50) + 'ms;--s:' + (0.7 + Math.random() * 0.6).toFixed(2) + '"></span>';
    if (B === 'nova') h += '<div class="d3flash nova"></div>';
    if (B === 'crown') h += '<div class="sg-big crownup">♛</div>';
    if (B === 'runecircle') { let rc = '<div class="sg-rc">'; for (let k = 0; k < 10; k++) rc += '<span style="transform:rotate(' + k * 36 + 'deg) translateY(-118px)">' + D3_RUNES[(k * 3) % D3_RUNES.length] + '</span>'; h += rc + '</div>'; }
    if (B === 'prism') h += '<div class="sg-prism"></div><div class="sg-prism p2"></div><div class="d3flash nova"></div>';
    if (f.rings) for (let k = 3; k <= f.rings + 1; k++) h += '<div class="sg-ring r' + k + '"></div>';
    const N = f.big === 'petals' ? 30 : 26;
    for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2 + Math.random() * 0.3; const dist = 90 + Math.random() * 160; let dx = Math.cos(a) * dist, dy = Math.sin(a) * dist;
      if (f.move === 'rise') { dx = (Math.random() - 0.5) * 160; dy = -(120 + Math.random() * 220); } if (f.move === 'fall') { dx = (Math.random() - 0.5) * 260; dy = -(y * 0.9) * Math.random(); }
      let sh = D3_SHAPE[f.shape] || D3_SHAPE.spark; if (f.shape === 'rune') sh = '<i class="pru">' + D3_RUNES[Math.floor(Math.random() * D3_RUNES.length)] + '</i>';
      h += '<span class="d3p sg ' + (f.move === 'fall' ? 'fallin' : f.move) + '" style="--dx:' + dx.toFixed(0) + 'px;--dy:' + dy.toFixed(0) + 'px;--c:' + f.col[i % f.col.length] + ';--d:' + (Math.random() * 220).toFixed(0) + 'ms;--r:' + ((Math.random() - 0.5) * 720).toFixed(0) + 'deg;--sz:' + (1 + Math.random() * 1.2).toFixed(2) + '">' + sh + '</span>'; }
  }
  st.innerHTML = h; document.body.appendChild(st); dieEl.classList.add('n20pop');
  setTimeout(() => st.remove(), level === 'voll' ? 2400 : 1500);
}

/* Natürliche 1 (bei allen gleich): Bildschirm bebt, Risse laufen vom Würfel über den Bildschirm */
function d3stage1(dieEl, level) {
  const r = dieEl.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const W = window.innerWidth, H = window.innerHeight;
  const paths = []; const n = 7;
  for (let k = 0; k < n; k++) { let a = (k / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.6; let px = x, py = y; let d = 'M' + px.toFixed(0) + ' ' + py.toFixed(0); const len = Math.hypot(W, H) * (0.35 + Math.random() * 0.35); let walked = 0;
    while (walked < len) { const st = 25 + Math.random() * 45; a += (Math.random() - 0.5) * 0.7; px += Math.cos(a) * st; py += Math.sin(a) * st; walked += st; d += ' L' + px.toFixed(0) + ' ' + py.toFixed(0);
      if (Math.random() < 0.28) { let bx = px, by = py, ba = a + (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.6); let bd = 'M' + bx.toFixed(0) + ' ' + by.toFixed(0); for (let m = 0; m < 3; m++) { const bs = 15 + Math.random() * 25; ba += (Math.random() - 0.5) * 0.6; bx += Math.cos(ba) * bs; by += Math.sin(ba) * bs; bd += ' L' + bx.toFixed(0) + ' ' + by.toFixed(0); } paths.push([bd, 1]); } }
    paths.push([d, 2]); }
  const st = document.createElement('div'); st.className = 'd3stage n1stage'; st.setAttribute('aria-hidden', 'true'); st.style.cssText = '--x:' + x + 'px;--y:' + y + 'px';
  st.innerHTML = '<div class="n1-vig"></div><svg class="n1-cracks" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
    paths.map(([d, w]) => '<path d="' + d + '" stroke="rgba(0,0,0,.55)" stroke-width="' + (w * 2.4 + 1) + '" fill="none" stroke-linejoin="bevel"/><path d="' + d + '" stroke="rgba(255,235,225,.9)" stroke-width="' + w * 0.9 + '" fill="none" stroke-linejoin="bevel"/>').join('') +
    '<circle cx="' + x + '" cy="' + y + '" r="22" fill="none" stroke="rgba(255,235,225,.7)" stroke-width="1.2"/></svg>';
  document.body.appendChild(st);
  if (level === 'voll') { document.body.classList.remove('d3quake'); void document.body.offsetWidth; document.body.classList.add('d3quake'); setTimeout(() => document.body.classList.remove('d3quake'), 650); }
  setTimeout(() => st.remove(), 2300);
}

/* ---- Geräusche (WebAudio, ohne Dateien) ---- */
let D3_AC = null;
function d3ac() { if (!d3sound()) return null; try { if (!D3_AC) D3_AC = new (window.AudioContext || window.webkitAudioContext)(); if (D3_AC.state === 'suspended') D3_AC.resume(); return D3_AC; } catch (e) { return null; } }
function d3noise(ac, t, dur, f, g) { const n = Math.floor(ac.sampleRate * dur); const b = ac.createBuffer(1, n, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = ac.createBufferSource(); s.buffer = b; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.2; const gn = ac.createGain(); gn.gain.value = g; s.connect(bp); bp.connect(gn); gn.connect(ac.destination); s.start(t); }
function d3tone(ac, t, f1, f2, dur, g, type) { const o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); const gn = ac.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(g, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(gn); gn.connect(ac.destination); o.start(t); o.stop(t + dur + 0.05); }
function d3snd(kind, n) {
  const ac = d3ac(); if (!ac) return; const t = ac.currentTime + 0.01; const v = d3vol() * 0.5;
  if (kind === 'roll') { const k = Math.min(3, n || 1); for (let j = 0; j < k; j++) [0, 0.09, 0.17, 0.24, 0.3, 0.35, 0.39].forEach((dt, i) => d3noise(ac, t + dt + j * 0.03, 0.03, 1800 + Math.random() * 1600, v * (1 - i * 0.12))); }
  if (kind === 'land') d3tone(ac, t, 150, 60, 0.14, v * 0.8);
  if (kind === 'n20') [880, 1175, 1568, 2093].forEach((f, i) => d3tone(ac, t + i * 0.07, f, 0, 0.7, v * 0.35, 'triangle'));
  if (kind === 'n1') { d3tone(ac, t, 110, 70, 0.6, v * 0.5, 'sawtooth'); d3tone(ac, t, 117, 74, 0.6, v * 0.4, 'sawtooth'); d3noise(ac, t + 0.02, 0.12, 600, v); }
}

/* ---- Welches Set würfelt gerade? ---- */
function d3setOf(ch) { if (S.dmRoll || (typeof isDM === 'function' && isDM() && (S.view === 'camp' || S.view === 'mobs'))) return 'schatten'; const id = ch && (D3_OLD[ch.dice] || ch.dice); return id && D3_SETS[id] && !D3_SETS[id].dm ? id : 'klassik'; }
const d3ok = (sides) => [4, 6, 8, 10, 12, 20, 100].includes(+sides);

/* ---- Auswahl: pro Online-Raum gehört jedes Set nur einem Helden ---- */
function d3taken() { const m = {}; if (!S.camp || !S.table) return m; for (const [uid, p] of Object.entries(S.table)) if (uid !== UID && p && p.dice && D3_SETS[p.dice] && !D3_SETS[p.dice].free) { const o = m[p.dice]; if (!o || (p.diceAt || 0) < o.at) m[p.dice] = { name: p.char || 'jemand', at: p.diceAt || 0, uid }; } return m; }
function d3conflict() { /* gleichzeitig gewählt: früher gewählt gewinnt */
  const ch = cur(); if (!ch || !ch.dice || !S.camp) return; const t = d3taken()[ch.dice]; if (!t) return;
  if (t.at < (ch.diceAt || 0) || (t.at === (ch.diceAt || 0) && t.uid < UID)) { const nm = D3_SETS[ch.dice].name; ch.dice = ''; ch.diceAt = 0; persist('c', ch.id); if (typeof queueMe === 'function') queueMe(); bannerToast('Würfel-Set vergeben', '„' + nm + '“ hat ' + t.name + ' schon gewählt. Du würfelst wieder mit dem Heldenbuch-Set – wähle ein anderes.'); }
}
function diceModal() {
  const ch = cur(); if (!ch) return; const taken = d3taken(); const fx = d3fx(); const mine = ch.dice || 'klassik';
  const card = (id) => { const s = D3_SETS[id]; const tk = taken[id]; const on = mine === id;
    return '<button class="d3card' + (on ? ' on' : '') + (tk ? ' taken' : '') + '"' + (tk ? ' disabled' : '') + ' data-act="diceSet" data-arg="' + id + '"><span class="d3pv" style="--dg:' + s.glow + '">' + d3svg(20, 20, id, { tilt: 0.42 }) + '</span><b>' + esc(s.name) + '</b><small>' + (tk ? 'Vergeben an ' + esc(tk.name) : esc(s.desc)) + '</small></button>'; };
  const m = $('#modal'); S.modal = 'dice';
  m.innerHTML = '<div class="dlg d3dlg" role="dialog" aria-modal="true" aria-label="Würfel-Set"><div class="dph"><b>Würfel-Set für ' + esc(ch.name) + '</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<p class="hint">' + (S.camp ? 'Im Raum <b>' + esc(S.camp) + '</b> gehört jedes Set nur einem Helden. Am Tisch würfeln deine Würfel bei allen in deinem Design.' : 'Allein frei wählbar. Am Online-Tisch gehört jedes Set nur einem Helden.') + '</p>' +
    '<div class="d3grid">' + ['klassik'].concat(D3_PLAYER).map(card).join('') + '</div>' +
    (typeof isDM === 'function' && isDM() ? '<p class="hint">Als Spielleitung würfelst du am Tisch für Monster automatisch mit <b>Schatten der Spielleitung</b>.</p>' : '') +
    '<div class="d3opts"><div class="fld"><span>Effekte</span><div class="seg">' + [['voll', 'Voll'], ['ruhig', 'Ruhig'], ['aus', 'Aus']].map(([k, l]) => '<button class="' + (fx === k ? 'on' : '') + '" data-act="diceFx" data-arg="' + k + '">' + l + '</button>').join('') + '</div></div>' +
    '<div class="fld"><span>Geräusche</span><div class="seg"><button class="' + (d3sound() ? '' : 'on') + '" data-act="diceSnd" data-arg="0">Aus</button><button class="' + (d3sound() ? 'on' : '') + '" data-act="diceSnd" data-arg="1">An</button></div>' + (d3sound() ? '<input type="range" min="0" max="1" step="0.05" value="' + d3vol() + '" id="d3vol" aria-label="Lautstärke">' : '') + '</div>' +
    '<div class="d3try"><button class="btn ghost" data-act="diceTry" data-arg="20">Probewurf W20</button><button class="btn ghost" data-act="diceTry" data-arg="n20">Natürliche 20 zeigen</button><button class="btn ghost" data-act="diceTry" data-arg="n1">Natürliche 1 zeigen</button></div></div></div>';
  m.hidden = false;
}
XA.diceOpen = () => diceModal();
XA.diceSet = (t, a) => { const ch = cur(); if (!ch || !D3_SETS[a] || D3_SETS[a].dm) return; if (d3taken()[a]) return; ch.dice = a === 'klassik' ? '' : a; ch.diceAt = Date.now(); persist('c', ch.id); if (typeof queueMe === 'function') queueMe(); diceModal(); };
XA.diceFx = (t, a) => { d3set('hb_dice_fx', a); d3set('hb_fx', { voll: 'stark', ruhig: 'dezent', aus: 'aus' }[a] || 'stark'); if (typeof applyFxLevel === 'function') { applyFxLevel(); if (typeof startFx === 'function') startFx(); } diceModal(); };
XA.diceSnd = (t, a) => { d3set('hb_dice_snd', a); if (a === '1') { d3ac(); d3snd('land'); } diceModal(); };
XA.diceTry = (t, a) => { const m = $('#modal'); m.hidden = true; S.modal = null; const n = a === 'n20' ? 20 : a === 'n1' ? 1 : 1 + Math.floor(Math.random() * 20); pushLog({ label: 'Probewurf', total: n, detail: 'W20 [' + n + '] · nur zum Anschauen', sides: 20, nat: n, crit: n === 20, fumble: n === 1, preview: true }); };
document.addEventListener('input', (ev) => { if (ev.target && ev.target.id === 'd3vol') d3set('hb_dice_vol', ev.target.value); });
document.addEventListener('change', (ev) => { if (ev.target && ev.target.id === 'd3vol') d3snd('land'); });

function diceRow(ch, small) { if (!ch) return ''; const id = d3setOf(ch); const s = D3_SETS[id];
  return '<div class="d3row' + (small ? ' sm' : '') + '"><span class="d3pv" style="--dg:' + s.glow + '">' + d3svg(20, 20, id, { tilt: 0.42, thin: true }) + '</span><div><b>' + esc(s.name) + '</b>' + (small ? '' : '<small>' + esc(s.desc) + '</small>') + '</div><button class="btn sm ghost" data-act="diceOpen">' + (small ? 'Ändern' : 'Würfel-Set wählen') + '</button></div>'; }
