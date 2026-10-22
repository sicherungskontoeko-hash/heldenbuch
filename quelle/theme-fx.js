/* ==== Stimmungen: kräftige Verzierungen, Licht-Ebenen und Reaktionen auf kritische Würfe ==== */
const SVGU = (s) => 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
const CARDS = '.panel,.blk,.hero,.comp,.mob,.dlg,.summary,.themep';
(function themeFxCss() {
  const T = (k) => 'html[data-theme="' + k + '"]:not([data-fx="dezent"])';
  const all = (k, sel) => sel.split(',').map((x) => T(k) + ' ' + x.trim()).join(',');
  let c = '';
  c += '#scene::before{transition:filter .45s ease,opacity .45s ease}';
  c += 'html[data-theme=\"warm\"] #scene::before{filter:saturate(1.08) contrast(1.04) brightness(.88)}';
  c += 'html[data-theme=\"episch\"] #scene::before{filter:saturate(1.06) contrast(1.05) brightness(.86)}';
  c += 'html[data-theme=\"gruselig\"] #scene::before{filter:saturate(.92) contrast(1.08) brightness(.74)}';
  c += 'html[data-theme=\"romantisch\"] #scene::before{filter:saturate(1.08) contrast(1.03) brightness(.9)}';
  c += 'html[data-theme=\"lustig\"] #scene::before{filter:saturate(1.18) contrast(1.06) brightness(.92)}';
  c += 'html[data-theme=\"kalt\"] #scene::before{filter:saturate(1.04) contrast(1.05) brightness(.86)}';
  c += 'html[data-theme=\"blutig\"] #scene::before{filter:saturate(1.02) contrast(1.12) brightness(.76)}';
  c += 'html[data-theme=\"mystisch\"] #scene::before{filter:saturate(1.1) contrast(1.06) brightness(.8)}';
  c += 'html[data-theme=\"wueste\"] #scene::before{filter:saturate(1.04) contrast(1.03) brightness(.9)}';
  c += '#vfx{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}#vfx::before,#vfx::after{content:"";position:absolute;inset:0}#burst{position:fixed;inset:0;pointer-events:none;z-index:31;overflow:hidden}';
  c += '@keyframes hbShine{to{background-position:200% 0}}@keyframes hbSway{0%,100%{transform:rotate(-4deg) scale(1.1)}50%{transform:rotate(4deg) scale(1.1)}}@keyframes hbPulse{0%,100%{opacity:.55}14%{opacity:1}28%{opacity:.6}42%{opacity:.95}}@keyframes hbFlicker{0%,100%{opacity:1}41%{opacity:1}42%{opacity:.55}43%{opacity:1}77%{opacity:1}78%{opacity:.7}80%{opacity:1}}@keyframes hbAurora{0%{transform:translateX(-12%) skewX(-8deg)}50%{transform:translateX(12%) skewX(8deg)}100%{transform:translateX(-12%) skewX(-8deg)}}@keyframes hbNebula{0%{transform:scale(1.2) rotate(0)}100%{transform:scale(1.2) rotate(360deg)}}@keyframes hbHue{0%{filter:hue-rotate(0)}100%{filter:hue-rotate(360deg)}}@keyframes hbBob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-3px) rotate(1deg)}}@keyframes hbHeat{0%{transform:translateY(0)}100%{transform:translateY(-40px)}}@keyframes hbCandle{0%,100%{opacity:.75}20%{opacity:.9}40%{opacity:.7}60%{opacity:.95}80%{opacity:.8}}@keyframes hbShake{0%,100%{transform:none}20%{transform:translate(-6px,2px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-4px,1px)}80%{transform:translate(3px,-1px)}}@keyframes hbFlash{0%{opacity:0}8%{opacity:1}16%{opacity:.15}24%{opacity:.9}100%{opacity:0}}@keyframes hbGrow{0%{transform:translate(-50%,-50%) scale(.2);opacity:0}15%{opacity:1}100%{transform:translate(-50%,-50%) scale(2.6);opacity:0}}@keyframes hbSplat{0%{transform:translate(-50%,-50%) scale(.2) rotate(0);opacity:0}12%{transform:translate(-50%,-50%) scale(1.15) rotate(8deg);opacity:.95}70%{opacity:.85}100%{transform:translate(-50%,-50%) scale(1.2) rotate(8deg);opacity:0}}';
  c += '.shake{animation:hbShake .4s}.bfx{position:absolute;inset:0}.bfx.flash{animation:hbFlash 1.1s forwards}.bfx.ring{inset:auto;left:50%;top:45%;width:60vmin;height:60vmin;border-radius:50%;animation:hbGrow 1.2s ease-out forwards}';
  c += '.bfx.ring2{inset:auto;left:50%;top:45%;width:60vmin;height:60vmin;border-radius:50%;animation:hbGrow 1.3s ease-out both}';
  c += '.bfx.rays{inset:auto;left:50%;top:45%;width:260vmax;height:260vmax;background:repeating-conic-gradient(from 0deg,transparent 0 7deg,rgba(var(--gold-rgb),.5) 7deg 10deg);-webkit-mask:radial-gradient(circle,#000 0,rgba(0,0,0,.6) 12%,transparent 30%);mask:radial-gradient(circle,#000 0,rgba(0,0,0,.6) 12%,transparent 30%);animation:hbRays 2s ease-out forwards}';
  c += '.bfx.core{inset:auto;left:50%;top:45%;width:90vmin;height:90vmin;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(var(--gold-rgb),.7) 18%,transparent 60%);animation:hbCore .9s ease-out forwards}';
  c += '.bfx.edge{box-shadow:inset 0 0 140px 40px rgba(var(--gold-rgb),.85);animation:hbFlash 1.6s forwards}';
  c += '.punch{animation:hbPunch .5s cubic-bezier(.2,1.6,.4,1)}';
  c += '@keyframes hbRays{0%{opacity:0;transform:translate(-50%,-50%) rotate(0) scale(.5)}12%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) rotate(50deg) scale(1.05)}}@keyframes hbCore{0%{opacity:0;transform:translate(-50%,-50%) scale(.1)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.6)}}@keyframes hbStamp{0%{transform:translate(-50%,-50%) scale(3.4) rotate(-8deg);opacity:0;filter:blur(10px)}13%{transform:translate(-50%,-50%) scale(.9) rotate(2deg);opacity:1;filter:blur(0)}21%{transform:translate(-50%,-50%) scale(1.07) rotate(-1deg)}29%{transform:translate(-50%,-50%) scale(1) rotate(0)}80%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.3)}}@keyframes hbPunch{0%,100%{transform:none}25%{transform:scale(1.03)}55%{transform:scale(.995)}}';
  c += 'html[data-fx="aus"] #embers,html[data-fx="aus"] #vfx{display:none}';

  /* WARM: flackerndes Kerzenlicht */
  c += T('warm') + ' #vfx::before{background:radial-gradient(ellipse at 50% 110%,rgba(255,140,40,.22),transparent 55%),radial-gradient(ellipse at 50% 50%,transparent 45%,rgba(0,0,0,.55) 100%);animation:hbCandle 3.2s infinite}';
  c += all('warm', CARDS) + '{box-shadow:0 0 0 1px rgba(226,130,60,.12),0 18px 50px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,200,120,.08)}';
  c += T('warm') + ' h1{text-shadow:0 0 24px rgba(255,150,60,.55),0 2px 0 rgba(0,0,0,.6)}';

  /* EPISCH: Gottesstrahlen, Goldfiligran, glänzende Schrift */
  c += T('episch') + ' #vfx::before{top:-30%;background:repeating-conic-gradient(from 190deg at 50% 0%,rgba(255,226,140,.13) 0deg 3deg,transparent 3deg 11deg);-webkit-mask:radial-gradient(ellipse at 50% 0%,#000 10%,transparent 70%);mask:radial-gradient(ellipse at 50% 0%,#000 10%,transparent 70%);animation:hbSway 18s ease-in-out infinite;transform-origin:50% 0}';
  c += T('episch') + ' #vfx::after{background:radial-gradient(ellipse at 50% -10%,rgba(255,215,110,.28),transparent 50%),radial-gradient(ellipse at 50% 50%,transparent 50%,rgba(0,0,20,.6) 100%)}';
  c += all('episch', CARDS) + '{position:relative;border-color:rgba(240,193,75,.5);box-shadow:inset 0 0 0 3px rgba(10,15,30,.9),inset 0 0 0 4px rgba(240,193,75,.28),0 0 30px rgba(240,193,75,.12),0 20px 50px rgba(0,0,0,.5)}';
  c += T('episch') + ' h1,' + T('episch') + ' .hero-intro h1{background:linear-gradient(100deg,#c9921f,#fff2c4 25%,#f0c14b 40%,#fffbe8 50%,#d9a12a 60%,#ffe38f 80%,#c9921f);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 16px rgba(240,193,75,.55));animation:hbShine 7s linear infinite}';
  c += T('episch') + ' .btn:not(.ghost):not(.dmg):not(.heal):not(.danger){background:linear-gradient(100deg,#c9921f,#ffe38f 45%,#fff6d0 50%,#f0c14b 55%,#c9921f);background-size:220% 100%;animation:hbShine 5s linear infinite;box-shadow:0 0 18px rgba(240,193,75,.45)}';

  /* GRUSELIG: Nebel, Spinnweben, Flackern, Blitze */
  c += T('gruselig') + ' #vfx::before{background:radial-gradient(ellipse at 50% 120%,rgba(120,200,110,.22),transparent 55%),radial-gradient(ellipse at 50% 45%,transparent 35%,rgba(0,0,0,.82) 100%)}';
  c += T('gruselig') + ' #vfx::after{background:rgba(220,255,220,.9);opacity:0}' + T('gruselig') + ' #vfx.flash::after{animation:hbFlash .9s}';
  c += all('gruselig', CARDS) + '{position:relative;border-color:rgba(166,207,140,.22);box-shadow:inset 0 0 40px rgba(0,0,0,.65),0 0 24px rgba(120,200,110,.07),0 20px 50px rgba(0,0,0,.6)}';
  c += T('gruselig') + ' h1,' + T('gruselig') + ' h2{text-shadow:0 0 14px rgba(170,255,160,.55),0 0 2px rgba(0,0,0,.9);animation:hbFlicker 5s infinite}';

  /* ROMANTISCH: Bokeh, Ornamente, sanftes Rosé */
  c += T('romantisch') + ' #vfx::before{background:radial-gradient(circle at 12% 22%,rgba(255,160,190,.22) 0 60px,transparent 61px),radial-gradient(circle at 82% 18%,rgba(255,200,170,.18) 0 90px,transparent 91px),radial-gradient(circle at 70% 78%,rgba(230,140,200,.16) 0 120px,transparent 121px),radial-gradient(circle at 25% 80%,rgba(255,180,200,.14) 0 70px,transparent 71px);filter:blur(18px);animation:hbBob 9s ease-in-out infinite}';
  c += T('romantisch') + ' #vfx::after{background:radial-gradient(ellipse at 50% 50%,transparent 50%,rgba(40,5,20,.55) 100%)}';
  c += all('romantisch', CARDS) + '{position:relative;border-radius:26px;border-color:rgba(235,180,162,.45);box-shadow:0 0 0 1px rgba(255,210,220,.08) inset,0 0 36px rgba(221,118,144,.16),0 20px 50px rgba(0,0,0,.45)}';
  c += T('romantisch') + ' h1{font-style:italic;background:linear-gradient(90deg,#f5c6b8,#fff0ea,#e89aae,#fadbd0);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 14px rgba(221,118,144,.5))}';

  /* LUSTIG: Regenbogen, Wackeln, dicke Knöpfe */
  c += T('lustig') + ' #vfx::before{inset:-20%;background:radial-gradient(circle at 20% 30%,rgba(255,107,154,.35),transparent 40%),radial-gradient(circle at 80% 25%,rgba(79,209,197,.32),transparent 40%),radial-gradient(circle at 50% 85%,rgba(255,210,63,.28),transparent 45%);animation:hbNebula 40s linear infinite}';
  c += all('lustig', CARDS) + '{border:3px solid transparent;border-radius:24px;background:linear-gradient(180deg,var(--surface),var(--bg2)) padding-box,linear-gradient(90deg,#ff6b9a,#ffd23f,#7be07b,#4fd1c5,#a08cff,#ff6b9a) border-box;box-shadow:0 8px 0 rgba(0,0,0,.35),0 20px 40px rgba(0,0,0,.35)}';
  c += all('lustig', '.hero:nth-child(odd),.blk:nth-child(odd)') + '{transform:rotate(-.6deg)}' + all('lustig', '.hero:nth-child(even),.blk:nth-child(even)') + '{transform:rotate(.6deg)}';
  c += all('lustig', '.hero:hover,.chip:hover,.btn:hover') + '{animation:hbBob .5s ease-in-out infinite}';
  c += T('lustig') + ' .btn:not(.ghost){border-radius:16px;box-shadow:0 5px 0 #b8901a,0 8px 18px rgba(0,0,0,.35);transform:translateY(-2px)}' + T('lustig') + ' .btn:not(.ghost):active{transform:translateY(3px);box-shadow:0 1px 0 #b8901a}';
  c += T('lustig') + ' h1{background:linear-gradient(90deg,#ff6b9a,#ffd23f,#7be07b,#4fd1c5,#a08cff,#ff6b9a);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;animation:hbShine 4s linear infinite;filter:drop-shadow(0 3px 0 rgba(0,0,0,.45))}';

  /* KALT: Polarlicht, Eiszapfen, Frostglas */
  c += T('kalt') + ' #vfx::before{top:-10%;bottom:55%;background:linear-gradient(100deg,transparent 10%,rgba(90,255,200,.22) 25%,rgba(120,180,255,.25) 40%,transparent 55%,rgba(160,120,255,.18) 70%,transparent 85%);filter:blur(30px);animation:hbAurora 16s ease-in-out infinite}';
  c += T('kalt') + ' #vfx::after{background:radial-gradient(ellipse at 50% 50%,transparent 45%,rgba(200,235,255,.16) 85%,rgba(230,248,255,.32) 100%)}';
  c += all('kalt', CARDS) + '{position:relative;background:linear-gradient(180deg,rgba(28,48,68,.72),rgba(12,24,36,.78));border-color:rgba(200,235,255,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 0 30px rgba(170,220,255,.08),0 20px 50px rgba(0,0,0,.45)}';
  c += T('kalt') + ' h1{background:linear-gradient(180deg,#ffffff,#bfe9ff 60%,#7cc7ee);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 14px rgba(170,230,255,.6))}';

  /* BLUTIG: Herzschlag-Vignette, tropfende Ränder, Blutschrift */
  c += T('blutig') + ' #vfx::before{background:radial-gradient(ellipse at 50% 50%,transparent 38%,rgba(120,0,8,.55) 80%,rgba(60,0,0,.9) 100%);animation:hbPulse 1.25s infinite}';
  c += all('blutig', CARDS) + '{position:relative;border-color:rgba(224,48,63,.35);box-shadow:inset 0 0 40px rgba(90,0,0,.45),0 0 26px rgba(181,22,28,.18),0 20px 50px rgba(0,0,0,.6)}';
  c += T('blutig') + ' h1{color:#ff3b45;text-shadow:0 1px 0 #7a0000,0 3px 0 #5a0000,0 7px 8px rgba(0,0,0,.7),0 0 22px rgba(255,0,20,.45)}' + T('blutig') + ' h2{color:#ff5a5a;text-shadow:0 2px 0 #5a0000}';

  /* MYSTISCH: Nebel-Galaxie, Runenkreise, schimmernde Schrift */
  c += T('mystisch') + ' #vfx::before{inset:-30%;background:radial-gradient(circle at 30% 35%,rgba(150,80,255,.55),transparent 32%),radial-gradient(circle at 70% 60%,rgba(60,200,255,.4),transparent 32%),radial-gradient(circle at 50% 82%,rgba(243,120,232,.38),transparent 36%),radial-gradient(circle at 15% 75%,rgba(100,60,220,.35),transparent 30%);filter:blur(10px);animation:hbNebula 70s linear infinite}';
  c += T('mystisch') + ' #vfx::after{background:radial-gradient(ellipse at 50% 50%,transparent 45%,rgba(5,0,20,.7) 100%)}';
  c += all('mystisch', CARDS) + '{position:relative;overflow:hidden;border-color:rgba(203,169,255,.42);box-shadow:0 0 0 1px rgba(127,216,234,.12) inset,0 0 34px rgba(160,110,255,.2),0 20px 50px rgba(0,0,0,.5)}';
  c += T('mystisch') + ' h1{background:linear-gradient(90deg,#cba9ff,#7fd8ea,#f3a8e8,#ecdfff,#cba9ff);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;animation:hbShine 8s linear infinite;filter:drop-shadow(0 0 16px rgba(160,110,255,.6))}';

  /* WÜSTE: Sonnenglut, Hitzeflimmern, Sandstein */
  c += T('wueste') + ' #vfx::before{background:radial-gradient(circle at 90% 6%,rgba(255,250,215,.85),rgba(255,210,120,.45) 9%,rgba(255,170,70,.18) 26%,transparent 50%),linear-gradient(0deg,rgba(210,140,50,.28),transparent 45%)}';
  c += T('wueste') + ' #vfx::after{top:30%;bottom:-40px;background:repeating-linear-gradient(0deg,transparent 0 18px,rgba(255,220,160,.035) 18px 20px);animation:hbHeat 2.6s linear infinite}';
  c += all('wueste', CARDS) + '{position:relative;border-radius:6px;clip-path:polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px);background:radial-gradient(rgba(255,220,160,.05) 1px,transparent 1px) 0 0/7px 7px,radial-gradient(rgba(0,0,0,.12) 1px,transparent 1px) 3px 4px/9px 9px,linear-gradient(180deg,var(--surface),var(--bg2));border-color:rgba(235,186,116,.4);box-shadow:inset 0 2px 0 rgba(255,226,170,.12),inset 0 -3px 0 rgba(0,0,0,.35)}';
  c += T('wueste') + ' h1{background:linear-gradient(180deg,#fff0c8,#ebba74 55%,#b86a2a);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;letter-spacing:.06em;filter:drop-shadow(0 3px 6px rgba(0,0,0,.6))}';

  c += '@media (max-width:820px){' + T('kalt') + ' .panel,' + T('kalt') + ' .blk{background:linear-gradient(180deg,#14283a,#0e1c2a)}}';
  c += '@media (prefers-reduced-motion:reduce){#vfx::before,#vfx::after,h1,h2,.btn{animation:none!important}}';
  const st = document.createElement('style'); st.id = 'themeFxCss'; st.textContent = c; document.head.appendChild(st);
  const v = document.createElement('div'); v.id = 'vfx'; const b = document.createElement('div'); b.id = 'burst';
  const cv = document.getElementById('embers'); if (cv && cv.parentNode) cv.parentNode.insertBefore(v, cv.nextSibling); else document.body.prepend(v);
  document.body.appendChild(b);
})();
function fxLevel() { try { return localStorage.getItem('hb_fx') || 'stark'; } catch (e) { return 'stark'; } }
function applyFxLevel() { document.documentElement.setAttribute('data-fx', fxLevel()); }
applyFxLevel();

