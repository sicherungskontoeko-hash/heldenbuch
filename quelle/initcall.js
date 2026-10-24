/* ---------- Kampfstart: grosses Fenster „Würfle Initiative“ und optional nur einige Helden auswählen ---------- */
function initCall() {
  const c = S.combat; const ch = S.chars[S.cur];
  if (!c || !c.active || !ch || !S.camp || dmOut(UID) || S.initCalled === c.id) return false;
  if (S.myInit && S.myInit.cid === c.id) return false; if (notIn(UID, S.table[UID])) return false;
  if (S.modal && S.modal !== 'initcall') return false; /* ein offener Dialog wird nicht verdrängt – dann reicht die kleine Meldung */
  S.initCalled = c.id; S.modal = 'initcall'; const m = $('#modal'); const sur = (c.surp || []).includes(UID);
  m.innerHTML = '<div class="dlg initcall" role="alertdialog" aria-modal="true" aria-label="Kampf beginnt"><div class="icx">⚔</div><h2>Kampf!</h2>' +
    '<p>' + esc(ch.name) + ', würfle Initiative.' + (sur ? ' <b>Du bist überrascht</b> (Nachteil).' : '') + '</p>' +
    '<button class="btn big glowbtn" data-act="initRoll">Initiative würfeln</button>' +
    '<div class="chips"><button class="link" data-act="initAway">Noch nicht dabei</button><button class="link" data-act="closeModal">Später</button></div></div>';
  m.hidden = false; try { navigator.vibrate && navigator.vibrate([90, 50, 90]); } catch (e) {}
  return true;
}
function fightPickHtml() {
  const ps = players(); S.fightInv = S.fightInv && S.fightInv.length ? S.fightInv.filter((u) => ps.some(([x]) => x === u)) : ps.map(([u]) => u);
  return '<div class="dlg" role="dialog" aria-modal="true" aria-label="Wer ist dabei?"><div class="dph"><h3>Wer ist im Kampf?</h3><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<p class="hint">Nur die Ausgewählten werden zum Initiativewurf aufgefordert. Die anderen stehen unter „Noch nicht im Kampf“ und greifen mit „Eingreifen“ später ein.</p>' +
    '<div class="chips">' + ps.map(([u, p]) => chip(S.fightInv.includes(u), esc(p.char || '?') + (p.pl ? ' <small>(' + esc(p.pl) + ')</small>' : ''), 'data-act="fightPickTog" data-arg="' + u + '"')).join('') + '</div>' +
    '<div class="chips end"><button class="btn ghost" data-act="closeModal">Abbrechen</button><button class="btn" data-act="fightStart"' + (S.fightInv.length ? '' : ' disabled') + '>Kampf beginnen (' + S.fightInv.length + ')</button></div></div>';
}
XA.fightPick = () => { S.fightInv = null; S.modal = 'fightpick'; const m = $('#modal'); m.innerHTML = fightPickHtml(); m.hidden = false; };
XA.fightPickTog = (t, a) => { const l = S.fightInv || []; S.fightInv = l.includes(a) ? l.filter((x) => x !== a) : l.concat([a]); $('#modal').innerHTML = fightPickHtml(); };
