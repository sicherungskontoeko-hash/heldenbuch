/* ==== Erklärbare Berechnungen und Nachbessern nach dem Wurf (P07) ==== */
function explainOn() { if (S.explain === undefined) { try { S.explain = localStorage.getItem('hb_explain') === '1'; } catch (e) { S.explain = false; } } return S.explain; }
const xpl = (parts) => parts && parts.length ? '<small class="xpl">' + esc(parts.join(' + ').replace(/\+ −/g, '− ').replace(/\+ \+/g, '+ ')) + '</small>' : '';
XA.explain = () => { S.explain = !explainOn(); try { localStorage.setItem('hb_explain', S.explain ? '1' : '0'); } catch (e) {} render(); };
function hintBlock(c) { return (c.hints || []).length ? '<div class="notice hints" data-grp="kampf werte gear"><b>Regelhinweis' + (c.hints.length > 1 ? 'e' : '') + ':</b><ul>' + c.hints.map((h) => '<li>' + esc(h) + '</li>').join('') + '</ul></div>' : ''; }
/* Rechenweg eines Wurfs aus der Wurfart ableiten */
function partsFor(c, kind) {
  const k = parseKind(kind);
  if (k.type === 'init') return c.initParts;
  if (k.type === 'save' && k.ab && c.saves[k.ab]) return c.saves[k.ab].parts;
  if (k.type === 'check' && k.skill && c.skills[k.skill]) return c.skills[k.skill].parts;
  if (k.type === 'check' && k.ab) return [AB_K[k.ab] + ' ' + sgn(c.mod[k.ab])].concat(c.lv('brd') >= 2 ? ['Alleskönner ' + sgn(Math.floor(c.pb / 2))] : []);
  return null;
}

/* ---------- Nachbessern: was darf ich nach dem Wurf noch tun? ---------- */
function boostOpts(c, type) {
  const ch = c.char, P = ch.play; const o = [];
  const left = (k) => { const r = c.res.find((x) => x.k === k); return r ? r.max - (+P.res[k] || 0) : 0; };
  if (P.insp) o.push({ k: 'insp', label: 'Heldeninspiration: neu würfeln', how: 'reroll' });
  const luckyK = (c.res.find((r) => /^ft_.*_o-lucky$/.test(r.k)) || {}).k; if (luckyK && left(luckyK) > 0) o.push({ k: 'lucky', label: 'Glückskind +1W4', how: 'add', expr: '1W4', res: luckyK });
  if (type === 'check' && c.lv('fig') >= 2 && left('sw') > 0) o.push({ k: 'tmind', label: 'Taktischer Verstand +1W10', how: 'add', expr: '1W10', res: 'sw' });
  if (type === 'save' && c.lv('fig') >= 9 && left('ind') > 0) o.push({ k: 'indom', label: 'Unbeugsam: neu +' + c.lv('fig'), how: 'reroll', plus: c.lv('fig'), res: 'ind' });
  if (type === 'save' && c.lv('mon') >= 14 && left('focus') > 0) o.push({ k: 'dsurv', label: 'Disziplinierter Überlebender: neu (1 Fokus)', how: 'reroll', res: 'focus' });
  if ((type === 'check' || type === 'save') && c.lv('wlk') >= 6 && c.subOf('wlk') === 'fiend' && left('dol') > 0) o.push({ k: 'dol', label: 'Glück des Dunklen +1W10', how: 'add', expr: '1W10', res: 'dol' });
  if ((type === 'check' || type === 'attack') && c.lv('brd') >= 14 && c.subOf('brd') === 'lore' && left('insp') > 0) o.push({ k: 'peerless', label: 'Unvergleichliches Können +1W' + step(6, [[5, 8], [10, 10], [15, 12]])(c.lv('brd')), how: 'add', expr: '1W' + step(6, [[5, 8], [10, 10], [15, 12]])(c.lv('brd')), res: 'insp' });
  if (c.lv('rog') >= 20 && left('luck') > 0) o.push({ k: 'stroke', label: 'Glückstreffer: zählt als 20', how: 'twenty', res: 'luck' });
  ['W4', 'W6', 'W8', 'W10', 'W12'].forEach((d) => o.push({ k: 'x' + d, label: '+1' + d, how: 'add', expr: '1' + d, ext: true }));
  return o;
}
function showBoost(c, roll) {
  let el = document.getElementById('boostBar'); if (!el) { el = document.createElement('div'); el.id = 'boostBar'; document.body.appendChild(el); }
  const o = boostOpts(c, roll.type); const own = o.filter((x) => !x.ext); const ext = o.filter((x) => x.ext);
  el.innerHTML = '<div class="bbh"><b>' + esc(roll.label) + ': ' + roll.total + '</b><span>Noch etwas draufpacken?</span><button class="x" data-act="boostX" aria-label="Schliessen">×</button></div>' +
    (own.length ? '<div class="chips">' + own.map((x) => '<button class="chip" data-act="boost" data-arg="' + x.k + '">' + esc(x.label) + '</button>').join('') + '</div>' : '') +
    '<div class="chips bext"><span>Von Verbündeten (z. B. Segnen, Inspiration):</span>' + ext.map((x) => '<button class="chip" data-act="boost" data-arg="' + x.k + '">' + x.label + '</button>').join('') + '</div>';
  el.hidden = false; el.classList.remove('out'); clearTimeout(showBoost.tm); if (typeof addHelp === 'function') addHelp();
  showBoost.tm = setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.hidden = true; }, 350); }, own.length ? 12000 : 7000);
}
function applyBoost(ch, k, where) {
  const c = derive(ch, S.hb); const r = where === 'atk' ? S.lastAtkRoll : S.lastRoll; if (!r) return;
  const x = boostOpts(c, r.type).find((y) => y.k === k); if (!x) return; const P = ch.play;
  if (x.res) { const rr = c.res.find((y) => y.k === x.res); const used = +P.res[x.res] || 0; if (!rr || used >= rr.max) return; P.res[x.res] = used + 1; }
  if (k === 'insp') P.insp = false;
  let total = r.total, detail = '';
  if (x.how === 'add') { const rl = rollExpr(x.expr); total = r.total + rl.total; detail = x.label.replace(/^\+/, '') + ' [' + rl.total + ']'; }
  else if (x.how === 'twenty') { total = 20 + r.mod; detail = 'Glückstreffer: W20 zählt als 20'; }
  else { const n = 1 + Math.floor(rnd() * 20); total = n + r.mod + (x.plus || 0); detail = x.label.split(':')[0] + ': neu gewürfelt W20 ' + n + (x.plus ? ' +' + x.plus : '') + ' ' + sgn(r.mod); r.nat = n; }
  const was = r.total; r.total = total;
  pushLog({ label: r.label + ' (nachgebessert)', total, detail: was + ' → ' + total + ' · ' + detail, share: true });
  if (where === 'atk' && S.dp) { S.dp.total = total; if (x.how !== 'add') { S.dp.nat = x.how === 'twenty' ? 20 : r.nat; const cr = derive(ch, S.hb).critRange; S.dp.crit = S.dp.crit0 = S.dp.nat >= cr; S.dp.fumble = S.dp.nat === 1; } renderDmgPrompt(); }
  else showBoost(c, r);
  commit(false);
}
Object.assign(XA, {
  boost: (t, a, p, ch) => applyBoost(ch, a, 'roll'),
  boostAtk: (t, a, p, ch) => applyBoost(ch, a, 'atk'),
  boostX: () => { const el = document.getElementById('boostBar'); if (el) el.hidden = true; }
});