/* Blitze bei „Gruselig“ */
setInterval(() => { if (document.documentElement.getAttribute('data-theme') !== 'gruselig' || fxLevel() !== 'stark' || document.hidden) return; if (Math.random() < 0.35) { const v = document.getElementById('vfx'); if (!v) return; v.classList.remove('flash'); void v.offsetWidth; v.classList.add('flash'); } }, 7000);

/* Reaktion auf natürliche 20 und 1 */
function themeBurst(kind) {
  if (fxLevel() === 'aus') return;
  const t = themeNow(); const b = document.getElementById('burst'); if (!b) return;
  const add = (cls, style) => { const el = document.createElement('div'); el.className = 'bfx ' + cls; if (style) el.style.cssText = style; b.appendChild(el); setTimeout(() => el.remove(), 2400); };
  const parts = (colors, n, shape) => { if (FX && FX.burst) FX.burst(colors, n, shape); };
  if (kind === 'fumble') { const v = document.getElementById('view'); if (v) { v.classList.remove('shake'); void v.offsetWidth; v.classList.add('shake'); }
    if (t === 'blutig') add('flash', 'background:radial-gradient(ellipse,transparent 30%,rgba(60,0,0,.85))');
    else if (t === 'gruselig') { const v2 = document.getElementById('vfx'); if (v2) { v2.classList.remove('flash'); void v2.offsetWidth; v2.classList.add('flash'); } }
    else if (t === 'lustig') parts(['120,120,140', '90,90,110'], 18, 'confetti');
    else add('flash', 'background:radial-gradient(ellipse,transparent 30%,rgba(0,0,0,.7))');
    return; }
  const strong = fxLevel() === 'stark' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (strong) {
    const PAL = { warm: ['255,214,140', '255,160,70', '255,240,200'], episch: ['255,231,150', '255,200,90', '255,255,230'], gruselig: ['170,255,160', '120,220,110', '220,255,210'], romantisch: ['255,190,210', '244,140,170', '255,240,245'], lustig: ['255,210,63', '255,107,154', '79,209,197', '123,224,123'], kalt: ['255,255,255', '180,230,255', '120,200,255'], blutig: ['255,90,60', '255,40,40', '255,190,120'], mystisch: ['236,223,255', '127,216,234', '243,168,232'], wueste: ['255,230,160', '255,190,90', '255,250,220'] };
    const pal = PAL[t] || PAL.warm;
    try { if (navigator.vibrate) navigator.vibrate([40, 60, 120]); } catch (e) {}
    const v = document.getElementById('view'); if (v) { v.classList.remove('punch', 'shake'); void v.offsetWidth; v.classList.add('punch'); }
    add('core'); add('rays'); add('edge');
    add('ring2', 'border:4px solid rgba(var(--gold-rgb),.95);box-shadow:0 0 50px rgba(var(--gold-rgb),.9),inset 0 0 30px rgba(var(--gold-rgb),.6)');
    add('ring2', 'border:2px solid rgba(255,255,255,.85);animation-delay:.18s');
    add('ring2', 'border:2px solid rgba(var(--gold-rgb),.7);animation-delay:.36s');
    setTimeout(() => { add('core', 'animation-duration:1.1s'); add('rays', 'animation-duration:1.6s;transform:rotate(15deg)'); }, 300);
    parts(pal, 140, 'spark'); setTimeout(() => parts(pal, 120, 'spark'), 300); setTimeout(() => parts(pal, 90), 600);
  }
  if (t === 'episch') { add('flash', 'background:radial-gradient(circle at 50% 45%,rgba(255,236,170,.75),transparent 60%)'); add('ring', 'border:3px solid rgba(255,226,140,.9);box-shadow:0 0 40px rgba(255,210,100,.8)'); parts(['255,231,150', '255,200,90', '255,255,230'], 70, 'spark'); }
  else if (t === 'gruselig') { const v = document.getElementById('vfx'); if (v) { v.classList.remove('flash'); void v.offsetWidth; v.classList.add('flash'); } add('ring', 'border:2px solid rgba(170,255,160,.7);box-shadow:0 0 50px rgba(120,220,110,.6)'); }
  else if (t === 'romantisch') { add('flash', 'background:radial-gradient(circle at 50% 45%,rgba(255,190,210,.5),transparent 60%)'); parts(['244,140,170', '255,200,215', '230,100,140', '255,90,130'], 90, 'heart'); }
  else if (t === 'lustig') { parts(['255,210,63', '255,107,154', '79,209,197', '123,224,123', '160,140,255'], 120, 'confetti'); }
  else if (t === 'kalt') { add('flash', 'background:radial-gradient(ellipse,transparent 25%,rgba(220,245,255,.75) 90%)'); parts(['255,255,255', '210,240,255'], 80, 'snow'); }
  else if (t === 'blutig') { add('flash', 'background:radial-gradient(ellipse,transparent 20%,rgba(150,0,10,.55))'); parts(['255,90,60', '220,40,40', '255,170,90'], 60); }
  else if (t === 'mystisch') { add('ring', 'border:2px dashed rgba(203,169,255,.95);box-shadow:0 0 50px rgba(160,110,255,.8),inset 0 0 40px rgba(127,216,234,.5)'); add('ring', 'border:1px solid rgba(127,216,234,.9);animation-delay:.15s'); parts(['236,223,255', '127,216,234', '243,168,232'], 60, 'spark'); }
  else if (t === 'wueste') { add('flash', 'background:radial-gradient(circle at 85% 0%,rgba(255,245,200,.9),rgba(255,190,90,.35) 30%,transparent 60%)'); parts(['235,200,140', '255,220,160'], 60, 'spark'); }
  else { add('flash', 'background:radial-gradient(circle at 50% 50%,rgba(255,170,80,.45),transparent 60%)'); parts(['255,214,140', '226,130,60'], 60, 'spark'); }
}
XA.fxLevel = (t, a) => { try { localStorage.setItem('hb_fx', a); localStorage.setItem('hb_dice_fx', { stark: 'voll', dezent: 'ruhig', aus: 'aus' }[a] || 'voll'); } catch (e) {} applyFxLevel(); startFx(); if (S.modal === 'theme') openThemeModal(); else render(); };
