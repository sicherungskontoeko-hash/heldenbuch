/* HB-25 Robustheit (Import, Migration, Speicher) und HB-26 Sonderfälle pro Spezies/Klasse als Kampfabläufe.
   Aufruf: node tests/cases.test.js [pfad/zur/app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  /* Alter v1-Spielstand im Speicher, bevor die App startet */
  await p.addInitScript(() => { try { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('heldenbuch', JSON.stringify({ chars: { alt1: { id: 'alt1', name: 'Altheld', cls: 'cle', level: 5, play: { hp: 20, res: {}, slots: {}, cond: [] } } }, hb: {}, cur: 'alt1' })); } } catch (e) {} });
  await p.goto('file://' + target); await p.waitForTimeout(500);
  const res = await p.evaluate(async () => {
    const out = []; const T = (id, name, got, want) => out.push({ id, name, ok: JSON.stringify(got) === JSON.stringify(want), got, want });
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let q = []; const seq = (...v) => { q = v.map((n) => (n - 0.5) / 20); }; Math.random = () => (q.length ? q.shift() : 0.5);
    const mk = (o) => { const ch = normChar(newChar(Object.assign({ name: 'T' }, o))); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.hp = derive(ch, S.hb).hpMax; return ch; };
    const click = (act, arg, extra) => { const t = document.createElement('button'); t.dataset.act = act; if (arg !== undefined) t.dataset.arg = arg; Object.assign(t.dataset, extra || {}); document.body.appendChild(t); t.click(); t.remove(); };
    S.rules = { strict: true };
    /* ---- HB-25 ---- */
    const alt = S.chars.alt1; T('HB-25', 'v1-Spielstand migriert (Unterklasse gesetzt, v=2)', alt ? [alt.v, alt.sub] : null, [2, 'life']);
    T('HB-25', 'Sicherung vor Migration angelegt', !!localStorage.getItem('heldenbuch_backup_v1'), true);
    { const n0 = Object.keys(S.chars).length; XA.restoreBackup(); const n1 = Object.keys(S.chars).length; T('HB-25', 'Sicherung als Kopie wiederhergestellt, Original bleibt', [n1 - n0, !!S.chars.alt1], [1, true]); }
    const tryImp = (txt) => { const n0 = JSON.stringify(Object.keys(S.chars).sort()); let err = ''; try { importJson(txt); } catch (e) { err = e.message; } return [!!err, JSON.stringify(Object.keys(S.chars).sort()) === n0]; };
    T('HB-25', 'Stufe 999 abgelehnt, nichts verändert', tryImp('{"id":"x1","name":"A","cls":"fig","level":999}'), [true, true]);
    T('HB-25', 'Attribut 9999 abgelehnt', tryImp('{"id":"x2","name":"A","cls":"fig","level":3,"base":{"str":9999}}'), [true, true]);
    T('HB-25', 'Defekter Spielstand („play“ ist Text) abgelehnt', tryImp('{"id":"x3","name":"A","cls":"fig","level":3,"play":"kaputt"}'), [true, true]);
    T('HB-25', 'Multiclass mit falscher Stufe abgelehnt', tryImp('{"id":"x4","name":"A","cls":"fig","level":3,"multi":[{"cls":"wiz","level":-2}]}'), [true, true]);
    T('HB-25', 'Kaputtes JSON abgelehnt', tryImp('{"id": "x5", '), [true, true]);
    { const keep = S.chars.alt1.name; importJson(JSON.stringify({ chars: [{ id: 'alt1', name: 'Doppelt', cls: 'fig', level: 2 }, { id: 'alt1', name: 'Doppelt2', cls: 'fig', level: 2 }] })); const names = Object.values(S.chars).map((c) => c.name); T('HB-25', 'Doppelte IDs: vorhandener Held nicht überschrieben, beide neu angelegt', [S.chars.alt1.name, names.includes('Doppelt'), names.includes('Doppelt2')], [keep, true, true]); }
    { const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'heldenbuch') { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } return orig.call(this, k, v); };
      const ch = mk({ cls: 'fig', level: 1 }); ch.name = 'Speichertest'; commit(false); const flagged = !!S.saveErr; Storage.prototype.setItem = orig; commit(false); T('HB-25', 'Voller Speicher: sichtbar gemeldet, Daten im Speicher erhalten, danach wieder gespeichert', [flagged, S.chars[ch.id].name, !S.saveErr], [true, 'Speichertest', true]); }
    /* ---- HB-26 ---- */
    { const ch = mk({ cls: 'fig', level: 3, species: 'orc' }); const P = ch.play; P.hp = 3; document.getElementById('hpAmt') || document.body.insertAdjacentHTML('beforeend', '<input id="hpAmt">'); document.getElementById('hpAmt').value = 8; click('hp', 'dmg'); T('HB-26', 'Ork: Unerbittliche Ausdauer → 1 TP statt 0', P.hp, 1); click('hp', 'dmg'); T('HB-26', 'Ork: zweites Mal → 0 TP, bewusstlos', [P.hp, P.cond.includes('unconscious')], [0, true]); }
    { const ch = mk({ cls: 'fig', level: 1, species: 'halfling' }); seq(1, 14); d20(0, 'Test', { kind: 'check:str' }); T('HB-26', 'Halbling: natürliche 1 wird neu gewürfelt', /Glück/.test(S.log[0].detail), true); }
    { const res = {}; for (const lg of ['abyssal', 'chthonic', 'infernal']) { const c = derive(newChar({ cls: 'fig', level: 5, species: 'tiefling', speciesChoice: lg }), {}); res[lg] = c.extraSpells.map((e) => e.id).length >= 2; } T('HB-26', 'Tiefling: jedes Erbe gibt Zauber (Stufe 5)', res, { abyssal: true, chthonic: true, infernal: true }); }
    { const c = derive(newChar({ cls: 'fig', level: 5, species: 'elf', speciesChoice: 'drow' }), {}); T('HB-26', 'Drow: Abstammungszauber vorhanden', c.extraSpells.some((e) => e.id === 'faerie-fire') && c.extraSpells.some((e) => e.id === 'darkness'), true); }
    { const ch = mk({ cls: 'fig', level: 5, species: 'goliath', speciesChoice: 'stone' }); turnReset(ch); turnRun(ch, 'f:gstone'); T('HB-26', 'Goliath (Stein): Steinausdauer als Reaktion mit Nutzung', [turnSt(ch).r, +ch.play.res.giant], [1, 1]); }
    { const ch = mk({ cls: 'fig', level: 5, species: 'mykori' }); turnReset(ch); turnRun(ch, 'f:spores'); T('HB-26', 'Mykori: Sporenwolke kostet Bonusaktion + Nutzung', [turnSt(ch).b, +ch.play.res.spores], [1, 1]); }
    { const c = derive(newChar({ cls: 'wiz', level: 1, species: 'steinblut', base: { str: 10, dex: 14, con: 12, int: 15, wis: 10, cha: 8 }, bgPlus: {} }), {}); T('HB-26', 'Steinblütiger: Steinhaut RK 13 + GES', c.ac, 15); }
    { const ch = mk({ cls: 'fig', level: 5, species: 'vesperkin' }); turnReset(ch); turnRun(ch, 'f:vstep'); T('HB-26', 'Vesperkin: Schattenschritt Bonusaktion + Nutzung', [turnSt(ch).b, +ch.play.res.vstep], [1, 1]); }
    { const ch = mk({ cls: 'wlk', level: 5, spells: ['hex', 'misty-step'] }); ch.play.pact = 2; doRest(ch, 'short', false, true); T('HB-26', 'Hexenmeister: Paktplätze nach kurzer Rast zurück', +ch.play.pact, 0); }
    { const ch = mk({ cls: 'mon', level: 5 }); ch.play.localFight = true; turnReset(ch); turnRun(ch, 'f:flurry'); const t = turnSt(ch); T('HB-26', 'Mönch: Schlaghagel = Bonusaktion + 1 Fokus, 1. Schlag sofort, 1 weiterer offen', [t.b, +ch.play.res.focus, t.bonusAtk, /Waffenloser Schlag: Angriff/.test(S.log[0].label)], [1, 1, 1, true]); S.dp = null; orbPrompt(''); }
    { const ch = mk({ cls: 'bar', level: 5, spells: [] }); ch.play.localFight = true; turnReset(ch); turnRun(ch, 'f:rage'); const r1 = turnSt(ch).b; turnRun(ch, 'f:reckless'); T('HB-26', 'Barbar: Kampfrausch + Tollkühn im selben Zug (frei)', [r1, ch.play.raging, !!ch.play.fx.reckless], [1, true, true]); }
    { const ch = mk({ cls: 'fk', level: 5 }); ch.play.localFight = true; turnReset(ch); const c = derive(ch, S.hb); const o = turnOpts(c).find((x) => x.cost === 'b'); let ok = true; if (o) { turnRun(ch, o.id); const o2 = turnOpts(derive(ch, S.hb)).find((x) => x.cost === 'b' && x.id !== o.id && !/rageoff/.test(x.id)); if (o2) { const before = JSON.stringify(ch.play.res); turnRun(ch, o2.id); ok = JSON.stringify(ch.play.res) === before; } } T('HB-26', 'Fluchklinge: zweite Bonusaktion blockiert, keine Ressource verbraucht', ok, true); }
    return out;
  });
  let fail = 0; for (const r of res) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.id + ' ' + r.name + (r.ok ? '' : '  → erhalten ' + JSON.stringify(r.got) + ', erwartet ' + JSON.stringify(r.want))); }
  console.log('\n' + (res.length - fail) + ' / ' + res.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
