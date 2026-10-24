/* ==== Rechenkern: alle abgeleiteten Werte eines Charakters ==== */
const mod = (s) => Math.floor((s - 10) / 2);
const sgn = (n) => (n >= 0 ? '+' : '−') + Math.abs(n);
const LAND = {
 arid:{name:'Trocken',dmg:'Feuer',sp:{3:['blur','burning-hands','fire-bolt'],5:['fireball'],7:['blight'],9:['wall-of-stone']}},
 polar:{name:'Polar',dmg:'Kälte',sp:{3:['fog-cloud','hold-person','ray-of-frost'],5:['sleet-storm'],7:['ice-storm'],9:['cone-of-cold']}},
 temperate:{name:'Gemässigt',dmg:'Blitz',sp:{3:['misty-step','shocking-grasp','sleep'],5:['lightning-bolt'],7:['freedom-of-movement'],9:['tree-stride']}},
 tropical:{name:'Tropisch',dmg:'Gift',sp:{3:['acid-splash','ray-of-sickness','web'],5:['stinking-cloud'],7:['polymorph'],9:['insect-plague']}}
};
const DIE_MAX = (d) => { const m = /W(\d+)/.exec(d); return m ? +m[1] : 1; };

function newChar(over) {
  return Object.assign({
    id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    v: 2, name: 'Neuer Held', player: '', level: 1, cls: 'fig', order: '', land: 'temperate',
    species: 'human', speciesChoice: '', speciesSkill: '', speciesSpellAbility: 'wis',
    bg: 'soldier', bgCustom: { name: 'Eigener Hintergrund', abil: ['str','dex','con'], skills: ['ath','prc'], feat: 'alert' },
    bgMode: '21', bgPlus: { str: 2, con: 1 },
    method: 'standard', base: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
    classSkills: [], extraSkills: [], expertise: [], humanFeat: 'skilled',
    asi: {}, styles: [], invocations: [], mi: {},
    cantrips: [], spells: [], book: [], arcanum: {},
    armor: 'none', armorBonus: 0, shield: false, shieldBonus: 0, mageArmor: false,
    weapons: [], misc: { ac: 0, save: 0, dc: 0, atk: 0, speed: 0, hp: 0, init: 0 },
    hpMode: 'avg', hpRolls: {}, gold: 0, inventory: '', notes: '', appearance: '', alignment: '', languages: 'Gemeinsprache',
    homebrew: [], featOpt: {}, multi: [], items: [], inv: [], comps: [], xp: 0,
    play: { hp: null, temp: 0, hdUsed: 0, ds: [0, 0], slots: {}, pact: 0, res: {}, insp: false, exh: 0, raging: false, cond: [] },
    updated: Date.now()
  }, over || {});
}

function featById(id, hb) {
  if (!id) return null;
  if (id.startsWith('hb:')) { const h = hb[id.slice(3)]; return h ? { name: h.name, cat: h.cat || 'general', text: h.text || '', plus: h.plus && h.plus.length ? h.plus : null, hpPerLevel: +h.hpPerLevel || 0, initFlat: +h.init || 0, ac: +h.ac || 0, speed: +h.speed || 0, home: true } : null; }
  return FEATS[id] || null;
}

function bgOf(ch) {
  if (ch.bg === 'custom' || ch.bg.startsWith('hb:')) {
    const src = ch.bg === 'custom' ? ch.bgCustom : null;
    if (src) return { name: src.name || 'Eigener Hintergrund', abil: src.abil, feat: src.feat, skills: src.skills, tool: '', equip: '' };
  }
  const b = BACKGROUNDS[ch.bg] || BACKGROUNDS.soldier;
  return ch.bgFeat && ch.bgFeat !== b.feat ? Object.assign({}, b, { feat: ch.bgFeat }) : b;
}

function asiLevels(cls, level) {
  const l = (cls.asi || []).filter((x) => x <= level);
  if (level >= 19) l.push(19);
  return l;
}

