/* ---------- Abläufe mit Zwischenschritt (Regeln wie am Tisch) ----------
   1. Zustände durch Rettungswurf (Person festhalten, Betäubender Schlag, Packen …): erst Ausgang, dann Zustand aufs Ziel.
   2. Gegnerangriff gegen Helden: Zustand des Ziels (liegend, gelähmt, ausweichend …) → Vorteil/Nachteil, Kritisch in 1,5 m.
   3. Treffer beim Helden: Reaktionen (Schild, Unglaubliches Ausweichen), Resistenz-Hinweis, Zusatzeffekt des Angriffs (Rettungswurf oder gepackt).
   4. Rettungswurf-Anforderung: Entrinnen (Schurke/Mönch 7), Zusatzeffekt bei Misserfolg. */
const AB_KEY = { 'STÄ': 'str', 'GES': 'dex', 'KON': 'con', 'INT': 'int', 'WEI': 'wis', 'CHA': 'cha' };
const COND_WORD = [[/gelähmt/, 'paralyzed'], [/vergiftet/, 'poisoned'], [/liegend|liegt\b|umgeworfen/, 'prone'], [/festgesetzt/, 'restrained'], [/bewusstlos/, 'unconscious'], [/\bblind/, 'blinded'], [/verängstigt/, 'frightened'], [/betäubt/, 'stunned'], [/bezaubert/, 'charmed'], [/gepackt|\bpackt?\b|packen/, 'grappled'], [/kampfunfähig/, 'incapacitated'], [/\btaub\b/, 'deafened']];
const condsIn = (t) => COND_WORD.filter(([re]) => re.test(String(t || ''))).map(([, k]) => k);
const condNames = (l) => (l || []).filter((k) => COND[k]).map((k) => COND[k].name).join(', ');
const condKeyOf = (name) => Object.keys(COND).find((k) => COND[k].name === name);

/* Zauber ohne Schaden, deren Wirkung ein misslungener Rettungswurf auslöst: [Zustände, Wirkung bei Misserfolg] */
const SPELL_COND = {
  'hold-person': [['paralyzed'], 'Wiederholung am Ende jedes seiner Züge'], 'hold-monster': [['paralyzed'], 'Wiederholung am Ende jedes seiner Züge'],
  'sleep': [['incapacitated'], 'am Ende seines nächsten Zuges erneuter Rettungswurf, sonst bewusstlos'], 'color-spray': [['blinded'], 'bis zum Ende deines nächsten Zuges'],
  'stinking-cloud': [['poisoned'], 'ohne Aktion, solange es in der Wolke ist'], 'grease': [['prone'], ''], 'hideous-laughter': [['prone', 'incapacitated'], 'Wiederholung am Zugende und bei Schaden mit Vorteil'],
  'command': [[], 'gehorcht dem Befehl im nächsten Zug'], 'faerie-fire': [[], 'leuchtet: Angriffe gegen es haben Vorteil, nicht unsichtbar'],
  'slow': [[], 'halbe Bewegung, −2 RK und GES-Rettungswürfe, keine Reaktionen'], 'bane': [[], '−1W4 auf Angriffs- und Rettungswürfe'],
  'irresistible-dance': [[], 'tanzt: Nachteil auf GES-Rettungswürfe und Angriffe, Angriffe gegen es mit Vorteil'], 'blindness-deafness': [['blinded'], 'oder taub (du wählst)'],
  'fear': [['frightened'], 'muss fliehen'], 'entangle': [['restrained'], ''], 'web': [['restrained'], ''], 'charm-person': [['charmed'], ''], 'charm-monster': [['charmed'], ''],
  'dominate-person': [['charmed'], 'du lenkst es'], 'dominate-monster': [['charmed'], 'du lenkst es'], 'dominate-beast': [['charmed'], 'du lenkst es'],
  'hypnotic-pattern': [['charmed', 'incapacitated'], 'Bewegungsrate 0'], 'banishment': [['incapacitated'], 'verbannt'], 'flesh-to-stone': [['restrained'], 'am Zugende erneut, nach 3 Fehlschlägen versteinert'],
  'suggestion': [['charmed'], 'folgt dem Vorschlag'], 'geas': [['charmed'], ''], 'confusion': [[], 'handelt verwirrt'], 'eyebite': [[], 'eingeschlafen, verängstigt oder krank (du wählst)'], 'polymorph': [[], 'verwandelt'],
  'enthrall': [[], '−10 auf Wahrnehmung, auch passiv'], 'true-polymorph': [[], 'verwandelt']
};
/* Ziel wird beim Auslösen festgehalten (o.tgt) – ein späterer Zielwechsel ändert nichts mehr */
const tgtNpc = (k) => (typeof onlineFight === 'function' && onlineFight() && k && k.startsWith('n:') ? ((S.combat && S.combat.npcs) || []).find((x) => 'n:' + x.id === k) : null);

