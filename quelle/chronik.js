/* ==== Abenteuerverfolgung: Chronik der Spielleitung und Ansagen der Spieler ====
   Chronik: schreibt auf dem Gerät der Spielleitung automatisch mit, was passiert (Szenen, Handouts, Kämpfe, Beute,
   Entscheidungen, Rasten, Helden am Boden, Stufenaufstiege, erledigte Ansagen) – je Abenteuer bzw. Tisch, in localStorage „hb_chronik“.
   Ansagen: Spieler schreiben oder diktieren (Tastatur-Mikrofon) „Was tust du?“; das geht über ihr Tisch-Dokument (Feld ans) an die Spielleitung.
   Erledigte Ansagen markiert die Spielleitung (Meta ansSeen), die Spieler sehen „✓ gesehen“. Beides fliesst in die Claude-Lage. */
const CHR_KEY = 'hb_chronik', CHR_MAX = 400;
const CHR_ICON = { abend: '📅', szene: '📖', handout: '📜', kampf: '⚔', kende: '🏁', beute: '💰', wahl: '⚖', rast: '☾', ansage: '💬', notiz: '✎', stufe: '⬆', boden: '✚', tod: '✝' };
function chrDb() { try { const d = JSON.parse(localStorage.getItem(CHR_KEY) || '{}'); return d && typeof d === 'object' ? d : {}; } catch (e) { return {}; } }
function chrSaveDb(d) { try { localStorage.setItem(CHR_KEY, JSON.stringify(d)); } catch (e) {} }
/* Wohin gehört ein Eintrag? Zum zuletzt geöffneten Abenteuer, sonst zum Tisch */
function chrWhere() { let a = ''; try { a = typeof advDb === 'function' ? advDb().last : ''; } catch (e) {} if (a && typeof advGet === 'function' && advGet(a)) return { key: 'adv:' + a, name: advGet(a).title }; if (S.camp) return { key: 'tisch:' + S.camp, name: 'Tisch ' + S.camp }; return { key: 'frei', name: 'Ohne Abenteuer' }; }
function chrList(key) { const d = chrDb(); return Array.isArray(d[key || chrWhere().key]) ? d[key || chrWhere().key] : []; }
const chrMine = () => !S.camp || (typeof isDM === 'function' && isDM()); /* nur die Spielleitung (oder ohne Tisch) schreibt mit */
function chrAdd(k, x, force) {
  if (!x || (!force && !chrMine())) return; const w = chrWhere(); const d = chrDb(); const L = Array.isArray(d[w.key]) ? d[w.key] : []; const now = Date.now();
  const last = L[L.length - 1];
  if (last && last.k === k && last.x === x && now - last.t < 15 * 60000) return; /* doppelt */
  if (k === 'szene') { const ls = [...L].reverse().find((e) => e.k === 'szene'); if (ls && ls.x === x && !L.slice(L.indexOf(ls) + 1).some((e) => e.k === 'abend')) return; }
  if (k !== 'abend' && (!last || now - last.t > 6 * 3600000)) L.push({ id: uidX(), t: now, k: 'abend', x: 'Spielabend · ' + new Date(now).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' }) });
  L.push({ id: uidX(), t: now, k, x: String(x).slice(0, 400) }); if (L.length > CHR_MAX) L.splice(0, L.length - CHR_MAX);
  d[w.key] = L; chrSaveDb(d); if (S.modal === 'chronik') chrOpen(true);
}
/* Text für Claude und zum Kopieren */
function chrText(n, key) { const L = chrList(key).slice(-(n || 999)); return L.map((e) => (e.k === 'abend' ? '\n' + e.x : '- ' + new Date(e.t).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) + ' ' + e.x)).join('\n').trim(); }
function chrOpen(keep) {
  const w = chrWhere(); const L = chrList(w.key); const m = $('#modal'); S.modal = 'chronik'; S.more = false; document.querySelectorAll('details.mnu[open]').forEach((d) => { d.open = false; });
  const rows = L.map((e) => e.k === 'abend' ? '<li class="cabend">' + esc(e.x) + '</li>' : '<li class="ce"><time>' + new Date(e.t).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) + '</time><span class="ci" aria-hidden="true">' + (CHR_ICON[e.k] || '•') + '</span><span class="cx">' + esc(e.x) + '</span><button class="x" data-act="chrDel" data-arg="' + e.id + '" aria-label="Eintrag löschen">×</button></li>').join('');
  m.innerHTML = '<div class="dlg chrdlg" role="dialog" aria-modal="true" aria-label="Chronik"><div class="dph"><b>Chronik · ' + esc(w.name) + '</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    (L.length ? '<ul class="chr" id="chrList">' + rows + '</ul>' : '<p class="hint">Noch nichts aufgeschrieben. Die Chronik füllt sich von selbst: Szenen, Handouts, Kämpfe, Beute, Entscheidungen, Rasten, Stufenaufstiege und erledigte Ansagen. Eigene Notizen kannst du unten ergänzen.</p>') +
    '<div class="chradd"><input id="chrN" type="text" placeholder="Notiz, z. B. «Die Helden haben Prunella die Wahrheit gesagt»" enterkeyhint="done">' + micBtn('chrN') + '<button class="btn sm" data-act="chrNote">Eintragen</button></div>' +
    '<div class="chips end"><button class="btn ghost sm" data-act="chrAbend">Neuer Spielabend</button><button class="btn ghost sm" data-act="chrCopy"' + (L.length ? '' : ' disabled') + '>Kopieren</button><button class="btn sm" data-act="chrRecap"' + (L.length ? '' : ' disabled') + '>✦ Was bisher geschah</button></div></div>';
  m.hidden = false; const l = $('#chrList'); if (l) l.scrollTop = l.scrollHeight;
}

