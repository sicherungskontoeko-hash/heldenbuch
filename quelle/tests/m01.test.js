/* M01 – Kampfseite am Handy: Angriffe früher erreichbar, Warnungen bleiben oben, alles bedienbar.
   Aufruf: node tests/m01.test.js [app.html] [--fotos=ORDNER] [--nur-messen]
   Testheldin: Kämpferin 5 mit 3 Waffen, Stimmung warm, Hilfe-Stufe Standard (wie die Ausgangsmessung vom 23.11.2026).
   Zielwerte (HB-UI-REDESIGN v1.2.0, M01): erste Waffenzeile ohne aktive Warnung
     390×844: Oberkante ≤ 700, Unterkante ≤ 785 (sichtbare Höhe ohne untere Leiste) · 320×568: Oberkante ≤ 480
     360×740: Oberkante ≤ 610 · 430×932: Oberkante ≤ 700 · PC unverändert (± 2 px zur Ausgangslage). */
const { chromium } = require('playwright');
const path = require('path');
const args = process.argv.slice(2);
const target = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
const fotos = (args.find((a) => a.startsWith('--fotos=')) || '').slice(8);
const nurMessen = args.includes('--nur-messen');
const ZIEL = { '320x568': { top: 480 }, '360x740': { top: 610 }, '390x844': { top: 700, bottom: 785 }, '430x932': { top: 700 } };
const PC_VORHER = { '1280x900': 622, '1440x900': 622 }; // Ausgangslage a898ebe
const out = []; const errs = []; const mess = {};
const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
const HELD = () => { localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_theme', 'warm');
  Object.keys(S.chars).forEach((k) => delete S.chars[k]); if (typeof hlSetLevel === 'function') hlSetLevel('std');
  const f = normChar(newChar({ name: 'Mira Klingensang', cls: 'fig', level: 5, sub: 'champion', species: 'human', bg: 'criminal', bgPlus: { dex: 2, con: 1 }, base: { str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8 }, classSkills: ['ath', 'prc'], styles: ['fs-defense'], armor: 'chainmail', shield: true, weapons: [{ w: 'longsword', mastery: true }, { w: 'handaxe', mastery: true }, { w: 'longbow', mastery: true }] }));
  S.chars[f.id] = f; S.cur = f.id; S.camp = ''; S.combat = null; S.view = 'sheet'; S.mg = 'kampf'; S.mode = 'normal'; S.hpOpen = false; render(); window.scrollTo(0, 0); };
