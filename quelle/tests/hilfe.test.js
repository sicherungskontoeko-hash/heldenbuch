/* Hilfe-Stufe (Einsteiger · Standard · Erfahren): Erklärungen, Zugleiste, Nachbessern, Regelprüfung, Einstellung, Willkommen.
   Aufruf: node tests/hilfe.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const page = async (vp, mobile, init) => {
    const ctx = await b.newContext({ viewport: vp, isMobile: !!mobile, hasTouch: !!mobile }); if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); await p.goto('file://' + target); await p.waitForTimeout(450); return [ctx, p];
  };
  const hero = (p, lvl) => p.evaluate((l) => { if (l) hlSetLevel(l); const s = sampleChar(); S.chars[s.id] = s; S.cur = s.id; S.view = 'sheet'; S.mg = 'kampf'; render(); }, lvl);
  const vis = (p, sel) => p.evaluate((q) => [...document.querySelectorAll(q)].filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed' && !e.hidden).length, sel);
  const check = async (p) => { await p.evaluate(() => { XA.boostX(); $('#toast').hidden = true; d20(3, 'Stärke-Wurf', { kind: 'check:str' }); }); await p.waitForTimeout(1500); };
  const boostShown = (p) => p.evaluate(() => { const e = document.getElementById('boostBar'); return !!(e && !e.hidden); });

  let [ctx, p] = await page({ width: 1280, height: 900 });
  /* ---------- Standard (Voreinstellung) ---------- */
  await hero(p);
  T('Voreinstellung: Standard', await p.evaluate(() => hlState().lvl === 'std' && hlLabel() === 'Standard'));
  const qStd = await vis(p, '#view .hlp');
  T('Standard: ?-Knöpfe da (1–4)', qStd >= 1 && qStd <= 4, qStd);
  T('Standard: Zugleiste mit A/B/R', await p.evaluate(() => document.querySelectorAll('.turnblk .tpill').length === 3));
  T('Standard: keine Einsteiger-Tipps, kein Zug-Leitfaden', await p.evaluate(() => !document.querySelector('.nb') && !document.querySelector('.tguide')));
  T('Standard: Rechenweg-Knopf nicht mehr in der Bogen-Leiste, sondern im ⋯-Menü', await p.evaluate(() => !document.querySelector('.mnav [data-act="explain"]') && !!document.querySelector('.smore [data-act="explain"]') && !!document.querySelector('.smore [data-act="hlOpen"]')));
  T('Standard: leere Favoritenzeile ohne Erklärtext', await p.evaluate(() => !document.querySelector('.tfav') && !/Tippe auf Aktion/.test(document.querySelector('.turnblk').textContent)));
  await check(p);
  T('Standard: ohne eigene Optionen keine Nachbessern-Leiste', !(await boostShown(p)));
  T('Standard: stattdessen ＋ im Würfelfenster', await p.evaluate(() => !!document.querySelector('#toast:not([hidden]) .tplus')));
  T('Standard: keine Wurferklärung', await p.evaluate(() => !document.querySelector('#toast .ttip')));
  await p.click('#toast .tplus'); await p.waitForTimeout(150);
  T('＋ öffnet die Nachbessern-Leiste auf Wunsch', await boostShown(p));
  await p.evaluate(() => { cur().play.insp = true; }); await check(p);
  T('Standard: mit Heldeninspiration erscheint die Leiste von selbst', await boostShown(p));
  await p.evaluate(() => { cur().play.insp = false; });
  /* Regelprüfung im Kampfmodus */
  const twoAtk = () => p.evaluate(() => { const ch = cur(); ch.play.localFight = true; turnReset(ch); S.dp = null; const n0 = S.log.length; weaponAttack(ch, 1, { dist: 'melee' }); orbPrompt(''); S.dp = null; const n1 = S.log.length; weaponAttack(ch, 1, { dist: 'melee' }); orbPrompt(''); S.dp = null; return [n1 - n0, S.log.length - n1]; });
  const r1 = await twoAtk();
  T('Standard: zweiter Angriff ohne Extraangriff wird gesperrt', r1[0] === 1 && r1[1] === 0, r1);
  T('Standard: Zauberplatz-Regel greift', await p.evaluate(() => { const ch = cur(); turnSt(ch).slotSpell = true; const r = spellCheck(ch, derive(ch, S.hb), getSpell('bless', S.hb), 1); return r.turn.length > 0; }));
  T('Standard: „1× pro Zug“ wird gemerkt', await p.evaluate(() => { const ch = cur(); onceMark(ch, 'sneak'); return onceUsed(ch, 'sneak'); }));

  /* ---------- Einsteiger ---------- */
  await p.evaluate(() => { const ch = cur(); ch.play.localFight = false; turnReset(ch); hlSetLevel('neu'); render(); });
  T('Einsteiger: Kurzerklärungen auf dem Bogen', await p.evaluate(() => document.querySelectorAll('.sheet .nb').length >= 6));
  T('Einsteiger: Zug-Leitfaden mit Bewegung, Aktion, Bonusaktion', await p.evaluate(() => { const g = document.querySelector('.tguide'); return !!g && g.querySelectorAll('li').length === 3 && /Langschwert/.test(g.textContent); }));
  const qNeu = await vis(p, '#view .hlp');
  T('Einsteiger: mehr ?-Knöpfe als Standard', qNeu > qStd, [qNeu, qStd]);
  T('Einsteiger: ?-Erklärung zu Fertigkeiten öffnet', await p.evaluate(() => { const b = [...document.querySelectorAll('#view .hlp')].find((x) => x.dataset.arg === 'fert'); if (!b) return false; b.click(); const ok = !!document.querySelector('.helpdlg') && /SG/.test(document.querySelector('.helpdlg').textContent); XA.closeModal ? XA.closeModal() : ($('#modal').hidden = true); S.modal = null; $('#modal').hidden = true; return ok; }));
  await check(p);
  T('Einsteiger: Wurferklärung im Würfelfenster', await p.evaluate(() => /SG/.test((document.querySelector('#toast .ttip') || {}).textContent || '')));
  T('Einsteiger: Nachbessern-Leiste immer', await boostShown(p));
  T('Einsteiger: Leitfaden hakt Aktion ab', await p.evaluate(() => { const ch = cur(); turnSt(ch).a = 1; render(); const li = document.querySelectorAll('.tguide li'); return li[1].classList.contains('done') && !li[0].classList.contains('done'); }));
  await p.evaluate(() => { turnReset(cur()); render(); });

  /* ---------- Erfahren ---------- */
  await p.evaluate(() => { hlSetLevel('pro'); render(); });
  T('Erfahren: keine ?-Knöpfe', (await vis(p, '#view .hlp')) === 0);
  T('Erfahren: keine Zugleiste, kein Leerkasten', await p.evaluate(() => !document.querySelector('.turnblk')));
  T('Erfahren: keine Tipps, kein ⓘ auf dem Bogen', await p.evaluate(() => !document.querySelector('.nb') && [...document.querySelectorAll('.sheet .ii')].every((e) => getComputedStyle(e).display === 'none')));
  await p.evaluate(() => { cur().play.insp = true; }); await check(p);
  T('Erfahren: keine Leiste nach dem Wurf, auch mit Inspiration', !(await boostShown(p)));
  T('Erfahren: ＋ im Würfelfenster bleibt', await p.evaluate(() => !!document.querySelector('#toast:not([hidden]) .tplus')));
  await p.evaluate(() => { cur().play.insp = false; });
  const r2 = await twoAtk();
  T('Erfahren: App sperrt keine Aktionen (zwei Angriffe)', r2[0] === 1 && r2[1] === 1, r2);
  T('Erfahren: Kampfmodus bleibt abschaltbar (schlanke Leiste)', await p.evaluate(() => { render(); const b = document.querySelector('.turnblk.slim [data-act="tFight"]'); return !!b && !document.querySelector('.tpill'); }));
  T('Erfahren: Angriffsfenster ohne «SL entscheidet»', await p.evaluate(() => { const ch = cur(); weaponAttack(ch, 1, { dist: 'melee' }); const ok = !!S.dp && !document.querySelector('#prompt .slb'); orbPrompt(''); S.dp = null; return ok; }));
  T('Erfahren: keine Zauberplatz- und Zugsperre', await p.evaluate(() => { const ch = cur(); turnSt(ch).slotSpell = true; const r = spellCheck(ch, derive(ch, S.hb), getSpell('bless', S.hb), 1); return r.turn.length === 0; }));
  T('Erfahren: „1× pro Zug“ zählt die App nicht', await p.evaluate(() => { const ch = cur(); onceMark(ch, 'sneak'); return !onceUsed(ch, 'sneak'); }));
  T('Erfahren: laufende Wirkung bleibt sichtbar', await p.evaluate(() => { const ch = cur(); ch.play.localFight = false; ch.play.fx = { bless: 1 }; ch.play.fxDur = { bless: 10 }; render(); const s = document.querySelector('.turnblk.slim'); return !!s && /Segnen/.test(s.textContent) && !!s.querySelector('[data-act="tNew"]'); }));
  T('Kampfunfähigkeit sperrt weiter (kein Zug-, sondern Zustandsregel)', await p.evaluate(() => { const ch = cur(); ch.play.fx = {}; ch.play.fxDur = {}; ch.play.localFight = true; ch.play.cond = ['stunned']; const n0 = S.log.length; weaponAttack(ch, 1, { dist: 'melee' }); orbPrompt(''); S.dp = null; ch.play.cond = []; ch.play.localFight = false; return S.log.length === n0; }));

  /* ---------- Dialog und Feineinstellung ---------- */
  await p.evaluate(() => { render(); document.querySelector('.smore').open = true; }); await p.click('.smore [data-act="hlOpen"]');
  T('⋯-Menü öffnet den Dialog „Hilfen“', await p.evaluate(() => S.modal === 'hilfe' && document.querySelectorAll('.hldlg .hlc').length === 3 && document.querySelector('.hlc.on').dataset.arg === 'pro'));
  await p.click('.hldlg .hlc[data-arg="std"]');
  T('Karte wählt die Stufe, Dialog bleibt offen', await p.evaluate(() => hlState().lvl === 'std' && S.modal === 'hilfe' && document.querySelector('.hlc.on').dataset.arg === 'std' && !!document.querySelector('.turnblk .tpill')));
  await p.evaluate(() => { document.querySelector('.hlfine').open = true; }); await p.click('.hldlg input[data-arg="zug"]');
  T('Einzeln: Zugleiste aus → „Standard (angepasst)“', await p.evaluate(() => !hlOn('zug') && hlLabel() === 'Standard (angepasst)' && !!document.querySelector('.hlc.part') && !document.querySelector('.tpill')));
  await p.click('.hldlg input[data-arg="rw"]');
  T('Einzeln: Rechenweg an', await p.evaluate(() => explainOn() && !!document.querySelector('.sheet.explain')));
  await p.evaluate(() => { XA.closeModal ? 0 : 0; S.modal = null; $('#modal').hidden = true; });
  await p.reload(); await p.waitForTimeout(450);
  T('Bleibt nach Neustart erhalten', await p.evaluate(() => hlState().lvl === 'std' && !hlOn('zug') && hlOn('rw')));
  await p.evaluate(() => { S.view = 'help'; render(); });
  T('Hilfe-Seite: Auswahl oben', await p.evaluate(() => document.querySelectorAll('.hlsec .hlc').length === 3));
  await p.click('.hlsec .hlc[data-arg="neu"]');
  T('Hilfe-Seite: Stufe wählbar', await p.evaluate(() => hlState().lvl === 'neu' && hlOn('zug') && !hlOn('rw')));
  await ctx.close();

  /* ---------- Handy: Mehr-Menü, Dialog passt ---------- */
  [ctx, p] = await page({ width: 390, height: 844 }, true);
  await hero(p, 'std');
  await p.evaluate(() => XA.more()); await p.waitForTimeout(100);
  T('Handy: „Hilfen: Standard“ im Mehr-Menü', await p.evaluate(() => /Hilfen: Standard/.test(($('#bnav .bmore [data-act="hlOpen"]') || {}).textContent || '')));
  await p.tap('#bnav .bmore [data-act="hlOpen"]'); await p.waitForTimeout(150);
  T('Handy: Dialog offen, kein Querscrollen', await p.evaluate(() => S.modal === 'hilfe' && document.documentElement.scrollWidth <= 391 && document.querySelector('.hldlg').scrollWidth <= document.querySelector('.hldlg').clientWidth + 1));
  await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; hlSetLevel('neu'); render(); });
  await check(p);
  T('Handy Einsteiger: Würfelfenster verdeckt die Nachbessern-Leiste nicht', await p.evaluate(() => { const a = $('#toast').getBoundingClientRect(), c = document.getElementById('boostBar').getBoundingClientRect(); return a.top >= c.bottom - 1 || c.top >= a.bottom - 1; }));
  await ctx.close();

  /* ---------- Willkommen: Stufe wählen; Übernahme des alten Rechenweg-Schalters ---------- */
  [ctx, p] = await page({ width: 390, height: 844 }, true, () => { window.__hbWelcomeTest = true; });
  T('Willkommen: Stufenwahl, Standard vorgewählt', await p.evaluate(() => S.modal === 'welcome' && document.querySelectorAll('.wlvl .seg button').length === 3 && document.querySelector('.wlvl .on').dataset.arg === 'std'));
  await p.tap('.wlvl [data-arg="pro"]'); await p.fill('#wName', 'Manu'); await p.tap('#modal [data-act="welcomeGo"]'); await p.waitForTimeout(150);
  T('Willkommen: „Erfahren“ übernommen', await p.evaluate(() => hlState().lvl === 'pro' && myName() === 'Manu'));
  T('Willkommen passt aufs Handy', await p.evaluate(() => document.documentElement.scrollWidth <= 391));
  await p.evaluate(() => { localStorage.removeItem('hb_hilfe'); localStorage.setItem('hb_explain', '1'); S.hl = null; });
  T('Alter Rechenweg-Schalter wird übernommen (Standard, angepasst)', await p.evaluate(() => hlState().lvl === 'std' && hlOn('rw') && hlLabel() === 'Standard (angepasst)'));
  await ctx.close();

  T('Keine Skriptfehler', errs.length === 0, errs);
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); await b.close(); process.exit(f ? 1 : 0);
})();
