/* ==== Nur Android-App: holt neue Versionen selbst von der Web-App (GitHub Pages) ====
   Ablauf: Beim Start läuft die neueste gespeicherte Version (oder die eingebaute, falls diese neuer ist).
   Nach dem Start wird im Hintergrund geprüft, ob es online eine neuere gibt; sie wird gespeichert und
   ist beim nächsten Öffnen aktiv (oder sofort über „Jetzt neu laden“). Helden bleiben gespeichert,
   weil die App ihre Adresse (localhost) dabei nicht wechselt.
   Sicherung: Startet eine heruntergeladene Version nicht sauber, wird sie verworfen und die eingebaute genutzt. */
(function () {
  var BUILD = __HB_BUILD__, VER = '__HB_VERSION__';
  var REMOTE = 'https://sicherungskontoeko-hash.github.io/heldenbuch/';
  var C = window.Capacitor; var native = !!(C && (typeof C.isNativePlatform === 'function' ? C.isNativePlatform() : C.isNative));
  if (window.HB_BOOT_TEST) native = true; /* nur für Tests */
  window.HB_BUILD = BUILD; window.HB_VER = VER;
  if (!native || !('caches' in window)) return;
  if (window.HB_BOOT_TEST && window.HB_BOOT_TEST.remote) REMOTE = window.HB_BOOT_TEST.remote;
  var K = 'hb_remote', KP = 'hb_boot_pending';
  function meta() { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } }
  function setMeta(m) { try { if (m) localStorage.setItem(K, JSON.stringify(m)); else localStorage.removeItem(K); } catch (e) {} }
  function drop() { setMeta(null); try { localStorage.removeItem(KP); } catch (e) {} try { caches.delete('hb-remote'); } catch (e) {} }
  function complete(h) { var e = '<!--HB_' + 'END-->'; return !!h && h.lastIndexOf(e) > h.length - 200; }
  var m = meta(); var pending = null; try { pending = localStorage.getItem(KP); } catch (e) {}
  /* 1. Start: gespeicherte neuere Version verwenden? */
  if (m && m.build > BUILD) {
    if (pending && +pending === m.build) { drop(); m = null; } /* letzter Start damit ist gescheitert */
    else {
      try { localStorage.setItem(KP, String(m.build)); } catch (e) {}
      document.write('<plaintext style="display:none">'); /* Rest der eingebauten Seite nicht mehr ausführen */
      caches.open('hb-remote').then(function (c) { return c.match('app'); }).then(function (r) { return r ? r.text() : null; }).then(function (html) {
        if (!complete(html)) { drop(); location.reload(); return; }
        document.open(); document.write(html); document.close();
      }).catch(function () { drop(); location.reload(); });
      return;
    }
  }
  /* 2. Diese Version läuft: nach erfolgreichem Start Markierung löschen, dann online nach Neuem schauen */
  var tries = 0;
  (function ok() {
    if (!document.getElementById('view') || !document.querySelector('#view *')) { if (++tries < 20) setTimeout(ok, 1000); return; }
    try { if (+localStorage.getItem(KP) === BUILD) localStorage.removeItem(KP); } catch (e) {}
    if (m && m.build < BUILD) drop(); /* eingebaute Version ist neuer als die gespeicherte */
    setTimeout(check, 1500);
  })();
  function check() {
    fetch(REMOTE + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (v) {
      if (!v || !(v.build > BUILD)) return;
      var cur = meta(); if (cur && cur.build >= v.build) return offer(cur);
      return fetch(REMOTE + 'index.html?b=' + v.build, { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : null; }).then(function (html) {
        if (!complete(html) || html.length < 500000) return;
        return caches.open('hb-remote').then(function (c) { return c.put('app', new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })); }).then(function () {
          var nm = { build: v.build, version: v.version, at: Date.now() }; setMeta(nm); offer(nm);
        });
      });
    }).catch(function () { /* offline: nichts tun */ });
  }
  function offer(nm) {
    if (document.getElementById('hbUpd')) return;
    var d = document.createElement('div'); d.id = 'hbUpd';
    d.setAttribute('style', 'position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:60;max-width:420px;margin:0 auto;display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--raised,#2B2018);border:1px solid var(--line2,rgba(222,176,104,.32));color:var(--ink,#F1E6D0);box-shadow:0 12px 40px rgba(0,0,0,.5);font-size:.9rem');
    d.innerHTML = '<span style="flex:1">Neue Version ' + String(nm.version || '').replace(/[<>&"]/g, '') + ' geladen – aktiv beim nächsten Öffnen.</span><button type="button" style="border:1px solid var(--gold,#E2AE52);background:var(--gold,#E2AE52);color:var(--gold-ink,#1a1208);border-radius:9px;padding:6px 10px;font-weight:700">Jetzt</button><button type="button" aria-label="Später" style="border:0;background:none;color:inherit;font-size:1.2rem;padding:0 4px">×</button>';
    var bs = d.querySelectorAll('button'); bs[0].onclick = function () { location.reload(); }; bs[1].onclick = function () { d.remove(); };
    document.body.appendChild(d);
  }
})();