const lage = () => { const nav = document.querySelector('#bnav'); const navH = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().height : 0;
  const a = document.querySelector('#view .atk'); const r = a.getBoundingClientRect(); const y = (s) => { const e = document.querySelector(s); if (!e || !e.offsetParent) return null; return Math.round(e.getBoundingClientRect().top + scrollY); };
  const rb = a.querySelector('.rb'); const rbB = rb ? Math.round(rb.getBoundingClientRect().bottom + scrollY) : null;
  return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), rbBottom: rbB, sichtbar: Math.round(innerHeight - navH), quer: document.documentElement.scrollWidth > innerWidth + 1,
    conds: y('#conds'), strow: y('.strow'), death: y('.death'), turn: y('.turnblk'), shbar: y('.shbar'), hpb: y('.vb.hpb') }; };
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[320, 568], [360, 740], [390, 844], [430, 932], [768, 1024], [1280, 900], [1440, 900]]) {
    const k = w + 'x' + h; const mob = w <= 820;
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: mob, isMobile: mob, deviceScaleFactor: mob ? 2 : 1 }); p.on('pageerror', (e) => errs.push(k + ': ' + e.message));
    await p.goto('file://' + target); await p.waitForTimeout(500);
    await p.evaluate(HELD); await p.waitForTimeout(150);
    const m = await p.evaluate(lage); mess[k] = { ohne_warnung: m };
    if (fotos && [320, 390, 1280].includes(w)) await p.screenshot({ path: path.join(fotos, 'm01-' + w + '-ruhig.png') });
    const z = ZIEL[k];
    if (z) T(k + ': erste Waffe oben ≤ ' + z.top + ' px' + (z.bottom ? ', ganz sichtbar (unten ≤ ' + z.bottom + ')' : ''), m.top <= z.top && (!z.bottom || m.bottom <= z.bottom), m);
    if (PC_VORHER[k]) T(k + ': PC unverändert (erste Waffe ' + PC_VORHER[k] + ' ± 2 px)', Math.abs(m.top - PC_VORHER[k]) <= 2, m.top);
    T(k + ': kein Querscrollen', !m.quer);
    if (mob) T(k + ': erste Angriffstaste ganz über der unteren Leiste (B-18)', m.rbBottom != null && m.rbBottom <= m.sichtbar, { rb: m.rbBottom, sichtbar: m.sichtbar });
    // Aktive Gefahren: Konzentration, Zustand, Erschöpfung – stehen über den Angriffen
    await p.evaluate(() => { const P = cur().play; P.conc = { id: 'bless', name: 'Segnen' }; P.cond = ['poisoned']; P.exh = 1; render(); window.scrollTo(0, 0); }); await p.waitForTimeout(100);
    const g = await p.evaluate(lage); mess[k].mit_warnung = g;
    if (fotos && [320, 390].includes(w)) await p.screenshot({ path: path.join(fotos, 'm01-' + w + '-warnung.png') });
    T(k + ': aktive Zustände und Konzentration stehen über den Angriffen', g.conds !== null && g.conds < g.top && g.strow !== null && g.strow < g.top, g);
    if (mob) { const vb = await p.evaluate(() => ['.vb.vconc b', '.vb.vcond b'].map((s) => { const e = document.querySelector(s); return e ? { text: e.textContent, ganz: e.scrollWidth <= e.clientWidth + 1, breite: Math.round(e.clientWidth) } : null; }));
      T(k + ': Werteleiste zeigt «Segnen» und «Vergiftet, Erschöpfung 1» lesbar (nicht abgeschnitten)', vb[0] && vb[0].ganz && vb[0].text === 'Segnen' && vb[1] && /Vergiftet/.test(vb[1].text) && vb[1].ganz, vb); }
    // 0 TP: Todesrettung über den Angriffen
    await p.evaluate(() => { const P = cur().play; P.conc = null; P.cond = []; P.exh = 0; P.hp = 0; P.ds = [0, 0]; render(); window.scrollTo(0, 0); }); await p.waitForTimeout(100);
    const d = await p.evaluate(lage); mess[k].null_tp = d;
    if (fotos && [320, 390].includes(w)) await p.screenshot({ path: path.join(fotos, 'm01-' + w + '-null-tp.png') });
    T(k + ': bei 0 TP stehen Todesrettungswürfe über den Angriffen', d.death !== null && d.death < d.top, d);
    if (!nurMessen && mob) {
      // Bedienung: alles aus dem bisherigen Kampfreiter ist da und wirkt
      await p.evaluate(HELD);
      const ok = await p.evaluate(async () => { const q = (s) => document.querySelector('#view ' + s); const res = {};
        const click = (s) => { const e = typeof s === 'string' ? q(s) : s; if (!e) return false; e.click(); return true; };
        res.modus = click('.seg [data-arg="adv"]') && S.mode === 'adv'; click('.seg [data-arg="normal"]');
        res.rastMenue = !!q('.smore [data-act="rest"][data-arg="short"]') && !!q('.smore [data-act="rest"][data-arg="long"]') && !!q('.smore [data-act="turnBack"]') && !!q('.smore [data-act="histOpen"]');
        res.pillen = ['a', 'b', 'r'].every((x) => !!q('.tbar [data-act="tPick"][data-arg="' + x + '"]'));
        res.bewegung = click('.tmove [data-act="tMove"][data-arg="1.5"]') && /7,5/.test(q('.tmove b').textContent);
        res.neuerZug = click('[data-act="tNew"]') && /9/.test(q('.tmove b').textContent);
        res.kampfmodus = !!q('[data-act="tFight"]');
        res.inspiration = click('.strow [data-act="flip"][data-path="play.insp"]') && cur().play.insp === true; click('.strow [data-act="flip"][data-path="play.insp"]');
        res.zustandWaehlbar = !!q('#conds .condpick [data-act="cond"]');
        res.erschoepfung = !!q('#conds select');
        res.angriff = !!q('.atk [data-act="atk"]') && !!q('.atk [data-act="dmg"]');
        click('[data-act="hpTog"]'); const inp = document.querySelector('#hpAmt'); if (inp) { inp.value = '5'; click(document.querySelector('[data-act="hp"][data-arg="dmg"]')); } res.schaden = cur().play.hp === derive(cur(), S.hb).hpMax - 5;
        res.reiterAlle = !!document.querySelector('.mnav [data-act="mg"][data-arg="alle"]') || !!document.querySelector('.mnav .mall');
        return res; });
      await p.waitForTimeout(900);
      ok.rueckgaengig = await p.evaluate(() => { const u = document.querySelector('.mnav .udo [data-act="undo"]'); if (!u || u.disabled) return 'kein Knopf'; u.click(); return cur().play.hp === derive(cur(), S.hb).hpMax; });
      Object.entries(ok).forEach(([n, v]) => T(k + ': bedienbar – ' + n, v === true, v));
      // Zustand per Tippen setzen: Block wandert nach oben, Angriffe darunter
      const z2 = await p.evaluate(() => { document.querySelector('#conds .condpick summary').click(); const c = document.querySelector('#conds .condpick [data-act="cond"][data-arg="prone"]'); if (c) c.click(); const L = { conds: Math.round(document.querySelector('#conds').getBoundingClientRect().top + scrollY), atk: Math.round(document.querySelector('#view .atk').getBoundingClientRect().top + scrollY) }; return Object.assign(L, { gesetzt: (cur().play.cond || []).includes('prone') }); });
      T(k + ': Zustand antippen setzt ihn und er rückt über die Angriffe', z2.gesetzt && z2.conds < z2.atk, z2);
    }
    await p.close();
  }
  await b.close();
  T('Keine Skriptfehler', !errs.length, errs);
  console.log(JSON.stringify(mess));
  out.forEach((r) => console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : '  → ' + JSON.stringify(r.got))));
  const f = out.filter((r) => !r.ok).length; console.log((out.length - f) + ' / ' + out.length + ' bestanden'); process.exit(f && !nurMessen ? 1 : 0);
})();
