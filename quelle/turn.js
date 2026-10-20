/* ==== Zugleiste: Aktion, Bonusaktion, Reaktion, Bewegung + Favoriten (P01/P03) ==== */
const COST_DE = { a: 'Aktion', b: 'Bonusaktion', r: 'Reaktion', f: 'frei' };
const COST_K = { a: 'A', b: 'B', r: 'R', f: '✦' };

function turnSt(ch) {
  const P = ch.play; if (!P.turn || typeof P.turn !== 'object') P.turn = {};
  const t = P.turn; for (const [k, v] of Object.entries({ a: 0, aMax: 1, b: 0, r: 0, atk: 0, mv: 0, mvMax: 0, bonusAtk: 0, bSpell: false })) if (t[k] === undefined) t[k] = v;
  return t;
}
function turnReset(ch, keepReaction) {
  const t = turnSt(ch); const r = t.r;
  ch.play.turn = { a: 0, aMax: 1, b: 0, r: keepReaction ? r : 0, atk: 0, mv: 0, mvMax: 0, bonusAtk: 0, bSpell: false, slotSpell: false, lightIdx: null };
  const fx = ch.play.fx || {}; delete fx.reckless; delete fx.aim; ch.play.fx = fx;
  if (!keepReaction && typeof startOfTurn === 'function') { try { startOfTurn(ch); } catch (e) {} }
}
const tLeft = (ch, k) => { const t = turnSt(ch); return k === 'a' ? t.aMax - t.a : k === 'b' ? 1 - t.b : k === 'r' ? 1 - t.r : 1; };
/* Verbucht Aktion/Bonusaktion/Reaktion. Rückgabe false = blockiert (strenger Modus im Kampf), dann wurde nichts verändert. */
function tSpend(ch, k, label, force) {
  if (k === 'f') return true;
  if (!force) {
    const why = canAct(ch); if (why && !ruleGate(ch, label + ': ' + why, label + ' nicht möglich', true)) return false;
    if (tLeft(ch, k) <= 0) {
      if (inFight(ch) && rule('strict')) { bannerToast(COST_DE[k] + ' schon verbraucht', label + ' ist in diesem Zug nicht mehr möglich. Neuer Zug: „Neuer Zug“ oder Zugwechsel am Tisch.'); return false; }
      if (inFight(ch)) bannerToast(COST_DE[k] + ' schon verbraucht', label + ' wurde trotzdem ausgeführt (Regeln locker).');
    }
  }
  const t = turnSt(ch);
  if (k === 'a') t.a++; else if (k === 'b') t.b = 1; else if (k === 'r') t.r = 1;
  tRefresh(); return true;
}
function tRefresh() { setTimeout(() => { const ch = cur(); if (!ch) return; try { commit(false); } catch (e) {} const el = document.querySelector('.turnblk'); if (el) el.outerHTML = turnBlock(derive(ch, S.hb)); if (typeof addHelp === 'function') addHelp(); }, 0); }
/* Wird von weaponAttack aufgerufen – zählt Angriffe der Angriffsaktion */
function tCountAttack(ch, c, how, src) {
  const t = turnSt(ch);
  if (how === 'bonus') { if (t.bonusAtk > 0) { const why = canAct(ch); if (why && !ruleGate(ch, why, null, true)) return false; t.bonusAtk--; tRefresh(); return true; } return tSpend(ch, 'b', src || 'Bonusangriff'); }
  if (how === 'nick') { const why = canAct(ch); if (why && !ruleGate(ch, why, null, true)) return false; tRefresh(); return true; }
  if (how === 'reaction') return tSpend(ch, 'r', src || 'Gelegenheitsangriff');
  if (t.atk > 0 && t.atk < c.attacksPer) { const why = canAct(ch); if (why && !ruleGate(ch, why, null, true)) return false; t.atk++; tRefresh(); return true; }
  if (!tSpend(ch, 'a', 'Angriff')) return false; t.atk = 1; return true;
}
/* Wird von castSpell aufgerufen – Zauber nach Zeitaufwand verbuchen (Prüfung vorher in spellCheck) */
function spellCost(s) { const tm = String(s.time || ''); if (/^Reaktion/.test(tm)) return 'r'; if (/^Bonusaktion/.test(tm)) return 'b'; if (/^Aktion/.test(tm)) return 'a'; return null; }
function tCountSpell(ch, s, lvl, usedSlot) {
  const k = spellCost(s); const t = turnSt(ch);
  if (usedSlot && !offTurn()) t.slotSpell = true;
  if (!k) return;
  if (k === 'a') t.atk = 0;
  tSpend(ch, k, s.name, true);
}

/* ---------- Was kann der Held? ---------- */
const tRoll = (expr, label) => rollDmg(expr, label);
function tHealSelf(ch, c, expr, label, temp) {
  const r = rollExpr(expr); const P = ch.play;
  if (temp) { P.temp = Math.max(P.temp || 0, r.total); pushLog({ label, total: r.total, detail: r.detail + ' · temporäre TP', groups: r.groups, sides: (r.groups[0] || {}).sides || 0, nat: r.total }); return; }
  if (P.hp == null) P.hp = c.hpMax;
  if (P.hp <= 0) { P.ds = [0, 0]; wakeUp(P); }
  P.hp = Math.min(c.hpMax, P.hp + r.total);
  pushLog({ label, total: r.total, detail: r.detail + ' · TP jetzt ' + P.hp + '/' + c.hpMax, groups: r.groups, sides: (r.groups[0] || {}).sides || 0, nat: r.total });
}
const tLog = (label, detail) => pushLog({ label, total: '✦', detail, share: true });
const maDie = (c) => 'W' + step(6, [[5, 8], [11, 10], [17, 12]])(c.lv('mon'));