/* ---------- Ansagen der Spieler ---------- */
function ansStoreKey() { return 'hb_ans_' + (S.camp || ''); }
function ansMine() { if (!S.camp) return []; if (!S.myAns) { try { S.myAns = JSON.parse(localStorage.getItem(ansStoreKey()) || '[]'); } catch (e) { S.myAns = []; } if (!Array.isArray(S.myAns)) S.myAns = []; } return S.myAns.slice(-5); }
const ansSeen = () => (S.meta && Array.isArray(S.meta.ansSeen) ? S.meta.ansSeen : []);
/* Offene Ansagen aller Spieler (für die Spielleitung), älteste zuerst */
function ansOpenList() {
  const seen = ansSeen(); const out = [];
  if (typeof players === 'function') for (const [u, p] of players()) for (const a of (p && Array.isArray(p.ans) ? p.ans : [])) if (a && a.id && !seen.includes(a.id) && (!S.ansHidden || !S.ansHidden.includes(a.id))) out.push({ uid: u, who: p.char || '?', id: a.id, t: a.t, x: String(a.x || '').slice(0, 400) });
  return out.sort((a, b) => a.t - b.t);
}
function ansBox(where) {
  if (!S.camp || (typeof isDM === 'function' && isDM())) return '';
  const mine = ansMine(); const seen = ansSeen();
  return '<div class="ansbox"' + (where === 'sheet' ? ' data-grp="kampf"' : '') + '><label for="ansX"><b>Was tust du?</b> <small>Ansage an die Spielleitung</small></label><div class="ansrow"><input id="ansX" type="text" enterkeyhint="send" autocomplete="off" placeholder="z. B. «Ich verwirre den Elch mit einem Spiegel»">' + micBtn('ansX') + '<button class="btn sm" data-act="ansSend">Ansagen</button></div>' +
    hlTip('Sprechen statt tippen: im Textfeld das Mikrofon der Handytastatur antippen.') +
    (mine.length ? '<ul class="ansmine">' + mine.slice(-2).reverse().map((a) => '<li>' + esc(a.x) + ' <small>' + (seen.includes(a.id) ? '✓ gesehen' : 'gesendet ' + ago(a.t)) + '</small></li>').join('') + '</ul>' : '') + '</div>';
}
function ansDmHtml(compact) {
  const L = ansOpenList(); if (!L.length) return compact ? '' : '<p class="hint">Keine offenen Ansagen.</p>';
  return '<div class="ansdm"><b>Ansagen <span class="cnt">' + L.length + '</span></b><ul>' + L.map((a) => '<li><span><b>' + esc(a.who) + '</b> <small>' + ago(a.t) + '</small><br>' + esc(a.x) + '</span><button class="chip" data-act="ansOk" data-arg="' + a.id + '" title="Erledigt – kommt in die Chronik">✓</button></li>').join('') + '</ul><div class="chips"><button class="btn sm" data-act="ansClaude">✦ An Claude</button>' + (L.length > 1 ? '<button class="btn sm ghost" data-act="ansAll">Alle ✓</button>' : '') + '</div></div>';
}
function ansMark(ids) {
  const L = ansOpenList().filter((a) => ids.includes(a.id)); if (!L.length) return;
  L.forEach((a) => chrAdd('ansage', a.who + ': ' + a.x));
  S.ansHidden = (S.ansHidden || []).concat(ids);
  if (typeof saveMeta === 'function' && S.camp) saveMeta({ ansSeen: ansSeen().concat(ids).slice(-120) });
  if (typeof paintCamp === 'function') paintCamp(); if (S.modal === 'ansagen') ansModal();
}
function ansModal() { const m = $('#modal'); S.modal = 'ansagen'; m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-label="Ansagen"><div class="dph"><b>Ansagen der Spieler</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' + ansDmHtml(false) + '</div>'; m.hidden = false; }

/* ---------- Mikrofon (nur in claude.ai mit der Fähigkeit „dictation“; sonst das Mikrofon der Tastatur) ---------- */
let HB_DICT = null;
const micBtn = (id) => '<button type="button" class="micbtn" data-act="mic" data-arg="' + id + '"' + (HB_DICT ? '' : ' hidden') + ' aria-label="Sprechen" title="Sprechen">🎤</button>';
setTimeout(() => { try { if (typeof isApp === 'function' && isApp()) return; if (window.claude && window.claude.use) window.claude.use('dictation').then((d) => { if (!d) return; HB_DICT = d; let base = '';
  d.onPartial(({ text }) => { const el = S.micEl && document.getElementById(S.micEl); if (el) el.value = base + text; });
  d.onFinal(({ text }) => { const el = S.micEl && document.getElementById(S.micEl); if (el) { base = base + text + ' '; el.value = base; } });
  d.onState(({ state }) => { S.micOn = state === 'listening'; document.querySelectorAll('.micbtn').forEach((b) => b.classList.toggle('on', S.micOn && b.dataset.arg === S.micEl)); if (S.micOn) { const el = document.getElementById(S.micEl); base = el && el.value ? el.value.replace(/\s*$/, ' ') : ''; } });
  document.querySelectorAll('.micbtn').forEach((b) => { b.hidden = false; }); }).catch(() => {}); } catch (e) {} }, 0);

/* ---------- Aktionen ---------- */
Object.assign(XA, {
  chrOpen: () => chrOpen(),
  chrDel: (t, a) => { const w = chrWhere(); const d = chrDb(); d[w.key] = (d[w.key] || []).filter((e) => e.id !== a); chrSaveDb(d); chrOpen(true); },
  chrNote: () => { const el = $('#chrN'); const v = el && el.value.trim(); if (!v) { if (el) el.focus(); return; } chrAdd('notiz', v, true); chrOpen(true); const n = $('#chrN'); if (n) n.focus(); },
  chrAbend: () => { const w = chrWhere(); const d = chrDb(); const L = d[w.key] || []; L.push({ id: uidX(), t: Date.now(), k: 'abend', x: 'Spielabend · ' + new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' }) }); d[w.key] = L; chrSaveDb(d); chrOpen(true); },
  chrCopy: async () => { const ok = typeof slCopy === 'function' && await slCopy('Chronik · ' + chrWhere().name + '\n' + chrText()); bannerToast(ok ? 'Chronik kopiert' : 'Kopieren nicht möglich', ''); },
  chrRecap: () => { S.slQ = 'Schreibe einen Rückblick «Was bisher geschah» zum Vorlesen am Anfang des Spielabends: 6–8 Sätze, lebendig erzählt, nur was die Helden selbst wissen (keine Geheimnisse der Spielleitung), mit einem Satz am Schluss, wo sie jetzt stehen. Grundlage ist die Chronik.'; if (typeof slOpen === 'function') slOpen(); },
  ansSend: () => { const el = $('#ansX'); const v = el && el.value.trim(); if (!v) { if (el) el.focus(); return; } ansMine(); S.myAns.push({ id: uidX(), t: Date.now(), x: v.slice(0, 400) }); S.myAns = S.myAns.slice(-10); try { localStorage.setItem(ansStoreKey(), JSON.stringify(S.myAns)); } catch (e) {}
    if (S.micOn && HB_DICT) HB_DICT.stop().catch(() => {}); el.value = ''; if (typeof queueMe === 'function') queueMe(); bannerToast('Angesagt', 'Die Spielleitung sieht deine Ansage.'); render(); },
  ansOk: (t, a) => ansMark([a]),
  ansAll: () => ansMark(ansOpenList().map((a) => a.id)),
  ansOpen: () => ansModal(),
  ansClaude: () => { const L = ansOpenList(); S.slQ = 'Die Spieler sagen an:\n' + L.map((a) => '- ' + a.who + ': ' + a.x).join('\n') + '\nWas passiert? Nenne pro Held die nötige Probe mit SG (falls eine nötig ist) und was bei Erfolg und Misserfolg geschieht. Kurz.'; if (typeof slOpen === 'function') slOpen(); },
  mic: (t, a) => { const d = HB_DICT; if (!d) return; if (S.micOn) { d.stop().catch(() => {}); return; } S.micEl = a; d.start().catch((e) => { if (e && e.code === 'not_granted') { HB_DICT = null; document.querySelectorAll('.micbtn').forEach((b) => { b.hidden = true; }); } }); }
});
/* Enter sendet Ansage bzw. Notiz */
document.addEventListener('keydown', (ev) => { if (ev.key !== 'Enter' || ev.isComposing) return; const id = ev.target && ev.target.id; if (id === 'ansX') { ev.preventDefault(); XA.ansSend(); } else if (id === 'chrN') { ev.preventDefault(); XA.chrNote(); } });

/* ---------- Automatisch mitschreiben: nach den Aktionen der Spielleitung ---------- */
function chrScene() { try { const A = advCurA && advCurA(); if (!A) return ''; const st = advSt(A.id); if (st.tab !== 'ch') return ''; const C = advCh(A, st.ch); const Sc = advSc(C, st.sc); return (C.kicker || C.title) + ' · ' + Sc.title; } catch (e) { return ''; } }
function chrFight(c) { const n = {}; (c.npcs || []).filter((x) => !x.reserve && !x.ally).forEach((x) => { const b = String(x.name).replace(/\s+\d+$/, ''); n[b] = (n[b] || 0) + 1; }); return Object.entries(n).map(([k, v]) => (v > 1 ? v + '× ' : '') + k).join(', '); }
let chrPre = null;
document.addEventListener('click', (ev) => {
  const t = ev.target.closest && ev.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
  if (a === 'fightEnd' && S.combat && S.combat.active) chrPre = JSON.parse(JSON.stringify(S.combat));
  setTimeout(() => {
    try {
      if (!chrMine()) return;
      if (a === 'advScene' || a === 'advStep' || (a === 'advTab' && /^ch:/.test(t.dataset.arg || ''))) { const s = chrScene(); if (s) chrAdd('szene', s); }
      else if (a === 'advHo' || a === 'hoAdd') { const h = ((S.meta && S.meta.handouts) || []).slice(-1)[0]; if (h && Date.now() - h.t < 5000) chrAdd('handout', 'Handout geteilt: ' + (h.title || 'ohne Titel')); }
      else if (a === 'fightGo' && S.combat && S.combat.active) { const pc = typeof players === 'function' ? players().filter(([u, p]) => p.init && p.init.cid === S.combat.id && !p.init.away).map(([, p]) => p.char) : []; const f = chrFight(S.combat); chrAdd('kampf', 'Kampf beginnt' + (pc.length ? ': ' + pc.join(', ') : '') + (f ? ' gegen ' + f : '')); }
      else if (a === 'advFight' && S.combat && S.combat.active && !S.camp) { const f = chrFight(S.combat); if (f) chrAdd('kampf', 'Kampf: ' + f); }
      else if (a === 'fightEnd' && chrPre) { const c = chrPre; chrPre = null; const foes = (c.npcs || []).filter((x) => !x.reserve && !x.ally && x.hpMax); const down = foes.filter((x) => x.hp <= 0).length;
        const pcs = typeof players === 'function' ? players().filter(([, p]) => p.hp <= 0).map(([, p]) => p.char) : [];
        chrAdd('kende', 'Kampf vorbei nach ' + (c.round || 1) + (c.round > 1 ? ' Runden' : ' Runde') + (foes.length ? ': ' + down + ' von ' + foes.length + ' Gegnern besiegt' : '') + (pcs.length ? '; am Boden: ' + pcs.join(', ') : '')); }
      else if (a === 'gift') { const g = ((S.meta && S.meta.gifts) || []).slice(-1)[0]; if (g && Date.now() - g.t < 5000) chrAdd('beute', 'Beute an ' + (g.to === 'all' ? 'alle' : ((S.table[g.to] || {}).char || '?')) + ': ' + [g.xp && g.xp + ' EP', g.gm && g.gm + ' GM', g.item && MAGIC_ITEMS[g.item] && MAGIC_ITEMS[g.item].name, g.text && (g.text.length > 90 ? g.text.slice(0, 90).replace(/\s\S*$/, '') + ' …' : g.text)].filter(Boolean).join(', ')); }
      else if (a === 'grpRest') chrAdd('rast', t.dataset.arg === 'long' ? 'Lange Rast' : 'Kurze Rast');
      else if (a === 'advFlag') { const A = advCurA(); const f = A && (A.flags || []).find((x) => x.id === t.dataset.arg); const v = A && advSt(A.id).flags[t.dataset.arg]; if (f && v) chrAdd('wahl', f.label + ': ' + v); }
      else if (a === 'advChoice') { const A = advCurA(); const r = A && advBlockAt(A, t.dataset.arg); const st = A && advSt(A.id); const i = r && st.choice[r.b.key]; if (r && i != null && r.b.rows[i]) chrAdd('wahl', (r.b.title || 'Entscheidung') + ': ' + advPlain(r.b.rows[i].a || '')); }
    } catch (e) {}
  }, 60);
}, true);
/* Am Tisch beobachten: Helden am Boden, Tod, Stufenaufstieg, neue Ansagen */
function chrWatch() {
  if (!S.camp || !(typeof isDM === 'function' && isDM()) || typeof players !== 'function') return;
  S.chrSeen = S.chrSeen || {}; const fresh = !S.chrInit; S.chrInit = true;
  for (const [u, p] of players()) {
    if (!p || !p.char) continue; const prev = S.chrSeen[u];
    if (prev && !fresh) {
      if (p.hp <= 0 && prev.hp > 0 && !p.dead) chrAdd('boden', p.char + ' geht zu Boden');
      if (p.dead && !prev.dead) chrAdd('tod', p.char + ' stirbt');
      if (+p.level > +prev.level) chrAdd('stufe', p.char + ' erreicht Stufe ' + p.level);
      for (const a of p.ans || []) if (!(prev.ans || []).includes(a.id) && !ansSeen().includes(a.id)) bannerToast('Ansage von ' + p.char, String(a.x).slice(0, 120));
    }
    S.chrSeen[u] = { hp: p.hp, dead: !!p.dead, level: p.level, ans: (p.ans || []).map((a) => a.id) };
  }
}
setTimeout(() => { if (typeof paintCamp === 'function') { const p0 = paintCamp; paintCamp = function () { const r = p0.apply(this, arguments); try { chrWatch(); } catch (e) {} return r; }; } }, 0);
/* Werkzeuge der Spielleitung: Ansagen und Chronik oben; für Spieler das Ansagefeld */
if (typeof dmTools === 'function') { const _chDm0 = dmTools; dmTools = function () { const h = _chDm0.apply(this, arguments); if (!S.camp) return h; if (typeof isDM === 'function' && isDM()) { const cb = '<button class="btn sm ghost" data-act="chrOpen">📜 Chronik <small>' + chrList().filter((e) => e.k !== 'abend').length + '</small></button>'; return ansDmHtml(true) + (h.indexOf('<div class="slrow">') >= 0 ? h.replace('<div class="slrow">', '<div class="slrow">' + cb) : '<div class="slrow">' + cb + '</div>' + h); } return ansBox('camp') + h; }; }
