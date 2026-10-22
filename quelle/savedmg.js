/* ---------- Schaden mit Rettungswurf des Ziels: erst den Ausgang klären, dann würfeln ----------
   Zauber (Feuerball, Heilige Flamme …), andauernde Zauber (Blitz herbeirufen …) und Fähigkeiten (Odemwaffe …).
   Ablauf wie beim Angriff: Die Ziele würfeln (Spielleitung), der Wirker wählt „misslungen“, „geschafft“ oder „mehrere Ziele“.
   Bei „geschafft“ halbiert sich der Schaden (abgerundet) – oder entfällt, wenn der Effekt keinen halben Schaden kennt. */
function saveDmg(o) {
  if (o.tgt === undefined) o.tgt = S.tgt || ''; S.sv = o; const tn = typeof tgtNpc === 'function' ? tgtNpc(o.tgt) : null; const ok = o.half ? 'halber Schaden' : 'kein Schaden';
  orbPrompt('<div class="pr svp"><b>' + esc(o.label) + ': ' + esc(o.ab) + '-Rettungswurf SG ' + o.dc + '</b>' +
    '<p>Zuerst ' + (tn ? 'würfelt ' + esc(tn.name) : 'würfeln die Ziele') + ' den Rettungswurf. Geschafft: ' + ok + '. ' + slTag() + '</p>' +
    '<div class="chips end"><button class="btn ghost" data-act="svRes" data-arg="ok">Geschafft – ' + ok + '</button><button class="btn" data-act="svRes" data-arg="fail">Misslungen – ' + esc(o.expr.replace(/-/g, '−')) + '</button></div>' +
    '<div class="chips end svx"><button class="link" data-act="svRes" data-arg="multi" title="Einmal würfeln, Ergebnis für beide Fälle anzeigen">Mehrere Ziele, verschieden</button><button class="link" data-act="svRes" data-arg="none">Ohne Schaden weiter</button></div></div>');
}
XA.svRes = (t, a) => {
  const o = S.sv; S.sv = null; orbPrompt(''); if (!o) return; const tail = o.tail ? ' · ' + o.tail : '';
  if (a === 'none') { pushLog({ label: o.label, total: '✦', detail: 'Schaden nicht gewürfelt' + tail, share: true }); return; }
  if (a === 'ok' && !o.half) { pushLog({ label: o.label, total: '0', detail: o.ab + '-Rettungswurf geschafft – kein Schaden' + tail, share: true }); return; }
  const r = rollExpr(o.expr.replace(/−/g, '-')); const m = /W(\d+)/.exec(o.expr); const g = /\[([\d,]+)\]/.exec(r.detail);
  const half = Math.floor(r.total / 2); const ty = o.type ? ' ' + o.type : '';
  const e = { label: o.label, groups: r.groups, total: r.total, sides: m ? +m[1] : 0, nat: g ? g[1].split(',').reduce((x, y) => x + +y, 0) : r.total };
  if (a === 'fail') e.detail = r.detail + ' · Rettungswurf misslungen: voller Schaden' + ty + tail;
  else if (a === 'ok') { e.label += ' (halbiert)'; e.total = half; e.detail = r.detail + ' = ' + r.total + ' · Rettungswurf geschafft: die Hälfte' + ty + tail; }
  else { e.total = r.total + ' / ' + (o.half ? half : 0); e.detail = r.detail + ' · misslungen: ' + r.total + ty + ' · geschafft: ' + (o.half ? half : 'kein Schaden') + tail; }
  pushLog(e);
  if (a !== 'multi' && typeof e.total === 'number' && e.total > 0 && o.tgt && o.tgt.startsWith('n:') && typeof onlineFight === 'function' && onlineFight()) setTimeout(() => applyPrompt(o.tgt, e.total, o.label), 200);
};
/* Göttlicher Funke: Heilung oder Schaden wählen */
XA.sparkGo = (t, a) => { const o = S.spark; S.spark = null; orbPrompt(''); if (!o) return; if (a === 'heal') rollDmg(o.expr, 'Göttlicher Funke: Heilung'); else saveDmg({ label: 'Göttlicher Funke', expr: o.expr, ab: 'KON', dc: o.dc, half: true, type: 'gleissend oder nekrotisch' }); };
