/* Stufenaufstieg-Assistent: drei Schritte, neue Merkmale, Veränderungen, TP, Multiclass-Wahl, offene Entscheidungen mit Sprung. Aufruf: node tests/levelup.test.js [app.html] [shots] */
const { chromium } = require('playwright');
const path = require('path');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html')); const shots = process.argv[3];
(async () => {
  const b = await chromium.launch(); const out = []; const errs = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  for (const dev of [{ n: 'desktop', vp: { width: 1280, height: 860 } }, { n: 'handy', vp: { width: 390, height: 844 }, m: true }]) {
    const ctx = await b.newContext({ viewport: dev.vp, isMobile: !!dev.m, hasTouch: !!dev.m }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(dev.n + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(400);
    const tap = async (sel) => { const el = p.locator(sel).first(); if (dev.m) await el.tap(); else await el.click(); await p.waitForTimeout(150); };
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'ruhig'); const n = newChar({ name: 'Brakk', cls: 'fig', level: 2 }); n.styles = ['defense']; S.chars[n.id] = n; S.cur = n.id; S.view = 'sheet'; render(); });
    await tap('[data-act="lvlUp"]');
    T(dev.n + ': Schritt 1 zeigt Stufe 2 → 3 und TP', await p.evaluate(() => /Stufe 2 → 3/.test($('.luwiz').textContent) && /TP/.test($('.luhp').textContent)));
    if (shots) await p.screenshot({ path: path.join(shots, 'lu-' + dev.n + '-1.png') });
    await tap('[data-act="luNext"]');
    T(dev.n + ': Schritt 2 stellt neue Merkmale als Karten vor', await p.evaluate(() => document.querySelectorAll('.lucard').length >= 1 && /Unterklasse/.test($('.lucards').textContent)));
    T(dev.n + ': Schritt 2 zeigt Veränderungen (TP-Maximum vorher → nachher)', await p.evaluate(() => { const r = [...document.querySelectorAll('.ludiff div')].find((d) => /TP-Maximum/.test(d.textContent)); return r && +r.querySelector('b').textContent > +r.querySelector('s').textContent; }));
    T(dev.n + ': Vorschau ändert den Helden noch nicht', await p.evaluate(() => cur().level === 2));
    if (shots) await p.screenshot({ path: path.join(shots, 'lu-' + dev.n + '-2.png') });
    await tap('[data-act="luBack"]'); T(dev.n + ': Zurück zu Schritt 1', await p.evaluate(() => !!$('.luhp')));
    await tap('[data-act="luNext"]'); await tap('[data-act="luGo"]');
    T(dev.n + ': Aufsteigen: Stufe 3, TP erhöht', await p.evaluate(() => cur().level === 3 && cur().play.hp === derive(cur(), S.hb).hpMax));
    T(dev.n + ': Schritt 3 listet offene Entscheidungen (Unterklasse)', await p.evaluate(() => /Unterklasse/.test($('.luwarn').textContent)));
    T(dev.n + ': Feier-Effekt erscheint', await p.evaluate(() => !!document.querySelector('.lucel .lunum')));
    if (shots) await p.screenshot({ path: path.join(shots, 'lu-' + dev.n + '-3.png') });
    const ix = await p.evaluate(() => [...document.querySelectorAll('.luwarn button')].findIndex((x) => /Unterklasse/.test(x.textContent)));
    await tap('.luwarn button >> nth=' + ix); T(dev.n + ': Antippen springt zur Unterklassen-Wahl', await p.evaluate(() => S.view === 'build' && S.step === 0 && $('#modal').hidden));
    /* Zauberwirker: Zauberplätze in der Vorschau */
    await p.evaluate(() => { const n = newChar({ name: 'Lyra', cls: 'wiz', level: 2 }); S.chars[n.id] = n; S.cur = n.id; S.view = 'sheet'; S.lu = null; render(); XA.lvlUp(); XA.luNext(); });
    T(dev.n + ': Zauberwirker: neue Zauberplätze in der Vorschau', await p.evaluate(() => /Zauberplätze Grad 2/.test($('.ludiff').textContent)));
    await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; S.lu = null; });
    /* Multiclass: Klasse wählen */
    await p.evaluate(() => { const n = newChar({ name: 'Mix', cls: 'fig', level: 3 }); n.multi = [{ cls: 'wiz', level: 1 }]; n.base.int = 14; S.chars[n.id] = n; S.cur = n.id; render(); XA.lvlUp(); });
    T(dev.n + ': Multiclass: beide Klassen zur Wahl', await p.evaluate(() => document.querySelectorAll('.luwiz [data-act="luCls"]').length === 2));
    await p.evaluate(() => { S.modal = null; $('#modal').hidden = true; S.lu = null; });
    /* Würfeln-Modus */
    await p.evaluate(() => { const n = newChar({ name: 'Wurf', cls: 'bar', level: 1 }); n.hpMode = 'roll'; S.chars[n.id] = n; S.cur = n.id; render(); XA.lvlUp(); });
    T(dev.n + ': Würfel-Modus: Weiter erst nach dem Wurf', await p.evaluate(() => $('[data-act="luNext"]').disabled));
    await tap('[data-act="luRoll"]'); T(dev.n + ': nach dem Wurf geht es weiter', await p.evaluate(() => !$('[data-act="luNext"]').disabled && S.lu.roll >= 1));
    T(dev.n + ': keine waagrechte Scrollleiste', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await ctx.close();
  }
  let fail = 0; for (const r of out) { if (!r.ok) fail++; console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))); }
  console.log('\n' + (out.length - fail) + ' / ' + out.length + ' bestanden' + (errs.length ? ' · JS-Fehler: ' + errs.join(' | ') : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
