/* Abgleich mit dem SRD 5.2 (2024): jeder Zauber und jedes Monster, das es dort gibt, gegen die Prüfwerte in srd2024-ref.json.
   Zauber: Grad, Schule, Konzentration, Ritual, Klassen, Reichweite, Schadensart, Grundwürfel, Rettungswurf, Angriffsart, Steigerung.
   Monster: HG, RK, TP, Trefferwürfel, Bewegung, Angriffsbonus und Schadenswürfel.
   Bewusst abweichend (mit Grund) steht in ERLAUBT. Aufruf: node tests/srd.test.js */
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const REF = JSON.parse(fs.readFileSync(path.join(__dirname, 'srd2024-ref.json'), 'utf8'));
const ERLAUBT = {
  'protection-from-evil-and-good': 'Konzentration: SRD-Daten widersprüchlich (Dauer «Concentration», Feld false) – Konzentration ist richtig',
  'fire-shield': 'zwei Schadensarten (warm/kalt), Rechentabelle führt Kälte',
  'arcane-hand': 'Steigerung: Faust +2W8 (Datensatz nennt auch die Hand mit +2W6)',
  'wall-of-ice': 'Steigerung: Wand +2W6 (Datensatz nennt auch die kalte Luft mit +1W6)',
  'wish': 'Kurzfassung ohne Nebenwirkungsschaden', 'earthquake': 'Kurzfassung ohne Einsturzschaden', 'prismatic-wall': 'Kurzfassung ohne Schichtwerte', 'symbol': 'Schadensart im Text, Datensatz verzeichnet Tod'
};
const MOB_ALIAS = { goblin: 'goblin-warrior', hobgoblin: 'hobgoblin-warrior', kobold: 'kobold-warrior', gnoll: 'gnoll-warrior', bugbear: 'bugbear-warrior', thug: 'tough', veteran: 'warrior-veteran', 'cult-fanatic': 'cultist-fanatic',
  'adult-red': 'adult-red-dragon', 'adult-black': 'adult-black-dragon', 'adult-blue': 'adult-blue-dragon', 'adult-green': 'adult-green-dragon', 'adult-white': 'adult-white-dragon', 'young-red': 'young-red-dragon', 'young-black': 'young-black-dragon', 'young-blue': 'young-blue-dragon', 'young-green': 'young-green-dragon', 'young-white': 'young-white-dragon',
  minotaur: 'minotaur-of-baphomet', werewolf: 'werewolf-hybrid', 'black-wyrmling': 'black-dragon-wyrmling', 'red-wyrmling': 'red-dragon-wyrmling', 'white-wyrmling': 'white-dragon-wyrmling', 'green-wyrmling': 'green-dragon-wyrmling', 'blue-wyrmling': 'blue-dragon-wyrmling',
  acolyte: 'priest-acolyte', centaur: 'centaur-trooper', sahuagin: 'sahuagin-warrior', vampire: 'vampire-vampire', wererat: 'wererat-hybrid', 'giant-constrictor': 'giant-constrictor-snake', merfolk: 'merfolk-skirmisher', 'flying-sword': 'animated-flying-sword', 'rug-of-smothering': 'animated-rug-of-smothering' };