/* ---- 1. Zustand durch Rettungswurf ---- */
function saveCond(o) {
  if (o.tgt === undefined) o.tgt = S.tgt || ''; S.sc = o; const n = tgtNpc(o.tgt); const what = [condNames(o.conds), o.fx].filter(Boolean).join(' · ') || 'die Wirkung tritt ein';
  orbPrompt('<div class="pr svp"><b>' + esc(o.label) + ': ' + esc(o.ab) + '-Rettungswurf SG ' + o.dc + '</b>' +
    '<p>Zuerst würfelt ' + (n ? esc(n.name) : 'das Ziel') + '. Misslungen: ' + esc(what) + '.' + (o.okFx ? ' Geschafft: ' + esc(o.okFx) + '.' : '') + ' ' + slTag() + '</p>' +
    '<div class="chips end"><button class="btn ghost" data-act="scRes" data-arg="ok">Geschafft</button><button class="btn" data-act="scRes" data-arg="fail">Misslungen' + (o.conds && o.conds.length ? ' – ' + esc(condNames(o.conds)) : '') + '</button></div>' +
    '<div class="chips end svx"><button class="link" data-act="scRes" data-arg="multi">Mehrere Ziele, verschieden</button></div></div>');
}
XA.scRes = (t, a) => {
  const o = S.sc; S.sc = null; orbPrompt(''); if (!o) return; const tail = o.tail ? ' · ' + o.tail : ''; const n = tgtNpc(o.tgt);
  if (a === 'ok') { pushLog({ label: o.label, total: '✓', detail: (n ? n.name + ': ' : '') + o.ab + '-Rettungswurf geschafft' + (o.okFx ? ' – ' + o.okFx : ' – keine Wirkung') + tail, share: true }); return; }
  const what = [condNames(o.conds), o.fx].filter(Boolean).join(' · ');
  if (a === 'multi') { pushLog({ label: o.label, total: '✦', detail: 'Wer den ' + o.ab + '-Rettungswurf (SG ' + o.dc + ') nicht schafft: ' + (what || 'Wirkung tritt ein') + tail, share: true }); return; }
  pushLog({ label: o.label, total: '✗', detail: (n ? n.name : 'Ziel') + ': Rettungswurf misslungen' + (what ? ' – ' + what : '') + tail, share: true });
  if (!n || !S.combat) return;
  /* Zustand am Effekt festmachen, damit er mit dem Zauber endet; ohne Dauer bleibt er, bis die Spielleitung ihn entfernt */
  const c = S.combat; const effects = (c.effects || []).slice(); let hooked = false; const cs = o.conds || [];
  if (o.spell) for (let i = effects.length - 1; i >= 0; i--) if (effects[i].spell === o.spell && effects[i].src === 'p:' + UID && !effects[i].tgt) { effects[i] = Object.assign({}, effects[i], { tgt: o.tgt, conds: cs }); hooked = true; break; }
  if (!hooked && o.dur === 'next' && cs.length) { effects.push({ id: effUid(), name: o.label, src: 'p:' + UID, tgt: o.tgt, left: 1, at: 'start', conds: cs, t: Date.now() }); hooked = true; }
  saveCombat(Object.assign({}, c, { effects, npcs: hooked || !cs.length ? c.npcs : (c.npcs || []).map((x) => (x.id === n.id ? Object.assign({}, x, { cond: [...new Set((x.cond || []).concat(cs))] }) : x)), t: Date.now(), log: clog(c, n.name + ': ' + o.label + (what ? ' – ' + what : '')) }));
};

