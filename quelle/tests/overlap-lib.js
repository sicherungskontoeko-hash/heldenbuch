/* Prüft, ob Inhalte dauerhaft verdeckt sind.
   Regel: Jedes Bedienelement und jeder Text muss in mindestens einer Scrollposition vollständig und unverdeckt
   sichtbar sein (Kopfleisten, untere Navigation, schwebende Knöpfe, Rückgängig-Knöpfe usw. dürfen nichts
   dauerhaft überdecken). Zusätzlich: kein waagrechtes Scrollen der Seite, keine abgeschnittenen Knopfbeschriftungen.
   Verwendung: const { scan } = require('./overlap-lib'); const r = await scan(page, 'Handy 360: Bogen Kampf'); */

const scanInPage = async () => {
  const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const st = document.createElement('style'); st.id = 'ovscan';
  st.textContent = '*,*::before,*::after{pointer-events:auto!important;transition:none!important;animation:none!important;scroll-behavior:auto!important}';
  document.head.appendChild(st);
  const DECOR = new Set(['scene', 'embers', 'vfx', 'burst', 'ovscan']);
  const TRANSIENT = '#toast,#prompt,#mini,#pfBk,#warnfab';
  const modal = document.getElementById('modal');
  const modalOpen = !!(modal && !modal.hidden && modal.innerHTML.trim());
  const root = modalOpen ? modal : document.body;
  const vw = window.innerWidth, vh = window.innerHeight;
  const csC = new Map(); const cs = (e) => { let c = csC.get(e); if (!c) { c = getComputedStyle(e); csC.set(e, c); } return c; };
  const alpha = (col) => { const m = /rgba?\(([^)]+)\)/.exec(col || ''); if (!m) return 0; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? +p[3] : 1; };
  const hasText = (e) => { for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim().length > 0) return true; return false; };
  const effOp = new Map(); const faded = (e) => { if (effOp.has(e)) return effOp.get(e); let v = false; for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const c = cs(x); if (+c.opacity < 0.05 || c.visibility === 'hidden') { v = true; break; } } effOp.set(e, v); return v; };
  const opaque = (e0) => {
    const e = e0.closest && e0.closest('svg') ? e0.closest('svg') : e0; /* SVG-Teile zählen als ihr Bild */
    if (e.id && DECOR.has(e.id)) return false;
    if (faded(e)) return false;
    if (e.tagName === 'CANVAS') return false;
    const c = cs(e); if (c.visibility === 'hidden' || +c.opacity < 0.05) return false;
    if (/^(IMG|svg|INPUT|SELECT|TEXTAREA|BUTTON|VIDEO)$/.test(e.tagName)) return true;
    if (alpha(c.backgroundColor) > 0.3) return true;
    if (c.backgroundImage && c.backgroundImage !== 'none') return true;
    if (c.backdropFilter && c.backdropFilter !== 'none') return true;
    return hasText(e);
  };
  const desc = (e) => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].slice(0, 3).join('.') : '')) + (e.dataset && e.dataset.act ? '[' + e.dataset.act + ']' : '');
  const label = (e) => ((e.getAttribute && (e.getAttribute('aria-label') || e.getAttribute('title'))) || e.innerText || e.value || e.placeholder || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  const hidden = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const c = cs(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.1) return true; if (x.tagName === 'DETAILS' && !x.open && x !== e && !(e.closest('summary') && e.closest('summary').parentElement === x)) return true; } return false; };
  const all = [...root.querySelectorAll('*')];
  const cand = all.filter((e) => {
    if (e.closest(TRANSIENT)) return false; if (e.id && DECOR.has(e.id)) return false; if (e.closest('#scene,#embers,#vfx,#burst')) return false;
    if (/^(SCRIPT|STYLE|svg|path|g|circle|rect|polygon|line|use|defs|OPTION|BR)$/.test(e.tagName) || e.closest('svg')) return false;
    const inter = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(e.tagName) || (e.dataset && e.dataset.act);
    if (!inter && !hasText(e)) return false;
    if (e.tagName === 'INPUT' && e.type === 'hidden') return false;
    if (!e.getClientRects().length) return false;
    const r = e.getBoundingClientRect(); if (r.width < 6 || r.height < 6) return false;
    return !hidden(e);
  });
  const clipRect = (e) => {
    const r = e.getBoundingClientRect(); let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const c = cs(a); if (c.overflowX !== 'visible' || c.overflowY !== 'visible') { const q = a.getBoundingClientRect(); if (c.overflowX !== 'visible') { x0 = Math.max(x0, q.left); x1 = Math.min(x1, q.right); } if (c.overflowY !== 'visible') { y0 = Math.max(y0, q.top); y1 = Math.min(y1, q.bottom); } }
    }
    return { r, x0: Math.max(x0, 0), y0: Math.max(y0, 0), x1: Math.min(x1, vw), y1: Math.min(y1, vh) };
  };
  const coverAt = (e, x, y) => {
    const L = document.elementsFromPoint(x, y);
    for (const h of L) {
      if (h === e || e.contains(h)) return null;
      if (h.contains(e)) return null; /* Rahmen des Elements erreicht: darüber liegt nichts Fremdes */
      if (h.id === 'ovscan') continue;
      /* WebKit trifft Text auch über der Zeile (Oberlänge der Schrift): liegt der Punkt ausserhalb des Kastens eines
         Geschwisters im selben Rahmen, verdeckt es nichts Sichtbares */
      { const q = h.getBoundingClientRect(); if ((x < q.left - 1 || x > q.right + 1 || y < q.top - 1 || y > q.bottom + 1) && h.parentElement && h.parentElement === e.parentElement) continue; }
      if (!opaque(h)) continue;
      /* Eingebettetes Symbol (z. B. ⓘ im Chip): liegt ganz innerhalb des Elements und im selben Rahmen – gewollt */
      const er = e.getBoundingClientRect(), hr = h.getBoundingClientRect();
      if (hr.left >= er.left - 2 && hr.right <= er.right + 2 && hr.top >= er.top - 2 && hr.bottom <= er.bottom + 2 && hr.width * hr.height < er.width * er.height * 0.4 && e.parentElement && e.parentElement.contains(h)) continue;
      return h;
    }
    return 'leer';
  };
  /* frei: mindestens 90 % der Höhe und Breite sichtbar (bei sehr grossen Elementen 80 % des Bildschirms) und alle Prüfpunkte unverdeckt */
  const textRect = (e) => { try { const rg = document.createRange(); rg.selectNodeContents(e); const q = rg.getBoundingClientRect(); if (q.width > 2 && q.height > 2) return q; } catch (x) {} return null; };
  const test = (e) => {
    const inter = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(e.tagName);
    const k = clipRect(e); let { r } = k;
    if (!inter) { const q = textRect(e); if (q) { r = q; k.x0 = Math.max(k.x0, q.left); k.x1 = Math.min(k.x1, q.right); k.y0 = Math.max(k.y0, q.top); k.y1 = Math.min(k.y1, q.bottom); } } const w = k.x1 - k.x0, h = k.y1 - k.y0;
    if (w <= 2 || h <= 2) return { ok: false, why: 'ausserhalb' };
    const needH = Math.min(r.height * 0.9, vh * 0.8), needW = Math.min(r.width * 0.9, vw * 0.9);
    if (h < needH || w < needW) return { ok: false, why: 'teilweise' };
    const pts = [[0.5, 0.5], [0.1, 0.5], [0.9, 0.5], [0.5, 0.15], [0.5, 0.85]];
    for (const [fx, fy] of pts) {
      const x = Math.min(k.x1 - 2, Math.max(k.x0 + 2, k.x0 + w * fx)), y = Math.min(k.y1 - 2, Math.max(k.y0 + 2, k.y0 + h * fy));
      const c = coverAt(e, x, y); if (c && c !== 'leer') return { ok: false, why: 'verdeckt', by: c };
    }
    return { ok: true };
  };
  const scroller = document.scrollingElement || document.documentElement;
  const maxY = Math.max(0, scroller.scrollHeight - vh);
  const open = new Set(cand); const last = new Map();
  const ys = []; for (let y = 0; y < maxY; y += Math.max(120, Math.round(vh * 0.35))) ys.push(y); ys.push(maxY);
  const sy0 = scroller.scrollTop;
  for (const y of modalOpen ? [sy0] : ys) {
    scroller.scrollTop = y; await raf();
    for (const e of [...open]) { const t = test(e); if (t.ok) open.delete(e); else last.set(e, t); }
    if (!open.size) break;
  }
  for (const e of [...open]) {
    for (const opt of [{ block: 'center', inline: 'center' }, { block: 'start', inline: 'start' }, { block: 'end', inline: 'end' }, { block: 'nearest', inline: 'nearest' }]) {
      e.scrollIntoView(opt); await raf(); const t = test(e); if (t.ok) { open.delete(e); break; } last.set(e, t);
    }
  }
  /* Nur das oberste betroffene Element melden (nicht jedes Kind einzeln) */
  const bad = [...open].filter((e) => ![...open].some((o) => o !== e && o.contains(e)));
  const res = bad.filter((e) => (last.get(e) || {}).why === 'verdeckt').map((e) => { const t = last.get(e); const r = e.getBoundingClientRect(); return { el: desc(e), text: label(e), by: t.by ? desc(t.by) + (t.by.closest ? ' in ' + desc(t.by.closest('#top,#bnav,.shbar,.mnav,#diceFab,.udo,#modal,.dlg') || t.by) : '') : '', at: [r.left, r.top, r.width, r.height].map(Math.round).join(',') }; });
  /* Unerreichbar: Bedienelemente, die sich in keiner Scrollposition ganz zeigen lassen (z. B. Fenster höher als der Bildschirm) */
  const unreach = bad.filter((e) => /^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|A)$/.test(e.tagName) && /^(ausserhalb|teilweise)$/.test((last.get(e) || {}).why) && e.getBoundingClientRect().height < vh * 0.8).map((e) => ({ el: desc(e), text: label(e), by: 'nicht erreichbar (' + last.get(e).why + ')', at: '' }));
  res.push(...unreach);
  /* Abgeschnittene Beschriftungen von Knöpfen und Reitern */
  const cut = cand.filter((e) => /^(BUTTON|A|SUMMARY)$/.test(e.tagName) && e.scrollWidth > e.clientWidth + 3 && cs(e).overflowX !== 'visible' && (e.innerText || '').trim().length > 1).map((e) => ({ el: desc(e), text: label(e) }));
  const hscroll = document.documentElement.scrollWidth > vw + 1;
  scroller.scrollTop = sy0; st.remove();
  /* Bei Querscrollen die Verursacher nennen (äusserste rechte Kanten), damit Fehler aus anderen Browsern lesbar sind */
  const wide = hscroll ? [...document.querySelectorAll('body *')].map((e) => [e, e.getBoundingClientRect()]).filter(([e, q]) => q.width && q.right > vw + 1).sort((a, c) => c[1].right - a[1].right).slice(0, 6).map(([e, q]) => e.tagName + '.' + String(e.className).slice(0, 30) + ' r=' + Math.round(q.right) + ' w=' + Math.round(q.width) + ' «' + (e.textContent || '').trim().slice(0, 24) + '»') : [];
  return { n: cand.length, covered: res, cut, hscroll, wide };
};

async function scan(page, name) {
  const r = await page.evaluate(scanInPage);
  r.name = name; return r;
}
module.exports = { scan, scanInPage };