const FEAT_ACTIONS = [
  /* Barbar */
  { id: 'rage', n: 'Kampfrausch beginnen', cost: 'b', res: 'rage', when: (c) => c.lv('bar') && !c.char.play.raging, check: (ch, c) => c.heavyArmor ? 'In schwerer Rüstung kannst du keinen Kampfrausch beginnen.' : null, run: (ch, c) => rageStart(ch, c) },
  { id: 'rageext', n: 'Kampfrausch verlängern', cost: 'b', when: (c) => c.lv('bar') && c.char.play.raging && !c.char.play.rageKeep && c.lv('bar') < 15, sub: 'falls du in diesem Zug weder angreifst noch einen Rettungswurf erzwingst', run: (ch) => { ch.play.rageKeep = true; tLog('Kampfrausch', 'verlängert bis zum Ende deines nächsten Zuges'); } },
  { id: 'rageoff', n: 'Kampfrausch beenden', cost: 'f', when: (c) => c.lv('bar') && c.char.play.raging, run: (ch) => rageEnd(ch.play, 'freiwillig beendet') },
  { id: 'ragesave', n: 'Rettungswurf erzwungen', cost: 'f', when: (c) => c.lv('bar') && c.char.play.raging && !c.char.play.rageKeep, sub: 'hält den Kampfrausch aufrecht', run: (ch) => { ch.play.rageKeep = true; tLog('Kampfrausch', 'bleibt bestehen (Rettungswurf erzwungen)'); } },
  { id: 'reckless', n: 'Tollkühner Angriff', cost: 'f', sub: 'Vorteil auf Stärke-Angriffe in diesem Zug', when: (c) => c.lv('bar') >= 2 && !(c.char.play.fx || {}).reckless, run: (ch) => { ch.play.fx = ch.play.fx || {}; ch.play.fx.reckless = true; tLog('Tollkühner Angriff', 'Vorteil auf Stärke-Angriffe bis Zugende – Angriffe gegen dich haben Vorteil bis zu deinem nächsten Zug.'); } },
  { id: 'ipres', n: 'Einschüchternde Präsenz', cost: 'b', res: 'ip', when: (c) => c.lv('bar') >= 14 && c.subOf('bar') === 'berserker', sub: (c) => 'WEI-RW SG ' + (8 + c.mod.str + c.pb), run: (ch, c) => tLog('Einschüchternde Präsenz', 'Kreaturen in 9 m: WEI-Rettungswurf SG ' + (8 + c.mod.str + c.pb) + ' oder 1 Minute verängstigt.') },
  /* Barde */
  { id: 'binsp', n: 'Bardische Inspiration', cost: 'b', res: 'insp', when: (c) => c.lv('brd'), sub: (c) => c.res.find((r) => r.k === 'insp').n.replace(/^.*\(/, '').replace(')', ''), run: (ch, c) => tLog('Bardische Inspiration', 'Eine Kreatur in 18 m erhält einen Inspirationswürfel (' + c.res.find((r) => r.k === 'insp').n.replace(/^.*\(/, '').replace(')', '') + ').') },
  { id: 'cutting', n: 'Schneidende Worte', cost: 'r', res: 'insp', when: (c) => c.lv('brd') >= 3 && c.subOf('brd') === 'lore', run: (ch, c) => tRoll('1W' + step(6, [[5, 8], [10, 10], [15, 12]])(c.lv('brd')), 'Schneidende Worte (abziehen)') },
  /* Kleriker */
  { id: 'spark', n: 'Göttlicher Funke', cost: 'a', res: 'cd', when: (c) => c.lv('cle') >= 2, sub: (c) => step(1, [[7, 2], [13, 3], [18, 4]])(c.lv('cle')) + 'W8 ' + sgn(c.mod.wis), run: (ch, c) => tRoll(step(1, [[7, 2], [13, 3], [18, 4]])(c.lv('cle')) + 'W8' + sgn(c.mod.wis).replace('−', '-'), 'Göttlicher Funke (Heilung oder Schaden, KON-RW halbiert)') },
  { id: 'turnu', n: 'Untote vertreiben', cost: 'a', res: 'cd', when: (c) => c.lv('cle') >= 2, sub: (c) => 'WEI-RW SG ' + (8 + c.pb + c.mod.wis), run: (ch, c) => { tLog('Untote vertreiben', 'Untote in 9 m: WEI-Rettungswurf SG ' + (8 + c.pb + c.mod.wis) + ' oder 1 Minute verängstigt und kampfunfähig.'); if (c.lv('cle') >= 5) tRoll(Math.max(1, c.mod.wis) + 'W8', 'Untote versengen'); } },
  { id: 'preserve', n: 'Bewahrung des Lebens', cost: 'a', res: 'cd', when: (c) => c.lv('cle') >= 3 && c.subOf('cle') === 'life', sub: (c) => (5 * c.lv('cle')) + ' TP verteilen', run: (ch, c) => tLog('Bewahrung des Lebens', 'Verteile ' + 5 * c.lv('cle') + ' TP auf Kreaturen in 9 m (höchstens bis zur Hälfte ihres Maximums).') },
  { id: 'divint', n: 'Göttliches Eingreifen', cost: 'a', res: 'di', when: (c) => c.lv('cle') >= 10, run: () => tLog('Göttliches Eingreifen', 'Wirke einen Klerikerzauber bis Grad 5 ohne Zauberplatz.') },
  /* Druide */
  { id: 'wshape', n: 'Tiergestalt', cost: 'f', when: (c) => c.lv('dru') >= 2 && !c.char.play.ws, sub: (c) => 'Bonusaktion · ' + c.lv('dru') + ' temp. TP', run: (ch, c) => wsPrompt(ch, c) },
  { id: 'wsoff', n: 'Tiergestalt beenden', cost: 'b', when: (c) => !!c.char.play.ws, run: (ch) => wsEnd(ch, 'Du nimmst deine normale Gestalt an.') },
  { id: 'hmmove', n: 'Mal des Jägers versetzen', cost: 'b', check: (ch) => markMoveCheck(ch, 'hm'), when: (c) => !!(c.char.play.fx || {}).hm, sub: 'auf das gewählte Ziel', run: (ch) => { ch.play.fx.hmTgt = S.tgt || null; tLog('Mal des Jägers', 'liegt jetzt auf ' + (S.tgt ? partName(S.tgt) : 'einem neuen Ziel')); } },
  { id: 'hexmove', n: 'Verhexen versetzen', cost: 'b', check: (ch) => markMoveCheck(ch, 'hex'), when: (c) => !!(c.char.play.fx || {}).hex, sub: 'auf das gewählte Ziel', run: (ch) => { ch.play.fx.hexTgt = S.tgt || null; tLog('Verhexen', 'liegt jetzt auf ' + (S.tgt ? partName(S.tgt) : 'einem neuen Ziel')); } },
  { id: 'flameatk', n: 'Flamme werfen', cost: 'a', when: (c) => !!(c.char.play.fx || {}).flame, sub: 'Zauberangriff, 18 m', run: (ch, c) => { const s = getSpell('produce-flame'); const ctx = spellCtx(c, 'produce-flame'); tSpellAtk(ch, s, spellDice(s, 0, c, ctx.mod), ctx.atk); } },
  { id: 'landaid', n: 'Hilfe des Landes', cost: 'a', res: 'ws', when: (c) => c.lv('dru') >= 3 && c.subOf('dru') === 'land', sub: (c) => step(2, [[10, 3], [14, 4]])(c.lv('dru')) + 'W6', run: (ch, c) => { const n = step(2, [[10, 3], [14, 4]])(c.lv('dru')); tRoll(n + 'W6', 'Hilfe des Landes: Schaden (KON-RW SG ' + (8 + c.pb + c.mod.wis) + ' halbiert)'); setTimeout(() => tRoll(n + 'W6', 'Hilfe des Landes: Heilung'), 500); } },
  /* Kämpfer */
  { id: 'swind', n: 'Zweiter Atem', cost: 'b', res: 'sw', when: (c) => c.lv('fig'), sub: (c) => '1W10+' + c.lv('fig') + ' TP', run: (ch, c) => tHealSelf(ch, c, '1W10+' + c.lv('fig'), 'Zweiter Atem') },
  { id: 'surge', n: 'Tatendrang', cost: 'f', res: 'as', sub: 'eine zusätzliche Aktion', when: (c) => c.lv('fig') >= 2, run: (ch) => { turnSt(ch).aMax++; tLog('Tatendrang', 'Du erhältst eine zusätzliche Aktion.'); } },
  /* Mönch */
  { id: 'maBonus', n: 'Waffenloser Schlag (Kampfkunst)', cost: 'b', when: (c) => c.lv('mon'), run: (ch) => weaponAttack(ch, 0, { bonusPaid: true }) },
  { id: 'flurry', n: 'Schlaghagel', cost: 'b', res: 'focus', sub: (c) => (c.lv('mon') >= 10 ? 3 : 2) + ' waffenlose Schläge', when: (c) => c.lv('mon') >= 2, run: (ch, c) => { turnSt(ch).bonusAtk = (c.lv('mon') >= 10 ? 3 : 2) - 1; weaponAttack(ch, 0, { bonusPaid: true }); } },
  { id: 'patient', n: 'Geduldige Verteidigung', cost: 'b', when: (c) => c.lv('mon') >= 2, sub: 'Rückzug (mit 1 Fokus auch Ausweichen)', run: () => tLog('Geduldige Verteidigung', 'Rückzug als Bonusaktion; für 1 Fokuspunkt zusätzlich Ausweichen.') },
  { id: 'windstep', n: 'Schritt des Windes', cost: 'b', when: (c) => c.lv('mon') >= 2, sub: 'Spurt', run: (ch, c) => { turnSt(ch).mvMax += c.speed; tLog('Schritt des Windes', 'Spurt als Bonusaktion (für 1 Fokus auch Rückzug, doppelte Sprungweite).'); } },
  { id: 'deflect', n: 'Angriffe abwehren', cost: 'r', when: (c) => c.lv('mon') >= 3, sub: (c) => '1W10' + sgn(c.mod.dex + c.lv('mon')), run: (ch, c) => tRoll('1W10' + sgn(c.mod.dex + c.lv('mon')).replace('−', '-'), 'Angriffe abwehren (Schaden verringern)') },
  { id: 'slowfall', n: 'Langsamer Fall', cost: 'r', when: (c) => c.lv('mon') >= 4, sub: (c) => '−' + 5 * c.lv('mon') + ' Fallschaden', run: (ch, c) => tLog('Langsamer Fall', 'Fallschaden um ' + 5 * c.lv('mon') + ' verringert.') },
  { id: 'stun', n: 'Betäubender Schlag', cost: 'f', res: 'focus', when: (c) => c.lv('mon') >= 5, sub: (c) => 'KON-RW SG ' + (8 + c.pb + c.mod.wis), run: (ch, c) => tLog('Betäubender Schlag', 'Ziel: KON-Rettungswurf SG ' + (8 + c.pb + c.mod.wis) + ' oder betäubt bis zum Beginn deines nächsten Zuges.') },
  { id: 'wholeness', n: 'Ganzheit des Körpers', cost: 'b', res: 'wob', when: (c) => c.lv('mon') >= 6 && c.subOf('mon') === 'openhand', sub: (c) => '1' + maDie(c) + sgn(c.mod.wis), run: (ch, c) => tHealSelf(ch, c, '1' + maDie(c) + sgn(Math.max(1, c.mod.wis)).replace('−', '-'), 'Ganzheit des Körpers') },
  /* Paladin */
  { id: 'loh', n: 'Handauflegen', cost: 'b', when: (c) => c.lv('pal'), sub: (c) => { const r = c.res.find((x) => x.k === 'loh'); return (r.max - (+c.char.play.res.loh || 0)) + ' TP im Pool'; }, run: (ch, c) => tLohPrompt(ch, c) },
  { id: 'dsense', n: 'Göttlicher Sinn', cost: 'b', res: 'pcd', when: (c) => c.lv('pal') >= 3, run: () => tLog('Göttlicher Sinn', '10 Minuten: Himmlische, Unholde und Untote in 18 m spüren.') },
  { id: 'sacred', n: 'Heilige Waffe', cost: 'f', res: 'pcd', when: (c) => c.lv('pal') >= 3 && c.subOf('pal') === 'devotion' && !(c.char.play.fx || {}).sacred, sub: (c) => '+' + Math.max(1, c.mod.cha) + ' auf Nahkampfangriffe', run: (ch, c) => { fxSet(ch.play, 'sacred', true); tLog('Heilige Waffe', '10 Minuten: +' + Math.max(1, c.mod.cha) + ' auf Angriffe mit Nahkampfwaffen (wird automatisch eingerechnet).'); } },
  { id: 'abjure', n: 'Feinde vertreiben', cost: 'a', res: 'pcd', when: (c) => c.lv('pal') >= 9, sub: (c) => 'WEI-RW SG ' + (8 + c.pb + c.mod.cha), run: (ch, c) => tLog('Feinde vertreiben', 'Bis zu ' + Math.max(1, c.mod.cha) + ' Kreaturen in 18 m: WEI-Rettungswurf SG ' + (8 + c.pb + c.mod.cha) + ' oder 1 Minute verängstigt.') },
  { id: 'nimbus', n: 'Heiliger Nimbus', cost: 'b', res: 'nimbus', when: (c) => c.lv('pal') >= 20 && c.subOf('pal') === 'devotion', run: (ch, c) => tLog('Heiliger Nimbus', '10 Minuten helles Licht; Feinde in der Aura erleiden ' + (c.mod.cha + c.pb) + ' gleissenden Schaden zu Beginn ihres Zuges.') },
  /* Waldläufer */
  { id: 'tireless', n: 'Unermüdlich', cost: 'a', res: 'tire', when: (c) => c.lv('ran') >= 10, sub: (c) => '1W8' + sgn(c.mod.wis) + ' temp. TP', run: (ch, c) => tHealSelf(ch, c, '1W8' + sgn(Math.max(1, c.mod.wis)).replace('−', '-'), 'Unermüdlich', true) },
  { id: 'veil', n: 'Naturschleier', cost: 'b', res: 'veil', when: (c) => c.lv('ran') >= 14, run: () => tLog('Naturschleier', 'Unsichtbar bis zum Ende deines nächsten Zuges.') },
  /* Schurke */
  { id: 'caDash', n: 'Raffinierte Aktion: Spurt', cost: 'b', when: (c) => c.lv('rog') >= 2, run: (ch, c) => { turnSt(ch).mvMax += c.speed; tLog('Spurt', 'Zusätzliche Bewegung: ' + fmtM(c.speed)); } },
  { id: 'caDis', n: 'Raffinierte Aktion: Rückzug', cost: 'b', when: (c) => c.lv('rog') >= 2, run: () => tLog('Rückzug', 'Deine Bewegung löst in diesem Zug keine Gelegenheitsangriffe aus.') },
  { id: 'caHide', n: 'Raffinierte Aktion: Verstecken', cost: 'b', when: (c) => c.lv('rog') >= 2, run: (ch, c) => d20(c.skills.ste.val, 'Verstecken (Heimlichkeit)', { kind: 'check:dex:ste:' + c.skills.ste.prof }) },
  { id: 'aim', n: 'Ruhiges Zielen', cost: 'b', when: (c) => c.lv('rog') >= 3 && !(c.char.play.fx || {}).aim, sub: 'Vorteil auf den nächsten Angriff', run: (ch) => { ch.play.fx = ch.play.fx || {}; ch.play.fx.aim = true; tLog('Ruhiges Zielen', 'Vorteil auf deinen nächsten Angriff in diesem Zug; Bewegung 0.'); } },
  { id: 'uncanny', n: 'Unglaubliches Ausweichen', cost: 'r', when: (c) => c.lv('rog') >= 5, sub: 'Schaden halbieren', run: () => tLog('Unglaubliches Ausweichen', 'Der Schaden des Angriffs wird halbiert.') },
  { id: 'fasthands', n: 'Schnelle Finger', cost: 'b', when: (c) => c.lv('rog') >= 3 && c.subOf('rog') === 'thief', run: () => tLog('Schnelle Finger', 'Fingerfertigkeit, Diebeswerkzeug oder Gegenstand benutzen.') },
  /* Zauberer */
  { id: 'innate', n: 'Angeborene Zauberei', cost: 'b', res: 'is', when: (c) => c.lv('sor') && !(c.char.play.fx || {}).innate, sub: 'Vorteil auf Zauberangriffe, SG +1', run: (ch) => { fxSet(ch.play, 'innate', true); tLog('Angeborene Zauberei', '1 Minute: Zauber-SG +1 und Vorteil auf Zauberangriffe (Vorteil wird automatisch gewürfelt).'); } },
  { id: 'wings', n: 'Drachenflügel', cost: 'b', res: 'wings', when: (c) => c.lv('sor') >= 14 && c.subOf('sor') === 'draconic', run: () => tLog('Drachenflügel', '1 Stunde Flugbewegung 18 m.') },
  /* Hexenmeister (Schattenklinge) */
  { id: 'smal', n: 'Schattenmal', cost: 'b', res: 'smal', when: (c) => c.lv('wlk') >= 3 && c.subOf('wlk') === 'shadowblade', run: (ch, c) => tLog('Schattenmal', '1 Minute: einmal pro Zug +1W' + (c.lv('wlk') >= 10 ? 8 : 6) + ' nekrotisch beim Treffer (im Trefferdialog wählbar), danach Teleport 3 m.') },
  { id: 'smantel', n: 'Schattenmantel', cost: 'r', res: 'smal', when: (c) => c.lv('wlk') >= 6 && c.subOf('wlk') === 'shadowblade', run: (ch, c) => tLog('Schattenmantel', 'Schaden halbiert, Teleport bis 6 m in Schatten.') },
  { id: 'snacht', n: 'Klinge der Nacht', cost: 'f', res: 'snacht', when: (c) => c.lv('wlk') >= 14 && c.subOf('wlk') === 'shadowblade', run: (ch, c) => tLog('Klinge der Nacht', '1 Minute: Schattenmantel kostet keine Nutzung.') },
  /* Eigene Klassen */
  { id: 'bwheal', n: 'Blutstillung', cost: 'b', res: 'blood', when: (c) => c.lv('bw'), sub: (c) => '2' + RW_DIE(c.lv('bw')) + sgn(c.mod.con), run: (ch, c) => tRoll('2' + RW_DIE(c.lv('bw')) + sgn(c.mod.con).replace('−', '-'), 'Blutstillung (Heilung)') },
  { id: 'bwfaden', n: 'Roter Faden', cost: 'b', res: 'blood', when: (c) => c.lv('bw') >= 2, run: (ch, c) => tLog('Roter Faden', 'Kreatur in 18 m markiert: +1' + RW_DIE(c.lv('bw')) + ' nekrotisch einmal pro Zug (im Trefferdialog wählbar).') },
  { id: 'bwsense', n: 'Blutsinn', cost: 'b', res: 'blood', when: (c) => c.lv('bw') >= 7, run: () => tLog('Blutsinn', '1 Minute: Kreaturen mit Blut in 9 m wahrnehmen.') },
  { id: 'bwbann', n: 'Aderbann', cost: 'a', res: 'blood', when: (c) => c.lv('bw') >= 9, sub: (c) => 'KON-RW SG ' + (8 + c.pb + c.mod.con), run: (ch, c) => tLog('Aderbann', 'Kreatur in 18 m: KON-Rettungswurf SG ' + (8 + c.pb + c.mod.con) + ' oder festgesetzt (Konzentration).') },
  { id: 'bwspell', n: 'Blutbann', cost: 'r', res: 'bloodbann', when: (c) => c.lv('bw') >= 15, sub: '2 Blutladungen', run: (ch, c) => tLog('Blutbann', 'Zaubernde Kreatur: KON-Rettungswurf SG ' + (8 + c.pb + c.mod.con) + ', bei Misserfolg scheitert der Zauber. (2 Blutladungen abziehen)') },
  { id: 'fkmark', n: 'Fluchmarke setzen', cost: 'b', res: 'mark', when: (c) => c.lv('fk'), sub: (c) => '+1' + RW_DIE(c.lv('fk')) + ' pro Zug', run: (ch, c) => tLog('Fluchmarke', 'Kreatur in 18 m markiert (+1' + RW_DIE(c.lv('fk')) + ' im Trefferdialog, kritisch ab 19 ab Stufe 3).') },
  { id: 'fkmark20', n: 'Fluchmarke setzen', cost: 'b', when: (c) => c.lv('fk') >= 20, run: () => tLog('Fluchmarke', 'Kreatur markiert.') },
  /* Spezies */
  { id: 'breath', n: 'Odemwaffe', cost: 'a', res: 'breath', when: (c) => c.char.species === 'dragonborn', sub: (c) => step(1, [[5, 2], [11, 3], [17, 4]])(c.level) + 'W10 · GES-RW SG ' + (8 + c.mod.con + c.pb), run: (ch, c) => tRoll(step(1, [[5, 2], [11, 3], [17, 4]])(c.level) + 'W10', 'Odemwaffe (GES-RW SG ' + (8 + c.mod.con + c.pb) + ' halbiert)') },
  { id: 'dflight', n: 'Drachenflug', cost: 'b', res: 'dflight', when: (c) => c.char.species === 'dragonborn' && c.level >= 5, run: () => tLog('Drachenflug', '10 Minuten Flugbewegung.') },
  { id: 'adren', n: 'Adrenalinschub', cost: 'b', res: 'adr', when: (c) => c.char.species === 'orc', sub: (c) => 'Spurt + ' + c.pb + ' temp. TP', run: (ch, c) => { turnSt(ch).mvMax += c.speed; ch.play.temp = Math.max(ch.play.temp || 0, c.pb); tLog('Adrenalinschub', 'Spurt und ' + c.pb + ' temporäre TP.'); } },
  { id: 'stonec', n: 'Steingespür', cost: 'b', res: 'stone', when: (c) => c.char.species === 'dwarf', run: () => tLog('Steingespür', '10 Minuten Erschütterungssinn 18 m auf Stein.') },
  { id: 'large', n: 'Grosse Gestalt', cost: 'b', res: 'large', when: (c) => c.char.species === 'goliath' && c.level >= 5, run: () => tLog('Grosse Gestalt', '10 Minuten gross, Vorteil auf Stärkewürfe, +3 m Bewegung.') },
  { id: 'gcloud', n: 'Wolkenschritt', cost: 'b', res: 'giant', when: (c) => c.char.species === 'goliath' && c.char.speciesChoice === 'cloud', run: () => tLog('Wolkenschritt', 'Teleport bis 9 m.') },
  { id: 'gstone', n: 'Steinausdauer', cost: 'r', res: 'giant', when: (c) => c.char.species === 'goliath' && c.char.speciesChoice === 'stone', sub: (c) => '1W12' + sgn(c.mod.con), run: (ch, c) => tRoll('1W12' + sgn(c.mod.con).replace('−', '-'), 'Steinausdauer (Schaden verringern)') },
  { id: 'gstorm', n: 'Sturmdonner', cost: 'r', res: 'giant', when: (c) => c.char.species === 'goliath' && c.char.speciesChoice === 'storm', run: () => tRoll('1W8', 'Sturmdonner (Schallschaden)') },
  { id: 'spores', n: 'Sporenwolke', cost: 'b', res: 'spores', when: (c) => c.char.species === 'mykori', sub: (c) => 'KON-RW SG ' + (8 + c.mod.con + c.pb), run: (ch, c) => tLog('Sporenwolke', 'Kreaturen deiner Wahl in 3 m: KON-RW SG ' + (8 + c.mod.con + c.pb) + ' oder vergiftet.') },
  { id: 'vstep', n: 'Schattenschritt', cost: 'b', res: 'vstep', when: (c) => c.char.species === 'vesperkin', run: () => tLog('Schattenschritt', 'Teleport bis 9 m von Dunkel zu Dunkel.') },
  { id: 'stonef', n: 'Steinwerdung', cost: 'r', res: 'stoneform', when: (c) => c.char.species === 'steinblut', run: () => tLog('Steinwerdung', 'Resistenz gegen diesen Wucht-, Stich- oder Hiebschaden.') },
  /* weitere ✦-Unterklassen */
  { id: 'xahnenschild', n: 'Ahnenschild', cost: 'f', when: (c) => c.lv('bar') >= 3 && c.subOf('bar') === 'ahnen', run: (ch, c) => tLog('Ahnenschild', 'Verbündeter in 9 m: ' + (c.lv('bar') >= 16 ? 4 : c.lv('bar') >= 9 ? 3 : 2) + ' + ' + c.mod.con + ' temporäre TP.') },
  { id: 'xsippe', n: 'Sippenruf', cost: 'r', res: 'sippe', when: (c) => c.lv('bar') >= 6 && c.subOf('bar') === 'ahnen', run: (ch, c) => tLog('Sippenruf', 'Verbündeter wiederholt den Rettungswurf mit +' + c.mod.con + '.') },
  { id: 'xfelswurf', n: 'Felswurf', cost: 'b', res: 'felswurf', when: (c) => c.lv('bar') >= 6 && c.subOf('bar') === 'koloss', run: (ch, c) => tRoll('2W8+' + (c.lv('bar') >= 16 ? 4 : c.lv('bar') >= 9 ? 3 : 2), 'Felswurf (Wucht, STÄ-RW SG ' + (8 + c.pb + c.mod.str) + ' oder liegend)') },
  { id: 'xbeben', n: 'Bebenstoss', cost: 'b', when: (c) => c.lv('bar') >= 10 && c.subOf('bar') === 'koloss', run: (ch, c) => tRoll('2W6', 'Bebenstoss (GES-RW SG ' + (8 + c.pb + c.mod.str) + ', Wucht + liegend)') },
  { id: 'xmaske', n: 'Maskenwechsel', cost: 'b', when: (c) => c.lv('brd') >= 3 && c.subOf('brd') === 'masken', run: (ch, c) => tLog('Maskenwechsel', 'Heldin, Narr oder Herrscherin – 10 Minuten.') },
  { id: 'xbuehne', n: 'Bühnenwechsel', cost: 'r', res: 'insp', when: (c) => c.lv('brd') >= 6 && c.subOf('brd') === 'masken', run: (ch, c) => tLog('Bühnenwechsel', 'Platztausch mit einem Verbündeten in 9 m.') },
  { id: 'xfinale', n: 'Grosses Finale', cost: 'a', res: 'finale', when: (c) => c.lv('brd') >= 14 && c.subOf('brd') === 'masken', run: (ch, c) => tLog('Grosses Finale', 'Feinde in 9 m: WEI-RW SG ' + c.spell.dc + ' oder bezaubert und kampfunfähig.') },
  { id: 'xcrescendo', resN: 3, n: 'Crescendo', cost: 'b', res: 'takt', when: (c) => c.lv('brd') >= 14 && c.subOf('brd') === 'klingentakt', run: (ch, c) => tLog('Crescendo', 'Angriff gegen bis zu drei Kreaturen, je +3W6 Schall bei Treffer.') },
  { id: 'xkrone', n: 'Donnerkrone', cost: 'b', res: 'cd', when: (c) => c.lv('cle') >= 3 && c.subOf('cle') === 'sturmkrone', run: (ch, c) => tRoll((c.lv('cle') >= 10 ? 3 : 2) + 'W6', 'Donnerkrone (GES-RW SG ' + c.spell.dc + ', Blitz)') },
  { id: 'xthron', n: 'Sturmthron', cost: 'b', res: 'thron', when: (c) => c.lv('cle') >= 17 && c.subOf('cle') === 'sturmkrone', run: (ch, c) => tLog('Sturmthron', '1 Minute Flug 18 m.') },
  { id: 'xglutsegen', n: 'Glutsegen', cost: 'a', res: 'cd', when: (c) => c.lv('cle') >= 3 && c.subOf('cle') === 'esse', run: (ch, c) => tLog('Glutsegen', 'Waffe +1W4 Feuer oder Rüstung mit Feuerresistenz – 1 Stunde.') },
  { id: 'xfunken', n: 'Funkenflug', cost: 'r', res: 'funken', when: (c) => c.lv('cle') >= 6 && c.subOf('cle') === 'esse', run: (ch, c) => tRoll('1W8+' + Math.max(0, c.mod.wis), 'Funkenflug (Feuer)') },
  { id: 'xschnuppe', n: 'Sternschnuppe', cost: 'r', res: 'schnuppe', when: (c) => c.lv('dru') >= 6 && c.subOf('dru') === 'sternspur', run: (ch, c) => tRoll('2W6', 'Sternschnuppe (gleissend, Nachteil auf den Angriff)') },
  { id: 'xriss', n: 'Himmelsriss', cost: 'a', res: 'riss', when: (c) => c.lv('dru') >= 14 && c.subOf('dru') === 'sternspur', run: (ch, c) => tRoll('8W8', 'Himmelsriss (KON-RW SG ' + c.spell.dc + ', gleissend)') },
  { id: 'xlageblick', n: 'Lageblick', cost: 'b', when: (c) => c.lv('fig') >= 7 && c.subOf('fig') === 'feldkunst', run: (ch, c) => tLog('Lageblick', 'RK und TP des Ziels im Vergleich zu deinen.') },
  { id: 'xgegenzug', n: 'Gegenzug', cost: 'r', res: 'taktik', when: (c) => c.lv('fig') >= 15 && c.subOf('fig') === 'feldkunst', run: (ch, c) => tLog('Gegenzug', 'Angriff gegen den Angreifer.') },
  { id: 'xschild', n: 'Schildzeichen', cost: 'r', res: 'arkan', when: (c) => c.lv('fig') >= 3 && c.subOf('fig') === 'arkanklinge', run: (ch, c) => tLog('Schildzeichen', '+4 RK gegen diesen Angriff.') },
  { id: 'xsprung', n: 'Sprungzeichen', cost: 'b', res: 'arkan', when: (c) => c.lv('fig') >= 3 && c.subOf('fig') === 'arkanklinge', run: (ch, c) => tLog('Sprungzeichen', 'Teleport bis 6 m.') },
  { id: 'xschneide', n: 'Zeichen der Schneide', cost: 'b', res: 'arkan', when: (c) => c.lv('fig') >= 3 && c.subOf('fig') === 'arkanklinge', run: (ch, c) => tLog('Zeichen der Schneide', '1 Minute: +1W6 Energie pro Treffer (im Trefferdialog wählbar).') },
  { id: 'xnwind', n: 'Nachtwindgestalt', cost: 'b', res: 'focus', when: (c) => c.lv('mon') >= 6 && c.subOf('mon') === 'nachtwind', run: (ch, c) => tLog('Nachtwindgestalt', 'Durch Kreaturen bewegen, keine Gelegenheitsangriffe, +3 m.') },
  { id: 'xatem', n: 'Ruhiger Atem', cost: 'b', res: 'focus', when: (c) => c.lv('mon') >= 3 && c.subOf('mon') === 'waage', run: (ch, c) => tRoll('1W' + (c.lv('mon') >= 17 ? 12 : c.lv('mon') >= 11 ? 10 : c.lv('mon') >= 5 ? 8 : 6) + '+' + Math.max(0, c.mod.wis), 'Ruhiger Atem (temporäre TP)') },
  { id: 'xschuld', n: 'Schuldspruch', cost: 'b', res: 'pcd', when: (c) => c.lv('pal') >= 3 && c.subOf('pal') === 'unnachgiebig', run: (ch, c) => tLog('Schuldspruch', '1 Minute: +' + c.pb + ' Schaden einmal pro Zug gegen das Ziel (im Trefferdialog wählbar).') },
  { id: 'xjahr', n: 'Jahreszeiten des Hains', cost: 'b', res: 'pcd', when: (c) => c.lv('pal') >= 3 && c.subOf('pal') === 'hain', run: (ch, c) => tLog('Jahreszeiten des Hains', 'Frühling, Sommer, Herbst oder Winter – 1 Minute.') },
  { id: 'xfalle', n: 'Fallensteller', cost: 'a', res: 'falle', when: (c) => c.lv('ran') >= 3 && c.subOf('ran') === 'daemmer', run: (ch, c) => tLog('Fallensteller', 'Falle gelegt: GES-RW SG ' + c.spell.dc + ', 2W6 Stich und festgesetzt.') },
  { id: 'xnebel', n: 'Pfad im Nebel', cost: 'b', res: 'nebelpfad', when: (c) => c.lv('ran') >= 15 && c.subOf('ran') === 'daemmer', run: (ch, c) => tLog('Pfad im Nebel', 'Teleport bis 9 m.') },
  { id: 'xchallenge', n: 'Herausforderung', cost: 'b', when: (c) => c.lv('rog') >= 3 && c.subOf('rog') === 'duellant', run: (ch, c) => tLog('Herausforderung', '1 Minute: Hinterhältiger Angriff ohne Vorteil, solange du allein mit dem Ziel stehst.') },
  { id: 'xriposte', n: 'Riposte', cost: 'r', when: (c) => c.lv('rog') >= 9 && c.subOf('rog') === 'duellant', run: (ch, c) => tLog('Riposte', 'Angriff gegen den Angreifer.') },
  { id: 'xtrugbild', n: 'Täuschungsbild', cost: 'b', res: 'trug', when: (c) => c.lv('rog') >= 3 && c.subOf('rog') === 'trugbild', run: (ch, c) => tLog('Täuschungsbild', 'Trugbild in 9 m für 1 Minute.') },
  { id: 'xdschritt', n: 'Doppelgängerschritt', cost: 'r', res: 'trug', when: (c) => c.lv('rog') >= 9 && c.subOf('rog') === 'trugbild', run: (ch, c) => tLog('Doppelgängerschritt', 'Platztausch mit dem Trugbild – der Angriff verfehlt.') },
  { id: 'xchaosschild', resN: 2, n: 'Chaosschild', cost: 'r', res: 'sp', when: (c) => c.lv('sor') >= 14 && c.subOf('sor') === 'chaos', run: (ch, c) => tRoll('1W6', 'Chaosschild (4–6: verfehlt)') },
  { id: 'xwachtraum', resN: 2, n: 'Wachtraum', cost: 'r', res: 'sp', when: (c) => c.lv('sor') >= 6 && c.subOf('sor') === 'traum', run: (ch, c) => tLog('Wachtraum', 'Angreifer: WEI-RW SG ' + c.spell.dc + ' oder der Angriff verfehlt.') },
  { id: 'xgunst', n: 'Gunst des Hofes', cost: 'b', res: 'gunst', when: (c) => c.lv('wlk') >= 3 && c.subOf('wlk') === 'daemmerhof', run: (ch, c) => tLog('Gunst des Hofes', 'Verbündeter +1W6 auf den nächsten W20 – oder Feind Nachteil.') },
  { id: 'xabwehr', n: 'Höfliche Abwehr', cost: 'r', res: 'abwehr', when: (c) => c.lv('wlk') >= 6 && c.subOf('wlk') === 'daemmerhof', run: (ch, c) => tLog('Höfliche Abwehr', 'Angreifer: CHA-RW SG ' + c.spell.dc + ' oder anderes Ziel.') },
  { id: 'xecho', n: 'Echo der Tiefe', cost: 'b', res: 'echo', when: (c) => c.lv('wlk') >= 3 && c.subOf('wlk') === 'tiefe', run: (ch, c) => tLog('Echo der Tiefe', 'WEI-RW SG ' + c.spell.dc + ' oder Nachteil auf den nächsten Angriff.') },
  { id: 'xfaden', n: 'Schicksalsfaden', cost: 'r', res: 'faden', when: (c) => c.lv('wiz') >= 3 && c.subOf('wiz') === 'schicksal', run: (ch, c) => tRoll(c.lv('wiz') >= 10 ? '1W8' : '1W4', 'Schicksalsfaden (± auf einen W20)') },
  { id: 'xsternschrift', n: 'Sternenschrift', cost: 'b', res: 'sternschrift', when: (c) => c.lv('rk') >= 3 && c.subOf('rk') === 'stern', run: (ch, c) => tLog('Sternenschrift', 'Verbündeter addiert 1 Runenwürfel zum nächsten W20.') },
  { id: 'xdornsiegel', n: 'Dornensiegel', cost: 'b', res: 'blood', when: (c) => c.lv('bw') >= 3 && c.subOf('bw') === 'dorn', run: (ch, c) => tLog('Dornensiegel', '3-m-Dornenkreis für 1 Minute.') },
  { id: 'xgegenfluch', n: 'Gegenfluch', cost: 'r', res: 'gegenfluch', when: (c) => c.lv('fk') >= 6 && c.subOf('fk') === 'dornen', run: (ch, c) => tLog('Gegenfluch', 'Verbündeter hat Vorteil auf den Rettungswurf.') },
  { id: 'xdrohne', n: 'Drohnenangriff', cost: 'b', when: (c) => c.lv('ma') >= 3 && c.subOf('ma') === 'schwarm', run: (ch, c) => tRoll('1W6+' + Math.max(0, c.mod.int), 'Drohne (Stich)') },
  { id: 'xschutzschwarm', n: 'Schutzschwarm', cost: 'r', res: 'drohnen', when: (c) => c.lv('ma') >= 6 && c.subOf('ma') === 'schwarm', run: (ch, c) => tRoll('1W10+' + Math.max(0, c.mod.int), 'Schutzschwarm (Schaden verringern)') }
];
const STD_ACTIONS = [
  ['dash', 'Spurt', 'a', 'Zusätzliche Bewegung'], ['disengage', 'Rückzug', 'a', 'Keine Gelegenheitsangriffe'], ['dodge', 'Ausweichen', 'a', 'Angriffe gegen dich mit Nachteil, Vorteil auf GES-RW'],
  ['help', 'Helfen', 'a', 'Verbündeter erhält Vorteil'], ['hide', 'Verstecken', 'a', 'Heimlichkeit SG 15'], ['influence', 'Beeinflussen', 'a', 'Charisma- oder Weisheitswurf'],
  ['search', 'Suchen', 'a', 'Weisheitswurf (Wahrnehmung …)'], ['study', 'Studieren', 'a', 'Intelligenzwurf (Nachforschungen …)'], ['utilize', 'Gegenstand benutzen', 'a', ''], ['ready', 'Vorbereiten', 'a', 'Auslöser festlegen, Reaktion nutzen']
];
function stdRun(ch, c, id) {
  if (id === 'dash') { turnSt(ch).mvMax += c.speed; tLog('Spurt', 'Zusätzliche Bewegung: ' + fmtM(c.speed)); }
  else if (id === 'hide') d20(c.skills.ste.val, 'Verstecken (Heimlichkeit)', { kind: 'check:dex:ste:' + c.skills.ste.prof });
  else if (id === 'search') d20(c.skills.prc.val, 'Suchen (Wahrnehmung)', { kind: 'check:wis:prc:' + c.skills.prc.prof });
  else if (id === 'study') d20(c.skills.inv.val, 'Studieren (Nachforschungen)', { kind: 'check:int:inv:' + c.skills.inv.prof });
  else { const s = STD_ACTIONS.find((x) => x[0] === id); tLog(s[1], s[3] || ''); }
}
function featureCost(text) { if (/Reaktion/.test(text)) return 'r'; if (/Bonusaktion/.test(text)) return 'b'; if (/\b(Magieaktion|Aktion)\b/.test(text)) return 'a'; return 'f'; }

/* Alle Optionen des Helden, nach Kosten */
function turnOpts(c) {
  const ch = c.char, P = ch.play; const out = [];
  const resLeft = (k) => { const r = c.res.find((x) => x.k === k); return r ? r.max - (+P.res[k] || 0) : null; };
  c.attacks.forEach((a, i) => { out.push({ id: 'atk:' + i, cost: 'a', grp: 'Angriff', n: a.name, sub: sgn(a.atk) + ' · ' + a.dmg + ' ' + (a.dtype || '') }); });
  c.attacks.forEach((a, i) => { if (a.melee) out.push({ id: 'oa:' + i, cost: 'r', grp: 'Gelegenheitsangriff', n: 'Gelegenheitsangriff: ' + a.name, sub: sgn(a.atk) }); });
  const tL = turnSt(ch).lightIdx; c.attacks.forEach((a, i) => { if (a.light && a.idx !== undefined && !a.thrown && tL != null && tL !== a.idx) { const nick = a.mastery === 'nick' && !onceUsed(ch, 'nick'); out.push({ id: 'off:' + i, cost: nick ? 'f' : 'b', grp: 'Angriff', n: 'Zweitwaffe: ' + a.name, sub: nick ? 'Kerbe: Teil der Angriffsaktion (1× pro Zug)' : 'nach einem Angriff mit einer leichten Waffe' }); } });
  /* Zauber */
  const seen = new Set(); const sp = [];
  for (const info of c.spell.classes || []) info.always.concat(info.cantrips, info.prepared).forEach((id) => { if (!seen.has(id)) { seen.add(id); sp.push(id); } });
  (c.extraSpells || []).forEach((e) => { if (!seen.has(e.id)) { seen.add(e.id); sp.push(e.id); } });
  sp.forEach((id) => { const s = getSpell(id, S.hb); if (!s) return; const k = spellCost(s); if (!k || id === 'divine-smite') return; out.push({ id: 'sp:' + id, cost: k, grp: 'Zauber', n: s.name, sub: (s.lvl ? 'Grad ' + s.lvl : 'Zaubertrick') + (s.conc ? ' · K' : '') }); });
  /* Merkmale */
  for (const f of FEAT_ACTIONS) { let ok = false; try { ok = !!f.when(c); } catch (e) {} if (!ok) continue; if (f.id === 'fkmark' && c.lv('fk') >= 20) continue; const left = f.res ? resLeft(f.res) : null; if (f.res && left === null) continue; out.push({ id: 'f:' + f.id, cost: f.cost, grp: 'Fähigkeit', n: f.n, sub: (typeof f.sub === 'function' ? f.sub(c) : f.sub || '') , left, empty: left !== null && left <= 0 }); }
  /* Runen, Riten, Flüche, Module */
  (c.optSets || []).forEach((o) => { if (typeof OPT_RES === 'undefined' || !OPT_RES.hasOwnProperty(o.key)) return; const rk = OPT_RES[o.key]; (o.use || o.chosen).forEach((k) => { const it = o.items.find((x) => x.k === k); if (!it) return; const cost = optCost(o.key, it.text); const dice = optDice(o.key, it.text, c, o.lvl); if (!cost && !dice.length) return; const left = rk ? resLeft(rk) : null; out.push({ id: 'opt:' + o.key + ':' + k, cost: featureCost(it.text.replace(/^[^:]*Solange aktiv:[^.]*\./, '')), grp: o.label, n: it.name, sub: cost ? cost + ' × ' + (rk === 'rune' ? 'Aktivierung' : rk === 'blood' ? 'Blutladung' : 'Zelle') : 'würfeln', left, empty: rk && cost > left }); }); });
  /* Talente mit Nutzungen */
  c.feats.forEach((x) => { const u = x.f.uses; if (!u) return; const k = 'ft_' + (x.slot === 'asi' ? 'asi' + x.lv : x.slot) + '_' + x.id; const left = resLeft(k); out.push({ id: 'ft:' + k, cost: featureCost(x.f.text), grp: 'Talent', n: u.name || x.f.name, sub: x.f.text.slice(0, 70) + '…', left, empty: left !== null && left <= 0 }); });
  /* Tränke */
  if (typeof itemList === 'function') itemList(ch).forEach((x) => { const d = itemDef(x); if (d.drink && (+x.qty || 1) > 0) out.push({ id: 'it:' + x.uid, cost: 'b', grp: 'Gegenstand', n: d.name + ' trinken', sub: d.drink + ' TP · ' + (+x.qty || 1) + '×' }); });
  STD_ACTIONS.forEach(([id, n, k, sub]) => out.push({ id: 'std:' + id, cost: k, grp: 'Allgemein', n, sub }));
  return out.filter((o) => !o.hide);
}

function turnRun(ch, id) {
  const c = derive(ch, S.hb); const [kind, a1, a2] = id.split(':'); const P = ch.play;
  if (kind === 'atk') return weaponAttack(ch, +a1);
  if (kind === 'oa') return weaponAttack(ch, +a1, { how: 'reaction' });
  if (kind === 'off') return weaponAttack(ch, +a1, { how: 'bonus', off: true });
  if (kind === 'sp') {
    const s = getSpell(a1, S.hb); if (!s) return;
    if (!s.lvl) return castSpell(ch, s.id, 0);
    const ex = c.extraSpells.find((e) => e.id === s.id) && !(c.spell.byId || {})[s.id];
    const fr = freeRes(c, s); const frLeft = fr ? fr.max - (+P.res[fr.k] || 0) : 0;
    if (fr && frLeft > 0) return castSpell(ch, s.id, s.lvl, 'free', fr.k);
    if (ex) { pushLog({ label: s.name, total: '✗', detail: 'Keine freie Nutzung mehr' }); return; }
    const lv = slotLevels(c, s); const pa = pactAvail(c, s); const ctx = spellCtx(c, s.id);
    if (pa && (ctx.cls === 'wlk' || !lv.length)) return castSpell(ch, s.id, pa, 'pact');
    if (lv.length) return castSpell(ch, s.id, lv[0]);
    pushLog({ label: s.name, total: '✗', detail: 'Kein Zauberplatz frei' }); return;
  }
  if (kind === 'f') {
    const f = FEAT_ACTIONS.find((x) => x.id === a1); if (!f) return;
    let r = null, used = 0; const need = f.resN || 1;
    if (f.res) { r = c.res.find((x) => x.k === f.res); used = +P.res[f.res] || 0; if (!r || used + need > r.max) { pushLog({ label: f.n, total: '✗', detail: 'Keine Nutzung mehr übrig' }); return; } }
    const chk = f.check ? f.check(ch, c) : null; if (chk) { pushLog({ label: f.n, total: '✗', detail: chk }); return; }
    const cost = ['maBonus', 'flurry'].includes(f.id) ? 'b' : f.id === 'loh' ? 'f' : f.cost;
    if (!tSpend(ch, cost, f.n)) return;
    if (r) P.res[f.res] = used + need;
    f.run(ch, c); commit(); return;
  }
  if (kind === 'opt') { const it = (c.optSets || []).find((o) => o.key === a1); const item = it && it.items.find((x) => x.k === a2); if (item && !tSpend(ch, featureCost(item.text.replace(/^[^:]*Solange aktiv:[^.]*\./, '')), item.name)) return; return optUse(ch, a1, a2); }
  if (kind === 'ft') { const k = id.slice(3); const r = c.res.find((x) => x.k === k); const used = +P.res[k] || 0; if (!r || used >= r.max) { pushLog({ label: r ? r.n : 'Talent', total: '✗', detail: 'Keine Nutzung mehr übrig' }); return; } const fx = c.feats.find((x) => k.endsWith('_' + x.id)); const cost = fx ? featureCost(fx.f.text) : 'f'; if (!tSpend(ch, cost, r.n)) return; P.res[k] = used + 1; tLog(r.n, fx ? fx.f.text : ''); commit(); return; }
  if (kind === 'it') { if (!tSpend(ch, 'b', 'Trank')) return; XA.itDrink(null, a1, '', ch); return; }
  if (kind === 'std') { const s = STD_ACTIONS.find((x) => x[0] === a1); if (!tSpend(ch, s[2], s[1])) return; stdRun(ch, c, a1); commit(); }
}
function tLohPrompt(ch, c) {
  const r = c.res.find((x) => x.k === 'loh'); const left = r.max - (+ch.play.res.loh || 0);
  orbPrompt('<div class="pr"><b>Handauflegen</b><p>' + left + ' von ' + r.max + ' Punkten im Pool. Für 5 Punkte kannst du stattdessen „vergiftet“ beenden.</p><div class="chips"><input type="number" id="lohN" min="1" max="' + left + '" value="' + Math.min(left, 5) + '" aria-label="Punkte" style="width:90px"><button class="btn" data-act="tLoh" data-arg="me">Auf mich</button><button class="btn ghost" data-act="tLoh" data-arg="ally">Auf Verbündeten</button><button class="btn ghost" data-act="tLoh" data-arg="x">Abbrechen</button></div></div>');
}

/* ---------- Darstellung ---------- */
function turnBlock(c) {
  const ch = c.char; const t = turnSt(ch); const favs = (ch.favs || []);
  const opts = turnOpts(c); const byId = Object.fromEntries(opts.map((o) => [o.id, o]));
  const mvMax = c.speed + (t.mvMax || 0); const mvLeft = Math.max(0, mvMax - (t.mv || 0));
  const pill = (k, label, left, max) => '<button class="tpill' + (left <= 0 ? ' used' : '') + '" data-act="tPick" data-arg="' + k + '" aria-label="' + label + ' wählen"><i>' + COST_K[k] + '</i><span>' + label + '</span><b>' + (max > 1 ? left + '/' + max : left > 0 ? 'frei' : 'weg') + '</b></button>';
  let h = '<section class="blk turnblk" data-grp="kampf"><div class="tbar">' + pill('a', 'Aktion', t.aMax - t.a, t.aMax) + pill('b', 'Bonusaktion', 1 - t.b, 1) + pill('r', 'Reaktion', 1 - t.r, 1) +
    '<div class="tmove"><span>Bewegung</span><button class="tm" data-act="tMove" data-arg="1.5" aria-label="1,5 m bewegen">−</button><b>' + fmtM(mvLeft) + '</b><button class="tm" data-act="tMove" data-arg="-1.5" aria-label="1,5 m zurück">+</button></div>' +
    '<button class="btn sm ghost tnew" data-act="tNew" title="Zugbeginn: Aktion, Bonusaktion, Reaktion und Bewegung zurücksetzen, Dauer herunterzählen">Neuer Zug</button></div>' +
    '<div class="tctx">' + (onlineFight() ? '<span class="tinfo">⚔ Kampf am Tisch' + (offTurn() ? ' · nicht dein Zug' : ' · dein Zug') + '</span>' : '<button class="chip' + (ch.play.localFight ? ' on' : '') + '" data-act="tFight" title="Im Kampfmodus gelten die Zugregeln (Aktionen, Bonusaktion, 1 Zauberplatz pro Zug) streng.">⚔ Kampfmodus ' + (ch.play.localFight ? 'an' : 'aus') + '</button>') + tgtSelect(c) + '</div>';
  /* laufende Angriffsaktion */
  const extra = [];
  if (t.atk > 0 && t.atk < c.attacksPer) extra.push('<span class="tinfo">Angriffsaktion: noch ' + (c.attacksPer - t.atk) + ' Angriff' + (c.attacksPer - t.atk > 1 ? 'e' : '') + '</span>' + c.attacks.filter((a) => !a.name.startsWith('Blutlanze')).map((a, i) => '<button class="chip tq" data-act="tUse" data-arg="atk:' + c.attacks.indexOf(a) + '">' + esc(a.name) + ' ' + sgn(a.atk) + '</button>').join(''));
  if (t.bonusAtk > 0) extra.push('<span class="tinfo">Schlaghagel: noch ' + t.bonusAtk + ' Schlag</span><button class="chip tq" data-act="tUse" data-arg="bfl:0">Waffenloser Schlag</button>');
  const incap = (ch.play.cond || []).find((k) => COND[k] && COND[k].fx && COND[k].fx.incap); if (incap) extra.push('<span class="tinfo warnc">' + COND[incap].name + ': keine Aktionen, Bonusaktionen oder Reaktionen.</span>');
  const fx = ch.play.fx || {}; const act = [];
  const FXN = { reckless: 'Tollkühn', aim: 'Ruhiges Zielen', innate: 'Angeborene Zauberei', sacred: 'Heilige Waffe', bless: 'Segnen', hm: 'Mal des Jägers', hex: 'Verhexen', df: 'Göttliche Gunst', shill: 'Shillelagh', flame: 'Flamme in der Hand', vex: 'Bedrängen' };
  const dur = ch.play.fxDur || {};
  for (const k of Object.keys(fx)) { if (!fx[k] || k.endsWith('_L') || k.endsWith('Tgt')) continue; const nm = FXN[k] || (k.startsWith('fo_') ? (getSpell(k.slice(3)) || {}).name : null); if (nm) act.push([k, nm + (dur[k] ? ' (' + (dur[k] >= 10 ? Math.round(dur[k] / 10) + ' Min.' : dur[k] + ' Rd.') + ')' : '')]); }
  if (ch.play.raging) act.push(['rage', 'Kampfrausch' + (ch.play.rageKeep ? '' : ' – endet nach diesem Zug, wenn du nicht angreifst')]);
  if (ch.play.ws) act.push(['ws', 'Tiergestalt' + (BESTIARY[ch.play.ws] ? ': ' + BESTIARY[ch.play.ws][0] : '')]);
  if (ch.play.ws && typeof WS_STATS !== 'undefined' && WS_STATS[ch.play.ws]) extra.push('<span class="tinfo">' + esc(BESTIARY[ch.play.ws][0]) + ': ' + esc(BESTIARY[ch.play.ws][5]) + ' · ' + esc(WS_STATS[ch.play.ws].senses) + ' ' + slTag('Sinne und Merkmale wie Rudeltaktik wendet ihr am Tisch an – die App rechnet sie nicht automatisch') + '</span>');
  if (act.length) extra.push('<span class="tinfo">Aktiv:</span>' + act.map(([k, n]) => '<button class="chip" data-act="tFxOff" data-arg="' + k + '" title="Beenden">' + esc(n) + ' ×</button>').join(''));
  if (act.length && !inFight(ch) && Object.keys(dur).length) extra.push('<span class="tinfo">Zeit vergeht:</span>' + [[10, '+1 Min.'], [100, '+10 Min.'], [600, '+1 Std.']].map(([r, l]) => '<button class="chip" data-act="tTime" data-arg="' + r + '">' + l + '</button>').join(''));
  if (extra.length) h += '<div class="tnow">' + extra.join('') + '</div>';
  if (typeof effMineHtml === 'function') h += effMineHtml();
  const fv = favs.map((id) => byId[id]).filter(Boolean);
  h += '<div class="tfav">' + (fv.length ? fv.map((o) => '<button class="tq' + (o.empty || tLeft(ch, o.cost) <= 0 ? ' dim' : '') + '" data-act="tUse" data-arg="' + o.id + '"><i class="k' + o.cost + '">' + COST_K[o.cost] + '</i>' + esc(o.n) + (o.left !== null && o.left !== undefined ? '<small>' + o.left + '</small>' : '') + '</button>').join('') : '<span class="hint">Tippe auf Aktion, Bonusaktion oder Reaktion, um zu sehen, was du kannst. Mit ☆ legst du Favoriten für diese Leiste an.</span>') + '</div></section>';
  return h;
}
function openTurnPicker(k) {
  const ch = cur(); if (!ch) return; const c = derive(ch, S.hb); const t = turnSt(ch); const favs = ch.favs || [];
  const list = turnOpts(c).filter((o) => o.cost === k || o.cost === 'f').map((o) => o.cost === 'f' ? Object.assign({}, o, { grp: 'Frei (kostet keine Aktion)' }) : o);
  const groups = {}; list.forEach((o) => { (groups[o.grp] = groups[o.grp] || []).push(o); });
  const order = ['Angriff', 'Gelegenheitsangriff', 'Zauber', 'Fähigkeit', 'Runen', 'Blutriten', 'Flüche', 'Gerätemodule', 'Talent', 'Gegenstand', 'Allgemein', 'Frei (kostet keine Aktion)'];
  const keys = Object.keys(groups).sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99);
  const left = tLeft(ch, k);
  const m = $('#modal'); S.modal = 'turn';
  m.innerHTML = '<div class="dlg turndlg" role="dialog" aria-modal="true" aria-label="' + COST_DE[k] + ' wählen"><div class="dph"><h3>' + COST_DE[k] + (k === 'a' && t.aMax > 1 ? ' (' + left + ' von ' + t.aMax + ' frei)' : left > 0 ? ' – frei' : ' – schon verbraucht') + '</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    
    keys.map((g) => '<h4>' + esc(g) + '</h4><div class="tlist">' + groups[g].map((o) => '<div class="trow' + (o.empty ? ' empty' : '') + '"><button class="tgo" data-act="tUse" data-arg="' + o.id + '"' + (o.empty ? ' disabled' : '') + '><i class="k' + o.cost + '">' + COST_K[o.cost] + '</i><b>' + esc(o.n) + '</b><small>' + esc([o.sub, o.left !== null && o.left !== undefined ? 'noch ' + o.left : ''].filter(Boolean).join(' · ')) + '</small></button><button class="tstar' + (favs.includes(o.id) ? ' on' : '') + '" data-act="tFav" data-arg="' + o.id + '" aria-label="Favorit">' + (favs.includes(o.id) ? '★' : '☆') + '</button></div>').join('') + '</div>').join('') +
    '<div class="chips end"><button class="btn ghost" data-act="tToggle" data-arg="' + k + '">' + (left > 0 ? 'Als verbraucht markieren' : 'Wieder freigeben') + '</button><button class="btn" data-act="closeModal">Fertig</button></div></div>';
  m.hidden = false;
}
Object.assign(XA, {
  tPick: (t, a) => openTurnPicker(a),
  tUse: (t, a, p, ch) => { if (S.modal === 'turn') { S.modal = null; $('#modal').hidden = true; } if (a.startsWith('bfl:')) { const st = turnSt(ch); st.bonusAtk = Math.max(0, st.bonusAtk - 1); weaponAttack(ch, 0, { bonusPaid: true }); commit(); return; } turnRun(ch, a); },
  tFav: (t, a, p, ch) => { ch.favs = ch.favs || []; const i = ch.favs.indexOf(a); if (i >= 0) ch.favs.splice(i, 1); else ch.favs.push(a); commit(); const k = turnOpts(derive(ch, S.hb)).find((o) => o.id === a); if (S.modal === 'turn' && k) openTurnPicker(k.cost === 'f' ? 'b' : k.cost); },
  tToggle: (t, a, p, ch) => { const st = turnSt(ch); if (a === 'a') st.a = st.a >= st.aMax ? 0 : st.aMax; else st[a] = st[a] ? 0 : 1; commit(); openTurnPicker(a); },
  tNew: (t, a, p, ch) => { turnReset(ch); commit(); },
  tTime: (t, a, p, ch) => { timePass(ch, +a); commit(); },
  tFight: (t, a, p, ch) => { ch.play.localFight = !ch.play.localFight; if (ch.play.localFight) turnReset(ch); commit(); },
  tMove: (t, a, p, ch) => { const st = turnSt(ch); const c = derive(ch, S.hb); st.mv = Math.max(0, Math.min(c.speed + st.mvMax, (st.mv || 0) + +a)); commit(); },
  tFxOff: (t, a, p, ch) => { const P = ch.play; if (a === 'rage') rageEnd(P, 'freiwillig beendet'); else if (a === 'ws') wsEnd(ch, 'beendet'); else { if (P.conc && P.fxSrc && P.fxSrc[a] === P.conc.id) endConc(P); fxSet(P, a, false); } commit(); },
  tLoh: (t, a, p, ch) => { if (a === 'x') { orbPrompt(''); return; } const c = derive(ch, S.hb); const r = c.res.find((x) => x.k === 'loh'); const left = r.max - (+ch.play.res.loh || 0); const n = Math.max(0, Math.min(left, +($('#lohN') || {}).value || 0)); if (!n) return; if (!tSpend(ch, 'b', 'Handauflegen')) { orbPrompt(''); return; } ch.play.res.loh = (+ch.play.res.loh || 0) + n; if (a === 'me') { const P = ch.play; if (P.hp <= 0) { P.ds = [0, 0]; wakeUp(P); } P.hp = Math.min(c.hpMax, P.hp + n); } pushLog({ label: 'Handauflegen', total: n, detail: (a === 'me' ? 'auf dich · TP jetzt ' + ch.play.hp + '/' + c.hpMax : 'auf einen Verbündeten') + ' · Pool ' + (left - n) + '/' + r.max, share: true }); orbPrompt(''); commit(); }
});
