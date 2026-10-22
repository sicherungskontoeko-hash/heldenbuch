/* Schaden mit Rettungswurf des Ziels: erst fragen (misslungen / geschafft / mehrere Ziele), dann würfeln.
   Aufruf: node tests/savedmg.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + target); await p.waitForTimeout(400);
  const res = await p.evaluate(async () => {
    localStorage.setItem('hb_dice_fx', 'aus');
    const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
    const mk = (o) => { const ch = normChar(newChar(Object.assign({ name: 'T' }, o))); S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'sheet'; ch.play.hp = derive(ch, S.hb).hpMax; return ch; };
    const click = (act, arg) => { const t = document.createElement('button'); t.dataset.act = act; if (arg !== undefined) t.dataset.arg = arg; document.body.appendChild(t); t.click(); t.remove(); };
    const pr = () => (document.getElementById('prompt').hidden ? '' : document.getElementById('prompt').textContent);
    const seq = (vals) => { let i = 0; Math.random = () => vals[i++ % vals.length]; };
    const R0 = Math.random;
    const wiz = mk({ cls: 'wiz', level: 5, base: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 }, spells: ['fireball', 'burning-hands', 'acid-splash'], prepared: ['fireball', 'burning-hands'] });
    const dc = derive(wiz, S.hb).spell.dc;
    /* Feuerball: erst Frage, kein Schadenswurf */
    let n0 = S.log.length; castSpell(wiz, 'fireball', 3, 'slot');
    T('Feuerball: Abfrage „GES-Rettungswurf SG ' + dc + '“ erscheint', new RegExp('Feuerball: GES-Rettungswurf SG ' + dc).test(pr()), pr());
    T('… noch kein Schaden gewürfelt, Platz aber verbraucht', S.log.length === n0 && +wiz.play.slots[3] === 1, [S.log.length - n0, wiz.play.slots[3]]);
    T('… Knöpfe: geschafft (halber Schaden) / misslungen (8W6)', /Geschafft – halber Schaden/.test(pr()) && /Misslungen – 8W6/.test(pr()));
    seq([0.999]); click('svRes', 'fail'); Math.random = R0;
    T('Misslungen: voller Schaden 48 (8×6)', S.log[0].total === 48 && /misslungen/.test(S.log[0].detail) && !pr(), S.log[0]);
    castSpell(wiz, 'fireball', 3, 'slot'); seq([0.999]); click('svRes', 'ok'); Math.random = R0;
    T('Geschafft: halber Schaden 24', S.log[0].total === 24 && /halbiert/.test(S.log[0].label), S.log[0]);
    castSpell(wiz, 'burning-hands', 1, 'slot'); seq([0.999]); click('svRes', 'multi'); Math.random = R0;
    T('Mehrere Ziele: „18 / 9“ (Brennende Hände)', S.log[0].total === '18 / 9' && /misslungen: 18.*geschafft: 9/.test(S.log[0].detail), S.log[0]);
    /* Zaubertrick ohne halben Schaden */
    n0 = S.log.length; castSpell(wiz, 'acid-splash', 0, 'cantrip');
    T('Säurespritzer: „Geschafft – kein Schaden“', /Geschafft – kein Schaden/.test(pr()), pr());
    click('svRes', 'ok');
    T('… geschafft: 0 Schaden, nichts gewürfelt', S.log[0].total === '0' && !S.log[0].groups && S.log.length === n0 + 1, S.log[0]);
    castSpell(wiz, 'acid-splash', 0, 'cantrip'); click('svRes', 'none');
    T('„Ohne Schaden weiter“: nur Eintrag, Abfrage zu', S.log[0].total === '✦' && !pr());
    /* Heilzauber bleiben ohne Abfrage */
    const cle = mk({ cls: 'cle', level: 5, base: { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 10 }, spells: ['cure-wounds', 'sacred-flame'], prepared: ['cure-wounds'] });
    castSpell(cle, 'cure-wounds', 1, 'slot');
    T('Heilung: keine Rettungswurf-Abfrage', !/Rettungswurf/.test(pr()));
    orbPrompt(''); S.healPend = null; document.getElementById('modal').hidden = true;
    castSpell(cle, 'sacred-flame', 0, 'cantrip');
    T('Heilige Flamme: GES-Rettungswurf, kein halber Schaden', /Heilige Flamme: GES-Rettungswurf/.test(pr()) && /kein Schaden/.test(pr()), pr());
    orbPrompt(''); S.sv = null;
    /* Göttlicher Funke */
    const sp = FEAT_ACTIONS.concat(typeof STD_ACTIONS !== 'undefined' ? [] : []).find((x) => x.id === 'spark') || (typeof TURN_FEATS !== 'undefined' && TURN_FEATS.find((x) => x.id === 'spark'));
    if (sp) { sp.run(cle, derive(cle, S.hb)); T('Göttlicher Funke: erst Heilen oder Schaden', /Heilen/.test(pr()) && /Schaden/.test(pr()), pr()); click('sparkGo', 'dmg'); T('… Schaden: KON-Rettungswurf-Abfrage', /Göttlicher Funke: KON-Rettungswurf/.test(pr()), pr()); click('svRes', 'fail'); T('… misslungen: Schaden gewürfelt', /Göttlicher Funke/.test(S.log[0].label) && typeof S.log[0].total === 'number'); }
    else T('Göttlicher Funke gefunden', false);
    /* Odemwaffe */
    const db = mk({ cls: 'fig', species: 'dragonborn', level: 5, base: { str: 15, dex: 12, con: 14, int: 10, wis: 10, cha: 10 } });
    const br = FEAT_ACTIONS.find((x) => x.id === 'breath') || (typeof TURN_FEATS !== 'undefined' && TURN_FEATS.find((x) => x.id === 'breath'));
    if (br) { br.run(db, derive(db, S.hb)); T('Odemwaffe: GES-Rettungswurf SG ' + (8 + 2 + 3), /Odemwaffe: GES-Rettungswurf SG 13/.test(pr()) && /2W10/.test(pr()), pr()); orbPrompt(''); S.sv = null; }
    else T('Odemwaffe gefunden', false);
    /* Andauernder Zauber: Blitz herbeirufen */
    const dru = mk({ cls: 'dru', level: 5, base: { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 10 } }); dru.play.fx = { fo_call_lightning: 1 }; dru.play.fx['fo_call-lightning'] = 1; dru.play.fx['fo_call-lightning_L'] = 3;
    const cl = FEAT_ACTIONS.find((x) => x.id === 'fo_call-lightning');
    cl.run(dru, derive(dru, S.hb)); T('Blitz herbeirufen (Folgezug): Abfrage statt Sofortschaden', /Blitze herbeirufen: GES-Rettungswurf/.test(pr()) && /3W10/.test(pr()), pr());
    seq([0.999]); click('svRes', 'ok'); Math.random = R0; T('… geschafft: 15 (Hälfte von 30)', S.log[0].total === 15, S.log[0]);
    return out;
  });
  T0 = res; const all = res.concat([{ n: 'Keine Skriptfehler', ok: errs.length === 0, got: errs }]);
  all.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = all.filter((r) => !r.ok).length; console.log((all.length - f) + ' / ' + all.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
var T0;