/* ---- 2. Zustand des Ziels beim Gegnerangriff ---- */
function tgtState(k) {
  let conds = [], dodge = false, name = '';
  if (k === 'me' || k === 'p:' + UID) { const ch = cur(); if (ch) { conds = (ch.play.cond || []).filter((x) => COND[x]); dodge = !!(ch.play.fx || {}).dodge; name = ch.name; } }
  else if (k && k.startsWith('p:')) { const p = (S.table || {})[k.slice(2)] || {}; conds = (p.cond || []).map(condKeyOf).filter(Boolean); dodge = !!p.dodge; name = p.char || ''; }
  const incap = conds.some((x) => ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'].includes(x));
  const adv = conds.filter((x) => ['blinded', 'paralyzed', 'petrified', 'restrained', 'stunned', 'unconscious'].includes(x)).map((x) => COND[x].name);
  const dis = []; if (conds.includes('invisible')) dis.push('Unsichtbar'); if (dodge && !incap) dis.push('weicht aus');
  return { name, adv, dis, prone: conds.includes('prone'), crit5: conds.some((x) => x === 'paralyzed' || x === 'unconscious') };
}
function npcTgtNote(o, btnsOnly) {
  if (!o || !o.tgt) return ''; const s = tgtState(o.tgt); const parts = []; const btn = [];
  if (s.adv.length) parts.push(s.adv.join(', ') + ' → Vorteil');
  if (s.dis.length) parts.push(s.dis.join(', ') + ' → Nachteil');
  if (s.prone) parts.push('liegend → aus 1,5 m Vorteil, weiter weg Nachteil');
  if (s.crit5) parts.push('Treffer aus 1,5 m sind kritisch');
  if (!parts.length) return '';
  const both = s.dis.length && s.adv.length; const can = !o.re && o.nat !== undefined && !o.pair && !both;
  if (can && (s.adv.length || s.prone)) btn.push('<button class="chip" data-act="npcRe" data-arg="adv">Mit Vorteil auswerten</button>');
  if (can && (s.dis.length || s.prone)) btn.push('<button class="chip" data-act="npcRe" data-arg="dis">Mit Nachteil auswerten</button>');
  if (btnsOnly) return btn.join('');
  return '<p class="tgtnote">⚠ ' + esc(s.name) + ': ' + esc(parts.join(' · ')) + (both ? ' – Vorteil und Nachteil heben sich auf.' : '') + '</p>';
}
XA.npcRe = (t, a) => { const o = S.npcA; if (!o || o.re) return; const r2 = 1 + Math.floor(rnd() * 20); const n1 = o.nat; const keep = a === 'adv' ? Math.max(n1, r2) : Math.min(n1, r2);
  o.re = a; o.nat = keep; o.total = keep + (+o.bonus || 0);
  pushLog({ label: o.name + ' (' + (a === 'adv' ? 'Vorteil' : 'Nachteil') + ')', total: o.total, detail: 'zweiter W20 ' + r2 + ' · ' + (a === 'adv' ? 'höherer' : 'niedrigerer') + ' zählt: ' + keep + ' ' + sgn(+o.bonus || 0), crit: keep === 20, fumble: keep === 1, sides: 20, nat: keep, pair: [n1, r2], keep: keep === n1 ? 0 : 1, adv: a === 'adv', share: true });
  setTimeout(npcPrompt, typeof d3fx === 'function' && d3fx() === 'voll' ? 950 : 150); };
XA.npcCrit5 = () => { const o = S.npcA; if (!o) return; o.forceCrit = !o.forceCrit; npcPrompt(); };
XA.npcRider = () => { const o = S.npcA; if (!o) return; o.riderOn = !o.riderOn; npcPrompt(); };

/* Zusatzeffekt eines Monsterangriffs aus dem Merkmalstext: „Klauen: KON-Rettungswurf (SG 10) oder gelähmt“, „Biss packt (SG 13)“ */
function mobRider(mid, atk) {
  const M = BESTIARY[mid]; if (!M || !atk) return null; const sens = String(M[8] || '').split(/\.\s+(?=[A-ZÄÖÜ✦])/);
  const sen = sens.find((s) => s.indexOf(atk) >= 0 && /SG\s*\d+/.test(s)); if (!sen) return null;
  const dc = +(/SG\s*(\d+)/.exec(sen) || [])[1]; const ab = (/(STÄ|GES|KON|INT|WEI|CHA)(?:-Rettungswurf)?[^.]{0,6}SG/.exec(sen) || [])[1];
  const txt = sen.replace(/\.$/, '').trim(); const charge = /Sturmangriff|Anlauf|nach \d/.test(sen);
  if (!ab && /packt|packen/.test(sen)) return { kind: 'grab', dc, conds: ['grappled'].concat(/festgesetzt/.test(sen) ? ['restrained'] : []), txt, charge };
  const fx = (sen.split(/\boder\b/)[1] || '').replace(/\.$/, '').trim();
  return { kind: 'save', ab: ab || 'KON', dc, conds: condsIn((fx || sen).replace(/\([^)]*\)/g, '')), /* Klammern = Sonderfall, entscheidet die SL */ fx: fx || txt.replace(/^[^:]*:\s*/, ''), txt, charge };
}
const riderShort = (r) => r.kind === 'grab' ? 'packt (Entkommen SG ' + r.dc + ')' : r.ab + ' SG ' + r.dc + (r.conds && r.conds.length ? ' · ' + condNames(r.conds) : r.fx ? ' · ' + r.fx.slice(0, 30) : '');

