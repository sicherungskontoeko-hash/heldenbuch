/* ---------- ✦ Beute würfeln nach Herausforderungsgrad (eigene Tabellen) ----------
   Quelle: besiegte Gegner des laufenden Kampfs (sonst alle Gegner, sonst die des zuletzt beendeten Kampfs).
   Ergebnis: Münzen, Wertsachen, magische Gegenstände (aus MAGIC_ITEMS nach Seltenheit), EP – füllt auf Wunsch das Verteilen-Formular. */
const LOOT_GEMS = [
  [10, ['ein trüber Blutstein', 'ein Beutel Flussperlen', 'ein Achat mit Bänderung', 'eine angelaufene Kupferbrosche', 'ein Satz beinerner Würfel']],
  [25, ['eine silberne Gürtelschnalle mit Rabenmotiv', 'ein Mondstein, kaum grösser als ein Fingernagel', 'ein bemalter Holzanhänger aus Valdris', 'ein Jaspis in Messingfassung']],
  [50, ['ein Onyx mit eingeritzter Rune', 'ein Karneol, rot wie Glut', 'eine Silberkette mit Bernstein', 'ein kleiner Zinnspiegel mit Elfenmuster']],
  [250, ['ein geschliffener Granat', 'ein Jadeamulett in Drachenform', 'ein goldener Siegelring mit fremdem Wappen', 'eine Elfenbeinstatuette einer Göttin']],
  [750, ['ein tiefblauer Saphir', 'eine Goldkrone mit Perlen', 'ein Kelch aus Weissgold mit Granaten', 'ein Wandteppich aus Seide, kunstvoll bestickt']],
  [2500, ['ein Smaragd von der Grösse einer Walnuss', 'ein schwarzer Opal, in dem Sterne zu treiben scheinen', 'ein juwelenbesetztes Zepter eines vergessenen Königs']]
];
const LOOT_RAR = [ /* Gewichte je Stufe der Gefahr */
  { 'gewöhnlich': 55, 'ungewöhnlich': 40, 'selten': 5 },
  { 'gewöhnlich': 20, 'ungewöhnlich': 50, 'selten': 27, 'sehr selten': 3 },
  { 'ungewöhnlich': 25, 'selten': 45, 'sehr selten': 27, 'legendär': 3 },
  { 'selten': 30, 'sehr selten': 55, 'legendär': 15 }
];
const lootTier = (n) => n <= 4 ? 0 : n <= 10 ? 1 : n <= 16 ? 2 : 3;
const lootD = (n, s) => { let t = 0; for (let i = 0; i < n; i++) t += 1 + Math.floor(rnd() * s); return t; };
const lootPick = (a) => a[Math.floor(rnd() * a.length)];
function lootWeighted(w) { const tot = Object.values(w).reduce((s, x) => s + x, 0); let r = rnd() * tot; for (const [k, x] of Object.entries(w)) { r -= x; if (r < 0) return k; } return Object.keys(w)[0]; }
function lootFoes() {
  const c = S.combat; const live = c && c.active ? (c.npcs || []).filter((x) => !x.ally && !x.reserve) : [];
  if (live.length) { const dead = live.filter((x) => x.hpMax > 0 && x.hp <= 0); return { list: dead.length ? dead : live, src: dead.length ? 'besiegt' : 'alle Gegner' }; }
  return { list: S.lastFoes || [], src: 'letzter Kampf' };
}
function lootGen(foes, hoard) {
  const crs = foes.map((x) => (BESTIARY[x.mid] || [])[1]).filter((cr) => CR_XP[cr] != null); if (!crs.length) return null;
  const maxN = Math.max(...crs.map(crNum)); const tier = lootTier(maxN);
  const coin = (cr) => { const n = crNum(cr), t = lootTier(n); return t === 0 ? lootD(2, 6) * 2 + Math.round(n * 5) : t === 1 ? lootD(4, 6) * 10 : t === 2 ? lootD(4, 6) * 40 : lootD(6, 6) * 150; };
  let gm = crs.reduce((s, cr) => s + coin(cr), 0); if (hoard) gm = gm * 4 + [50, 400, 2500, 15000][tier];
  const vals = []; const vRoll = hoard ? 1 + lootD(1, 3) : rnd() < 0.4 ? 1 : 0;
  for (let i = 0; i < vRoll; i++) { const g = LOOT_GEMS[Math.min(LOOT_GEMS.length - 1, tier * 1 + Math.floor(rnd() * 2) + (tier ? 1 : 0))]; vals.push({ n: lootPick(g[1]), v: g[0] }); }
  const items = []; let scroll = null;
  const nItems = hoard ? 1 + lootD(1, 2) : rnd() < Math.min(0.6, 0.25 + 0.05 * (foes.length - 1) + 0.1 * tier) ? 1 : 0;
  for (let i = 0; i < nItems; i++) {
    if (rnd() < 0.15) { const lv = [lootD(1, 2), 1 + lootD(1, 3), 3 + lootD(1, 3), 5 + lootD(1, 4)][tier]; scroll = 'Zauberschriftrolle (Grad ' + Math.min(9, lv) + ')'; continue; }
    const r = lootWeighted(LOOT_RAR[tier]); const pool = Object.keys(MAGIC_ITEMS).filter((k) => MAGIC_ITEMS[k].r === r && !items.includes(k)); if (pool.length) items.push(lootPick(pool));
  }
  if (!hoard && !items.length && tier === 0 && rnd() < 0.3) items.push('potion-heal');
  const xp = foes.reduce((s, x) => s + (CR_XP[(BESTIARY[x.mid] || [])[1]] || 0), 0);
  return { gm, vals, items, scroll, xp, tier, n: foes.length, hoard: !!hoard, t: Date.now() };
}
const lootHeroes = () => Math.max(1, players().length);
function lootBox() {
  const L = S.loot; const f = lootFoes(); const nh = lootHeroes();
  let h = '<div class="lootbar"><button class="btn sm ghost" data-act="lootRoll"' + (f.list.length ? '' : ' disabled title="Erst Gegner in einen Kampf setzen"') + '>🎲 Beute würfeln</button><label class="chk" title="Versteck, Schatzkammer oder Anführer: deutlich mehr"><input type="checkbox" id="lootHoard"' + (S.lootHoard ? ' checked' : '') + '> Hort</label><span class="hint">' + (f.list.length ? f.list.length + ' Gegner (' + f.src + ')' : 'noch keine Gegner') + '</span></div>';
  if (!L) return h;
  const per = Math.floor(L.gm / nh); const valSum = L.vals.reduce((s, v) => s + v.v, 0);
  h += '<div class="lootres"><p><b>' + L.gm.toLocaleString('de-CH') + ' GM</b> in Münzen' + (nh > 1 ? ' · ' + per.toLocaleString('de-CH') + ' je Held' : '') + ' · <b>' + L.xp.toLocaleString('de-CH') + ' EP</b>' + (nh > 1 ? ' (' + Math.floor(L.xp / nh).toLocaleString('de-CH') + ' je Held)' : '') + '</p>' +
    (L.vals.length ? '<p class="lootv">Wertsachen (' + valSum.toLocaleString('de-CH') + ' GM): ' + L.vals.map((v) => esc(v.n) + ' <small>' + v.v + ' GM</small>').join(' · ') + '</p>' : '') +
    (L.items.length || L.scroll ? '<div class="chips lootit">' + L.items.map((k) => '<button class="chip' + (S.lootSel === k ? ' on' : '') + '" data-act="lootItem" data-arg="' + k + '" title="' + esc(MAGIC_ITEMS[k].text) + '">✦ ' + esc(MAGIC_ITEMS[k].name) + ' <small>' + MAGIC_ITEMS[k].r + '</small></button>').join('') + (L.scroll ? '<span class="chip ro">📜 ' + esc(L.scroll) + '</span>' : '') + '</div>' : '<p class="hint">Kein magischer Gegenstand dabei.</p>') +
    '<div class="chips"><button class="btn sm" data-act="lootFill">Ins Formular übernehmen</button><span class="hint">EP, Gold je Held, ein Gegenstand und die Wertsachen als Eintrag – danach „Verteilen“.</span></div></div>';
  return h;
}
Object.assign(XA, {
  lootRoll: () => { const f = lootFoes(); S.lootHoard = !!($('#lootHoard') || {}).checked; const L = lootGen(f.list, S.lootHoard); if (!L) { bannerToast('Keine Gegner', 'Setze zuerst Gegner aus dem Bestiarium in einen Kampf.'); return; } S.loot = L; S.lootSel = L.items[0] || null; paintCamp(true); },
  lootItem: (t, a) => { S.lootSel = S.lootSel === a ? null : a; paintCamp(true); },
  lootFill: () => { const L = S.loot; if (!L) return; const nh = lootHeroes();
    const rest = L.items.filter((k) => k !== S.lootSel).map((k) => MAGIC_ITEMS[k].name).concat(L.scroll ? [L.scroll] : [], L.vals.map((v) => v.n + ' (' + v.v + ' GM)'));
    S.gPre = { to: 'all', xp: Math.floor(L.xp / nh) || '', gm: Math.floor(L.gm / nh) || '', item: S.lootSel || '', text: rest.join(', ') }; paintCamp(true);
    setTimeout(() => { const b = $('[data-act="gift"]'); if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); b.classList.add('glowbtn'); setTimeout(() => b.classList.remove('glowbtn'), 2400); } }, 60); }
});
/* Gegner merken, bevor ein Kampf beendet wird (danach sind sie weg) */
document.addEventListener('click', (ev) => { const t = ev.target && ev.target.closest && ev.target.closest('[data-act="fightEnd"]'); if (!t || !S.combat || !S.combat.active) return;
  const l = (S.combat.npcs || []).filter((x) => !x.ally && !x.reserve); if (l.length) { const dead = l.filter((x) => x.hpMax > 0 && x.hp <= 0); S.lastFoes = (dead.length ? dead : l).map((x) => ({ mid: x.mid, hp: x.hp, hpMax: x.hpMax })); } }, true);
/* Nach dem Verteilen: Vorbelegung und Beute leeren */
const _gift0 = XA.gift; XA.gift = function () { const r = _gift0.apply(this, arguments); S.gPre = null; S.loot = null; S.lootSel = null; return r; };