const MC_ARMOR = { bar: ['shield'], brd: ['light'], cle: ['light', 'medium', 'shield'], dru: ['light', 'shield'], fig: ['light', 'medium', 'shield'], pal: ['light', 'medium', 'shield'], ran: ['light', 'medium', 'shield'], rog: ['light'], wlk: ['light'] };
const MC_MARTIAL = ['bar', 'fig', 'pal', 'ran'];
const MC_SKILL = { brd: ALL_SKILLS, ran: CLASSES.ran.skills, rog: CLASSES.rog.skills };
const MC_PREREQ = { bar: [['str']], brd: [['cha']], cle: [['wis']], dru: [['wis']], fig: [['str', 'dex']], mon: [['dex'], ['wis']], pal: [['str'], ['cha']], ran: [['dex'], ['wis']], rog: [['dex']], sor: [['cha']], wlk: [['cha']], wiz: [['int']] };
function derive(ch, hb) {
  hb = hb || {};
  const cls = CLASSES[ch.cls] || CLASSES.fig;
  const multi = (ch.multi || []).filter((m) => CLASSES[m.cls] && m.cls !== ch.cls && +m.level > 0);
  const levels = {}; levels[ch.cls] = Math.max(1, +ch.level || 1);
  multi.forEach((m) => { levels[m.cls] = (levels[m.cls] || 0) + (+m.level); });
  const warn0 = []; const capOn = typeof rule !== 'function' || rule('lvlcap');
  if (capOn) { let over = Object.values(levels).reduce((a, b) => a + b, 0) - 20; if (over > 0) { warn0.push('Die Gesamtstufe darf höchstens 20 sein – überzählige Stufen werden ignoriert.'); for (const m of multi.slice().reverse()) { if (over <= 0) break; const cut = Math.min(over, levels[m.cls] - 0); levels[m.cls] -= cut; over -= cut; } if (over > 0) levels[ch.cls] = Math.max(1, levels[ch.cls] - over); } }
  for (const k of Object.keys(levels)) if (levels[k] <= 0) delete levels[k];
  const L = Math.max(1, Object.values(levels).reduce((a, b) => a + b, 0));
  const lv = (id) => levels[id] || 0;
  const mOf = (id) => (id === ch.cls ? ch : multi.find((m) => m.cls === id) || {});
  const ord = (id) => (lv(id) ? mOf(id).order || '' : '');
  const classList = [{ id: ch.cls, C: cls, lvl: levels[ch.cls], primary: true, m: ch, idx: -1 }].concat(multi.filter((m) => levels[m.cls] > 0).map((m, i) => ({ id: m.cls, C: CLASSES[m.cls], lvl: levels[m.cls], primary: false, m, idx: (ch.multi || []).indexOf(m) })));
  for (const e of classList) { const C = e.C; const chosen = C.subs ? C.subs.find((s) => s.id === e.m.sub) : null; e.subChosen = !C.subs || !!chosen; const sb = chosen || (C.subs ? { name: '', feats: [], id: null } : { name: C.sub.name, feats: C.subFeats, id: C.sub.id }); if (C.subs && e.m.sub && !chosen) warn0.push('Unbekannte Unterklasse „' + e.m.sub + '“ bei ' + C.name + ' – bitte neu wählen.'); e.subName = sb.name; e.subFeats = sb.feats; e.subId = sb.id; e.subGrant = (chosen || !C.subs) ? sb.grant || null : null; e.subSpells = chosen ? chosen.spells : C.subs ? null : C.sub.spells; }
  const subOf = (id) => (classList.find((e) => e.id === id) || {}).subId;
  const sp = SPECIES[ch.species] || SPECIES.human;
  const bg = bgOf(ch);
  const pb = 2 + Math.floor((L - 1) / 4);
  const hasSub = lv(ch.cls) >= 3;
  const warn = warn0;
  const c = { char: ch, level: L, cls, sp, bg, pb, hasSub: lv(ch.cls) >= 3, warn, notes: [], lv, ord, classes: classList, multi: multi.length > 0, subName: classList[0].subName, subOf };
  c.classLabel = classList.map((e) => e.C.name + ' ' + e.lvl).join(' / ');
  const homebrew = (ch.homebrew || []).map((id) => hb[id]).filter(Boolean).concat(typeof itemFx === 'function' ? itemFx(ch) : []);
  c.attuneMax = lv('rog') >= 13 && subOf('rog') === 'thief' ? 4 : 3;
  if (typeof attuneCount === 'function' && attuneCount(ch) > c.attuneMax) warn.push('Einstimmung: höchstens ' + c.attuneMax + ' Gegenstände – entferne eine Einstimmung.');

  /* --- Talente sammeln --- */
  const feats = [];
  if (bg.feat) feats.push({ src: 'Hintergrund', id: bg.feat, f: featById(bg.feat, hb), slot: 'bg' });
  if (sp.bonusFeat) feats.push({ src: 'Spezies (Vielseitig)', id: ch.humanFeat, f: featById(ch.humanFeat, hb), slot: 'human' });
  if (lv('wlk') >= 2 && (ch.invocations || []).includes('lessons')) { if (ch.lessonsFeat) feats.push({ src: 'Lehren der Ersten', id: ch.lessonsFeat, f: featById(ch.lessonsFeat, hb), slot: 'lessons' }); else warn.push('Lehren der Ersten: Herkunftstalent wählen.'); }
  const styleN = classList.reduce((n, e) => n + (e.C.fightingStyle && e.lvl >= e.C.fightingStyle ? 1 : 0), 0) + (lv('fig') >= 7 && subOf('fig') === 'champion' ? 1 : 0);
  c.styleN = styleN;
  (ch.styles || []).slice(0, styleN).forEach((id) => feats.push({ src: 'Kampfstil', id, f: featById(id, hb), slot: 'style' }));
  if (styleN && (ch.styles || []).filter(Boolean).length < styleN) warn.push('Kampfstil wählen (' + styleN + ').');
  c.asiSlots = [];
  for (const e of classList) for (const al of asiLevels(e.C, e.lvl)) {
    const key = e.primary ? String(al) : e.id + al;
    const label = (e.primary && !multi.length) ? 'Stufe ' + al : e.C.name + '-Stufe ' + al;
    c.asiSlots.push({ key, label, al });
    const a = ch.asi[key] || {};
    const id = a.feat || (al === 19 ? '' : 'asi');
    if (!id) { warn.push(label + ': Epische Gabe oder Attributswerterhöhung wählen.'); continue; }
    feats.push({ src: label, id, f: featById(id, hb), slot: 'asi', lv: key, plus: a.plus || {} });
  }
  for (const x of feats) x.opt = x.slot === 'asi' ? (ch.asi[x.lv] || {}) : ((ch.featOpt || {})[x.slot === 'style' ? 'style' : x.slot] || {});
  c.feats = feats.filter((x) => x.f);


  /* --- Attribute --- */
  const abil = {}; const breakdown = {};
  for (const k of AB) { abil[k] = +ch.base[k] || 8; breakdown[k] = ['Basis ' + abil[k]]; }
  if (ch.method === 'manual') { const badB = AB.filter((k) => abil[k] < 3 || abil[k] > 20); if (badB.length) warn.push('Basiswerte ausserhalb 3–20: ' + badB.map((k) => AB_K[k]).join(', ') + '.'); }
  const bgA = bg.abil || [];
  const plus = ch.bgPlus || {};
  let bgSum = 0;
  for (const k of AB) {
    const p = +plus[k] || 0;
    if (p && !bgA.includes(k)) continue;
    if (p) { const capA = typeof rule !== 'function' || rule('abilcap') ? 20 : 30; const nv = Math.min(capA, abil[k] + p); if (nv < abil[k] + p) warn.push(AB_K[k] + ': Hintergrund-Bonus über 20 verfällt.'); abil[k] = nv; bgSum += p; breakdown[k].push('Hintergrund +' + p); }
  }
  const bgVals = AB.map((k) => (bgA.includes(k) ? +plus[k] || 0 : 0)).filter((x) => x);
  const okBg = (ch.bgMode === '21' && bgVals.sort().join() === '1,2') || (ch.bgMode === '111' && bgVals.length === 3 && bgVals.every((x) => x === 1));
  if (!okBg) warn.push('Hintergrund-Boni verteilen: ' + (ch.bgMode === '21' ? '+2 und +1' : '+1/+1/+1') + ' auf ' + bgA.map((k) => AB_K[k]).join(', ') + '.');
  if (ch.method === 'pointbuy') {
    const cost = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
    let pts = 0; for (const k of AB) pts += cost[ch.base[k]] ?? 99;
    c.pointsUsed = pts;
    if (pts > 27) warn.push('Punktekauf: ' + pts + ' von 27 Punkten – zu viele.');
  }
  if (ch.method === 'standard') {
    const s = AB.map((k) => +ch.base[k]).sort((a, b) => b - a).join();
    if (s !== '15,14,13,12,10,8') warn.push('Standardwerte: Jeder Wert (15, 14, 13, 12, 10, 8) genau einmal.');
  }
  for (const x of c.feats) {
    const cap = x.f.cap30 || (typeof rule === 'function' && !rule('abilcap')) ? 30 : 20;
    if (x.f.asi) {
      const p = x.plus || {}; let sum = 0;
      for (const k of AB) { const v = +p[k] || 0; if (v) { sum += v; abil[k] = Math.min(cap, abil[k] + v); breakdown[k].push(x.src + ' +' + v); } }
      if (sum !== 2) warn.push(x.src + ': Attributswerterhöhung verteilen (+2 oder +1/+1).');
    } else if (x.f.plus) {
      const p = x.plus || {}; const k = x.f.plus.length === 1 ? x.f.plus[0] : AB.find((k) => p[k]);
      if (k && x.f.plus.includes(k)) { abil[k] = Math.min(cap, abil[k] + 1); breakdown[k].push(x.src + ' +1'); }
      else if (x.slot === 'asi') warn.push(x.src + ': Attribut für +1 wählen (' + x.f.plus.map((k) => AB_K[k]).join('/') + ').');
    }
  }
  if (lv('bar') >= 20) for (const k of ['str', 'con']) { abil[k] = Math.min(25, abil[k] + 4); breakdown[k].push('Urgewalt +4'); }
  if (lv('mon') >= 20) for (const k of ['dex', 'wis']) { abil[k] = Math.min(25, abil[k] + 4); breakdown[k].push('Körper und Geist +4'); }
  if (typeof itemSet === 'function') itemSet(ch, abil, breakdown);
  const wsS = ch.play && ch.play.ws && typeof WS_STATS !== 'undefined' ? WS_STATS[ch.play.ws] : null;
  c.conOrig = abil.con;
  if (wsS) for (const k of ['str', 'dex', 'con']) { abil[k] = wsS[k]; breakdown[k] = ['Tiergestalt ' + wsS[k]]; }
  c.abil = abil; c.breakdown = breakdown;
  if (multi.length) for (const e of classList) { const req = MC_PREREQ[e.id] || []; const ok = req.every((grp) => grp.some((a) => abil[a] >= 13)); if (!ok) warn.push('Multiclassing ' + e.C.name + ': braucht ' + req.map((g) => g.map((a) => AB_K[a]).join(' oder ')).join(' und ') + ' von mindestens 13.'); }
  c.mod = {}; for (const k of AB) c.mod[k] = mod(abil[k]);

  /* --- Rettungswürfe --- */
  const saveProf = new Set(cls.saves);
  c.feats.forEach((x) => { if (x.f.saveChoice) { const k = x.opt.save; if (k && x.f.saveChoice.includes(k)) saveProf.add(k); else warn.push(x.src + ': Rettungswurf für „' + x.f.name + '“ wählen.'); } });
  if (lv('mon') >= 14) AB.forEach((k) => saveProf.add(k));
  if (lv('rog') >= 15) { saveProf.add('wis'); saveProf.add('cha'); }
  const aura = lv('pal') >= 6 ? Math.max(1, c.mod.cha) : 0;
  const hbSave = homebrew.reduce((s, h) => s + (+h.save || 0), 0);
  c.saves = {};
  for (const k of AB) { const parts = [AB_K[k] + ' ' + sgn(c.mod[k])]; if (saveProf.has(k)) parts.push('Übung ' + sgn(pb)); if (aura) parts.push('Aura des Schutzes ' + sgn(aura)); if (+ch.misc.save) parts.push('Sonstiges ' + sgn(+ch.misc.save)); homebrew.forEach((h) => { if (+h.save) parts.push(h.name + ' ' + sgn(+h.save)); }); c.saves[k] = { prof: saveProf.has(k), val: c.mod[k] + (saveProf.has(k) ? pb : 0) + aura + (+ch.misc.save || 0) + hbSave, parts }; }
  if (aura) c.notes.push('Aura des Schutzes +' + aura + ' auf alle Rettungswürfe eingerechnet.');

  /* --- Fertigkeiten --- */
  const prof = {}; const src = {};
  const addP = (s, from) => { if (!s) return; prof[s] = Math.max(prof[s] || 0, 1); (src[s] = src[s] || []).push(from); };
  (bg.skills || []).forEach((s) => addP(s, 'Hintergrund'));
  const cs = (ch.classSkills || []).filter((s) => cls.skills.includes(s));
  cs.slice(0, cls.skillN).forEach((s) => addP(s, cls.name));
  if (cs.length < cls.skillN) warn.push(cls.name + ': ' + (cls.skillN - cs.length) + ' Fertigkeit(en) wählen.');
  if (sp.skillPick) { if (ch.speciesSkill && sp.skillPick.includes(ch.speciesSkill)) addP(ch.speciesSkill, sp.name); else warn.push(sp.name + ': Fertigkeit wählen.'); }
  let extraN = 0; const extraSrc = [];
  c.feats.forEach((x) => { if (x.f.skills) { extraN += x.f.skills; extraSrc.push(x.f.name); } });
  if (lv('brd') >= 3 && subOf('brd') === 'lore') { extraN += 3; extraSrc.push('Schule des Wissens'); }
  if (lv('bar') >= 3) { extraN += 1; extraSrc.push('Urwissen'); }
  if (lv('brd') >= 3 && subOf('brd') === 'stars') { addP('arc', 'Himmelskunde'); addP('nat', 'Himmelskunde'); }
  if (lv('brd') >= 3 && subOf('brd') === 'masken') { addP('dec', 'Hofzunge'); addP('prf', 'Hofzunge'); }
  if (lv('bar') >= 3 && subOf('bar') === 'ahnen') addP('his', 'Stimmen der Ahnen');
  if (lv('mon') >= 3 && subOf('mon') === 'waage') addP('med', 'Ruhiger Atem');
  multi.forEach((m) => { if (MC_SKILL[m.cls]) { extraN += 1; extraSrc.push('Multiclassing ' + CLASSES[m.cls].name); } });
  c.extraN = extraN; c.extraSrc = extraSrc;
  (ch.extraSkills || []).slice(0, extraN).forEach((s) => addP(s, 'Zusatz'));
  if ((ch.extraSkills || []).length < extraN) warn.push('Noch ' + (extraN - ch.extraSkills.length) + ' zusätzliche Fertigkeit(en) wählen (' + extraSrc.join(', ') + ').');
  let expN = 0; for (const e of classList) for (const [el, n] of e.C.expertise || []) if (e.lvl >= el) expN += n;
  const onlyWiz = classList.filter((e) => e.C.expertise && e.lvl >= e.C.expertise[0][0]).every((e) => e.id === 'wiz');
  c.feats.forEach((x) => { if (x.f.expertise) expN += x.f.expertise; });
  c.expN = expN;
  const featExp = c.feats.some((x) => x.f.expertise);
  c.expFrom = !featExp && onlyWiz ? CLASSES.wiz.expertiseFrom : null;
  const exp = (ch.expertise || []).filter((s) => prof[s] && (!c.expFrom || c.expFrom.includes(s))).slice(0, expN);
  exp.forEach((s) => { prof[s] = 2; });
  const optsOf = (id) => (lv(id) ? mOf(id).opts || [] : []);
  if (optsOf('bw').includes('zunge') && lv('bw') >= 2) { if (prof.itm) prof.itm = 2; else addP('itm', 'Rote Zunge'); }
  if (exp.length < expN) warn.push('Expertise: noch ' + (expN - exp.length) + ' wählen.');
  const jack = lv('brd') >= 2 ? Math.floor(pb / 2) : 0;
  const ordBonus = {};
  if (ord('cle') === 'thaumaturge') { ordBonus.arc = ordBonus.rel = Math.max(1, c.mod.wis); }
  if (ord('dru') === 'magician') { ordBonus.arc = ordBonus.nat = Math.max(1, c.mod.wis); }
  c.skills = {};
  for (const s of ALL_SKILLS) {
    const p = prof[s] || 0; const a = SKILLS[s][1];
    const parts = [AB_K[a] + ' ' + sgn(c.mod[a])]; if (p === 2) parts.push('Expertise ' + sgn(2 * pb)); else if (p) parts.push('Übung ' + sgn(pb)); else if (jack) parts.push('Alleskönner ' + sgn(jack)); if (ordBonus[s]) parts.push((ord('cle') === 'thaumaturge' ? 'Thaumaturg' : 'Magier-Ordnung') + ' ' + sgn(ordBonus[s]));
    c.skills[s] = { prof: p, val: c.mod[a] + (p ? p * pb : jack) + (ordBonus[s] || 0), src: src[s] || [], parts };
  }
  c.passive = 10 + c.skills.prc.val + c.feats.reduce((s, x) => s + (x.f.passive || 0), 0);
  c.passiveIns = 10 + c.skills.ins.val;

  /* --- Trefferpunkte (in Tiergestalt mit der eigenen KON) --- */
  const conM = mod(c.conOrig);
  const hd = cls.hd; let hp = hd + conM; const hpParts = ['Stufe 1: ' + hd + ' ' + sgn(conM)];
  for (let l = 2; l <= lv(ch.cls); l++) {
    const roll = ch.hpMode === 'roll' && +ch.hpRolls[l] ? Math.min(hd, +ch.hpRolls[l]) : hd / 2 + 1;
    hp += Math.max(1, roll + conM);
  }
  if (lv(ch.cls) > 1) hpParts.push(cls.name + ' 2–' + lv(ch.cls) + ': ' + (ch.hpMode === 'roll' ? 'gewürfelt' : 'Durchschnitt ' + (hd / 2 + 1)) + ' ' + sgn(conM) + ' je Stufe');
  multi.forEach((m) => { const d = CLASSES[m.cls].hd; for (let l = 1; l <= +m.level; l++) { const roll = ch.hpMode === 'roll' && m.hpRolls && +m.hpRolls[l] ? Math.min(d, +m.hpRolls[l]) : d / 2 + 1; hp += Math.max(1, roll + conM); } hpParts.push(CLASSES[m.cls].name + ' ' + m.level + '× W' + d + ' (' + (ch.hpMode === 'roll' ? 'gewürfelt' : 'Durchschnitt ' + (d / 2 + 1)) + ' ' + sgn(conM) + ')'); });
  c.hdPool = classList.map((e) => ({ d: e.C.hd, n: e.lvl })).sort((a, b) => b.d - a.d).reduce((acc, x) => { const f = acc.find((y) => y.d === x.d); if (f) f.n += x.n; else acc.push(x); return acc; }, []);
  if (sp.hpPerLevel) { hp += L; hpParts.push('Zwergische Zähigkeit +' + L); }
  if (lv('sor') >= 3 && subOf('sor') === 'draconic') { hp += lv('sor'); hpParts.push('Drachische Widerstandskraft +' + lv('sor')); }
  c.feats.forEach((x) => { if (x.f.hpPerLevel) { hp += x.f.hpPerLevel * L; hpParts.push(x.f.name + ' +' + x.f.hpPerLevel * L); } });
  homebrew.forEach((h) => { if (+h.hpPerLevel) { hp += +h.hpPerLevel * L; hpParts.push(h.name + ' +' + h.hpPerLevel * L); } });
  if (+ch.misc.hp) { hp += +ch.misc.hp; hpParts.push('Sonstiges ' + sgn(+ch.misc.hp)); }
  c.hpMax = Math.max(1, hp); c.hpParts = hpParts; c.hd = hd;

  /* --- Rüstungsklasse --- */
  const ar = ARMOR[ch.armor] || ARMOR.none;
  const profArmor = new Set(cls.armor);
  multi.forEach((m) => (MC_ARMOR[m.cls] || []).forEach((a) => profArmor.add(a)));
  if (ord('cle') === 'protector') profArmor.add('heavy');
  if (lv('bw') >= 3 && subOf('bw') === 'battle') { profArmor.add('medium'); profArmor.add('shield'); }
  if (lv('ma') >= 3 && subOf('ma') === 'combat') profArmor.add('heavy');
  if (lv('wlk') >= 3 && subOf('wlk') === 'shadowblade') { profArmor.add('medium'); profArmor.add('shield'); }
  if (ord('dru') === 'warden') profArmor.add('medium');
  if (lv('cle') >= 3 && subOf('cle') === 'esse') profArmor.add('heavy');
  if (lv('brd') >= 3 && subOf('brd') === 'klingentakt') profArmor.add('medium');
  if (c.feats.some((x) => x.f.shieldProf)) profArmor.add('shield');
  const opts = [];
  if (ar.type === 'none') {
    opts.push([10 + c.mod.dex, 'Ohne Rüstung 10 ' + sgn(c.mod.dex)]);
    if (lv('bar')) opts.push([10 + c.mod.dex + c.mod.con, 'Ungerüstete Verteidigung 10 + GES + KON']);
    if (lv('mon') && !ch.shield) opts.push([10 + c.mod.dex + c.mod.wis, 'Ungerüstete Verteidigung 10 + GES + WEI']);
    if (lv('sor') >= 3 && subOf('sor') === 'draconic') opts.push([10 + c.mod.dex + c.mod.cha, 'Drachische Widerstandskraft 10 + GES + CHA']);
    if (ch.mageArmor) opts.push([13 + c.mod.dex, 'Magierrüstung 13 + GES']);
    if (sp.natAc) opts.push([sp.natAc + c.mod.dex, sp.name + ': Steinhaut ' + sp.natAc + ' + GES']);
  } else {
    const dx = ar.type === 'light' ? c.mod.dex : ar.type === 'medium' ? Math.min(2, c.mod.dex) : 0;
    opts.push([ar.ac + dx + (+ch.armorBonus || 0), ar.name + ' ' + ar.ac + (ar.type !== 'heavy' ? ' + GES' + (ar.type === 'medium' ? ' (max 2)' : '') : '') + (+ch.armorBonus ? ' +' + ch.armorBonus : '')]);
    if (!profArmor.has(ar.type)) warn.push('Keine Übung mit ' + ar.name + ': Nachteil auf STÄ-/GES-Würfe und Angriffe, keine Zauber.');
  }
  opts.sort((a, b) => b[0] - a[0]);
  let ac = opts[0][0]; const acParts = [opts[0][1]];
  if (ch.shield) { if (profArmor.has('shield')) { ac += 2 + (+ch.shieldBonus || 0); acParts.push('Schild +' + (2 + (+ch.shieldBonus || 0))); } else { acParts.push('Schild ohne Übung: kein RK-Bonus'); warn.push('Keine Übung mit Schilden: Der Schild gibt keinen RK-Bonus (D&D 2024).'); } }
  if (ar.type !== 'none' && c.feats.some((x) => x.f.defense)) { ac += 1; acParts.push('Kampfstil Verteidigung +1'); }
  if (ar.type !== 'none' && lv('ma') >= 3 && subOf('ma') === 'combat') { ac += 1; acParts.push('Panzerschmied +1'); }
  c.feats.forEach((x) => { if (x.f.ac) { ac += x.f.ac; acParts.push(x.f.name + ' ' + sgn(x.f.ac)); } if (x.f.acShield && ch.shield) { ac += x.f.acShield; acParts.push(x.f.name + ' +' + x.f.acShield); } });
  homebrew.forEach((h) => { if (+h.ac) { ac += +h.ac; acParts.push(h.name + ' ' + sgn(+h.ac)); } });
  if (+ch.misc.ac) { ac += +ch.misc.ac; acParts.push('Sonstiges ' + sgn(+ch.misc.ac)); }
  if (((ch.play || {}).fx || {}).shield) { ac += 5; acParts.push('Schild (Zauber) +5'); }
  c.ac = ac; c.acParts = acParts;
  c.armorStealthDis = !!ar.stealth; c.armorNonProf = ar.type !== 'none' && !profArmor.has(ar.type); c.heavyArmor = ar.type === 'heavy'; c.armorType = ar.type;

  /* --- Initiative, Bewegung, Sinne --- */
  let init = c.mod.dex + jack; const initParts = ['GES ' + sgn(c.mod.dex)];
  if (jack) initParts.push('Alleskönner +' + jack);
  c.feats.forEach((x) => { if (x.f.init === 'pb') { init += pb; initParts.push(x.f.name + ' +' + pb); } if (x.f.initFlat) { init += x.f.initFlat; initParts.push(x.f.name + ' ' + sgn(x.f.initFlat)); } });
  homebrew.forEach((h) => { if (+h.init) { init += +h.init; initParts.push(h.name + ' ' + sgn(+h.init)); } });
  if (+ch.misc.init) { init += +ch.misc.init; initParts.push('Sonstiges ' + sgn(+ch.misc.init)); }
  c.init = init; c.initParts = initParts;
  c.initAdv = lv('bar') >= 7 || (lv('fig') >= 3 && subOf('fig') === 'champion');
  let speed = sp.speedFn ? sp.speedFn(c) : sp.speed; const spParts = [sp.name + ' ' + fmtM(speed)];
  const heavy = ar.type === 'heavy';
  if (lv('bar') >= 5 && !heavy) { speed += 3; spParts.push('Schnelle Bewegung +3 m'); }
  if (lv('ran') >= 6 && !heavy) { speed += 3; spParts.push('Umherstreifen +3 m'); }
  if (lv('mon') >= 2 && ar.type === 'none' && !ch.shield) { const b = step(3, [[6, 4.5], [10, 6], [14, 7.5], [18, 9]])(lv('mon')); speed += b; spParts.push('Ungerüstete Bewegung +' + fmtM(b)); }
  if (heavy && ar.str && abil.str < ar.str) { speed -= 3; spParts.push('Zu schwache Stärke für ' + ar.name + ' −3 m'); }
  c.feats.forEach((x) => { if (x.f.speed) { speed += x.f.speed; spParts.push(x.f.name + ' +' + fmtM(x.f.speed)); } });
  homebrew.forEach((h) => { if (+h.speed) { speed += +h.speed; spParts.push(h.name + ' +' + fmtM(+h.speed)); } });
  if (+ch.misc.speed) { speed += +ch.misc.speed; spParts.push('Sonstiges ' + fmtM(+ch.misc.speed)); }
  const ex = +ch.play?.exh || 0;
  if (ex) { speed -= 1.5 * ex; spParts.push('Erschöpfung −' + fmtM(1.5 * ex)); }
  const stop = (ch.play?.cond || []).find((k) => typeof COND !== 'undefined' && COND[k] && COND[k].fx && COND[k].fx.speed0);
  if (stop) { speed = 0; spParts.push(COND[stop].name + ': 0 m'); }
  c.speed = Math.max(0, speed); c.speedParts = spParts;
  c.dv = sp.dvFn ? sp.dvFn(c) : sp.dv;
  c.carry = abil.str * 7.5;

  /* --- Übungen --- */
  const wp = { simple: 'Einfache Waffen', martial: 'Einfache und Kriegswaffen', monk: 'Einfache Waffen, leichte Kriegswaffen', rogue: 'Einfache Waffen, Kriegswaffen mit Finesse oder Leicht' }[cls.weapons];
  const martialAny = cls.weapons === 'martial' || multi.some((m) => MC_MARTIAL.includes(m.cls)) || ord('cle') === 'protector' || ord('dru') === 'warden' || (lv('cle') >= 3 && subOf('cle') === 'sturmkrone');
  const extraWp = martialAny && cls.weapons !== 'martial' ? ', Kriegswaffen' : '';
  const arDe = { light: 'leichte', medium: 'mittelschwere', heavy: 'schwere', shield: 'Schilde' };
  c.profText = { armor: [...profArmor].map((a) => arDe[a]).join(', ') || 'keine', weapons: wp + extraWp, tools: bg.tool || '—' };

  /* --- Merkmale --- */
  const fl = [];
  sp.traits(c).forEach(([n, t]) => fl.push({ src: sp.name, n, t, lv: 0 }));
  for (const e of classList) {
    const C = e.C;
    C.feats.filter((f) => f[0] <= e.lvl).forEach(([fl0, n, t]) => fl.push({ src: C.name, n, t, lv: fl0 }));
    if (e.lvl >= 3) { if (!e.subChosen) warn.push('Unterklasse wählen (' + C.name + ').'); e.subFeats.filter((f) => f[0] <= e.lvl).forEach(([fl0, n, t]) => fl.push({ src: e.subName, n, t, lv: fl0 })); }
    if (C.options) {
      const O = C.options, n = O.n(e.lvl); const norm = (k) => { const v = O.list[k]; return v.length === 4 ? { name: v[0], text: v[1] + ': ' + v[2], min: v[3] } : { name: v[0], text: v[1], min: v[2] }; };
      const granted = []; if (e.subGrant && e.lvl >= 3) for (const [gl, ks] of Object.entries(e.subGrant)) if (e.lvl >= +gl) ks.forEach((k) => { if (O.list[k] && !granted.includes(k)) granted.push(k); });
      const chosen = (e.m.opts || []).filter((k) => O.list[k] && norm(k).min <= e.lvl && !granted.includes(k)).slice(0, n);
      chosen.forEach((k) => fl.push({ src: O.label, n: norm(k).name, t: norm(k).text, lv: 0 }));
      granted.forEach((k) => fl.push({ src: O.label + ' (' + e.subName + ')', n: norm(k).name, t: norm(k).text, lv: 3 }));
      if (chosen.length < n) warn.push(O.label + ': noch ' + (n - chosen.length) + ' wählen.');
      (c.optSets = c.optSets || []).push({ cls: e.id, label: O.label, key: O.key, n, chosen, granted, use: chosen.concat(granted), path: e.primary ? 'opts' : 'multi.' + e.idx + '.opts', lvl: e.lvl, items: Object.keys(O.list).map((k) => Object.assign({ k }, norm(k))) });
    }
    const o = e.m.order;
    if (C.order && o && C.order.opts[o]) fl.push({ src: C.name, n: C.order.label + ': ' + C.order.opts[o][0], t: C.order.opts[o][1], lv: 1 });
    if (C.order && !o) warn.push(C.order.label + ' wählen' + (e.primary ? '' : ' (' + C.name + ')') + '.');
    if (e.id === 'dru' && e.lvl >= 3 && e.subId === 'land') { const ld = LAND[e.m.land || 'temperate'] || LAND.temperate; fl.push({ src: e.subName, n: 'Landschaft: ' + ld.name, t: 'Resistenz ab Stufe 10: ' + ld.dmg + '.', lv: 3 }); }
  }
  c.feats.forEach((x) => fl.push({ src: x.src, n: x.f.name, t: x.f.text, lv: 0, feat: true }));
  if (lv('wlk')) {
    const n = CLASSES.wlk.invocations(lv('wlk')); const inv = (ch.invocations || []).filter((k) => INVOCATIONS[k]).slice(0, n);
    inv.forEach((k) => fl.push({ src: 'Anrufung', n: INVOCATIONS[k][0], t: INVOCATIONS[k][1], lv: 0 }));
    if (inv.length < n) warn.push('Anrufungen: noch ' + (n - inv.length) + ' wählen.');
    c.invN = n;
  }
  homebrew.filter((h) => h.kind !== 'spell').forEach((h) => fl.push({ src: h.kind === 'item' ? 'Gegenstand' : 'Hausregel', n: h.name, t: h.text || '', lv: 0, hb: true }));
  c.features = fl;

  /* --- Ressourcen --- */
  let res = []; for (const e of classList) if (e.C.res) res = res.concat(e.C.res(e.lvl, c));
  if (sp.res) res = res.concat(sp.res(c).map((r) => Object.assign({ species: true }, r)));
  homebrew.forEach((h) => { if (+h.uses) res.push({ k: 'hb_' + h.id, n: h.name, max: +h.uses, reset: h.reset || 'long' }); });
  c.feats.forEach((x) => { const u = x.f.uses; if (u) res.push({ k: 'ft_' + (x.slot === 'asi' ? 'asi' + x.lv : x.slot) + '_' + x.id, n: u.name || x.f.name, max: u.n === 'pb' ? pb : u.n, reset: u.reset }); });

  /* --- Zauber (auch Multiclassing) --- */
  const casters = classList.filter((e) => e.C.caster);
  const sc = { has: casters.length > 0, classes: [] };
  let casterLvl = 0; casters.forEach((e) => { if (e.C.caster === 'full') casterLvl += e.lvl; if (e.C.caster === 'half') casterLvl += Math.ceil(e.lvl / 2); });
  sc.slots = casterLvl ? FULL_SLOTS[Math.min(20, casterLvl)].slice() : [];
  if (lv('wlk')) sc.pact = pactSlots(lv('wlk'));
  const known = (id) => !!getSpell(id, hb);
  const many = casters.length > 1;
  for (const e of casters) {
    const C = e.C, a = C.ability, el = e.lvl, src = e.primary ? ch : e.m;
    const info = { id: e.id, name: C.name, primary: e.primary, ability: a, mod: c.mod[a], path: e.primary ? '' : 'multi.' + e.idx + '.' };
    info.dc = 8 + pb + c.mod[a] + (+ch.misc.dc || 0) + homebrew.reduce((s, h) => s + (+h.dc || 0), 0);
    info.atk = pb + c.mod[a] + (+ch.misc.atk || 0) + homebrew.reduce((s, h) => s + (+h.atk || 0), 0);
    info.dcParts = ['8', 'Übung ' + sgn(pb), AB_K[a] + ' ' + sgn(c.mod[a])].concat(+ch.misc.dc ? ['Sonstiges ' + sgn(+ch.misc.dc)] : []).concat(homebrew.filter((h) => +h.dc).map((h) => h.name + ' ' + sgn(+h.dc)));
    info.atkParts = ['Übung ' + sgn(pb), AB_K[a] + ' ' + sgn(c.mod[a])].concat(+ch.misc.atk ? ['Sonstiges ' + sgn(+ch.misc.atk)] : []).concat(homebrew.filter((h) => +h.atk).map((h) => h.name + ' ' + sgn(+h.atk)));
    info.maxLvl = C.caster === 'pact' ? pactSlots(el).lvl : C.caster === 'half' ? FULL_SLOTS[Math.ceil(el / 2)].length : FULL_SLOTS[el].length;
    info.cantripN = (C.cantrips ? C.cantrips(el) : 0) + ((e.id === 'cle' && src.order === 'thaumaturge') || (e.id === 'dru' && src.order === 'magician') ? 1 : 0);
    info.prepN = C.prepared(el);
    const always = new Set();
    for (const [al, list] of Object.entries(C.always || {})) if (el >= +al) list.forEach((s) => always.add(s));
    if (e.subSpells && el >= 3) for (const [al, list] of Object.entries(e.subSpells)) if (el >= +al) list.forEach((s) => always.add(s));
    if (e.id === 'dru' && el >= 3 && e.subId === 'land') for (const [al, list] of Object.entries((LAND[src.land || 'temperate'] || LAND.temperate).sp)) if (el >= +al) list.forEach((s) => always.add(s));
    info.always = [...always];
    info.list = spellList(e.id, hb, e.id === 'brd' && el >= 10);
    info.cantrips = (src.cantrips || []).filter(known).filter((id) => !always.has(id));
    info.prepared = (src.spells || []).filter(known).filter((id) => !always.has(id));
    const tag = many ? ' (' + C.name + ')' : '';
    if (info.cantrips.length < info.cantripN) warn.push('Zaubertricks' + tag + ': ' + info.cantrips.length + ' von ' + info.cantripN + ' gewählt.');
    if (info.cantrips.length > info.cantripN) warn.push('Zu viele Zaubertricks' + tag + ' (' + info.cantrips.length + '/' + info.cantripN + ').');
    if (info.prepared.length < info.prepN) warn.push('Vorbereitete Zauber' + tag + ': ' + info.prepared.length + ' von ' + info.prepN + '.');
    if (info.prepared.length > info.prepN) warn.push('Zu viele vorbereitete Zauber' + tag + ' (' + info.prepared.length + '/' + info.prepN + ').');
    if (e.id === 'wlk') { info.arcanum = [6, 7, 8, 9].filter((g) => el >= { 6: 11, 7: 13, 8: 15, 9: 17 }[g]); const arc = src.arcanum || {}; info.arcanum.forEach((g) => { if (arc[g]) res.push({ k: 'arc' + g, n: 'Arkanum: ' + (getSpell(arc[g], hb) || {}).name, max: 1, reset: 'long' }); }); }
    sc.classes.push(info);
  }
  if (sc.has) { const f = sc.classes[0]; Object.assign(sc, { ability: f.ability, mod: f.mod, dc: f.dc, atk: f.atk, maxLvl: f.maxLvl, cantripN: f.cantripN, prepN: f.prepN, always: f.always, list: f.list, cantrips: f.cantrips, prepared: f.prepared, arcanum: f.arcanum }); }
  sc.byId = {}; for (const info of sc.classes) for (const id of info.always.concat(info.cantrips, info.prepared)) if (!sc.byId[id]) sc.byId[id] = info;
  /* Zusatzzauber aus Spezies und Magie-Eingeweihter */
  const extra = [];
  if (sp.spells) { const ab = ch.speciesSpellAbility || 'wis'; sp.spells(c).forEach((id) => { extra.push({ id, src: sp.name, ab }); const s = getSpell(id, hb); if (s && s.lvl > 0) res.push({ k: 'sp_' + id, n: s.name + ' (' + sp.name + ')', max: 1, reset: 'long', species: true }); }); }
  c.feats.forEach((x) => { if (x.f.mi) { const m = ch.mi[x.slot === 'asi' ? 'asi' + x.lv : x.slot] || {}; const ab = m.ability || 'wis'; (m.cantrips || []).slice(0, x.f.miC || 2).forEach((id) => extra.push({ id, src: x.f.name, ab })); if (m.spell && x.f.miSpell !== false) { extra.push({ id: m.spell, src: x.f.name, ab }); res.push({ k: 'mi_' + (x.slot === 'asi' ? 'asi' + x.lv : x.slot), n: (getSpell(m.spell, hb) || {}).name + ' (gratis)', max: 1, reset: 'long' }); } if ((m.cantrips || []).length < (x.f.miC || 2) || (x.f.miSpell !== false && !m.spell)) warn.push(x.f.name + ': Zauber wählen.'); } });
  c.extraSpells = extra.map((e) => Object.assign(e, { dc: 8 + pb + c.mod[e.ab], atk: pb + c.mod[e.ab] }));
  sc.anything = sc.has || extra.length > 0;
  c.spell = sc;
  c.res = res;

  /* --- Angriffe --- */
  const maDie = lv('mon') ? 'W' + step(6, [[5, 8], [11, 10], [17, 12]])(lv('mon')) : null;
  const archery = c.feats.some((x) => x.f.archery);
  const rageDmg = lv('bar') ? step(2, [[9, 3], [16, 4]])(lv('bar')) : 0;
  c.rageDmg = rageDmg;
  const atkMisc = (+ch.misc.atk || 0);
  const att = [];
  const isMonk = !!lv('mon') && ar.type === 'none' && !ch.shield; c.martialArts = isMonk;
  const unarmedAb = isMonk && c.mod.dex > c.mod.str ? 'dex' : 'str';
  att.push({ name: 'Waffenloser Schlag', ab: unarmedAb, die: isMonk ? '1' + maDie : '', atkParts: [AB_K[unarmedAb] + ' ' + sgn(c.mod[unarmedAb]), 'Übung ' + sgn(pb)].concat(+ch.misc.atk ? ['Sonstiges ' + sgn(+ch.misc.atk)] : []), dmgParts: isMonk ? ['1' + maDie, AB_K[unarmedAb] + ' ' + sgn(c.mod[unarmedAb])] : ['1 + STÄ ' + sgn(c.mod.str)], dmod: isMonk ? c.mod[unarmedAb] : Math.max(0, 1 + c.mod.str), gwf: false, light: false, finesse: false, ranged: false, atk: c.mod[unarmedAb] + pb + (+ch.misc.atk || 0), dmg: isMonk ? '1' + maDie + sgn(c.mod[unarmedAb]).replace('+0', '').replace('−0', '') : String(Math.max(1, 1 + c.mod.str)), dtype: 'Wucht', props: '', melee: true, prof: true });
  const masteryAny = classList.some((e) => e.C.mastery);
  const thrownAtt = []; const shillOn = !!((ch.play || {}).fx || {}).shill; const shillAb = ((c.extraSpells || []).find((e) => e.id === 'shillelagh') || {}).ab || (lv('dru') ? 'wis' : lv('wlk') ? 'cha' : 'wis');
  (ch.weapons || []).forEach((w, i) => {
    const W = WEAPONS[w.w]; if (!W) return;
    const [n, cat, kind, die, dt, props, mas, range, vers] = W;
    const ranged = kind === 'ranged';
    const monkW = isMonk && !ranged && (cat === 's' || props.includes('light'));
    let ab = ranged ? 'dex' : props.includes('finesse') || monkW ? (c.mod.dex > c.mod.str ? 'dex' : 'str') : 'str';
    if (lv('ma') && ['hcrossbow', 'hvcrossbow', 'lcrossbow', 'pistol', 'musket'].includes(w.w) && c.mod.int > c.mod[ab]) ab = 'int';
    if (lv('bw') >= 3 && subOf('bw') === 'battle' && c.mod.con > c.mod[ab]) ab = 'con';
    if (lv('wlk') >= 3 && subOf('wlk') === 'shadowblade' && !ranged && c.mod.cha > c.mod[ab]) ab = 'cha';
    if (lv('fk') >= 3 && subOf('fk') === 'blade' && !ranged && c.mod.cha > c.mod[ab]) ab = 'cha';
    if (lv('bw') >= 2 && optsOf('bw').includes('klinge') && cat === 's' && c.mod.con > c.mod[ab]) ab = 'con';
    if (w.ab && w.ab !== 'auto') ab = w.ab;
    const shill = shillOn && (w.w === 'club' || w.w === 'quarterstaff'); if (shill) ab = shillAb;
    const martialOk = martialAny || (lv('wlk') >= 3 && subOf('wlk') === 'shadowblade') || (lv('brd') >= 3 && subOf('brd') === 'klingentakt' && w.w === 'scimitar') || (lv('bw') >= 3 && subOf('bw') === 'battle') || (lv('ma') >= 3 && subOf('ma') === 'combat') || classList.some((e) => (e.C.extraWeapons || []).includes(w.w));
    const p = cat === 's' || martialOk || (cls.weapons === 'monk' && props.includes('light')) || (cls.weapons === 'rogue' && (props.includes('finesse') || props.includes('light')));
    const bonus = Math.max(+w.bonus || 0, typeof itemWpn === 'function' ? itemWpn(ch, i) : 0);
    const gun = lv('ma') >= 17 && ['hcrossbow', 'hvcrossbow', 'lcrossbow', 'pistol', 'musket'].includes(w.w) ? 1 : 0;
    const ewB = ((ch.play || {}).fx || {}).ewpn ? (+(ch.play.fx.ewpn_L) >= 7 ? 3 : +(ch.play.fx.ewpn_L) >= 5 ? 2 : 1) : 0;
    const atk = c.mod[ab] + (p ? pb : 0) + bonus + (archery && ranged ? 2 : 0) + atkMisc + gun + ewB;
    let d = die;
    if (monkW && DIE_MAX(die) < DIE_MAX('1' + maDie) && die.startsWith('1')) d = '1' + maDie;
    if (shill) d = L >= 17 ? '2W6' : '1W' + (L >= 11 ? 12 : L >= 5 ? 10 : 8);
    const dm = c.mod[ab] + bonus;
    const ds = (x) => x + (dm ? sgn(dm) : '');
    const atkParts = [AB_K[ab] + ' ' + sgn(c.mod[ab])].concat(ewB ? ['Elementarwaffe +' + ewB] : []).concat(p ? ['Übung ' + sgn(pb)] : ['keine Übung']).concat(bonus ? ['magisch ' + sgn(bonus)] : []).concat(archery && ranged ? ['Bogenschiessen +2'] : []).concat(atkMisc ? ['Sonstiges ' + sgn(atkMisc)] : []).concat(gun ? ['Perfektionierte Technik +1'] : []);
    const dmgParts = [d].concat(dm ? [AB_K[ab] + (bonus ? ' + magisch' : '') + ' ' + sgn(dm)] : []);
    const A = { atkParts, dmgParts, name: n + (bonus ? ' +' + bonus : '') + (shill ? ' (Shillelagh)' : ''), idx: i, ab, atk, die: d, vers: vers || null, dmod: dm, gwf: !ranged && (props.includes('two') || props.includes('versatile')), twoOnly: props.includes('two'), light: props.includes('light'), finesse: props.includes('finesse'), ranged, dmg: ds(d), dmg2: vers ? ds(vers) : null, dtype: DT[dt], prof: p,
      props: props.map((x) => PROP_DE[x]).join(', ') + (range ? ' (' + range + ' m)' : ''), mastery: masteryAny && w.mastery ? mas : null, melee: !ranged, rage: rageDmg && ab === 'str' && !ranged && ar.type !== 'heavy', shill };
    if (shill) { A.dtype = A.dtype + ' oder Energie'; A.vers = null; A.dmg2 = null; }
    att.push(A);
    if (!ranged && props.includes('thrown')) thrownAtt.push(Object.assign({}, A, { name: A.name + ' (geworfen)', ranged: true, melee: false, gwf: false, vers: null, dmg2: null, thrown: true, props: 'Wurfwaffe' + (range ? ' (' + range + ' m)' : ''), rage: rageDmg && ab === 'str' && ar.type !== 'heavy' }));
    if (!p) warn.push('Keine Übung mit ' + n + ' – kein Übungsbonus auf den Angriff.');
  });
  thrownAtt.forEach((x) => att.push(x));
  if (masteryAny) { const mN = Math.max(...classList.filter((e) => e.C.mastery).map((e) => e.C.mastery(e.lvl))); c.masteryN = mN; const used = (ch.weapons || []).filter((w) => w.mastery).length; if (used > mN) warn.push('Zu viele Waffenmeisterschaften (' + used + '/' + mN + ').'); }
  c.attacks = att;
  const wsF = ch.play && ch.play.ws && typeof BESTIARY !== 'undefined' ? BESTIARY[ch.play.ws] : null;
  if (wsF) {
    c.wsForm = wsF[0]; c.ac = wsF[2]; c.acParts = [wsF[0] + ' (Tiergestalt) ' + wsF[2]]; c.speed = parseFloat(String(wsF[5]).replace(',', '.')) || c.speed; c.speedText = wsF[5];
    c.attacks = wsF[7].map(([n, b, dmg, t]) => { const m = /^(\d+W\d+)\s*([+−-]\s*\d+)?/.exec(String(dmg)); return { name: wsF[0] + ': ' + n, ab: 'str', atk: +b, die: m ? m[1] : '', dmod: m && m[2] ? +m[2].replace(/\s/g, '').replace('−', '-') : 0, dmg: String(dmg), dtype: t || '', melee: true, ranged: false, atkParts: [wsF[0] + ' ' + sgn(+b)], dmgParts: [String(dmg)], props: 'Tiergestalt', prof: true, ws: true }; });
    c.notes.push('Tiergestalt ' + wsF[0] + ': RK, Bewegung, Angriffe sowie STÄ, GES und KON der Tierform; deine Übungen, TP, INT, WEI und CHA bleiben. Keine Zauber.' + (wsS ? ' Sinne/Merkmale: ' + wsS.senses + '.' : ''));
  }
  c.sneak = lv('rog') ? Math.ceil(lv('rog') / 2) + 'W6' : null;
  c.attacksPer = Math.max(lv('fig') ? step(1, [[5, 2], [11, 3], [20, 4]])(lv('fig')) : 1, ['bar', 'mon', 'pal', 'ran', 'rk', 'fk', 'ma'].some((k) => lv(k) >= 5) || (lv('bw') >= 6 && subOf('bw') === 'battle') ? 2 : 1, lv('ma') >= 18 && subOf('ma') === 'combat' ? 3 : 1);
  c.classDC = []; const dcOf = (a) => 8 + pb + c.mod[a];
  if (lv('rk')) c.classDC.push(['Runen-SG', dcOf('int')]); if (lv('bw')) c.classDC.push(['Blut-SG', dcOf('con')], ['Blutangriff', sgn(pb + c.mod.con)]); if (lv('fk')) c.classDC.push(['Fluch-SG', dcOf('cha') + (lv('fk') >= 3 && subOf('fk') === 'judge' ? 1 : 0)]); if (lv('ma')) c.classDC.push(['Geräte-SG', dcOf('int') + (lv('ma') >= 17 ? 1 : 0)]);
  if (lv('bw')) { const n = step(1, [[5, 2], [11, 3], [17, 4]])(L); const add = (ch.opts || []).includes('stark') || ((multi.find((m) => m.cls === 'bw') || {}).opts || []).includes('stark') ? c.mod.con : 0; att.push({ name: 'Blutlanze' + (n > 1 ? ' (' + n + ' Strahlen)' : ''), ab: 'con', atk: pb + c.mod.con, die: '1W10', dmod: add, dmg: '1W10' + (add ? sgn(add) : ''), dtype: 'Nekrotisch', props: '18 m · Magieaktion', melee: false, ranged: true, prof: true }); }
  c.critRange = lv('fig') >= 3 && subOf('fig') === 'champion' ? (lv('fig') >= 15 ? 18 : 19) : 20;
  const mk = Math.min(lv('fk') >= 18 && subOf('fk') === 'blade' ? 18 : lv('fk') >= 3 ? 19 : 20, lv('rog') >= 17 && subOf('rog') === 'duellant' ? 19 : 20, lv('pal') >= 20 && subOf('pal') === 'unnachgiebig' ? 18 : 20);
  c.critMark = mk < c.critRange ? mk : null; c.critMarkLabel = lv('fk') >= 3 ? 'markiertes Ziel' : lv('rog') >= 17 ? 'herausgefordertes Ziel' : 'gezeichnetes Ziel';
  /* Zusätzlicher Schaden (einmal pro Zug), im Trefferdialog wählbar */
  const xd = []; const die = (l) => +RW_DIE(l).slice(1);
  if (lv('fk')) xd.push({ k: 'fkmark', label: 'Fluchmarke', n: 1, s: die(lv('fk')), note: 'nekrotisch/psychisch' });
  if (lv('fk') >= 18 && subOf('fk') === 'shadow') xd.push({ k: 'fkend', label: 'Jagdende (Ziel ≤ halbe TP)', n: 3, s: die(lv('fk')) });
  if (lv('bw') >= 2) xd.push({ k: 'bwfaden', label: 'Roter Faden', n: 1, s: die(lv('bw')), note: 'nekrotisch' });
  if (lv('bw') >= 3 && subOf('bw') === 'battle') xd.push({ k: 'bwkrieg', label: 'Kriegsblut (1 Blutladung)', n: 2, s: die(lv('bw')), res: 'blood', note: 'nekrotisch' });
  if (lv('rk') >= 3 && subOf('rk') === 'war') xd.push({ k: 'rkklinge', label: 'Runenklinge', n: lv('rk') >= 18 ? 3 : 1, s: die(lv('rk')) });
  if (lv('rk') >= 11) xd.push({ k: 'rkschlag', label: 'Runenschlag', n: 1, s: die(lv('rk')), note: 'Energie' });
  if (lv('ma') >= 6 && subOf('ma') === 'combat') xd.push({ k: 'mamod', label: 'Waffenmodifikation', n: 1, s: 6 });
  if (lv('wlk') >= 3 && subOf('wlk') === 'shadowblade') xd.push({ k: 'smal', label: 'Schattenmal', n: 1, s: lv('wlk') >= 10 ? 8 : 6, note: 'nekrotisch' });
  /* weitere ✦-Unterklassen */
  if (lv('brd') >= 3 && subOf('brd') === 'klingentakt') xd.push({ k: 'takt', label: 'Rhythmuswechsel (1 Taktpunkt)', n: 1, s: 6, res: 'takt' });
  if (lv('fig') >= 3 && subOf('fig') === 'feldkunst') xd.push({ k: 'taktik', label: 'Schwachstelle (1 Taktikpunkt)', n: 1, s: 8, res: 'taktik' });
  if (lv('fig') >= 3 && subOf('fig') === 'arkanklinge') xd.push({ k: 'arkan', label: 'Zeichen der Schneide', n: 1, s: 6, note: 'Energie' });
  if (lv('pal') >= 3 && subOf('pal') === 'unnachgiebig') xd.push({ k: 'schuld', label: 'Schuldspruch', n: 0, s: 0, flat: pb });
  if (lv('pal') >= 3 && subOf('pal') === 'hain') xd.push({ k: 'sommer', label: 'Sommer-Aura', n: 1, s: 4, note: 'Feuer' });
  if (lv('ran') >= 11 && subOf('ran') === 'daemmer') xd.push({ k: 'zschatten', label: 'Zweiter Schatten (Ziel sah dich nicht)', n: 2, s: 8 });
  if (lv('ran') >= 3 && subOf('ran') === 'wildbund') xd.push({ k: 'zusammen', label: 'Zusammenspiel', n: 1, s: 6 });
  if (lv('cle') >= 3 && subOf('cle') === 'esse') xd.push({ k: 'glut', label: 'Glutsegen', n: 1, s: 4, note: 'Feuer' });
  if (lv('rog') >= 17 && subOf('rog') === 'duellant') xd.push({ k: 'hafen', label: 'Klinge des Hafens (herausgefordert)', n: 3, s: 6 });
  if (lv('rog') >= 17 && subOf('rog') === 'trugbild') xd.push({ k: 'trugm', label: 'Meister des Trugs', n: 4, s: 6 });
  if (lv('ran') >= 3 && subOf('ran') === 'hunter') xd.push({ k: 'colossus', label: 'Kolossjäger (verletztes Ziel)', n: 1, s: 8 });
  if (lv('ran') >= 3 && subOf('ran') === 'stormh') xd.push({ k: 'bolt', label: 'Blitzschuss', n: 1, s: lv('ran') >= 11 ? 8 : 6, note: 'Blitz' });
  if (lv('cle') >= 7) xd.push({ k: 'dstrike', label: 'Göttlicher Schlag', n: lv('cle') >= 14 ? 2 : 1, s: 8, note: 'gleissend/nekrotisch' });
  if (lv('dru') >= 7) xd.push({ k: 'pstrike', label: 'Urtümlicher Schlag', n: lv('dru') >= 15 ? 2 : 1, s: 8, note: 'elementar' });
  if (lv('bar') >= 9) xd.push({ k: 'brutal', label: 'Brutaler Schlag (ohne Vorteil)', n: lv('bar') >= 17 ? 2 : 1, s: 10 });
  if (lv('bar') >= 3 && subOf('bar') === 'berserker') xd.push({ k: 'frenzy', label: 'Raserei (Tollkühn im Kampfrausch)', n: rageDmg, s: 6 });
  if (ch.species === 'goliath' && ch.speciesChoice === 'fire') xd.push({ k: 'gfire', label: 'Feuerriese', n: 1, s: 10, res: 'giant', note: 'Feuer' });
  if (ch.species === 'goliath' && ch.speciesChoice === 'frost') xd.push({ k: 'gfrost', label: 'Frostriese', n: 1, s: 6, res: 'giant', note: 'Kälte' });
  if ((ch.invocations || []).includes('lifedrinker') && lv('wlk') >= 9) xd.push({ k: 'lifedr', label: 'Lebenstrinker (Paktwaffe)', n: 1, s: 6 });
  c.dmgExtras = xd;
  /* Hinweise auf Regelkonflikte */
  const hints = [];
  if (lv('mon') && (ar.type !== 'none' || ch.shield)) hints.push('Mönch mit ' + (ar.type !== 'none' ? 'Rüstung' : 'Schild') + ': Ungerüstete Verteidigung, Ungerüstete Bewegung und Kampfkunst wirken nicht.');
  if (lv('bar') && ar.type === 'heavy') hints.push('Barbar in schwerer Rüstung: Kampfrausch-Vorteile und Ungerüstete Verteidigung wirken nicht.');
  if (lv('bar') && ch.play && ch.play.raging && ch.play.conc) hints.push('Im Kampfrausch kannst du dich nicht konzentrieren – ' + ch.play.conc.name + ' endet eigentlich.');
  if (ar.type !== 'none' && lv('bar') && !lv('mon')) { const ud = 10 + c.mod.dex + c.mod.con; if (ud > c.ac - (ch.shield ? 2 + (+ch.shieldBonus || 0) : 0)) hints.push('Ohne Rüstung hättest du mit Ungerüsteter Verteidigung eine höhere RK (' + (ud + (ch.shield ? 2 + (+ch.shieldBonus || 0) : 0)) + ').'); }
  if (ch.mageArmor && ar.type !== 'none') hints.push('Magierrüstung wirkt nur ohne Rüstung.');
  if (c.armorNonProf) hints.push('Rüstung ohne Übung: Nachteil auf STÄ- und GES-Würfe sowie Angriffe, und du kannst keine Zauber wirken.');
  if (heavy && ar.str && abil.str < ar.str) hints.push(ar.name + ' braucht Stärke ' + ar.str + ' – Bewegung −3 m.');
  if (typeof itemList === 'function' && itemList(ch).some((x) => (MAGIC_ITEMS[x.id] || {}).acBare && x.att) && (ar.type !== 'none' || ch.shield)) hints.push('Armschienen der Verteidigung wirken nur ohne Rüstung und ohne Schild.');
  if (c.feats.some((x) => x.id === 'fs-gwf') && !(ch.weapons || []).some((w) => WEAPONS[w.w] && (WEAPONS[w.w][5].includes('two') || WEAPONS[w.w][5].includes('versatile')))) hints.push('Kampf mit grossen Waffen nützt nur mit zweihändigen oder vielseitigen Nahkampfwaffen.');
  if (c.feats.some((x) => x.id === 'fs-twf') && (ch.weapons || []).filter((w) => WEAPONS[w.w] && WEAPONS[w.w][5].includes('light')).length < 2) hints.push('Kampf mit zwei Waffen braucht zwei leichte Waffen.');
  if (c.feats.some((x) => x.id === 'fs-defense') && ar.type === 'none') hints.push('Kampfstil Verteidigung wirkt nur mit Rüstung.');
  c.hints = hints;
  return c;
}

