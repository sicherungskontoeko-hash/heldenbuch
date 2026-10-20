/* Kombinationstest: alle Klassen × alle Unterklassen × Stufen 1–20 – Werte endlich, keine doppelten Ressourcen, alle Zauber vorhanden */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '..', 'index.html')); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const out = { bad: [], n: 0, notes: [] };
    const num = (v) => typeof v === 'number' && isFinite(v);
    for (const [cid, C] of Object.entries(CLASSES)) {
      const subs = C.subs ? C.subs.map((s) => s.id) : [C.sub.id];
      for (const sub of subs) for (let L = 1; L <= 20; L++) {
        const ch = newChar({ cls: cid, level: L, sub, opts: C.options ? Object.keys(C.options.list) : [], invocations: ['lifedrinker', 'mind'], species: 'goliath', speciesChoice: 'fire', weapons: [{ w: 'longsword', mastery: true }, { w: 'shortbow' }, { w: 'pistol' }, { w: 'dagger' }] });
        ch.play.hp = 10;
        let c; try { c = derive(ch, {}); } catch (e) { out.bad.push(cid + '/' + sub + '/' + L + ': ' + e.message); continue; }
        out.n++;
        const chk = { hp: c.hpMax, ac: c.ac, init: c.init, speed: c.speed, pb: c.pb, pass: c.passive };
        for (const [k, v] of Object.entries(chk)) if (!num(v)) out.bad.push(cid + '/' + sub + '/' + L + ' ' + k + '=' + v);
        for (const a of c.attacks) if (!num(a.atk) || /NaN|undefined/.test(a.dmg)) out.bad.push(cid + '/' + sub + '/' + L + ' attack ' + a.name + ' ' + a.atk + ' ' + a.dmg);
        for (const rr of c.res) if (!num(rr.max) || !rr.k || !rr.n || /undefined|NaN/.test(rr.n)) out.bad.push(cid + '/' + sub + '/' + L + ' res ' + JSON.stringify(rr));
        const keys = c.res.map((x) => x.k); const dup = keys.filter((k, i) => keys.indexOf(k) !== i); if (dup.length) out.bad.push(cid + '/' + sub + '/' + L + ' dup res ' + dup);
        for (const x of c.dmgExtras || []) if (!num(x.n) || !num(x.s) || (x.n && !x.s)) out.bad.push(cid + '/' + sub + '/' + L + ' xd ' + JSON.stringify(x));
        for (const f of c.features) if (!f.n || /undefined|NaN/.test(f.n + f.t)) out.bad.push(cid + '/' + sub + '/' + L + ' feat ' + f.n);
        if (c.spell.has) for (const info of c.spell.classes) { if (!num(info.dc) || !num(info.prepN) || !num(info.cantripN) || !num(info.maxLvl)) out.bad.push(cid + '/' + L + ' spellinfo'); for (const id of info.always) if (!getSpell(id, {})) out.bad.push(cid + '/' + sub + '/' + L + ' missing always spell ' + id); }
        try { const tbl = C.table(L); tbl.forEach(([a, v]) => { if (/undefined|NaN/.test(String(v))) out.bad.push(cid + '/' + L + ' table ' + a + '=' + v); }); } catch (e) { out.bad.push(cid + ' table ' + e.message); }
      }
    }
    // spot checks
    const D = (o) => derive(newChar(o), {});
    const pal1 = D({ cls: 'pal', level: 1 }); out.notes.push('pal1 slots ' + JSON.stringify(pal1.spell.slots));
    const pal5 = D({ cls: 'pal', level: 5 }); out.notes.push('pal5 slots ' + JSON.stringify(pal5.spell.slots) + ' prep ' + pal5.spell.prepN);
    const mc = D({ cls: 'pal', level: 6, multi: [{ cls: 'wlk', level: 3 }] }); out.notes.push('pal6/wlk3 slots ' + JSON.stringify(mc.spell.slots) + ' pact ' + JSON.stringify(mc.spell.pact) + ' pb ' + mc.pb);
    const wiz5 = D({ cls: 'wiz', level: 5, multi: [{ cls: 'cle', level: 4 }] }); out.notes.push('wiz5/cle4 slots ' + JSON.stringify(wiz5.spell.slots));
    const life = D({ cls: 'cle', level: 7, sub: 'life' }); out.notes.push('life7 always ' + life.spell.always.join(','));
    const land = D({ cls: 'dru', level: 9, sub: 'land', land: 'arid' }); out.notes.push('land9 arid ' + land.spell.always.join(','));
    const stars = D({ cls: 'brd', level: 3, sub: 'stars' }); out.notes.push('stars always ' + stars.spell.always.join(',') + ' arc ' + stars.skills.arc.prof + ' nat ' + stars.skills.nat.prof);
    const guard = D({ cls: 'rk', level: 3, sub: 'guard', opts: ['glut', 'bann', 'leit', 'schutz'] }); const os = guard.optSets[0]; out.notes.push('guard chosen ' + os.chosen + ' granted ' + os.granted + ' n ' + os.n);
    const nosub = D({ cls: 'rk', level: 3 }); out.notes.push('rk nosub granted ' + nosub.optSets[0].granted + ' warn sub ' + nosub.warn.some((w) => /Unterklasse/.test(w)));
    const fk = D({ cls: 'fk', level: 3, sub: 'blade', base: { str: 10, dex: 12, con: 14, int: 8, wis: 13, cha: 15 }, weapons: [{ w: 'longsword' }, { w: 'longbow' }] }); out.notes.push('fk blade ab ' + fk.attacks.map((a) => a.name + ':' + a.ab).join(',') + ' critMark ' + fk.critMark);
    const bwk = D({ cls: 'bw', level: 2, opts: ['klinge', 'zunge'], base: { str: 10, dex: 12, con: 15, int: 8, wis: 13, cha: 14 }, weapons: [{ w: 'mace' }, { w: 'longsword' }] }); out.notes.push('bw klinge ' + bwk.attacks.map((a) => a.name + ':' + a.ab).join(',') + ' itm ' + bwk.skills.itm.prof);
    const fkres = D({ cls: 'fk', level: 3, sub: 'judge', opts: ['vergeltung'] }); out.notes.push('fk judge res ' + fkres.res.map((x) => x.k).join(',') + ' granted ' + fkres.optSets[0].granted);
    const bar15 = D({ cls: 'bar', level: 15 }); out.notes.push('bar15 res ' + bar15.res.map((x) => x.k).join(','));
    const barg = D({ cls: 'bar', level: 15, sub: 'glut' }); out.notes.push('bar15 glut res ' + barg.res.map((x) => x.k).join(','));
    const ma = D({ cls: 'ma', level: 17, sub: 'combat', armor: 'chainmail', weapons: [{ w: 'pistol' }] }); out.notes.push('ma17 ac ' + ma.ac + ' parts ' + ma.acParts.join('|') + ' pistol atk ' + ma.attacks[1].atk);
    return out;
  });
  console.log('checked', r.n, 'bad', r.bad.length); console.log(r.bad.slice(0, 40).join('\n')); console.log(r.notes.join('\n')); console.log('ERR', errs);
  await b.close(); process.exit(r.bad.length || errs.length ? 1 : 0);
})();
