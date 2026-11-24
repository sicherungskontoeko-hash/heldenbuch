/* ---------- Kleine Bedien-Animationen (Effekte 2.0, Schritt 4) ----------
   Nur Deckkraft und Verschiebung, kurze feste Dauern, kein «transition: all», kein dauerndes will-change.
   Ausgelöst nur bei echten Ereignissen, nie bei jedem Neuzeichnen:
   Dialog öffnet (180 ms), Menü öffnet (150 ms), Aufklappen (150 ms), Bogen-Reiter wechselt (120 ms),
   Held wechselt (200 ms), Knopf gedrückt (80 ms), Meldung erscheint (200 ms), Stimmung wechselt (400 ms Überblenden,
   erst wenn das neue Bild dekodiert ist; höchstens zwei Hintergrundbilder gleichzeitig; Energiesparend: direkt).
   Schalter «Bedien-Animationen» (Grundwert an); reduzierte Bewegung schaltet alles ab. */
function vfxUiOn() { return typeof vfxLoad === 'function' && vfxLoad().menu !== false && !(typeof vfxReduce === 'function' && vfxReduce()); }
function vfxUiApply() { document.documentElement.setAttribute('data-anim', vfxUiOn() ? 'an' : 'aus'); }
function vfxPulse(el, cls, ms) { if (!el || !vfxUiOn()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); clearTimeout(el['_t' + cls]); el['_t' + cls] = setTimeout(() => el.classList.remove(cls), ms); }
const VFX_UI = { cur: null, mg: null, view: null };
(function vfxUiWatch() {
  const start = () => {
    vfxUiApply();
    const view = document.getElementById('view'), modal = document.getElementById('modal');
    if (view && typeof MutationObserver === 'function') new MutationObserver(() => {
      if (typeof S === 'undefined') return; const heroNew = VFX_UI.cur !== null && S.cur !== VFX_UI.cur && S.view === VFX_UI.view; const tabNew = VFX_UI.mg !== null && S.view === 'sheet' && VFX_UI.view === 'sheet' && S.mg !== VFX_UI.mg && !heroNew;
      VFX_UI.cur = S.cur; VFX_UI.mg = S.mg; VFX_UI.view = S.view;
      if (heroNew) vfxPulse(view, 'vfx-hero', 220); else if (tabNew) vfxPulse(view.querySelector('.sheet .cols'), 'vfx-sec', 140);
    }).observe(view, { childList: true });
    if (modal && typeof MutationObserver === 'function') new MutationObserver(() => { if (!modal.hidden && !modal._open) { modal._open = true; vfxPulse(modal, 'vfx-open', 200); } if (modal.hidden) modal._open = false; }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
    const mini = document.getElementById('mini'); if (mini && typeof MutationObserver === 'function') new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('mt')) vfxPulse(n, 'vfx-msg', 220); }).observe(mini, { childList: true });
    if (typeof S !== 'undefined') { VFX_UI.cur = S.cur; VFX_UI.mg = S.mg; VFX_UI.view = S.view; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
})();
/* Menüs und Aufklapper: nur beim Öffnen */
document.addEventListener('toggle', (ev) => { const d = ev.target; if (!d || d.tagName !== 'DETAILS' || !d.open) return; vfxPulse(d, d.classList.contains('mnu') ? 'vfx-menu' : 'vfx-unfold', 170); }, true);
/* Stimmungswechsel: altes Bild liegt darüber, bis das neue dekodiert ist, dann 400 ms Überblenden */
function vfxThemeFade(old, now) {
  if (!vfxUiOn() || !old || old === now || typeof THEME_SCENES === 'undefined' || !THEME_SCENES[old] || (typeof vfxTier === 'function' && vfxTier() === 'eco')) return;
  const sc = document.getElementById('scene'); if (!sc) return; document.querySelectorAll('.scenefade').forEach((x) => x.remove());
  const o = THEME_SCENES[old]; const f = document.createElement('div'); f.className = 'scenefade'; f.setAttribute('aria-hidden', 'true');
  f.style.cssText = 'background:var(--scene-' + old + ') ' + (o.pos || 'center center') + '/cover no-repeat;opacity:' + (o.op || '.42');
  sc.appendChild(f); const go = () => { if (!f.isConnected) return; f.classList.add('go'); setTimeout(() => f.remove(), 460); };
  const n = THEME_SCENES[now] && THEME_SCENES[now].img; if (!n) return go(); const img = new Image(); img.src = n;
  const t = setTimeout(go, 700); (img.decode ? img.decode() : Promise.resolve()).then(() => { clearTimeout(t); go(); }, () => { clearTimeout(t); go(); });
}
