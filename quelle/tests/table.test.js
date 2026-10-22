/* Aufgeräumter Spieltisch: Spielleitung kämpft nicht mit, keine doppelten Knöpfe, kleine Meldungen statt Würfelfenster,
   eine Stimmungs-/Effekte-Einstellung, Rast im ⋯-Menü, wenige Hilfe-Knöpfe. Aufruf: node tests/table.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + target); await p.waitForTimeout(400);
  const setup = () => p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); UID = 'me1'; const ch = normChar(newChar({ name: 'Mira', cls: 'fig', level: 3 })); S.chars[ch.id] = ch; S.cur = ch.id;
    window.saveCombat = (c) => { S.combat = c; paintCamp(); }; window.saveMeta = (o) => { Object.assign(S.meta, o); };
    S.camp = 'raum'; S.meta = { dm: 'me1', mercy: {} }; S.table = { me1: { char: 'Mira', ac: 16, level: 3 }, u2: { char: 'Lyra', ac: 13, level: 3 }, u3: { char: 'Tor', ac: 17, level: 3 } };
    S.combat = { id: 'k', active: true, round: 1, turn: null, npcs: [] }; encInsert([{ mid: 'goblin', n: 2 }], '', { groupInit: true }); S.view = 'camp'; render(); });
  await setup();
  /* Spielleitung */
  T('SL steht nicht unter „Würfelt noch“', await p.evaluate(() => !waiting().some((x) => x.uid === 'me1') && waiting().length === 2));
  T('SL ist kein Ziel für Gegnerangriffe', await p.evaluate(() => !npcTargets().some((x) => x.k === 'p:me1' || x.k === 'me') && npcTargets().length === 2));
  T('SL nicht in „Rettungswurf anfordern → Wer?“', await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = saveReqForm(); return !d.querySelector('[data-act="srTo"][data-arg="me1"]') && !!d.querySelector('[data-act="srTo"][data-arg="u2"]'); }));
  T('„Die Gruppe“: SL nur als Zeile „Spielleitung: Mira“', await p.evaluate(() => /Spielleitung: Mira/.test(partyHtml().replace(/<[^>]+>/g, '')) && (partyHtml().match(/class="pm( me)?"/g) || []).length === 2));
  T('SL hat keine „Deine Initiative“-Knöpfe', await p.evaluate(() => !document.querySelector('#fightBox [data-act="initRoll"]')));
  T('Zugleiste der SL: kein „Initiative würfeln“', await p.evaluate(() => !document.querySelector('#turnbar [data-act="initRoll"]')));
  T('Gruppenstufe ohne SL', await p.evaluate(() => partyLevels().length === 2));
  await p.evaluate(() => { const c = document.getElementById('dmPlays'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); render(); });
  T('„Ich spiele selbst mit“: SL zählt wieder als Held', await p.evaluate(() => S.meta.dmPlays === true && waiting().some((x) => x.uid === 'me1') && partyLevels().length === 3));
  await p.evaluate(() => { S.meta.dmPlays = false; render(); });
  /* Zug, Knöpfe */
  await p.evaluate(() => { S.table.u2.init = { cid: 'k', v: 30 }; S.table.u3.init = { cid: 'k', v: 1 }; document.querySelector('#fightBox [data-act="fightGo"]').click(); });
  T('Kampfkasten ohne eigenen „Zug beenden“/„Weiter“', await p.evaluate(() => !document.querySelector('#fightBox [data-act="turnEnd"]')));
  T('Zugleiste: SL hat „Weiter ▸“, wenn ein anderer dran ist', await p.evaluate(() => /Weiter/.test(($('#turnbar [data-act="turnEnd"]') || {}).textContent || '')));
  T('Gegnerzeile ohne ×, Entfernen im ⋯-Dialog', await p.evaluate(() => !document.querySelector('#fightBox .order [data-act="npcDel"]') && !!document.querySelector('#fightBox [data-act="npcOpen"]')));
  T('Ein Knopf „+ Gegner“ statt vier Wegen', await p.evaluate(() => document.querySelectorAll('#fightBox [data-act="encOpen"]').length === 1 && !document.querySelector('#fightBox #npcName')));
  await p.evaluate(() => { document.querySelector('#fightBox [data-act="encOpen"]').click(); });
  T('Planer: Gegner ohne Werte, Häkchen überrascht/Verstärkung', await p.evaluate(() => !!$('#modal #npcName') && !!$('#encSur') && !!$('#encRes')));
  await p.evaluate(() => { $('#npcName').value = 'Hauptmann Vorn'; document.querySelector('#modal [data-act="npcAdd"]').click(); });
  T('… Gegner ohne Werte wird hinzugefügt', await p.evaluate(() => S.combat.npcs.some((x) => x.name === 'Hauptmann Vorn')));
  await p.evaluate(() => { $('#modal').hidden = true; S.modal = null; });
  /* Meldungen */
  await p.evaluate(() => { $('#toast').hidden = true; $('#mini').innerHTML = ''; pushLog({ label: 'Wirkung beendet', total: '✦', detail: 'bless' }); });
  T('Ereignis ohne Würfel: kleine Meldung, kein Würfelfenster', await p.evaluate(() => $('#toast').hidden && /Wirkung beendet/.test($('#mini').textContent)));
  /* Stimmung, Effekte */
  T('SL-Werkzeuge: Stimmung als kompakte Zeile', await p.evaluate(() => !document.querySelector('#dmTools .tswatch') && !!document.querySelector('#dmTools [data-act="themeOpen"]')));
  await p.evaluate(() => XA.themeOpen());
  T('Stimmungsdialog der SL: „Für die ganze Runde“', await p.evaluate(() => !!$('#themeAll') && $('#themeAll').checked));
  await p.evaluate(() => document.querySelector('#modal [data-act="theme"][data-arg="gruselig"]').click());
  T('… wählt die Stimmung für alle', await p.evaluate(() => S.meta.theme === 'gruselig'));
  await p.evaluate(() => { XA.fxLevel(null, 'dezent'); });
  T('Eine Effekte-Einstellung: „Dezent“ gilt auch für die Würfel', await p.evaluate(() => localStorage.getItem('hb_dice_fx') === 'ruhig'));
  await p.evaluate(() => { XA.diceFx(null, 'aus'); });
  T('… und umgekehrt: Würfel „Aus“ schaltet auch die Szenen-Effekte aus', await p.evaluate(() => localStorage.getItem('hb_fx') === 'aus'));
  await p.evaluate(() => { localStorage.setItem('hb_fx', 'stark'); $('#modal').hidden = true; S.modal = null; });
  /* Schaden anwenden: drei Knöpfe */
  await p.evaluate(() => { applyPrompt('n:' + S.combat.npcs[0].id, 9, 'Feuerpfeil'); });
  T('Schaden auf Gegner: nur Voll / Halb / Nicht', await p.evaluate(() => document.querySelectorAll('#prompt [data-act="applyDmg"]').length === 3));
  await p.evaluate(() => orbPrompt(''));
  /* Bogen */
  await p.evaluate(() => { S.view = 'sheet'; render(); });
  T('Bogen: Rast im ⋯-Menü statt eigener Knöpfe', await p.evaluate(() => !!document.querySelector('.smore .mnul [data-act="rest"][data-arg="long"]') && !document.querySelector('.sctl > [data-act="rest"]')));
  T('Bogen im Tisch-Kampf: kein „Neuer Zug“', await p.evaluate(() => !document.querySelector('[data-act="tNew"]')));
  T('Bogen: höchstens 4 Hilfe-Knöpfe', await p.evaluate(() => document.querySelectorAll('#view .hlp').length <= 4), await p.evaluate(() => document.querySelectorAll('#view .hlp').length));
  await p.evaluate(() => { S.camp = ''; S.combat = null; render(); });
  T('Ohne Tisch: „Neuer Zug“ vorhanden', await p.evaluate(() => !!document.querySelector('[data-act="tNew"]')));
  /* Handy */
  await p.setViewportSize({ width: 390, height: 844 }); await setup();
  T('Handy: TP-Feld der Gegnerzeile voll sichtbar', await p.evaluate(() => { const i = document.querySelector('#fightBox .nctl input'); return i && i.getBoundingClientRect().width >= 60; }));
  const fits = await p.evaluate(() => { const ch = normChar(newChar({ name: 'Ilva', cls: 'wiz', level: 5, base: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 }, spells: ['fireball', 'shield', 'hold-person'], prepared: ['fireball', 'shield', 'hold-person'] })); S.chars[ch.id] = ch; S.cur = ch.id; S.meta.dmPlays = true; S.tgt = 'n:' + S.combat.npcs[0].id;
    const res = []; const chk = (n) => { const pr = document.querySelector('#prompt .pr'); const r = pr ? pr.getBoundingClientRect() : null; res.push([n, !!pr && pr.scrollWidth <= pr.clientWidth + 1 && r.right <= 391 && r.left >= -1]); orbPrompt(''); S.sv = S.sc = S.hitPend = S.npcA = null; };
    castSpell(ch, 'fireball', 3, 'slot'); chk('Feuerball'); turnReset(ch); ch.play.slots = {}; castSpell(ch, 'hold-person', 2, 'slot'); chk('Person festhalten');
    hitPrompt({ by: 'Ghul A: Klauen', amount: 8, dtype: 'Hieb', atk: 14, nat: 12, crit: false, rider: mobRider('ghoul', 'Klauen'), t: Date.now() }); chk('Treffer mit Schild und Zusatz');
    applyPrompt(S.tgt, 12, 'Feuerball'); chk('Schaden anwenden');
    S.table.u2.cond = ['Liegend']; S.npcA = { name: 'Goblin: Krummsäbel', dmg: '1W6+2', dtype: 'Hieb', total: 15, nat: 11, bonus: 4, tgt: 'p:u2', rider: mobRider('ghoul', 'Klauen'), riderOn: true }; npcPrompt(); chk('Gegnerangriff mit Hinweis, Zusatz, Deckung');
    return res; });
  T('Handy: alle Abfragen passen in die Breite', fits.every((x) => x[1]), fits);
  T('Handy: kein Querscrollen am Tisch', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
