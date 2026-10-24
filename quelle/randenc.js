/* ---------- Zufallsbegegnung auf Knopfdruck ----------
   Fundort + Gruppe (Anzahl/Stufen) + Schwierigkeit → ausgewogene Begegnung nach dem EP-Budget (SRD 5.2.1).
   Vorlagen: Einzelgegner, Rudel gleicher Art, Anführer mit Gefolge, gemischte Gruppe. Ergebnis landet im Begegnungsplaner. */
const ER_DIFF = ['Niedrig', 'Moderat', 'Hoch'];
/* ✦ kurze Szenen-Aufhänger je Fundort */
const ER_SCENE = {
  stadt: ['In einer engen Gasse versperren sie euch den Weg – hinter euch fällt ein Tor ins Schloss.', 'Auf dem Markt bricht Tumult aus, mittendrin stehen sie und haben euch längst gesehen.', 'Im Hinterzimmer einer Schenke kippt die Stimmung, Stühle fallen um.'],
  wald: ['Zwischen den Bäumen knackt es, dann wird es plötzlich still – sie sind schon da.', 'Auf einer Lichtung stösst ihr auf ein frisch verlassenes Lager. Nicht ganz verlassen.', 'Der Pfad führt über einen umgestürzten Stamm, darunter bewegt sich etwas.'],
  gebirge: ['Auf dem schmalen Pass rieseln Steine – von oben kommen sie.', 'In einer Felsnische flackert ein Feuer, und die Wachen dort sind hellwach.', 'Der Wind trägt einen Geruch heran, dann ein Brüllen, das von den Wänden widerhallt.'],
  hoehle: ['Eure Fackel zeigt Kratzspuren an der Decke. Frische.', 'Das Tropfen verstummt. In der Dunkelheit glimmen Augen auf.', 'Der Gang öffnet sich zu einer Halle, in der etwas auf euch gewartet hat.'],
  sumpf: ['Der Steg knarrt, das Wasser daneben schlägt Blasen.', 'Nebel kriecht über das Moor, und in ihm schälen sich Gestalten heraus.', 'Ein Irrlicht tanzt voraus, als wolle es euch genau hierher führen.'],
  gruft: ['Eine Grabplatte schabt zur Seite. Kalte Luft weht heraus.', 'Kerzen, die niemand angezündet hat, flackern auf, als ihr eintretet.', 'Hinter euch rastet der Riegel ein, vor euch regt sich Staub.'],
  kueste: ['Die Flut kommt schneller als gedacht – und mit ihr etwas aus dem Wasser.', 'Am Strand liegt ein Wrack, und im Wrack wohnt jemand.', 'Möwen fliegen kreischend auf, dann bricht die Brandung an der falschen Stelle.'],
  wueste: ['Die Düne vor euch bewegt sich. Sie ist keine Düne.', 'Am Wasserloch sind andere schneller gewesen, und sie teilen nicht.', 'Hitzeflimmern, dann Schatten, die nicht zur Sonne passen.'],
  eis: ['Das Eis unter euch knackt, und durch den Schneesturm kommen Umrisse näher.', 'Spuren im Schnee führen im Kreis – um euch herum.', 'Aus einer Eishöhle dringt ein tiefes, hungriges Grollen.'],
  ebenen: ['Die Luft reisst auf wie Stoff, Schwefelgeruch strömt herein.', 'Ein Portal flackert, und wer durchkommt, ist nicht freundlich gesinnt.', 'Die Farben stimmen hier nicht, und die Wesen darin auch nicht.'],
  arkan: ['Eine Glyphe am Boden glüht auf, als der Erste sie betritt.', 'Die Bücherregale rücken zusammen, irgendwo klirrt eine Rüstung.', 'Der Turm summt. Etwas wurde hier zur Bewachung zurückgelassen.']
};
const erXp = (k) => CR_XP[(BESTIARY[k] || [])[1]] || 0;
const erPick = (a) => a[Math.floor(rnd() * a.length)];
const erInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
function erBudget(levels, d) { return levels.reduce((s, l) => s + XP_BUDGET[Math.max(1, Math.min(20, +l || 1))][d], 0); }
/* Ein Vorschlag pro Aufruf. Gibt { mobs:[{mid,n}], xp, kind } oder null. */
function randEnc(hab, levels, d) {
  if (!levels.length) return null;
  const B = erBudget(levels, d); const lowB = d > 0 ? erBudget(levels, d - 1) + 1 : Math.round(B * 0.5);
  const pool = Object.keys(BESTIARY).filter((k) => mobHab(k).includes(hab) && erXp(k) > 0 && erXp(k) <= B);
  if (!pool.length) return null;
  const MAXN = Math.min(12, Math.max(6, levels.length * 2));
  const tpl = {
    solo: () => { const c = pool.filter((k) => erXp(k) >= lowB); return c.length ? [{ mid: erPick(c), n: 1 }] : null; },
    rudel: () => { const c = pool.filter((k) => erXp(k) * 2 <= B && erXp(k) * MAXN >= lowB); if (!c.length) return null; const k = erPick(c); const x = erXp(k);
      const lo = Math.max(2, Math.ceil(lowB / x)), hi = Math.min(MAXN, Math.floor(B / x)); return lo <= hi ? [{ mid: k, n: erInt(lo, hi) }] : null; },
    anfuehrer: () => { const c = pool.filter((k) => erXp(k) >= B * 0.3 && erXp(k) <= B * 0.75); if (!c.length) return null; const L = erPick(c); const rest = B - erXp(L);
      const m = pool.filter((k) => k !== L && crNum(BESTIARY[k][1]) < crNum(BESTIARY[L][1]) && erXp(k) <= rest); if (!m.length) return null; const k = erPick(m); const x = erXp(k);
      const lo = Math.max(1, Math.ceil((lowB - erXp(L)) / x)), hi = Math.min(MAXN - 1, Math.floor(rest / x)); return lo <= hi ? [{ mid: L, n: 1 }, { mid: k, n: erInt(lo, hi) }] : null; },
    gemischt: () => { const c = pool.filter((k) => erXp(k) * 3 <= B); if (c.length < 2) return null; const a = erPick(c); let b = erPick(c); for (let i = 0; i < 8 && b === a; i++) b = erPick(c); if (a === b) return null;
      const out = { [a]: 1, [b]: 1 }; let tot = erXp(a) + erXp(b), n = 2; for (let i = 0; i < 20 && n < MAXN; i++) { const k = rnd() < 0.5 ? a : b; if (tot + erXp(k) > B) { const o = k === a ? b : a; if (tot + erXp(o) > B) break; out[o]++; tot += erXp(o); } else { out[k]++; tot += erXp(k); } n++; if (tot >= lowB && rnd() < 0.35) break; }
      return Object.entries(out).map(([mid, n2]) => ({ mid, n: n2 })); }
  };
  const W = [['solo', 2], ['rudel', 3], ['anfuehrer', 3], ['gemischt', 2]];
  const good = []; let best = null;
  for (let t = 0; t < 160 && good.length < 6; t++) {
    let r = rnd() * W.reduce((s, w) => s + w[1], 0); let kind = W[0][0]; for (const [k, w] of W) { r -= w; if (r < 0) { kind = k; break; } }
    const mobs = tpl[kind](); if (!mobs) continue;
    const xp = encXp(mobs); const n = mobs.reduce((s, m) => s + m.n, 0);
    const off = xp < lowB ? lowB - xp : xp > B ? (xp - B) * 2 : 0;
    const cand = { mobs, xp, kind, n, off };
    if (!off) good.push(cand); else if (!best || off < best.off) best = cand;
  }
  return good.length ? erPick(good) : best;
}
/* Gruppe für die Berechnung: am Tisch automatisch, sonst Eingabe im Planer, sonst 4 Helden auf der Stufe des eigenen Helden */
function erLevels() {
  const auto = partyLevels(); if (auto.length) return { levels: auto, auto: true };
  const E = S.enc || {}; if (E.np && E.lv) return { levels: Array.from({ length: Math.max(1, Math.min(10, +E.np)) }, () => +E.lv), auto: false };
  let L = 1; try { L = cur() ? derive(cur(), S.hb).level : 1; } catch (e) {}
  return { levels: [L, L, L, L], auto: false, guess: true };
}
function encRandBox() {
  const h = S.erHab || (S.mhab && HABITATS[S.mhab] ? S.mhab : 'wald'); const d = S.erDiff != null ? S.erDiff : 1; const g = erLevels(); const E = S.enc || {};
  return '<div class="encrand"><b>🎲 Zufallsbegegnung</b><div class="chips"><select id="erHab" aria-label="Fundort">' + Object.entries(HABITATS).map(([k, l]) => '<option value="' + k + '"' + (k === h ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>' +
    ER_DIFF.map((l, i) => chip(i === d, l, 'data-act="erDiff" data-arg="' + i + '"')).join('') + '<button class="btn sm" data-act="encRand">' + (E.rand ? 'Neu würfeln' : 'Würfeln') + '</button></div>' +
    (g.guess ? '<p class="hint">Gerechnet für 4 Helden auf Stufe ' + g.levels[0] + ' – unten anpassbar.</p>' : '') +
    (E.rand && E.scene ? '<p class="erscene">✦ ' + esc(E.scene) + '</p>' : '') + '</div>';
}
Object.assign(XA, {
  erDiff: (t, a) => { S.erDiff = +a; encPlanner(); },
  encRand: () => { const sel = $('#erHab'); if (sel) S.erHab = sel.value; const h = S.erHab || 'wald'; const d = S.erDiff != null ? S.erDiff : 1; const g = erLevels();
    S.enc = S.enc || { name: '', mobs: [], lv: '', np: '' }; const E = S.enc; if (g.guess && !E.np) { E.np = String(g.levels.length); E.lv = String(g.levels[0]); }
    const r = randEnc(h, g.levels, d);
    if (!r) { bannerToast('Nichts gefunden', 'In „' + HABITATS[h] + '“ gibt es keine Kreatur, die zu dieser Gruppe passt.'); return; }
    if (r.off) bannerToast('Nicht ganz passend', 'In „' + HABITATS[h] + '“ gibt es nichts, das genau passt – die Schwierigkeit unten zeigt, was herauskam.');
    E.mobs = r.mobs; E.rand = true; E.name = 'Zufall · ' + HABITATS[h] + ' (' + ER_DIFF[d] + ')'; E.scene = erPick(ER_SCENE[h] || ['']);
    encPlanner(); },
  encRandOpen: () => { S.enc = { name: '', mobs: [{ mid: '', n: 1 }], lv: (S.enc || {}).lv || '', np: (S.enc || {}).np || '' }; XA.encRand(); if (!$('#modal') || $('#modal').hidden) encPlanner(); },
  encFight: () => { const E = S.enc; if (!E) return; E.name = ($('#encName') || {}).value || E.name; const o = encOpts(); S.modal = null; $('#modal').hidden = true;
    S.myInit = null; saveCombat({ id: 'k' + Date.now().toString(36), active: true, round: 1, turn: null, npcs: [], t: Date.now() }); encInsert(E.mobs.filter((m) => BESTIARY[m.mid] && +m.n > 0), E.name, o); S.view = 'camp'; render(); }
});
document.addEventListener('change', (ev) => { if (ev.target && ev.target.id === 'erHab') S.erHab = ev.target.value; });