/* ---- 3. Treffer beim eigenen Helden: Reaktionen und Hinweise ---- */
function heroRes(ch, c) {
  const out = []; if (!ch) return out; const P = ch.play || {};
  if (c.lv && c.lv('bar') && P.raging && !c.heavyArmor) out.push(['Wucht', 'Kampfrausch'], ['Stich', 'Kampfrausch'], ['Hieb', 'Kampfrausch']);
  if (ch.species === 'dwarf') out.push(['Gift', 'Zwergische Unverwüstlichkeit']);
  const sp = SPECIES[ch.species]; if (sp && sp.choice && ch.speciesChoice && /\(([^)]+)\)/.test(sp.choice.opts[ch.speciesChoice] || '') && ['dragonborn', 'tiefling'].includes(ch.species)) out.push([/\(([^)]+)\)/.exec(sp.choice.opts[ch.speciesChoice])[1], sp.name]);
  return out;
}
function hasEvasion(c) { return !!(c.lv && (c.lv('rog') >= 7 || c.lv('mon') >= 7)); }
function shieldInfo(ch, c, h) {
  if (!h || h.atk == null || h.nat === 20 || !c.spell || !(c.spell.byId || {}).shield || (ch.play.fx || {}).shield) return null;
  const s = getSpell('shield', S.hb); if (!s) return null; const lv = typeof slotLevels === 'function' ? slotLevels(c, s) : []; const pa = typeof pactAvail === 'function' ? pactAvail(c, s) : 0;
  if (!lv.length && !pa) return null; if (typeof tLeft === 'function' && tLeft(ch, 'r') <= 0) return null;
  return { blocks: h.atk < c.ac + 5, lvl: lv[0], pact: !lv.length && pa ? pa : 0 };
}
function hitExtras(h, ch) {
  let c; try { c = derive(ch, S.hb); } catch (e) { return { html: '', half: '' }; }
  const out = []; let half = '';
  const res = heroRes(ch, c).filter(([t]) => h.dtype && String(h.dtype).toLowerCase().indexOf(t.toLowerCase()) >= 0); if (res.length) half = res[0][1] + ': Resistenz gegen ' + res[0][0];
  const sh = shieldInfo(ch, c, h); if (sh) out.push('<button class="btn sm ghost" data-act="hitShield"' + (sh.blocks ? '' : ' disabled') + ' title="Reaktion: +5 RK bis zu deinem nächsten Zug">🛡 Schild' + (sh.blocks ? ' wehrt ab (RK ' + (c.ac + 5) + ')' : ' reicht nicht') + '</button>');
  if (c.lv && c.lv('rog') >= 5 && (typeof tLeft !== 'function' || tLeft(ch, 'r') > 0) && h.atk != null) out.push('<button class="btn sm ghost" data-act="hitApply" data-arg="0.5" data-uncanny="1" title="Reaktion: Schaden eines Angriffs, den du siehst, halbieren">Unglaubliches Ausweichen (' + Math.floor(h.amount / 2) + ')</button>');
  if (h.rider) out.push('<span class="hint">Danach: ' + esc(riderShort(h.rider)) + '</span>');
  return { html: out.length ? '<div class="chips hitx">' + out.join('') + '</div>' : '', half };
}
XA.hitShield = () => { const h = S.hitPend; const ch = cur(); if (!h || !ch) return; const c = derive(ch, S.hb); const sh = shieldInfo(ch, c, h); if (!sh || !sh.blocks) return;
  const n0 = S.log.length; orbPrompt(''); S.hitPend = null; castSpell(ch, 'shield', sh.pact || sh.lvl, sh.pact ? 'pact' : 'slot');
  if (S.log.length > n0 && /\+5 RK/.test(String(S.log[0].total))) { pushLog({ label: 'Schild', total: 'abgewehrt', detail: h.by + ' verfehlt ' + ch.name + ' (' + h.atk + ' gegen RK ' + (c.ac + 5) + ')', share: true }); if (h.rider) setTimeout(() => bannerToast('Kein Zusatzeffekt', 'Der Angriff hat nicht getroffen.'), 300); }
  else { S.hitPend = h; hitPrompt(h); } };