function getSpell(id, hb) {
  if (!id) return null;
  if (id.startsWith('hb:')) { const h = (hb || {})[id.slice(3)]; return h && h.kind === 'spell' ? { id, name: h.name, en: 'Hausregel', lvl: +h.lvl || 0, school: h.school || 'evo', classes: h.classes || [], time: h.time || 'Aktion', range: h.range || '—', comp: h.comp || '—', dur: h.dur || 'Sofort', text: h.text || '', conc: !!h.conc, ritual: !!h.ritual, home: true } : null; }
  return SPELLS[id] || null;
}
/* Sortierte Liste aller Zauber; wird pro Zustand der Hausregel-Zauber nur einmal gebaut (frühere Fassung sortierte bei jedem Aufruf neu) */
let ALLSP = { key: null, list: [] };
function allSpells(hb) {
  const hs = Object.values(hb || {}).filter((h) => h.kind === 'spell'); const key = Object.keys(SPELLS).length + '|' + (hs.length ? JSON.stringify(hs) : '');
  if (ALLSP.key !== key) { const out = Object.values(SPELLS).concat(hs.map((h) => getSpell('hb:' + h.id, hb))); ALLSP = { key, list: out.sort((a, b) => a.lvl - b.lvl || COLL_DE.compare(a.name, b.name)) }; }
  return ALLSP.list.slice();
}
function spellList(clsId, hb, secrets) {
  if (clsId === 'any') return allSpells(hb);
  const ok = secrets ? ['brd', 'cle', 'dru', 'wiz'] : [clsId];
  return allSpells(hb).filter((s) => s.classes.some((k) => ok.includes(k)));
}

/* Würfel: "2W6+3" */
function rollExpr(expr) {
  const e = String(expr).replace(/\s/g, '').replace(/−/g, '-').replace(/[dD]/g, 'W');
  let total = 0; const parts = []; const groups = [];
  const re = /([+-]?)(\d*)W(\d+)|([+-]?)(\d+)/g; let m;
  while ((m = re.exec(e))) {
    if (m[3]) { const n = +(m[2] || 1), s = +m[3], sign = m[1] === '-' ? -1 : 1; const r = []; for (let i = 0; i < n; i++) r.push(1 + Math.floor(rnd() * s)); total += sign * r.reduce((a, b) => a + b, 0); parts.push((sign < 0 ? '−' : '') + n + 'W' + s + '[' + r.join(',') + ']'); groups.push({ sides: s, rolls: r, sign }); }
    else if (m[5]) { const v = (m[4] === '-' ? -1 : 1) * +m[5]; total += v; parts.push(sgn(v)); }
  }
  return { total, detail: parts.join(' '), groups };
}
if (typeof module !== 'undefined') module.exports = { derive, newChar, rollExpr, getSpell, spellList };
