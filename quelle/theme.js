/* ==== Stimmungen: ändern nur das Aussehen (Farben, Schrift, Hintergrund-Effekt), nie die Funktion ==== */
const THEMES = {
 warm: { name:'Warm', desc:'Kerzenlicht und Glut', font:'"Cinzel"',
  c:{ bg:'#130E0A', bg2:'#1A130E', surface:'#211812', raised:'#2B2018', sunk:'#0F0B08', ink:'#F1E6D0', muted:'#B9A587', faint:'#8A7863', gold:'#E2AE52', 'gold-hi':'#F6D58E', 'gold-ink':'#1B1209', ember:'#E0763A', wine:'#B9474A', moss:'#86B07A', arcane:'#B28DE0', 'card-a':'#2E2219', 'card-b':'#1C1510', 'gold-lo':'#8a5d1e' },
  rgb:{ gold:'226,174,82', 'gold-hi':'246,213,142', wine:'185,71,74', arcane:'178,141,224', ember:'224,118,58', bg:'19,14,10', line:'222,176,104', deep:'10,6,4', glow1:'224,118,58', glow2:'178,141,224', glow3:'226,174,82' },
  fx:{ mode:'rise', colors:['255,214,140','226,130,60'], n:46 } },
 episch: { name:'Episch', desc:'Gold, Sternennacht, Heldenmut', font:'"Cinzel Decorative","Cinzel"',
  c:{ bg:'#0A0F1E', bg2:'#0F1528', surface:'#151C33', raised:'#1C2542', sunk:'#070B16', ink:'#EEF1FB', muted:'#A9B1CF', faint:'#78809F', gold:'#F0C14B', 'gold-hi':'#FFE38F', 'gold-ink':'#1A1404', ember:'#F0963A', wine:'#C94B55', moss:'#8CC27F', arcane:'#9FB4FF', 'card-a':'#1C2542', 'card-b':'#111830', 'gold-lo':'#9A7314' },
  rgb:{ gold:'240,193,75', 'gold-hi':'255,227,143', wine:'201,75,85', arcane:'159,180,255', ember:'240,150,58', bg:'10,15,30', line:'240,193,75', deep:'4,6,14', glow1:'240,193,75', glow2:'90,120,255', glow3:'255,227,143' },
  fx:{ mode:'spark', colors:['255,231,150','255,190,90','255,255,230'], n:60 } },
 gruselig: { name:'Gruselig', desc:'Nebel, Moder, fahles Licht', font:'"IM Fell English SC","Cinzel"',
  c:{ bg:'#0A0E0B', bg2:'#0F1510', surface:'#141B16', raised:'#1B241D', sunk:'#060907', ink:'#DCE3D5', muted:'#96A28F', faint:'#67715F', gold:'#A6CF8C', 'gold-hi':'#D6F2BE', 'gold-ink':'#0C1408', ember:'#7E9C68', wine:'#9A3341', moss:'#8FBF6F', arcane:'#9FA8C9', 'card-a':'#1B241D', 'card-b':'#101611', 'gold-lo':'#4E6B3A' },
  rgb:{ gold:'166,207,140', 'gold-hi':'214,242,190', wine:'154,51,65', arcane:'159,168,201', ember:'126,156,104', bg:'10,14,11', line:'166,207,140', deep:'3,5,4', glow1:'90,130,90', glow2:'120,120,150', glow3:'166,207,140' },
  fx:{ mode:'fog', colors:['170,190,170','140,160,150'], n:14 } },
 romantisch: { name:'Romantisch', desc:'Rosé, Kerzen, Blütenblätter', font:'"Cormorant Garamond","Cinzel"',
  c:{ bg:'#1A0E13', bg2:'#21121A', surface:'#2A1720', raised:'#351E29', sunk:'#12090D', ink:'#F8E9EE', muted:'#C9A7B2', faint:'#96737E', gold:'#EBB4A2', 'gold-hi':'#FADBD0', 'gold-ink':'#2A0F17', ember:'#DD7690', wine:'#C24A61', moss:'#9CC59A', arcane:'#CFA4E2', 'card-a':'#351E29', 'card-b':'#22121A', 'gold-lo':'#A26F60' },
  rgb:{ gold:'235,180,162', 'gold-hi':'250,219,208', wine:'194,74,97', arcane:'207,164,226', ember:'221,118,144', bg:'26,14,19', line:'235,180,162', deep:'12,5,8', glow1:'221,118,144', glow2:'207,164,226', glow3:'235,180,162' },
  fx:{ mode:'petal', colors:['244,160,180','250,200,210','230,120,150'], n:26 } },
 lustig: { name:'Lustig', desc:'Bunt, verspielt, Konfetti', font:'"Fredoka","Cinzel"',
  c:{ bg:'#17123B', bg2:'#1E1849', surface:'#262058', raised:'#312A6B', sunk:'#100C2C', ink:'#FFF8F0', muted:'#CBC4F2', faint:'#958DC4', gold:'#FFD23F', 'gold-hi':'#FFE98A', 'gold-ink':'#2A1E00', ember:'#FF6B9A', wine:'#FF5E5B', moss:'#7BE07B', arcane:'#4FD1C5', 'card-a':'#312A6B', 'card-b':'#211B52', 'gold-lo':'#B8901A' },
  rgb:{ gold:'255,210,63', 'gold-hi':'255,233,138', wine:'255,94,91', arcane:'79,209,197', ember:'255,107,154', bg:'23,18,59', line:'255,210,63', deep:'10,8,30', glow1:'255,107,154', glow2:'79,209,197', glow3:'255,210,63' },
  fx:{ mode:'confetti', colors:['255,210,63','255,107,154','79,209,197','123,224,123','160,140,255'], n:40 } },
 kalt: { name:'Kalt', desc:'Eis, Schnee, Nordwind', font:'"Marcellus SC","Cinzel"',
  c:{ bg:'#09121A', bg2:'#0D1822', surface:'#122030', raised:'#18293B', sunk:'#060D13', ink:'#EAF4F9', muted:'#9EB5C2', faint:'#6D8695', gold:'#A6DCF2', 'gold-hi':'#E4F7FF', 'gold-ink':'#06202C', ember:'#73B9E2', wine:'#D46A7C', moss:'#8FD0B6', arcane:'#B9C6FF', 'card-a':'#18293B', 'card-b':'#0F1C29', 'gold-lo':'#4F8AA6' },
  rgb:{ gold:'166,220,242', 'gold-hi':'228,247,255', wine:'212,106,124', arcane:'185,198,255', ember:'115,185,226', bg:'9,18,26', line:'166,220,242', deep:'3,8,12', glow1:'115,185,226', glow2:'185,198,255', glow3:'228,247,255' },
  fx:{ mode:'snow', colors:['255,255,255','220,240,255'], n:70 } },
 blutig: { name:'Blutig', desc:'Tiefrot, Schatten, Gefahr', font:'"Pirata One","Cinzel"',
  c:{ bg:'#0D0505', bg2:'#140808', surface:'#1C0B0B', raised:'#260F0F', sunk:'#080303', ink:'#F3E5E5', muted:'#BC9C9C', faint:'#846464', gold:'#E0303F', 'gold-hi':'#FF7B7B', 'gold-ink':'#FFF2F2', ember:'#B5161C', wine:'#FF4D4F', moss:'#9AB57F', arcane:'#C58FB0', 'card-a':'#260F0F', 'card-b':'#170808', 'gold-lo':'#7A0F18' },
  rgb:{ gold:'224,48,63', 'gold-hi':'255,123,123', wine:'255,77,79', arcane:'197,143,176', ember:'181,22,28', bg:'13,5,5', line:'224,48,63', deep:'5,1,1', glow1:'181,22,28', glow2:'90,10,20', glow3:'224,48,63' },
  fx:{ mode:'drop', colors:['190,20,30','140,10,20'], n:22 } },
 mystisch: { name:'Mystisch', desc:'Violett, Sternenstaub, Geheimnis', font:'"Cinzel Decorative","Cinzel"',
  c:{ bg:'#0E0A1B', bg2:'#140F26', surface:'#1B1433', raised:'#241B42', sunk:'#090613', ink:'#F0EAFF', muted:'#AFA4D2', faint:'#7B70A2', gold:'#CBA9FF', 'gold-hi':'#ECDFFF', 'gold-ink':'#1A0D33', ember:'#7FD8EA', wine:'#E06A9A', moss:'#8FD6B0', arcane:'#F3A8E8', 'card-a':'#241B42', 'card-b':'#161029', 'gold-lo':'#7652B8' },
  rgb:{ gold:'203,169,255', 'gold-hi':'236,223,255', wine:'224,106,154', arcane:'243,168,232', ember:'127,216,234', bg:'14,10,27', line:'203,169,255', deep:'5,3,12', glow1:'127,216,234', glow2:'243,168,232', glow3:'203,169,255' },
  fx:{ mode:'stars', colors:['236,223,255','127,216,234','243,168,232'], n:80 } },
 wueste: { name:'Wüste', desc:'Sand, Hitze, alte Ruinen', font:'"Almendra","Cinzel"',
  c:{ bg:'#19120A', bg2:'#20170D', surface:'#2A1E11', raised:'#352616', sunk:'#110C06', ink:'#F7ECDB', muted:'#CBB08D', faint:'#957B5B', gold:'#EBBA74', 'gold-hi':'#FFE2AA', 'gold-ink':'#2A1906', ember:'#DB8F4B', wine:'#C55A45', moss:'#A9B86F', arcane:'#D7A9C9', 'card-a':'#352616', 'card-b':'#21170C', 'gold-lo':'#9A6E2E' },
  rgb:{ gold:'235,186,116', 'gold-hi':'255,226,170', wine:'197,90,69', arcane:'215,169,201', ember:'219,143,75', bg:'25,18,10', line:'235,186,116', deep:'10,7,3', glow1:'219,143,75', glow2:'255,200,120', glow3:'235,186,116' },
  fx:{ mode:'sand', colors:['235,200,140','210,170,110'], n:90 } }
};
(function themeCss() {
  let css = '';
  for (const [k, t] of Object.entries(THEMES)) {
    const v = Object.entries(t.c).map(([n, x]) => '--' + n + ':' + x).concat(Object.entries(t.rgb).map(([n, x]) => '--' + n + '-rgb:' + x));
    v.push('--line:rgba(' + t.rgb.line + ',.16)', '--line2:rgba(' + t.rgb.line + ',.32)', '--f-display:' + t.font + ',"Trajan Pro","Palatino Linotype",Georgia,serif');
    css += 'html[data-theme="' + k + '"]{' + v.join(';') + '}';
  }
  css += 'html[data-theme="lustig"] h1,html[data-theme="lustig"] h2{letter-spacing:.01em}html[data-theme="romantisch"] h1,html[data-theme="romantisch"] h2,html[data-theme="romantisch"] h3{font-weight:700;letter-spacing:.02em}html[data-theme="blutig"] h1,html[data-theme="blutig"] h2{letter-spacing:.04em}';
  const st = document.createElement('style'); st.id = 'themeCss'; st.textContent = css; document.head.appendChild(st);
})();
function themeOwn() { try { return localStorage.getItem('hb_theme') || 'warm'; } catch (e) { return 'warm'; } }
function themeFollow() { try { return localStorage.getItem('hb_theme_follow') !== '0'; } catch (e) { return true; } }
function themeNow() { const m = typeof S !== 'undefined' && S.camp && S.meta && S.meta.theme; if (m && THEMES[m] && themeFollow()) return m; const o = themeOwn(); return THEMES[o] ? o : 'warm'; }
function applyTheme() {
  const t = themeNow(); const html = document.documentElement;
  if (html.getAttribute('data-theme') === t) return;
  html.setAttribute('data-theme', t);
  const mc = document.querySelector('meta[name="theme-color"]'); if (mc) mc.setAttribute('content', THEMES[t].c.bg);
  startFx();
}
function setTheme(k, fromDm) { try { localStorage.setItem('hb_theme', k); if (!fromDm && typeof S !== 'undefined' && S.camp && S.meta && S.meta.theme && S.meta.theme !== k) localStorage.setItem('hb_theme_follow', '0'); } catch (e) {} applyTheme(); }