/* Zusatzeffekt nach dem Eintragen: Rettungswurf würfeln bzw. „gepackt“ übernehmen */
function riderPrompt(h) { const r = h.rider; if (!r) return; S.riderPend = h;
  orbPrompt('<div class="pr"><b>' + esc(h.by) + ': ' + (r.kind === 'grab' ? 'Du bist gepackt' : esc(r.ab) + '-Rettungswurf SG ' + r.dc) + '</b><p>' + esc(r.txt) + '</p><div class="chips end">' +
    (r.kind === 'grab' ? '<button class="btn ghost" data-act="riderGo" data-arg="no">Nicht übernehmen</button><button class="btn" data-act="riderGo" data-arg="cond">' + esc(condNames(r.conds)) + ' setzen</button>' : '<button class="btn" data-act="riderGo" data-arg="roll">Rettungswurf würfeln</button>') + '</div></div>'); }
XA.riderGo = (t, a) => { const h = S.riderPend; S.riderPend = null; orbPrompt(''); const ch = cur(); if (!h || !ch || a === 'no') return; const r = h.rider;
  if (a === 'cond') return condOnMe(ch, r.conds, h.by + (r.kind === 'grab' ? ' (Entkommen SG ' + r.dc + ')' : ''));
  const c = derive(ch, S.hb); const k = AB_KEY[r.ab] || 'con'; const tot = d20(c.saves[k].val, h.by + ': ' + r.ab + '-Rettungswurf (SG ' + r.dc + ')', { kind: 'save:' + k }); if (typeof tot !== 'number') return;
  if (tot >= r.dc) setTimeout(() => bannerToast('Geschafft!', 'Kein Zusatzeffekt durch ' + h.by + '.'), 600);
  else setTimeout(() => condAsk(ch, r.conds, r.fx, h.by), typeof d3fx === 'function' && d3fx() === 'voll' ? 1200 : 300); };
function condAsk(ch, conds, fx, by) { const cs = (conds || []).filter((k) => COND[k]); S.condPend = { conds: cs, by };
  orbPrompt('<div class="pr"><b>Misslungen: ' + esc(fx || condNames(cs)) + '</b><p>' + esc(by) + '</p><div class="chips end"><button class="btn ghost" data-act="condGo" data-arg="no">Schliessen</button>' + (cs.length ? '<button class="btn" data-act="condGo" data-arg="yes">' + esc(condNames(cs)) + ' setzen</button>' : '') + '</div></div>'); }
XA.condGo = (t, a) => { const p = S.condPend; S.condPend = null; orbPrompt(''); const ch = cur(); if (!p || !ch || a !== 'yes') return; condOnMe(ch, p.conds, p.by); };
function condOnMe(ch, conds, by) { const cs = (conds || []).filter((k) => COND[k]); if (!cs.length) return; ch.play.cond = [...new Set((ch.play.cond || []).concat(cs))]; commit(); pushLog({ label: ch.name + ': ' + condNames(cs), total: '✦', detail: 'durch ' + by, share: true }); }
