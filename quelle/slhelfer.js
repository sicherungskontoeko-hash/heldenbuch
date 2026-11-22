/* ==== Claude als Helfer der Spielleitung ====
   „Lage für Claude“: fasst Abenteuer-Szene, Gruppe, Kampf und letzte Würfe als Text zusammen – zum Kopieren oder Teilen in die Claude-App.
   In der claude.ai-Fassung (Fähigkeit „sample“) fragt der Assistent Claude direkt; die Antwort lässt sich kopieren oder als Handout teilen. */
const SL_ROLE = 'Du bist Co-Spielleiter bei einer D&D-Runde (Regeln 2024, SRD 5.2). Die Spielleitung fragt dich mitten im Spiel. ' +
  'Antworte auf Deutsch in Schweizer Rechtschreibung (ss statt ß), kurz und direkt am Tisch verwendbar: zuerst das, was die Spielleitung jetzt sagen oder entscheiden kann, dann höchstens drei knappe Punkte. ' +
  'Erfinde keine Regeln; wenn eine Regel unklar ist, sag es und schlag eine faire Entscheidung vor. Verrate Spielern keine Geheimnisse der Spielleitung, ausser sie fragt danach. Halte dich an Ton und Inhalt des Abenteuers.';
const SL_QUICK = [
  ['szene', 'Szene beschreiben', 'Beschreibe die aktuelle Szene stimmungsvoll in 3–4 Sätzen zum Vorlesen. Nutze, was die Helden gerade sehen, hören und riechen.'],
  ['taktik', 'Gegner diese Runde', 'Was tun die Gegner in dieser Runde sinnvollerweise? Pro Gegner ein Satz mit Ziel und Aktion, passend zu ihrem Wesen und ihren TP.'],
  ['nsc', 'NSC improvisieren', 'Improvisiere eine passende Nebenfigur für diese Szene: Name, ein Satz Aussehen, eine Eigenart, was sie will, ein typischer Satz.'],
  ['regel', 'Regelfrage', 'Regelfrage: '],
  ['weiter', 'Spieler stecken fest', 'Die Spieler wissen nicht weiter. Gib mir zwei sanfte Anstösse aus der Welt heraus, ohne die Lösung zu verraten.'],
  ['folge', 'Was folgt daraus?', 'Die Helden haben gerade Folgendes getan: … Was sind die Folgen in dieser Szene? Ein ehrlicher, spielbarer Vorschlag.']
];
const slTxt = (s) => String(s == null ? '' : s).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\s+/g, ' ').trim();
/* Text einer Abenteuer-Szene (Vorlesetexte, Hinweise, Proben), gekürzt */
function slSceneText(C, Sc, max) {
  const out = []; const add = (t) => { if (t) out.push(t); };
  const blk = (b) => {
    if (!b) return;
    if (b.t === 'p') add(slTxt(b.x));
    else if (b.t === 'vorlese') add('Vorlesetext: ' + (b.ps || []).map(slTxt).join(' '));
    else if (b.t === 'dm' || b.t === 'rp') add((b.title ? b.title + ': ' : '') + (b.items || []).map(slTxt).join(' '));
    else if (b.t === 'probe') add('Proben: ' + (b.rows || []).map((r) => slTxt(r[0]) + ' – ' + slTxt(r[1])).join('; '));
    else if (b.t === 'kampf') add('Kampf: ' + slTxt(b.title || ''));
  };
  (C.intro || []).forEach(blk); (Sc.blocks || []).forEach(blk);
  let t = out.join('\n'); if (t.length > max) t = t.slice(0, max).replace(/\s\S*$/, '') + ' …';
  return t;
}
function slLage(q) {
  const L = []; const d = new Date();
  L.push(SL_ROLE, '', '# Lage am Spieltisch (Heldenbuch, ' + d.toLocaleString('de-CH', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ')');
  /* Abenteuer */
  try {
    const db = typeof advDb === 'function' ? advDb() : null; const A = db && db.last && advGet(db.last);
    if (A) {
      const st = advSt(A.id); const C = advCh(A, st.ch); const Sc = advSc(C, st.sc);
      L.push('', '## Abenteuer', A.title + (A.sub ? ' – ' + A.sub : ''));
      /* Hintergrund für Claude: die Kurzfassung der Geschichte aus der Vorbereitung, falls vorhanden */
      let bg = null; for (const ch of A.chapters) for (const sc of ch.scenes) for (const b of sc.blocks || []) if (!bg && b.t === 'dm' && /fünf Sätzen|Worum es geht|Die Wahrheit/i.test(b.title || '')) bg = b;
      if (bg) { let t = (bg.items || []).map(slTxt).join(' '); if (t.length > 1400) t = t.slice(0, 1400).replace(/\s\S*$/, '') + ' …'; L.push('Hintergrund (nur für die Spielleitung): ' + t); }
      L.push('Jetzt: ' + (C.kicker || '') + (C.title ? ' «' + C.title + '»' : '') + ' · Szene: ' + Sc.title);
      const fl = (A.flags || []).filter((f) => st.flags[f.id]).map((f) => f.label + ': ' + st.flags[f.id]);
      const cn = Object.entries(st.cnt || {}).filter(([, v]) => v !== '' && v != null).map(([k, v]) => k + ' ' + v);
      if (fl.length) L.push('Entscheidungen bisher: ' + fl.join(' · '));
      if (cn.length) L.push('Zähler: ' + cn.join(' · '));
      L.push('', slSceneText(C, Sc, 2200));
    }
  } catch (e) {}
  /* Gruppe */
  const grp = [];
  if (S.camp && typeof players === 'function') for (const [, p] of players()) { if (!p || !p.char || p.char === 'SL') continue; grp.push('- ' + p.char + (p.clsName ? ' (' + p.clsName + ' ' + (p.level || '') + ')' : '') + ': TP ' + p.hp + '/' + p.hpMax + (p.temp ? ' +' + p.temp + ' temp.' : '') + ', RK ' + p.ac + (p.cond && p.cond.length ? ', ' + p.cond.join(', ') : '') + (p.dead ? ', tot' : '') + (p.pl ? ' – gespielt von ' + p.pl : '')); }
  else for (const ch of Object.values(S.chars || {}).slice(0, 6)) { try { const c = derive(ch, S.hb); grp.push('- ' + ch.name + ' (' + c.classLabel + '): TP ' + (ch.play.hp ?? c.hpMax) + '/' + c.hpMax + ', RK ' + c.ac + ((ch.play.cond || []).length ? ', ' + ch.play.cond.filter((k) => COND[k]).map((k) => COND[k].name).join(', ') : '')); } catch (e) {} }
  if (grp.length) L.push('', '## Gruppe', ...grp);
  /* Kampf */
  if (S.combat && S.combat.active && typeof order === 'function') {
    const o = order(); const now = typeof curEntry === 'function' ? curEntry() : null;
    L.push('', '## Kampf · Runde ' + (S.combat.round || 1) + (now ? ' · am Zug: ' + now.name : ''));
    o.forEach((x) => L.push('- ' + x.v + ' ' + x.name + (x.npc ? (x.ally ? ' (Verbündeter)' : ' (Gegner)') + ': TP ' + x.hp + '/' + x.hpMax + ', RK ' + x.ac + (x.cond && x.cond.length ? ', ' + x.cond.map((k) => (COND[k] || {}).name || k).join(', ') : '') : ': TP ' + x.hp + '/' + x.hpMax) + (x.dead ? ', tot' : '')));
  }
  /* Ansagen der Spieler und Chronik */
  const AO = typeof ansOpenList === 'function' ? ansOpenList() : [];
  if (AO.length) L.push('', '## Ansagen der Spieler (offen)', ...AO.map((a) => '- ' + a.who + ': ' + a.x));
  const CT = typeof chrText === 'function' ? chrText(40) : '';
  if (CT) L.push('', '## Chronik (was bisher geschah, neueste zuletzt)', CT);
  /* Würfe */
  const H = typeof histLoad === 'function' ? histLoad().slice(0, 10) : [];
  if (H.length) L.push('', '## Letzte Würfe', ...H.map((x) => '- ' + histTime(x.t) + ' ' + (x.who ? x.who + ': ' : '') + x.label + ' = ' + x.total + (x.detail ? ' (' + x.detail + ')' : '')));
  L.push('', '## Frage der Spielleitung', q && q.trim() ? q.trim() : '(Die Spielleitung stellt ihre Frage gleich.)');
  return L.join('\n');
}
async function slCopy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
}
/* Gibt es die direkte Claude-Anbindung? (nur in claude.ai mit der Fähigkeit „sample“) */
let SL_SAMPLE = null, SL_SAMPLE_ASKED = false;
function slSampleInit() { if (SL_SAMPLE_ASKED) return; SL_SAMPLE_ASKED = true; if (typeof isApp === 'function' && isApp()) return; try { if (window.claude && window.claude.use) window.claude.use('sample').then((s) => { SL_SAMPLE = s || null; if (S.modal === 'slh') slOpen(true); }).catch(() => {}); } catch (e) {} }
function slOpen(keep) {
  slSampleInit(); const m = $('#modal'); S.modal = 'slh'; S.more = false; document.querySelectorAll('details.mnu[open]').forEach((d) => { d.open = false; });
  const q = keep && $('#slQ') ? $('#slQ').value : (S.slQ || '');
  const chat = S.slChat || [];
  const direct = !!SL_SAMPLE;
  m.innerHTML = '<div class="dlg sldlg" role="dialog" aria-modal="true" aria-label="Claude als Spielleiter-Helfer"><div class="dph"><b>Claude · Helfer der Spielleitung</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' +
    '<p class="hint">' + (direct ? 'Claude kennt die aktuelle Szene, die Gruppe, den Kampf und die letzten Würfe. Frag, was du brauchst.' : 'Schreib deine Frage, dann «Lage kopieren» und in der Claude-App einfügen. Die Szene, die Gruppe, der Kampf und die letzten Würfe sind schon dabei.') + '</p>' +
    '<div class="chips slq">' + SL_QUICK.map(([k, l]) => '<button class="chip" data-act="slQuick" data-arg="' + k + '">' + l + '</button>').join('') + '</div>' +
    '<textarea id="slQ" rows="3" placeholder="Was passiert, was brauchst du? z. B. «Die Helden wollen den Elch mit einem Spiegel verwirren»">' + esc(q) + '</textarea>' +
    (chat.length ? '<div class="slchat" id="slChat">' + chat.map((x) => '<div class="slm ' + x.r + '">' + (x.r === 'a' ? slMd(x.t) : '<p>' + esc(x.q) + '</p>') + '</div>').join('') + '</div>' : '') +
    '<div class="chips end">' + (direct ? '<button class="btn ghost" data-act="slCopy">Lage kopieren</button>' + (chat.length ? '<button class="btn ghost" data-act="slReset">Neu beginnen</button>' : '') + '<button class="btn" data-act="slAsk" id="slAskBtn">Claude fragen</button>'
      : (navigator.share ? '<button class="btn ghost" data-act="slShare">Teilen …</button>' : '') + '<button class="btn" data-act="slCopy">Lage kopieren</button>') + '</div>' +
    '<details class="sllage"><summary>Was Claude erfährt</summary><pre>' + esc(slLage(q)) + '</pre></details></div>';
  m.hidden = false; const c = $('#slChat'); if (c) c.scrollTop = c.scrollHeight;
}
const slMd = (t) => esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').split(/\n{2,}/).map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');
async function slAsk() {
  const q = (($('#slQ') || {}).value || '').trim(); if (!q) { const e = $('#slQ'); if (e) e.focus(); return; }
  if (!SL_SAMPLE || S.slBusy) return; S.slBusy = true;
  S.slChat = (S.slChat || []).concat([{ r: 'q', q }]); const msgs = [];
  /* Gespräch: erste Frage mit voller Lage, Folgefragen mit aktualisierter Lage am Ende */
  const prev = S.slChat.slice(0, -1); for (const x of prev) msgs.push(x.r === 'q' ? { role: 'user', content: x.full || x.q } : { role: 'assistant', content: x.t });
  const full = slLage(q); S.slChat[S.slChat.length - 1].full = prev.length ? q + '\n\n(Aktuelle Lage:)\n' + slLage('').split('\n## Frage')[0] : full; msgs.push({ role: 'user', content: S.slChat[S.slChat.length - 1].full });
  const ans = { r: 'a', t: 'Claude denkt nach …' }; S.slChat.push(ans); S.slQ = ''; slOpen(); const qe = $('#slQ'); if (qe) qe.value = '';
  const paint = () => { const c = $('#slChat'); if (c && c.lastChild) { c.lastChild.innerHTML = slMd(ans.t); c.scrollTop = c.scrollHeight; } };
  try {
    const r = await SL_SAMPLE(msgs, { modelTier: 'default', cache: false, onText: ({ text }) => { ans.t = text; paint(); } });
    ans.t = (r && r.text) || ans.t; paint();
  } catch (e) {
    ans.t = e && e.code === 'not_granted' ? 'Claude ist für diese Seite nicht freigegeben. Nutze «Lage kopieren».' : e && e.code === 'rate_limited' ? 'Gerade zu viele Anfragen. Versuch es in einer Minute nochmals.' : 'Keine Antwort erhalten. «Lage kopieren» funktioniert immer.';
    if (e && e.code === 'not_granted') SL_SAMPLE = null;
  }
  S.slBusy = false; if (S.modal === 'slh') { slOpen(true); const btns = document.querySelectorAll('#slChat .slm.a'); const last = btns[btns.length - 1]; if (last && typeof isDM === 'function' && isDM() && S.camp) last.insertAdjacentHTML('beforeend', '<div class="chips"><button class="chip" data-act="slHo">Als Handout teilen</button><button class="chip" data-act="slCopyA">Kopieren</button></div>'); else if (last) last.insertAdjacentHTML('beforeend', '<div class="chips"><button class="chip" data-act="slCopyA">Kopieren</button></div>'); }
}
Object.assign(XA, {
  slOpen: () => slOpen(),
  slQuick: (t, a) => { const x = SL_QUICK.find((y) => y[0] === a); const e = $('#slQ'); if (!x || !e) return; e.value = x[2]; e.focus(); if (x[0] === 'regel' || x[0] === 'folge') { const i = x[0] === 'regel' ? e.value.length : e.value.indexOf('…'); e.setSelectionRange(i, i + (x[0] === 'folge' ? 1 : 0)); } },
  slCopy: async () => { const q = (($('#slQ') || {}).value || ''); S.slQ = q; const ok = await slCopy(slLage(q)); bannerToast(ok ? 'Lage kopiert' : 'Kopieren nicht möglich', ok ? 'In der Claude-App einfügen und abschicken.' : 'Öffne «Was Claude erfährt» und kopiere den Text von Hand.'); },
  slShare: async () => { const q = (($('#slQ') || {}).value || ''); try { await navigator.share({ title: 'Lage am Spieltisch', text: slLage(q) }); } catch (e) {} },
  slAsk: () => slAsk(),
  slReset: () => { S.slChat = []; slOpen(); },
  slCopyA: async () => { const a = (S.slChat || []).filter((x) => x.r === 'a').pop(); if (a) { const ok = await slCopy(a.t); bannerToast(ok ? 'Antwort kopiert' : 'Kopieren nicht möglich', ''); } },
  slHo: () => { const a = (S.slChat || []).filter((x) => x.r === 'a').pop(); if (!a || !(typeof isDM === 'function' && isDM()) || typeof saveMeta !== 'function') return; saveMeta({ handouts: ((S.meta && S.meta.handouts) || []).concat([{ id: uidX(), title: 'Von der Spielleitung', text: a.t, t: Date.now() }]).slice(-20) }); bannerToast('Handout geteilt', 'Die Antwort ist jetzt bei allen am Tisch unter Handouts.'); }
});
/* Knopf für die Spielleitung am Tisch und im Abenteuer */
const slBtn = (cls) => '<button class="btn sm ghost slbtn ' + (cls || '') + '" data-act="slOpen" title="Claude als Helfer der Spielleitung">✦ Claude fragen</button>';
if (typeof dmTools === 'function') { const _slDm0 = dmTools; dmTools = function () { const h = _slDm0.apply(this, arguments); return h && typeof isDM === 'function' && isDM() ? '<div class="slrow">' + slBtn() + '<span class="hint">Szene, Gruppe, Kampf und Würfe gehen mit.</span></div>' + h : h; }; }
