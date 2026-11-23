/* Lange Zufallssitzung («Affentest»): Ohne Zurücksetzen werden viele zufällige sichtbare Knöpfe angetippt, Ansichten gewechselt,
   Zahlen eingegeben und Fenster geschlossen – wie ein ungeduldiger Spieler einen ganzen Abend lang. Mit festem Startwert,
   damit ein Fehler wiederholbar ist.
   Geprüft nach jedem Schritt: keine Skriptfehler, Ansicht nicht leer, kein «undefined»/«NaN» im Text, TP zwischen 0 und Maximum,
   keine negativen Zauberplätze oder Ressourcen, mindestens ein Held vorhanden.
   Aufruf: node tests/affe.test.js [app.html] [--schritte=N] */
const { chromium } = require('playwright');
const path = require('path');
const args = process.argv.slice(2);
const target = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
const SCHRITTE = +((args.find((a) => a.startsWith('--schritte=')) || '').slice(11)) || 500;
const NIE = ['delChar', 'askDel', 'campLeave', 'leave', 'importFile', 'exportAll', 'exportOne', 'print', 'reload', 'advReset', 'hbReset', 'stClear', 'histClear', 'txSend', 'campJoin', 'joinCamp', 'campGo', 'drOpen'];
const befunde = [];
(async () => {
  const b = await chromium.launch();
  for (const [seed, w, h] of [[11, 390, 844], [23, 1280, 900], [37, 360, 740]]) {
    const mob = w <= 820; const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: mob, isMobile: mob });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept().catch(() => {})); p.on('popup', (x) => x.close().catch(() => {}));
    await p.goto('file://' + target); await p.waitForTimeout(600);
    await p.evaluate(() => { localStorage.setItem('hb_dice_fx', 'aus'); window.print = () => {}; window.open = () => null; hlSetLevel('std');
      const a = normChar(newChar({ name: 'Ilsa', cls: 'wiz', level: 5, sub: 'evoker', species: 'elf', bg: 'sage', cantrips: ['fire-bolt', 'light', 'mage-hand'], spells: ['magic-missile', 'shield', 'fireball', 'misty-step', 'sleep'], weapons: [{ w: 'quarterstaff' }] })); S.chars[a.id] = a;
      const f = normChar(newChar({ name: 'Mira', cls: 'fig', level: 5, sub: 'champion', species: 'human', bg: 'soldier', armor: 'chainmail', shield: true, weapons: [{ w: 'longsword' }, { w: 'longbow' }] })); S.chars[f.id] = f;
      const r = normChar(newChar({ name: 'Brakk', cls: 'bar', level: 6, sub: 'berserker', species: 'orc', bg: 'soldier', weapons: [{ w: 'greataxe' }] })); S.chars[r.id] = r; S.cur = f.id; S.view = 'sheet'; render(); });
    let rnd = seed; const R = (n) => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd % n; };
    const VIEWS = ['heroes', 'build', 'sheet', 'sheet', 'sheet', 'spells', 'mobs', 'camp', 'adv', 'hb', 'help'];
    for (let i = 0; i < SCHRITTE; i++) {
      const art = R(10); let was = '';
      try {
        if (art === 0) { const v = VIEWS[R(VIEWS.length)]; was = 'Ansicht ' + v; await p.evaluate((v) => { const m = document.getElementById('modal'); m.hidden = true; S.modal = null; S.view = v; if (v === 'build') S.step = Math.floor(Math.random() * 7); render(); }, v); }
        else if (art === 1) { was = 'Zahl eingeben'; await p.evaluate((x) => { const f = [...document.querySelectorAll('#view input[type=number], #modal input[type=number]')].filter((e) => e.offsetParent); if (!f.length) return; const e = f[x % f.length]; e.value = String(x % 23); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, R(1000)); }
        else if (art === 2) { was = 'Escape'; await p.keyboard.press('Escape'); }
        else {
          const pick = await p.evaluate(([x, nie]) => { const vis = (e) => { const d = e.closest('details:not([open])'); if (d && !e.closest('summary')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled; };
            const modal = document.getElementById('modal'); const scope = modal && !modal.hidden ? modal : document;
            const l = [...scope.querySelectorAll('[data-act], details > summary')].filter((e) => vis(e) && !nie.includes(e.dataset.act)); if (!l.length) return '';
            const e = l[x % l.length]; const lab = (e.dataset.act || 'summary') + ' ' + (e.dataset.arg || '') + ' «' + (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30) + '»'; e.click(); return lab; }, [R(100000), NIE]);
          was = 'Klick ' + pick;
        }
        await p.waitForTimeout(25);
        const inv = await p.evaluate(() => { const o = []; const v = document.getElementById('view'); if (!v || !v.innerHTML.trim()) o.push('Ansicht leer');
          const t = document.body.innerText; const bad = t.match(/\bundefined\b|\bNaN\b|\[object [A-Za-z]+\]/); if (bad) o.push('Text: ' + bad[0] + ' «' + t.slice(Math.max(0, t.indexOf(bad[0]) - 40), t.indexOf(bad[0]) + 30).replace(/\s+/g, ' ') + '»');
          if (!Object.keys(S.chars).length) o.push('kein Held mehr');
          Object.values(S.chars).forEach((ch) => { const c = derive(ch, S.hb); const P = ch.play; if (P.hp != null && (P.hp < 0 || P.hp > c.hpMax)) o.push(ch.name + ': TP ' + P.hp + '/' + c.hpMax);
            Object.entries(P.slots || {}).forEach(([g, n]) => { if (+n < 0) o.push(ch.name + ': Platz Grad ' + g + ' = ' + n); });
            Object.entries(P.res || {}).forEach(([k, n]) => { if (+n < 0) o.push(ch.name + ': Ressource ' + k + ' = ' + n); }); });
          return o; });
        if (errs.length) { befunde.push(w + ' Schritt ' + i + ' (' + was + '): Skriptfehler ' + errs[0]); errs.length = 0; }
        inv.forEach((x) => befunde.push(w + ' Schritt ' + i + ' (' + was + '): ' + x));
      } catch (e) { befunde.push(w + ' Schritt ' + i + ' (' + was + '): ' + e.message.split('\n')[0]); }
      if (befunde.length > 40) break;
    }
    await p.close();
  }
  await b.close();
  const u = [...new Set(befunde)]; u.slice(0, 50).forEach((x) => console.log('✘ ' + x));
  console.log('Schritte je Sitzung: ' + SCHRITTE + ' · ' + (u.length ? u.length + ' Befunde' : 'Keine Befunde')); process.exit(u.length ? 1 : 0);
})();