/* ---------- Hintergrund-Effekte ---------- */
let FX = null;
function startFx() {
  const cv = document.getElementById('embers'); if (!cv || !cv.getContext) return;
  let reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  const ctx = cv.getContext('2d');
  if (FX) { FX.stop = true; FX = null; }
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (reduce) return;
  const cfg = THEMES[themeNow()].fx; const run = { stop: false }; FX = run;
  let W, H, dpr; const P = [];
  const size = () => { dpr = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); if (!startFx.bound) { window.addEventListener('resize', () => { if (FX && FX.size) FX.size(); }); startFx.bound = true; } run.size = size;
  const N = Math.round(Math.min(cfg.n, (W * H) / 32000 * (cfg.n / 46)));
  const col = () => cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
  const spawn = (p, init) => {
    p.c = col(); p.t = Math.random() * 6.28; p.x = Math.random() * W;
    const m = cfg.mode;
    if (m === 'rise' || m === 'spark') { p.y = init ? Math.random() * H : H + 10; p.r = 0.6 + Math.random() * (m === 'spark' ? 2.2 : 1.8); p.vy = (m === 'spark' ? 0.4 : 0.15) + Math.random() * (m === 'spark' ? 0.9 : 0.45); p.vx = (Math.random() - 0.5) * 0.25; p.a = 0.15 + Math.random() * 0.55; }
    else if (m === 'snow') { p.y = init ? Math.random() * H : -10; p.r = 0.8 + Math.random() * 2.2; p.vy = 0.3 + Math.random() * 0.8; p.vx = (Math.random() - 0.5) * 0.3; p.a = 0.35 + Math.random() * 0.5; }
    else if (m === 'petal') { p.y = init ? Math.random() * H : -20; p.r = 4 + Math.random() * 4; p.vy = 0.35 + Math.random() * 0.6; p.vx = 0.2 + Math.random() * 0.4; p.a = 0.35 + Math.random() * 0.4; p.rot = Math.random() * 6.28; p.vr = (Math.random() - 0.5) * 0.04; }
    else if (m === 'confetti') { p.y = init ? Math.random() * H : -20; p.r = 3 + Math.random() * 4; p.vy = 0.6 + Math.random() * 1.1; p.vx = (Math.random() - 0.5) * 0.6; p.a = 0.55 + Math.random() * 0.35; p.rot = Math.random() * 6.28; p.vr = (Math.random() - 0.5) * 0.15; }
    else if (m === 'drop') { p.y = init ? Math.random() * H : -30; p.r = 1.6 + Math.random() * 2; p.vy = 0.8 + Math.random() * 1.6; p.vx = 0; p.a = 0.3 + Math.random() * 0.35; }
    else if (m === 'fog') { p.y = Math.random() * H; p.x = init ? Math.random() * W : -300; p.r = 120 + Math.random() * 220; p.vx = 0.08 + Math.random() * 0.25; p.vy = (Math.random() - 0.5) * 0.05; p.a = 0.035 + Math.random() * 0.05; }
    else if (m === 'stars') { p.y = Math.random() * H; p.r = 0.5 + Math.random() * 1.6; p.vx = (Math.random() - 0.5) * 0.04; p.vy = (Math.random() - 0.5) * 0.04; p.a = 0.2 + Math.random() * 0.6; p.sp = 0.01 + Math.random() * 0.04; }
    else if (m === 'sand') { p.y = Math.random() * H; p.x = init ? Math.random() * W : -10; p.r = 0.5 + Math.random() * 1.2; p.vx = 1.2 + Math.random() * 2.4; p.vy = 0.1 + Math.random() * 0.25; p.a = 0.12 + Math.random() * 0.3; }
    return p;
  };
  for (let i = 0; i < N; i++) P.push(spawn({}, true));
  const tick = () => {
    if (run.stop) return;
    if (!document.hidden) {
      ctx.clearRect(0, 0, W, H); const m = cfg.mode;
      for (const p of P) {
        p.t += 0.02;
        if (m === 'rise' || m === 'spark') { p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * 0.15; if (p.y < -10) spawn(p);
          const fl = p.a * (0.7 + 0.3 * Math.sin(p.t * 3)); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4); g.addColorStop(0, 'rgba(' + p.c + ',' + fl + ')'); g.addColorStop(1, 'rgba(' + p.c + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill(); }
        else if (m === 'snow') { p.y += p.vy; p.x += p.vx + Math.sin(p.t) * 0.3; if (p.y > H + 10) spawn(p); ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
        else if (m === 'petal' || m === 'confetti') { p.y += p.vy; p.x += p.vx + Math.sin(p.t) * (m === 'petal' ? 0.6 : 0.3); p.rot += p.vr; if (p.y > H + 20 || p.x > W + 30) spawn(p);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
          if (m === 'petal') { ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 6.283); ctx.fill(); } else { ctx.scale(1, Math.abs(Math.cos(p.t * 2))); ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2); }
          ctx.restore(); }
        else if (m === 'drop') { p.y += p.vy; p.vy *= 1.004; if (p.y > H + 30) spawn(p); ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')'; ctx.beginPath(); ctx.moveTo(p.x, p.y - p.r * 4); ctx.quadraticCurveTo(p.x + p.r, p.y, p.x, p.y + p.r); ctx.quadraticCurveTo(p.x - p.r, p.y, p.x, p.y - p.r * 4); ctx.fill(); }
        else if (m === 'fog') { p.x += p.vx; p.y += p.vy; if (p.x - p.r > W) spawn(p); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, 'rgba(' + p.c + ',' + p.a + ')'); g.addColorStop(1, 'rgba(' + p.c + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
        else if (m === 'stars') { p.x += p.vx; p.y += p.vy; const a = p.a * (0.35 + 0.65 * Math.abs(Math.sin(p.t * p.sp * 50))); ctx.fillStyle = 'rgba(' + p.c + ',' + a + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); if (p.r > 1.7 && a > 0.55) { ctx.strokeStyle = 'rgba(' + p.c + ',' + a * 0.6 + ')'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y); ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5); ctx.stroke(); } }
        else if (m === 'sand') { p.x += p.vx; p.y += p.vy + Math.sin(p.t) * 0.2; if (p.x > W + 10 || p.y > H + 10) spawn(p); ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')'; ctx.fillRect(p.x, p.y, p.r * 3, p.r * 0.8); }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Auswahl ---------- */
function themeSwatches(dmMode) {
  const cur = dmMode ? ((S.meta && S.meta.theme) || '') : themeNow();
  return '<div class="tswatch">' + Object.entries(THEMES).map(([k, t]) => '<button class="tsw' + (cur === k ? ' on' : '') + '" data-act="' + (dmMode ? 'themeDm' : 'theme') + '" data-arg="' + k + '" style="--sa:' + t.c.bg + ';--sb:' + t.c.raised + ';--sc:' + t.c.gold + ';--sd:' + t.c['gold-hi'] + ';--sf:' + t.font + '"><i></i><b>' + t.name + '</b><small>' + t.desc + '</small></button>').join('') + '</div>';
}
function themeBlock() {
  const dm = S.camp && S.meta && S.meta.theme && THEMES[S.meta.theme];
  return '<section class="panel themep"><div class="tph"><h2>Stimmung</h2><span class="hint" style="margin:0">Ändert nur das Aussehen – alle Funktionen bleiben gleich.</span></div>' + themeSwatches(false) +
    (dm ? '<label class="chk tfollow"><input type="checkbox" id="themeFollow"' + (themeFollow() ? ' checked' : '') + '> Stimmung der Spielleitung folgen (' + THEMES[S.meta.theme].name + ')</label>' : '') + '</section>';
}
function openThemeModal() {
  const m = $('#modal'); S.modal = 'theme';
  m.innerHTML = '<div class="dlg themedlg" role="dialog" aria-modal="true" aria-label="Stimmung wählen">' + themeBlock() + '<div class="chips"><button class="btn" data-act="closeModal">Fertig</button></div></div>';
  m.hidden = false;
}
XA.theme = (t, a) => { setTheme(a); if (S.modal === 'theme') openThemeModal(); else render(); };
XA.themeDm = (t, a) => { saveMeta({ theme: a }); setTheme(a, true); try { localStorage.setItem('hb_theme_follow', '1'); } catch (e) {} render(); };
XA.themeOpen = () => { S.more = false; const bn = $('#bnav'); if (bn) bn.innerHTML = bnavHtml(); openThemeModal(); };
document.addEventListener('change', (ev) => { if (ev.target && ev.target.id === 'themeFollow') { try { localStorage.setItem('hb_theme_follow', ev.target.checked ? '1' : '0'); } catch (e) {} applyTheme(); if (S.modal === 'theme') openThemeModal(); else render(); } });
