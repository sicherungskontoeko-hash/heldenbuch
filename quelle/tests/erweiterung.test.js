/* Erweiterung (6 Klassen, 18 Unterklassen, 9 Völker): Standard- und erweiterte Auswahl, alle Stufen rendern,
   Aktionsökonomie, Rasten, Multiclassing, bestehende Helden bleiben sichtbar, Suche.
   Aufruf: node tests/erweiterung.test.js [index.html] */
const { chromium } = require('playwright'); const path = require('path');
const target = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html'));
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 600))); };
const HXC = ['hxform', 'hxmind', 'hxguard', 'hxthread', 'hxexec', 'hxblight'];
const HXS = ['hxferrali', 'hxsilk', 'hxgolem', 'hxrift', 'hxleaf', 'hxoculi', 'hxbone', 'hxfey', 'hxtail'];
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('hb_sample_done', '1'); localStorage.setItem('hb_dice_fx', 'aus'); localStorage.setItem('hb_w3d', '0'); });
  await p.goto('file://' + target); await p.waitForTimeout(500);

  /* ---------- Daten ---------- */
  const data = await p.evaluate(([hxc, hxs]) => ({ cls: hxc.filter((k) => CLASSES[k] && CLASSES[k].home && CLASSES[k].subs.length === 3), sp: hxs.filter((k) => SPECIES[k] && SPECIES[k].home), golem: Object.keys((SPECIES.hxgolem.choice || {}).opts || {}) }), [HXC, HXS]);
  T('6 Klassen mit je 3 Unterklassen, 9 Völker, alle als eigene Inhalte markiert', data.cls.length === 6 && data.sp.length === 9, data);
  T('Golem: drei Bauarten wählbar', data.golem.join() === 'clay,ceramic,forged', data.golem);

  /* ---------- Standard- und erweiterte Auswahl ---------- */
  await p.evaluate(() => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const ch = normChar(newChar({ name: 'Neu', cls: 'fig', species: 'human' })); S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'build'; });
  const clsStep = await p.evaluate(() => { for (let st = 0; st < 7; st++) { S.step = st; S.view = 'build'; render(); if (document.querySelector('button[data-act=setCls]')) return st; } return -1; });
  const spStep = await p.evaluate(() => { for (let st = 0; st < 7; st++) { S.step = st; S.view = 'build'; render(); if (document.querySelector('button[data-act=setSpecies]')) return st; } return -1; });
  await p.evaluate(() => { localStorage.removeItem('hb_rules'); S.rules = null; });
  let v = await p.evaluate(async (st) => { S.step = st; render(); return [...document.querySelectorAll('button[data-act=setCls]')].map((x) => x.dataset.arg); }, clsStep);
  const homeC = await p.evaluate(() => Object.keys(CLASSES).filter((k) => CLASSES[k].home)); const homeS = await p.evaluate(() => Object.keys(SPECIES).filter((k) => SPECIES[k].home));
  T('Standard: Klassenwahl zeigt nur die Grundklassen (12)', v.length === 12 && !v.some((k) => homeC.includes(k)), v);
  const tog = await p.evaluate(() => [...document.querySelectorAll('.homeview button')].map((x) => x.textContent + (x.classList.contains('on') ? '*' : '')));
  T('Umschalter «Standard / Erweitert» sichtbar, Standard aktiv', tog.join() === 'Standard*,Erweitert', tog);
  v = await p.evaluate((st) => { S.step = st; render(); return [...document.querySelectorAll('button[data-act=setSpecies]')].map((x) => x.dataset.arg); }, spStep);
  T('Standard: Spezieswahl ohne eigene Völker', v.length >= 9 && !v.some((k) => homeS.includes(k)), v);
  await p.evaluate((st) => { S.step = st; render(); }, clsStep); await p.click('.homeview button[data-arg="1"]'); await p.waitForTimeout(80);
  v = await p.evaluate(() => [...document.querySelectorAll('button[data-act=setCls]')].map((x) => x.dataset.arg));
  T('Erweitert: alle 22 Klassen inklusive der 6 neuen', v.length === 22 && HXC_OK(v), v);
  function HXC_OK(list) { return ['hxform', 'hxmind', 'hxguard', 'hxthread', 'hxexec', 'hxblight'].every((k) => list.includes(k)); }
  const pics = await p.evaluate((hx) => hx.map((k) => { const s = document.querySelector('button[data-act=setCls][data-arg=' + k + '] .pic-cls-' + k); return s ? getComputedStyle(s).backgroundImage.startsWith('url(') : false; }), HXC);
  T('Erweitert: jede neue Klasse zeigt ihre mitgelieferte Illustration', pics.every(Boolean), pics);
  T('Einstellung wird gespeichert', await p.evaluate(() => JSON.parse(localStorage.getItem('hb_rules') || '{}').homeview === true));
  v = await p.evaluate((st) => { S.step = st; render(); return { ids: [...document.querySelectorAll('button[data-act=setSpecies]')].map((x) => x.dataset.arg), pic: [...document.querySelectorAll('button[data-act=setSpecies]')].filter((x) => x.dataset.arg.startsWith('hx')).map((x) => { const s = x.querySelector('[class*=pic-sp-]'); return s ? getComputedStyle(s).backgroundImage.startsWith('url(') : false; }) }; }, spStep);
  T('Erweitert: alle 9 neuen Völker mit Illustration', HXS.every((k) => v.ids.includes(k)) && v.pic.length === 9 && v.pic.every(Boolean), v);
  const sub = await p.evaluate(() => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const ch = normChar(newChar({ name: 'U', cls: 'hxguard', level: 3, species: 'hxgolem' })); S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'build'; render();
    for (let st = 0; st < 7; st++) { S.step = st; render(); const b = [...document.querySelectorAll('button[data-act=pick][data-path=sub]')].filter((x) => x.dataset.val !== 'eigen'); if (b.length) return b.map((x) => x.dataset.val + ':' + (x.textContent.length > 60)); } return []; });
  T('Unterklassenwahl: 3 Unterklassen mit Beschreibung', sub.length === 3 && sub.every((x) => x.endsWith(':true')), sub);

  /* ---------- Bestehende Helden bleiben sichtbar ---------- */
  await p.evaluate(() => { S.rules.homeview = false; localStorage.setItem('hb_rules', JSON.stringify(S.rules)); });
  const keep = await p.evaluate(([cs, ss]) => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const ch = normChar(newChar({ name: 'Alt', cls: 'hxthread', level: 4, sub: 'swarm', species: 'hxfey', multi: [{ cls: 'rk', level: 2 }] })); S.chars[ch.id] = ch; S.cur = ch.id; S.view = 'build';
    S.step = cs; render(); const cl = [...document.querySelectorAll('button[data-act=setCls]')].map((x) => x.dataset.arg); S.step = ss; render(); const sp = [...document.querySelectorAll('button[data-act=setSpecies]')].map((x) => x.dataset.arg);
    S.view = 'sheet'; S.mg = 'kampf'; render(); const txt = document.querySelector('#view').textContent; const c = derive(ch, S.hb);
    return { cl, sp, sheet: /Fadenlenker/.test(txt) && /Feyri/.test(txt), lv: c.level, mc: c.classes.map((e) => e.id + e.lvl).join() }; }, [clsStep, spStep]);
  T('Standard-Sicht: gewählte eigene Klasse und Volk bleiben in der Auswahl', keep.cl.length === 13 && keep.cl.includes('hxthread') && keep.sp.includes('hxfey') && !keep.sp.includes('hxsilk'), keep);
  T('Standard-Sicht: bestehender Held mit eigener Klasse, Volk und Mehrklasse wird voll angezeigt', keep.sheet && keep.lv === 6 && keep.mc === 'hxthread4,rk2', keep);
  const mcSel = await p.evaluate(() => { S.view = 'build'; for (let st = 0; st < 7; st++) { S.step = st; render(); const s = document.getElementById('addMc'); if (s) return [...s.options].map((o) => o.value).filter(Boolean); } return null; });
  T('Mehrklassen-Auswahl folgt der Sicht (Standard: keine eigenen Klassen)', mcSel && mcSel.length > 5 && !mcSel.some((k) => homeC.includes(k)), mcSel);
  const srch = await p.evaluate(() => { SRCH_HOME = null; const a = srchAll().filter((e) => /Formwandler|Ferrali/.test(e.name)).length; S.rules.homeview = true; SRCH_HOME = null; const b = srchAll().filter((e) => /Formwandler|Ferrali/.test(e.name)).length; S.rules.homeview = false; SRCH_HOME = null; return { a, b }; });
  T('Suche: eigene Inhalte nur in der erweiterten Sicht', srch.a === 0 && srch.b >= 2, srch);

  /* ---------- Alle Klassen, Unterklassen, Stufen ---------- */
  const all = await p.evaluate((hx) => { const out = { n: 0, fail: [], tabs: 0 }; const base = { str: 15, dex: 14, con: 15, int: 14, wis: 12, cha: 10 };
    for (const id of hx) for (const sb of CLASSES[id].subs) for (let lv = 1; lv <= 20; lv++) {
      Object.keys(S.chars).forEach((k) => delete S.chars[k]); const ch = normChar(newChar({ name: 'T', cls: id, level: lv, sub: lv >= 3 ? sb.id : '', base, weapons: [{ w: 'longsword' }, { w: 'shortbow' }], armor: 'chainmail' })); S.chars[ch.id] = ch; S.cur = ch.id;
      try { const c = derive(ch, S.hb); out.n++; if (!c.features.length || c.res.some((r) => !r.n || !(r.max >= 0))) out.fail.push(id + '/' + sb.id + '/' + lv + ' Merkmale/Ressourcen'); if (lv >= 3 && (c.subName !== sb.name || !c.features.some((f) => f.src === sb.name))) out.fail.push(id + '/' + sb.id + '/' + lv + ' Unterklasse fehlt'); if (c.warn.some((x) => /Unterklasse wählen/.test(x)) && lv >= 3) out.fail.push(id + lv + ' Warnung Unterklasse');
        if ([1, 3, 5, 11, 17, 20].includes(lv)) { S.view = 'sheet'; for (const g of ['kampf', 'faehig', 'werte']) { S.mg = g; render(); out.tabs++; } }
      } catch (e) { out.fail.push(id + '/' + sb.id + '/' + lv + ': ' + e.message); } }
    return out; }, HXC);
  T('Alle 6 Klassen × 3 Unterklassen × Stufen 1–20 berechnen und zeichnen ohne Fehler', all.n === 360 && all.fail.length === 0 && all.tabs === 324, all);
  const allSp = await p.evaluate((hx) => { const out = []; for (const sp of hx) for (const v of (SPECIES[sp].choice ? Object.keys(SPECIES[sp].choice.opts) : [''])) for (const cls of ['fig', 'wiz', 'mon']) { const ch = normChar(newChar({ name: 'S', cls, level: 5, species: sp, speciesChoice: v })); try { const c = derive(ch, S.hb); const tr = SPECIES[sp].traits(c); if (!tr.length || tr.some((t) => !t[0] || !t[1])) out.push(sp + v + ' Merkmale'); S.chars = { [ch.id]: ch }; S.cur = ch.id; S.view = 'sheet'; S.mg = 'kampf'; render(); } catch (e) { out.push(sp + '/' + v + '/' + cls + ': ' + e.message); } } return out; }, HXS);
  T('Alle 9 Völker (inkl. 3 Golem-Bauarten) mit Kämpfer, Magier und Mönch ohne Fehler', allSp.length === 0, allSp);

  /* ---------- Aktionsökonomie ---------- */
  const eco = await p.evaluate((hx) => { const out = { runs: 0, bad: [] }; const base = { str: 16, dex: 14, con: 16, int: 16, wis: 12, cha: 10 };
    const close = () => { S.sa = null; S.dp = null; S.modal = null; const m = document.getElementById('modal'); if (m) m.hidden = true; };
    for (const id of hx) for (const sb of CLASSES[id].subs) for (const lv of [1, 3, 6, 11, 18, 20]) {
      Object.keys(S.chars).forEach((k) => delete S.chars[k]); const ch = normChar(newChar({ name: 'E', cls: id, level: lv, sub: lv >= 3 ? sb.id : '', base, weapons: [{ w: 'longsword' }], armor: 'chainmail' })); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.localFight = true;
      const c = derive(ch, S.hb);
      for (const o of turnOpts(c).filter((x) => /^f:hx_/.test(x.id))) { turnReset(ch); close(); const resK = (FEAT_ACTIONS.find((f) => 'f:' + f.id === o.id) || {}).res; const r0 = resK ? +(ch.play.res[resK] || 0) : 0;
        try { turnRun(ch, o.id); out.runs++; } catch (e) { out.bad.push(o.id + ': ' + e.message); continue; } close(); const t = turnSt(ch);
        const okCost = o.cost === 'a' ? t.a >= 1 : o.cost === 'b' ? t.b === 1 && t.a === 0 : o.cost === 'r' ? t.r === 1 && t.a === 0 && t.b === 0 : t.a === 0 && t.b === 0 && t.r === 0;
        if (!okCost) out.bad.push(id + lv + ' ' + o.id + ' Kosten ' + o.cost + ' → ' + JSON.stringify({ a: t.a, b: t.b, r: t.r }));
        if (resK && +(ch.play.res[resK] || 0) !== r0 + 1) out.bad.push(o.id + ' Ressource ' + resK + ' nicht gebucht');
        if (o.cost !== 'f') { const t1 = JSON.stringify(ch.play.res); const n1 = (S.log || []).length; const before = JSON.stringify({ a: t.a, b: t.b, r: t.r }); turnRun(ch, o.id); close(); const t2 = turnSt(ch);
          if (o.cost !== 'a' && JSON.stringify(ch.play.res) !== t1) out.bad.push(o.id + ' zweite ' + o.cost + ' im selben Zug hat Ressource verbraucht'); if (o.cost === 'b' && t2.b !== 1) out.bad.push(o.id + ' Bonusaktion doppelt'); }
      } }
    return out; }, HXC);
  T('Jede neue Fähigkeit bucht genau ihre Aktion/Bonusaktion/Reaktion und Ressource', eco.runs > 300 && eco.bad.length === 0, eco);
  const form = await p.evaluate(() => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const ch = normChar(newChar({ name: 'F', cls: 'hxform', level: 5, sub: '', weapons: [{ w: 'longsword' }, { w: 'shortbow' }], armor: 'leather' })); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.localFight = true; turnReset(ch);
    let c = derive(ch, S.hb); const o1 = turnOpts(c).filter((o) => /^f:hx_form_\d+$/.test(o.id)); turnRun(ch, 'f:hx_form_1'); c = derive(ch, S.hb); const after = turnOpts(c).filter((o) => /^f:hx_form_\d+$/.test(o.id)).length;
    const blade = c.attacks.filter((a) => a.melee).length; const xd = (c.extraDice || c.xd || []); const forms = (ch.play.hxForms || []).join();
    turnReset(ch, true); const keepEnd = (ch.play.hxForms || []).join(); turnReset(ch); const gone = !ch.play.hxForms;
    ch.level = 11; c = derive(ch, S.hb); const two = turnOpts(c).filter((o) => /^f:hx_form_\d+$/.test(o.id)).map((o) => o.n.split('+').length);
    ch.play.hxForms = ['Sehne']; const sp0 = derive(ch, S.hb).speed; delete ch.play.hxForms; const sp1 = derive(ch, S.hb).speed;
    ch.play.hxForms = ['Klinge']; ch.play.localFight = false; doRest(ch, 'long', true); return { o1: o1.length, after, forms, keepEnd, gone, two: [...new Set(two)], sehne: sp0 - sp1, longGone: !ch.play.hxForms, blade }; });
  T('Wandelgestalt: Bonusaktion, 4 Einzelformen, einmal pro Zug', form.o1 === 4 && form.after === 0 && form.forms === 'Klinge', form);
  T('Wandelgestalt hält bis zum Beginn des nächsten eigenen Zuges, endet mit langer Rast', form.keepEnd === 'Klinge' && form.gone && form.longGone, form);
  T('Ab Stufe 11 zwei Formen gleichzeitig; Sehne +3 m', form.two.join() === '2' && form.sehne === 3, form);
  const strict = await p.evaluate(() => { Object.keys(S.chars).forEach((k) => delete S.chars[k]); const ch = normChar(newChar({ name: 'G', cls: 'hxguard', level: 5, sub: 'bastion', armor: 'chainmail', weapons: [{ w: 'longsword' }] })); S.chars[ch.id] = ch; S.cur = ch.id; ch.play.localFight = true; turnReset(ch);
    turnRun(ch, 'f:hx_intercept'); const r1 = turnSt(ch).r; const n = (S.log || []).length; turnRun(ch, 'f:hx_intercept'); const t = turnSt(ch); turnRun(ch, 'f:hx_fortify'); const used = +ch.play.res.hxg_bastion || 0; turnRun(ch, 'f:hx_challenge'); const b2 = turnSt(ch).b;
    return { r1, used, b2, fort: derive(ch, S.hb).res.find((r) => r.k === 'hxg_bastion') }; });
  T('Strenge Regeln: zweite Reaktion bzw. Bonusaktion wird blockiert', strict.r1 === 1 && strict.used === 1 && strict.b2 === 1, strict);

  /* ---------- Rasten ---------- */
  const rest = await p.evaluate((hx) => { const out = []; for (const id of hx) for (const sb of CLASSES[id].subs) { const ch = normChar(newChar({ name: 'R', cls: id, level: 20, sub: sb.id, species: 'hxfey' })); S.chars = { [ch.id]: ch }; S.cur = ch.id; const c = derive(ch, S.hb);
      c.res.forEach((r) => { ch.play.res[r.k] = r.max; }); doRest(ch, 'short', true); const c2 = derive(ch, S.hb);
      c2.res.forEach((r) => { const u = +ch.play.res[r.k] || 0; if (r.reset === 'short' && u !== 0) out.push(id + '/' + sb.id + ' kurze Rast ' + r.k); if (r.reset === 'long' && !r.note && u !== r.max) out.push(id + '/' + sb.id + ' kurze Rast setzt ' + r.k + ' zurück'); });
      doRest(ch, 'long', true); c2.res.forEach((r) => { if ((+ch.play.res[r.k] || 0) !== 0) out.push(id + '/' + sb.id + ' lange Rast ' + r.k); }); }
    return out; }, HXC);
  T('Kurze Rast füllt nur Kurzrast-Ressourcen, lange Rast alle', rest.length === 0, rest);
  const leaf = await p.evaluate(() => { const ch = normChar(newChar({ name: 'L', cls: 'fig', level: 5, species: 'hxleaf' })); S.chars = { [ch.id]: ch }; S.cur = ch.id; const c = derive(ch, S.hb); ch.play.hp = 1; S.sr = { id: ch.id, want: { 10: 1 } }; XA.srDone(null, '', '', ch); const l = (S.log || []).find((x) => x.label === 'Trefferwürfel'); return l ? l.detail : ''; });
  T('Laubgeborene: Lichternte +ÜB bei kurzer Rast mit Trefferwürfel (im Protokoll)', /Lichternte \+3/.test(leaf), leaf);

  /* ---------- Multiclassing ---------- */
  const mc = await p.evaluate(() => { const mk = (cls, lvl, multi, abil) => { const ch = normChar(newChar({ name: 'M', cls, level: lvl, multi, base: abil || { str: 15, dex: 14, con: 15, int: 13, wis: 10, cha: 8 } })); return derive(ch, S.hb); };
    const a = mk('hxform', 5, [{ cls: 'fig', level: 5 }]).attacksPer, b = mk('hxform', 5, [{ cls: 'hxexec', level: 5 }]).attacksPer, c = mk('fig', 11, [{ cls: 'hxform', level: 5 }]).attacksPer, d = mk('hxguard', 4, [{ cls: 'hxexec', level: 1 }]).attacksPer, e = mk('hxguard', 5).attacksPer;
    const w = mk('hxmind', 3, [{ cls: 'hxguard', level: 1 }], { str: 10, dex: 12, con: 12, int: 16, wis: 10, cha: 8 }).warn.join(' '); const ok = mk('hxmind', 3, [{ cls: 'hxguard', level: 1 }], { str: 13, dex: 12, con: 13, int: 16, wis: 10, cha: 8 }).warn.filter((x) => /Multiclassing/.test(x));
    const two = derive(normChar(newChar({ name: 'M2', cls: 'hxguard', level: 6, sub: 'bastion', multi: [{ cls: 'hxexec', level: 3, sub: 'headsman' }], base: { str: 15, dex: 14, con: 15, int: 10, wis: 10, cha: 8 } })), S.hb); const keys = two.res.map((r) => r.k); return { a, b, c, d, e, w, ok, dup: keys.length !== new Set(keys).size, keys }; });
  T('Mehrklassen: Zusatzangriff addiert sich nicht (5+5 → 2, Kämpfer 11 → 3)', mc.a === 2 && mc.b === 2 && mc.c === 3 && mc.d === 1 && mc.e === 2, mc);
  T('Mehrklassen-Voraussetzungen der neuen Klassen werden geprüft', /Multiclassing Bollwerk/.test(mc.w) && mc.ok.length === 0, mc);
  T('Mehrklassen: Ressourcen beider Klassen getrennt, keine doppelten Schlüssel', !mc.dup && mc.keys.includes('hxg_bastion') && mc.keys.includes('hxe_precise'), mc.keys);

  /* ---------- Völker im Kampf ---------- */
  const spc = await p.evaluate(() => { const mk = (o) => { const ch = normChar(newChar(Object.assign({ name: 'V', level: 5, weapons: [{ w: 'longsword' }] }, o))); S.chars = { [ch.id]: ch }; S.cur = ch.id; ch.play.localFight = true; turnReset(ch); return ch; };
    let ch = mk({ cls: 'bar', species: 'hxbone', base: { str: 16, dex: 14, con: 14, int: 8, wis: 10, cha: 10 } }); let c = derive(ch, S.hb); const bone = c.attacks.filter((a) => /Knochenklinge/.test(a.name)).map((a) => a.dmg + '/' + a.dtype + '/' + !!a.rage + '/' + (a.dmg === '1W6' + sgn(c.mod.str)));
    ch = mk({ cls: 'mon', species: 'hxbone', level: 11, base: { str: 10, dex: 16, con: 14, int: 8, wis: 14, cha: 10 }, weapons: [] }); c = derive(ch, S.hb); const monk = c.attacks.filter((a) => /Knochenklinge/.test(a.name)).map((a) => a.dmg + '/' + a.ab);
    ch = mk({ cls: 'fig', species: 'hxferrali' }); c = derive(ch, S.hb); const fer = { atk: c.attacksPer, opts: turnOpts(c).filter((o) => /Hand|Arm/.test(o.n)).length };
    const gol = ['clay', 'ceramic', 'forged'].map((v) => { const g = mk({ cls: 'fig', species: 'hxgolem', speciesChoice: v }); const cc = derive(g, S.hb); return v + ':' + cc.res.filter((r) => /^hxsp_/.test(r.k)).map((r) => r.k + '/' + r.reset).join() + ':' + turnOpts(cc).filter((o) => /^f:hx_(naht|ton|gefu)$/.test(o.id)).map((o) => o.id + o.cost).join(); });
    ch = mk({ cls: 'fig', species: 'hxgolem', speciesChoice: 'ceramic' }); ch.play.hp = 5; turnRun(ch, 'f:hx_naht'); const healed = ch.play.hp > 5 && turnSt(ch).b === 1;
    return { bone, monk, fer, gol, healed }; });
  T('Ossari: Knochenklinge Hieb/Stich 1W6 + STÄ, Kampfrausch zählt', spc.bone.length === 2 && spc.bone.every((x) => /\/true\/true$/.test(x)) && /Hieb/.test(spc.bone[0]) && /Stich/.test(spc.bone[1]), spc.bone);
  T('Ossari-Mönch: Kampfkunstwürfel statt 1W6, GES erlaubt (nicht addiert)', spc.monk.join() === '1W10+3/dex,1W10+3/dex', spc.monk);
  T('Ferrali: vier Arme geben keinen zusätzlichen Angriff und keine Zusatzaktion', spc.fer.atk === 2 && spc.fer.opts === 0, spc.fer);
  T('Golem: Bauart bestimmt Fähigkeit, Kosten und Rast', spc.gol.join(' | ') === 'clay:hxsp_ton/short:f:hx_tonb | ceramic:hxsp_naht/long:f:hx_nahtb | forged:hxsp_gefu/long:f:hx_gefur', spc.gol);
  T('Goldene Naht heilt als Bonusaktion', spc.healed, spc);

  /* ---------- Speichern und Laden ---------- */
  const io = await p.evaluate(() => { const ch = normChar(newChar({ name: 'Export', cls: 'hxexec', level: 7, sub: 'reaper', species: 'hxgolem', speciesChoice: 'forged', multi: [{ cls: 'hxblight', level: 2 }] })); S.chars = { [ch.id]: ch }; S.cur = ch.id; const txt = exportData([ch]);
    S.chars = {}; importJson(txt); const back = Object.values(S.chars)[0]; return back ? [back.cls, back.sub, back.species, back.speciesChoice, (back.multi || []).map((m) => m.cls + m.level).join()].join('|') : 'leer'; });
  T('Export/Import behält Klasse, Unterklasse, Volk, Bauart und Mehrklasse', io === 'hxexec|reaper|hxgolem|forged|hxblight2', io);

  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})();
