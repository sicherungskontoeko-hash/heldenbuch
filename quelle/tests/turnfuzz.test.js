/* Zugleisten-Fuzz: führt für jede Klasse/Unterklasse jede angebotene Option einmal aus (Aufruf: node turnfuzz.test.js bar,brd,…) */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const errs=[]; const p = await b.newPage({viewport:{width:1200,height:900}});
  p.on('pageerror', e=>errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '..', 'index.html')); await p.waitForTimeout(300);
  const r = await p.evaluate(async (LIST) => { const bad = []; let n = 0; window.setTimeout0 = setTimeout;
    for (const [cid, C] of Object.entries(CLASSES).filter(([k]) => LIST.includes(k))) for (const sub of (C.subs ? C.subs.map((s) => s.id) : [C.sub.id])) for (const sp of ['goliath', 'mykori']) {
      const ch = normChar({ name: 'T', cls: cid, level: 20, sub, species: sp, speciesChoice: sp === 'goliath' ? 'stone' : '', opts: C.options ? Object.keys(C.options.list) : [], weapons: [{ w: 'shortsword' }, { w: 'dagger' }, { w: 'longbow' }],
        cantrips: Object.values(SPELLS).filter((s) => s.lvl === 0 && s.classes.includes(cid)).slice(0, 3).map((s) => s.id), spells: Object.values(SPELLS).filter((s) => s.lvl > 0 && s.classes.includes(cid)).slice(0, 12).map((s) => s.id), items: [{ uid: 'p1', id: 'potion-heal', qty: 2, eq: true }] });
      ch.play.hp = 50; S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'sheet';
      let opts; try { opts = turnOpts(derive(ch, S.hb)); } catch (e) { bad.push('opts ' + cid + ': ' + e.message); continue; }
      for (const o of opts) { n++; try { turnRun(ch, o.id); S.dp = null; S.sa = null; orbPrompt(''); } catch (e) { bad.push(cid + '/' + sub + '/' + sp + ' ' + o.id + ': ' + e.message); } }
      try { render(); openTurnPicker('a'); openTurnPicker('b'); openTurnPicker('r'); $('#modal').hidden = true; S.modal = null; } catch (e) { bad.push('ui ' + cid + ': ' + e.message); }
      delete S.chars[ch.id];
    }
    await new Promise((r) => setTimeout(r, 1500));
    return { n, bad: [...new Set(bad)] }; }, (process.argv[2] || Object.keys({bar:1}).join(',')).split(','));
  console.log('ran', r.n, 'bad', r.bad.length); console.log(r.bad.slice(0, 25).join('\n')); console.log('ERR', [...new Set(errs)].slice(0, 10)); await b.close(); process.exit(r.bad.length || errs.length ? 1 : 0);
})();
