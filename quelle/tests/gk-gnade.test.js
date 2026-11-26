/* GK-11: Gnaden-Dialog auf Deutsch («Gnade zeigen?»), Entscheidung unverändert.
   Echter Ablauf: Spielleitung am Tisch, ein Held fällt (Spielerdokument über den Snapshot-Eingang), Dialog öffnet sich.
   Aufruf: node tests/gk-gnade.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 500))); };
(async () => {
  const b = await chromium.launch(); const errs = [];
  for (const [w, h] of [[390, 844], [1280, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); });
    await p.goto('file://' + target); await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      window.__subs = {}; window.__writes = [];
      const ref = (pth) => ({ onSnapshot: (fn) => { __subs[pth] = fn; return () => {}; }, set: async (v) => { __writes.push({ p: pth, v: JSON.parse(JSON.stringify(v)) }); }, delete: async () => {}, get: async () => ({ exists: false }), ping: async () => {} });
      DB = { doc: ref, collection: (pth) => Object.assign(ref(pth), { doc: (id) => ref(pth + '/' + id), get: async () => ({ docs: [], empty: true }) }) }; UID = 'ich';
      const ch = sampleChar(); S.chars = { [ch.id]: ch }; S.cur = ch.id; joinCamp('raum', true); S.view = 'camp'; render();
      __subs['camp/raum/state/meta']({ exists: true, data: () => ({ dm: 'ich', mercy: {} }) });
      __subs['camp/raum/players']({ docs: [{ id: 'u2', data: () => ({ char: 'Bryn', cls: 'wiz', clsName: 'Magier', level: 3, dead: true, deadAt: 4242, deathFinal: false, t: Date.now() }) }] });
      const m = document.getElementById('modal'); const h2 = m.querySelector('#mercyT');
      const out = { open: !m.hidden && S.modal === 'mercy', title: h2 && h2.textContent, en: /Show mercy/.test(m.textContent), labelled: m.querySelector('[role="alertdialog"]').getAttribute('aria-labelledby') === 'mercyT', fits: h2 && h2.scrollWidth <= h2.clientWidth + 1, btns: [...m.querySelectorAll('button')].map((x) => x.textContent) };
      m.querySelector('[data-act="mercy"]').click();
      const w = __writes.filter((x) => /state\/meta$/.test(x.p)).pop(); out.saved = !!(w && w.v.mercy && w.v.mercy.u2 && w.v.mercy.u2.d === 'mercy' && w.v.mercy.u2.deadAt === 4242); out.closed = m.hidden && S.modal !== 'mercy';
      /* Gegenprobe: «Der Tod ist endgültig» für einen zweiten gefallenen Helden */
      __subs['camp/raum/players']({ docs: [{ id: 'u3', data: () => ({ char: 'Cora', cls: 'fig', clsName: 'Kämpferin', level: 2, dead: true, deadAt: 77, t: Date.now() }) }] });
      document.querySelector('#modal [data-act="doom"]').click(); const w2 = __writes.filter((x) => /state\/meta$/.test(x.p)).pop(); out.doom = !!(w2 && w2.v.mercy.u3 && w2.v.mercy.u3.d === 'death');
      /* Einzelspiel: gefallener Held ohne Kampagne, eigene Gnade */
      leaveCamp(); ch.play.dead = true; ch.play.deadAt = 5; ch.play.hp = 0; S.view = 'sheet'; render(); const sm = document.querySelector('[data-act="selfMercy"]'); out.self = !!sm && /Gnade zeigen \(1 TP\)/.test(sm.textContent); if (sm) sm.click(); out.selfOk = ch.play.dead === false && ch.play.hp === 1;
      return out;
    });
    T('GK11-T01 (' + w + ' px) Dialog über echten Ablauf: Titel «Gnade zeigen?», kein «Show mercy?»', r.open && r.title === 'Gnade zeigen?' && !r.en && r.labelled, r);
    T('GK11-T02 (' + w + ' px) Gnade/Tod wie bisher gespeichert, Einzelspielpfad unverändert', r.saved && r.closed && r.doom && r.self && r.selfOk, r);
    T('GK11-T03 (' + w + ' px) Titel passt, beide Knöpfe vorhanden', r.fits && r.btns.join('|') === 'Der Tod ist endgültig|Gnade zeigen', r);
    await p.close();
  }
  T('Keine JavaScript-Fehler', errs.length === 0, errs.slice(0, 5));
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden');
  await b.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