const SCH = { abjuration: 'abj', conjuration: 'con', divination: 'div', enchantment: 'enc', evocation: 'evo', illusion: 'ill', necromancy: 'nec', transmutation: 'trs' };
const CLS = { bard: 'brd', cleric: 'cle', druid: 'dru', paladin: 'pal', ranger: 'ran', sorcerer: 'sor', warlock: 'wlk', wizard: 'wiz' };
const DT = { fire: 'Feuer', force: 'Energie', radiant: 'gleissend', necrotic: 'nekrotisch', cold: 'Kälte', lightning: 'Blitz', thunder: 'Schall', acid: 'Säure', poison: 'Gift', psychic: 'psychisch', bludgeoning: 'Wucht', piercing: 'Stich', slashing: 'Hieb' };
const M = { 5: '1,5', 10: '3', 15: '4,5', 20: '6', 25: '7,5', 30: '9', 35: '10,5', 40: '12', 45: '13,5', 50: '15', 60: '18', 80: '24', 90: '27', 120: '36', 150: '45', 300: '90', 500: '150' };
const ft = (s) => { const m = /^(\d+) f/.exec(s || ''); return m ? +m[1] : null; };
const crS = (v) => ({ 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' }[v] || String(v));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.waitForTimeout(500);
  const app = await p.evaluate(() => ({ spells: SPELLS, data: SPELL_DATA, mobs: BESTIARY })); await b.close();
  const bad = []; let nS = 0, nM = 0;
  for (const [id, s] of Object.entries(app.spells)) {
    const e = REF.spells[id]; if (!e) continue; nS++; const d = app.data[id] || {}; const p2 = [];
    if (s.lvl !== e.lvl) p2.push('Grad'); if (s.school !== SCH[e.school]) p2.push('Schule'); if (!!s.ritual !== e.ritual) p2.push('Ritual');
    if (!!s.conc !== e.conc) p2.push('Konzentration');
    if (s.classes.slice().sort().join() !== e.classes.map((c) => CLS[c]).filter(Boolean).sort().join()) p2.push('Klassen ' + s.classes.join(' '));
    const f = ft(e.range); if (f && M[f] && s.range !== M[f] + ' m') p2.push('Reichweite ' + s.range + ' statt ' + M[f] + ' m');
    if (e.dtype && DT[e.dtype]) { if (d.type && d.type !== DT[e.dtype]) p2.push('Schadensart (Daten) ' + d.type); if (!s.text.toLowerCase().includes(DT[e.dtype].toLowerCase().slice(0, 5))) p2.push('Schadensart fehlt im Text'); }
    const dm = /^(\d+)d(\d+)/.exec(e.dice || ''); if (dm) { if (d.n && !d.heal && (d.n !== +dm[1] || d.s !== +dm[2])) p2.push('Würfel (Daten)'); if (!s.text.includes(dm[1] + 'W' + dm[2])) p2.push('Würfel fehlen im Text'); }
    if (e.save && d.save && d.save !== e.save) p2.push('Rettungswurf (Daten)');
    if (e.atk && d.atk && d.atk !== e.atk) p2.push('Angriffsart (Daten)');
    if (e.up && d.n && !d.heal && ((d.up || 0) !== e.up[0] || d.s !== e.up[1])) p2.push('Steigerung (Daten)');
    if (p2.length && !ERLAUBT[id]) bad.push('Zauber ' + id + ': ' + p2.join(', '));
  }
  for (const [id, m] of Object.entries(app.mobs)) {
    const e = REF.monsters[MOB_ALIAS[id] || id]; if (!e) continue; nM++; const p2 = [];
    if (String(m[1]) !== crS(e.cr)) p2.push('HG'); if (m[2] !== e.ac) p2.push('RK'); if (m[3] !== e.hp) p2.push('TP');
    if (e.hd && String(m[4]).replace(/\s/g, '') !== e.hd.replace(/d/g, 'W')) p2.push('Trefferwürfel');
    const w = ft(e.speed.walk); if (w != null && M[w] && !String(m[5]).startsWith(M[w] + ' m')) p2.push('Bewegung ' + m[5]);
    for (const [nm, bo, dmg] of m[7]) { const base = String(dmg).replace(/W/g, 'd').split('+')[0]; if (!/^\d+d\d+$/.test(base)) continue; if (!e.att.some(([b2, d2]) => b2 === bo && d2.split('+')[0] === base)) p2.push('Angriff ' + nm + ' +' + bo + ' ' + dmg); }
    if (p2.length) bad.push('Monster ' + id + ': ' + p2.join(', '));
  }
  for (const x of bad) console.log('✘ ' + x);
  console.log((bad.length ? '✘' : '✔') + ' ' + nS + ' Zauber und ' + nM + ' Monster mit dem SRD 5.2 abgeglichen, ' + bad.length + ' Abweichungen' + (Object.keys(ERLAUBT).length ? ' (' + Object.keys(ERLAUBT).length + ' begründete Ausnahmen)' : ''));
  process.exit(bad.length ? 1 : 0);
})();
