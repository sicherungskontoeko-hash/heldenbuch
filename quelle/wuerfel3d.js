/* ---------- Artefaktwürfel v5 – Prototyp (nur Optik) ----------
   WebGL-Darstellung einzelner Würfel mit echten räumlichen Ornamenten je Set.
   Bekommt fertige Ergebnisse und zeigt sie nur: kein Regel-Zufall (sichtbarer Zufall aus vrand()), keine Physik.
   Prototyp: W20 in Weltenhain (Wurzeln, Blätter), Eisenwerk (Bänder, Nieten, Zahnradkränze) und Arkanum
   (Goldfassung, freistehende Armillarringe mit Runen, Kugeln). Alles andere zeichnet weiter der bisherige SVG-Renderer.
   Ein gemeinsamer WebGL-Kontext zeichnet nacheinander in kleine 2D-Leinwände; eine Schleife für alle rollenden Würfel,
   keine Leerlauf-Animation. Fehlt WebGL, geht der Kontext verloren oder tritt ein Fehler auf, übernimmt der SVG-Renderer. */
const W3D = (() => {
  const SETS = {
    weltenhain: { deep: [0.01, 0.12, 0.05], mid: [0.07, 0.42, 0.18], glow: [0.35, 0.95, 0.45], glyph: [1.0, 0.86, 0.5], kind: 0, fit: 1.2 },
    eisenwerk: { deep: [0.07, 0.07, 0.08], mid: [0.2, 0.2, 0.22], glow: [0.0, 0.0, 0.0], glyph: [0.95, 0.72, 0.38], kind: 1, fit: 1.17 },
    arkanum: { deep: [0.1, 0.02, 0.2], mid: [0.42, 0.14, 0.72], glow: [0.85, 0.55, 1.0], glyph: [1.0, 0.84, 0.48], kind: 0, fit: 1.4 }
  };
  const SUP = { 20: Object.keys(SETS) };
  let cv = null, gl = null, prog = null, sprog = null, dead = false, tex = null, sbuf = null; const U = {}; const A = {};
  const meshes = new Map(); const act = []; let raf = 0;
  const supports = (sides, set) => !dead && !!(SUP[sides] && SUP[sides].includes(set)) && typeof d3geo === 'function';
  /* ---- Shader ---- */
  const VS = 'attribute vec3 aP,aN;attribute vec2 aU;attribute float aM;attribute vec3 aX;uniform mat4 uPV;uniform mat3 uR;uniform vec3 uT;uniform float uWorld;' +
    'varying vec3 vN,vW,vO,vX;varying vec2 vU;varying float vM;' +
    'void main(){mat3 R=uWorld>.5?mat3(1.):uR;vec3 w=R*aP+uT;vN=R*aN;vW=w;vO=aP;vU=aU;vM=aM;vX=aX;gl_Position=uPV*vec4(w,1.);}';
  const FS = 'precision highp float;varying vec3 vN,vW,vO,vX;varying vec2 vU;varying float vM;uniform sampler2D uTex;uniform vec3 uDeep,uMid,uGlow,uGlyph;uniform float uKind,uGold,uDim,uCam,uGS;' +
    'float h3(vec3 p){p=fract(p*.3183099+vec3(.1,.23,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}' +
    'float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}' +
    'float fb(vec3 p){return .55*n3(p)+.3*n3(p*2.1+3.1)+.15*n3(p*4.3+7.7);}' +
    'vec3 env(vec3 R){float a=exp(-pow((R.x+.45)*3.6,2.))*smoothstep(-.3,.7,R.y);float b=exp(-pow((R.y-.62)*5.,2.))*smoothstep(-.8,.3,R.x);float c=smoothstep(.2,1.,R.y)*.35;return vec3(.95,.93,.88)*(a*.9+b*.55)+vec3(.55,.6,.7)*c;}' +
    'void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(vec3(0.,0.,uCam)-vW);vec3 L=normalize(vec3(-.55,.8,.75));vec3 L2=normalize(vec3(.8,-.15,.45));' +
    'float d=max(dot(N,L),0.),d2=max(dot(N,L2),0.);vec3 H=normalize(L+V);float fr=pow(1.-max(dot(N,V),0.),3.);vec3 R=reflect(-V,N);vec3 c;float m=vM;' +
    /* 0: Körperfläche mit Zahl */
    'if(m<.5){float e=min(vX.x,min(vX.y,vX.z));float f=fb(vO*3.4+2.);vec3 base;vec3 em=vec3(0.);float gloss;' +
    ' if(uKind<.5){float crack=1.-smoothstep(.0,.012,abs(n3(vO*4.2+9.)-.5));float inner=smoothstep(.0,.3,e);float cloud=fb(vO*2.6+1.3);base=mix(uDeep,uMid,.25+.55*cloud+.35*inner)*(.6+.6*inner);em=uGlow*(crack*.35*inner+pow(inner,2.)*.18*cloud)+uGlow*step(.994,h3(floor(vO*46.)))*.8;gloss=1.;}' +
    ' else{float br=n3(vec3(vO.x*70.,vO.y*6.,vO.z*55.));base=uMid*(.55+.6*br)*(.8+.3*f);gloss=.55;}' +
    ' vec2 cc=(floor(vU*5.)+.5)/5.;vec2 gu=cc+(vU-cc)/uGS;float a=texture2D(uTex,gu).a;float aS=texture2D(uTex,gu+vec2(-.0016,-.0016)).a;float aH=texture2D(uTex,gu+vec2(.0016,.0016)).a;' +
    ' vec3 lit=base*(.32+.75*d+.25*d2)+em;lit+=env(R)*(.08+.55*fr)*gloss+vec3(1.)*pow(max(dot(N,H),0.),70.)*.55*gloss;' +
    ' lit=mix(lit,lit*.55,smoothstep(.05,.0,e)*.6)+vec3(1.,.97,.9)*smoothstep(.022,.0,e)*.35*gloss;' +
    ' vec3 gl=uGlyph*(.55+.6*d)+env(R)*.25+uGlyph*uGold*.6;gl*=1.-max(aS-a,0.)*.6;gl+=max(aH-a,0.)*.25;lit*=1.-max(aS-a,0.)*.5;' +
    ' c=mix(lit,gl,a);}' +
    /* 1: Rinde */
    'else if(m<1.5){float g=n3(vec3(vU.x*28.,vU.y*3.,vO.z*4.))*.6+n3(vO*18.)*.4;vec3 b=mix(vec3(.3,.18,.08),vec3(.68,.48,.26),g);c=b*(.42+.8*d+.25*d2)+vec3(.9,.8,.6)*pow(max(dot(N,H),0.),18.)*.18;}' +
    /* 2: Blatt */
    'else if(m<2.5){float rib=1.-smoothstep(.0,.06,abs(vU.y-.5));float vein=1.-smoothstep(.0,.04,abs(fract((vU.x*5.-abs(vU.y-.5)*2.5))-.5)-.0);vec3 b=mix(vec3(.12,.45,.1),vec3(.45,.8,.22),vU.x*.6+.2);b=mix(b,vec3(.75,.9,.35),rib*.5+vein*.12);' +
    ' float sss=max(dot(-N,L),0.)*.35;c=b*(.28+.8*d+.2*d2+sss)+vec3(1.)*pow(max(dot(N,H),0.),30.)*.25;}' +
    /* 3: Gold/Messing  4: Stahl  5: Niete */
    'else if(m<5.5){vec3 b=m<3.5?vec3(.86,.62,.26):m<4.5?vec3(.46,.48,.52):vec3(.5,.5,.53);float rough=m<3.5?40.:m<4.5?26.:50.;' +
    ' float ek=m>3.5&&m<4.5?.55:1.1;if(m>3.5&&m<4.5)b*=.75+.35*n3(vec3(vO.x*90.,vO.y*8.,vO.z*70.));c=b*(.18+.5*d+.15*d2)+b*env(R)*(ek+fr*.8)+vec3(1.,.95,.85)*pow(max(dot(N,H),0.),rough)*(m>3.5&&m<4.5?.45:.8);}' +
    /* 6: Kristallkugel */
    'else if(m<6.5){vec3 b=mix(uDeep,uMid,.5+.5*N.y);c=b*(.35+.7*d)+uGlow*fr*.8+env(R)*.5+vec3(1.)*pow(max(dot(N,H),0.),90.)*.9;}' +
    /* 7: Runenband (Innenseite Gold, aussen leuchtende Runen) */
    'else{float k=floor(vU.x*30.);vec2 cell=vec2(mod(k,5.),4.);vec2 uv=(cell+vec2(fract(vU.x*30.),vU.y))/5.;float r=texture2D(uTex,uv).a;vec3 b=vec3(.82,.6,.26);' +
    ' c=b*(.2+.5*d)+b*env(R)*(1.+fr)+vec3(1.,.95,.85)*pow(max(dot(N,H),0.),40.)*.7;c=mix(c,uGlow*1.25+vec3(.15),r*smoothstep(.15,.3,vU.y)*smoothstep(.85,.7,vU.y));}' +
    'c=mix(c,vec3(dot(c,vec3(.3,.59,.11)))*.6,uDim);gl_FragColor=vec4(clamp(c,0.,1.),1.);}';
  const SVS = 'attribute vec2 aS;varying vec2 v;uniform vec4 uB;void main(){v=aS;gl_Position=vec4(uB.xy+aS*uB.zw,.99,1.);}';
  const SFS = 'precision mediump float;varying vec2 v;uniform float uA;void main(){float r=dot(v,v);gl_FragColor=vec4(0.,0.,0.,uA*exp(-r*3.2)*(1.-smoothstep(.8,1.,r)));}';
  function compile(vs, fs) {
    const p = gl.createProgram(); for (const [t, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); gl.attachShader(p, s); }
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p;
  }
  function init() {
    if (gl) return !dead; if (dead) return false;
    try {
      cv = document.createElement('canvas'); cv.width = cv.height = 256;
      gl = cv.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
      if (!gl) { dead = true; return false; }
      cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); dead = true; act.splice(0).forEach((it) => it.fail()); });
      prog = compile(VS, FS); sprog = compile(SVS, SFS);
      for (const k of ['aP', 'aN', 'aU', 'aM', 'aX']) A[k] = gl.getAttribLocation(prog, k);
      for (const k of ['uPV', 'uR', 'uT', 'uWorld', 'uTex', 'uDeep', 'uMid', 'uGlow', 'uGlyph', 'uKind', 'uGold', 'uDim', 'uCam', 'uGS']) U[k] = gl.getUniformLocation(prog, k);
      U.uB = gl.getUniformLocation(sprog, 'uB'); U.uA = gl.getUniformLocation(sprog, 'uA'); A.aS = gl.getAttribLocation(sprog, 'aS');
      sbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sbuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      return true;
    } catch (e) { dead = true; if (typeof console !== 'undefined') console.warn('Artefaktwürfel: WebGL nicht verfügbar', e && e.message); return false; }
  }
  /* ---- Zahlen-Atlas: 5 × 5 Zellen, 20 Flächen + Runen ---- */
  function atlas() {
    if (tex) return tex; const N = 5, S = 1024, cs = S / N; const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    const fam = (typeof document !== 'undefined' && document.fonts && document.fonts.check && document.fonts.check('bold 40px Cinzel')) ? 'Cinzel' : 'Georgia, serif';
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let v = 1; v <= 20; v++) { const i = v - 1, cx = (i % N + 0.5) * cs, cy = (Math.floor(i / N) + 0.5) * cs; const s = String(v);
      let fs = cs * 0.37; x.font = 'bold ' + fs + 'px ' + fam; const w = x.measureText(s).width; if (w > cs * 0.42) { fs *= cs * 0.42 / w; x.font = 'bold ' + fs + 'px ' + fam; }
      x.fillText(s, cx, cy + fs * 0.04); if (v === 6 || v === 9) x.fillRect(cx - cs * 0.06, cy + fs * 0.42, cs * 0.12, Math.max(3, cs * 0.022)); }
    const RU = 'ᚠᚢᚦᚨᚱ'; x.font = 'bold ' + Math.round(cs * 0.62) + 'px Georgia, serif';
    for (let k = 0; k < 5; k++) x.fillText(RU[k], (k + 0.5) * cs, 4.5 * cs + cs * 0.02);
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.generateMipmap(gl.TEXTURE_2D);
    return tex;
  }
  /* ---- Geometrie-Bausteine ---- */
  function B() { const a = []; const vtx = (p, n, u, v, m, x) => a.push(p[0], p[1], p[2], n[0], n[1], n[2], u, v, m, x ? x[0] : 0, x ? x[1] : 0, x ? x[2] : 0);
    return { a, vtx, tri(p, q, r, m, u) { const n = V.norm(V.cross(V.sub(q, p), V.sub(r, p))); vtx(p, n, u ? u[0] : 0, u ? u[1] : 0, m); vtx(q, n, u ? u[0] : 0, u ? u[1] : 0, m); vtx(r, n, u ? u[0] : 0, u ? u[1] : 0, m); } }; }
  const perp = (n) => V.norm(Math.abs(n[0]) < 0.9 ? V.cross(n, [1, 0, 0]) : V.cross(n, [0, 1, 0]));
  /* Röhre entlang einer Punktfolge (glatte Normalen), uv.x läuft entlang */
  function tube(b, pts, rad, seg, m, radFn) {
    const rings = []; let ref = perp(V.sub(pts[1], pts[0]));
    for (let i = 0; i < pts.length; i++) { const t = V.norm(V.sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)])); ref = V.norm(V.sub(ref, V.mul(t, V.dot(ref, t)))); const bi = V.cross(t, ref); const r = radFn ? radFn(i / (pts.length - 1)) * rad : rad;
      const ring = []; for (let k = 0; k <= seg; k++) { const an = (k / seg) * Math.PI * 2; const nn = V.add(V.mul(ref, Math.cos(an)), V.mul(bi, Math.sin(an))); ring.push([V.add(pts[i], V.mul(nn, r)), nn, k / seg]); } rings.push(ring); }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < seg; k++) { const a = rings[i][k], c = rings[i][k + 1], d = rings[i + 1][k], e = rings[i + 1][k + 1]; const u0 = i / (rings.length - 1), u1 = (i + 1) / (rings.length - 1);
      b.vtx(a[0], a[1], u0, a[2], m); b.vtx(d[0], d[1], u1, d[2], m); b.vtx(c[0], c[1], u0, c[2] + 1 / seg, m); b.vtx(c[0], c[1], u0, c[2] + 1 / seg, m); b.vtx(d[0], d[1], u1, d[2], m); b.vtx(e[0], e[1], u1, e[2] + 1 / seg, m); }
  }
  function sphere(b, c, r, m, seg) { seg = seg || 10; for (let i = 0; i < seg; i++) for (let k = 0; k < seg * 2; k++) { const P = (ii, kk) => { const th = (ii / seg) * Math.PI, ph = (kk / (seg * 2)) * Math.PI * 2; const n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]; return [V.add(c, V.mul(n, r)), n]; };
    const a = P(i, k), bb = P(i + 1, k), cc = P(i, k + 1), d = P(i + 1, k + 1); for (const [p, n] of [a, cc, bb, bb, cc, d]) b.vtx(p, n, 0, 0, m); } }
  /* Blatt: geschwungene Fläche, uv.x entlang, uv.y quer (Mittelrippe bei 0,5) */
  function leaf(b, base, dir, nrm, len, wid) {
    const side = V.norm(V.cross(nrm, dir)); const S = 7, W = 3; const P = (i, j) => { const s = i / S, w = (j / W - 0.5) * 2; const prof = Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.05)), 0.75) * (1 - s * 0.25);
      const p = V.add(base, V.add(V.mul(dir, s * len), V.add(V.mul(side, w * wid * prof), V.mul(nrm, len * (0.22 * s * s + 0.18 * w * w * prof))))); return p; };
    for (let i = 0; i < S; i++) for (let j = 0; j < W; j++) { const a = P(i, j), c = P(i, j + 1), d = P(i + 1, j), e = P(i + 1, j + 1); const n = V.norm(V.cross(V.sub(d, a), V.sub(c, a)));
      const uv = (ii, jj) => [ii / S, jj / W]; for (const [p, u] of [[a, uv(i, j)], [d, uv(i + 1, j)], [c, uv(i, j + 1)], [c, uv(i, j + 1)], [d, uv(i + 1, j)], [e, uv(i + 1, j + 1)]]) b.vtx(p, n, u[0], u[1], 2); }
  }
  /* flacher Kranz mit Zähnen in einer Ebene (Zahnrad), Dicke entlang n */
  function gear(b, c, n, up, r0, r1, teeth, th, m, plain, sidesN) {
    const rt = V.cross(up, n); const prof = []; const K = plain ? (sidesN || 48) : teeth * 4;
    for (let i = 0; i < K; i++) { const an = (i / K) * Math.PI * 2; const ph = i % 4; const r = plain ? r1 : ph === 1 || ph === 2 ? r1 + th * 1.3 : r1; prof.push([an, r]); }
    const P = (an, r, z) => V.add(c, V.add(V.add(V.mul(rt, Math.cos(an) * r), V.mul(up, Math.sin(an) * r)), V.mul(n, z)));
    for (let i = 0; i < K; i++) { const [a0, ro0] = prof[i], [a1, ro1] = prof[(i + 1) % K]; const A1 = a1 + (i + 1 === K ? Math.PI * 2 : 0);
      const ti0 = P(a0, r0, th), ti1 = P(A1, r0, th), to0 = P(a0, ro0, th), to1 = P(A1, ro1, th), bo0 = P(a0, ro0, 0), bo1 = P(A1, ro1, 0), bi0 = P(a0, r0, 0), bi1 = P(A1, r0, 0);
      b.tri(ti0, to0, ti1, m); b.tri(ti1, to0, to1, m); b.tri(bo0, to0, bo1, m); b.tri(bo1, to0, to1, m); b.tri(ti0, ti1, bi0, m); b.tri(bi0, ti1, bi1, m);
      if (ro0 !== ro1) { const s0 = P(a0, ro0, 0), s1 = P(a0, ro0, th), s2 = P(a0, ro1, 0), s3 = P(a0, ro1, th); b.tri(s0, s1, s2, m); b.tri(s2, s1, s3, m); } }
  }
  /* Balken entlang einer Kante (Eisenwerk): Querschnitt Rechteck, aussen auf der Kante */
  function beam(b, A0, B0, w, h, m) {
    const e = V.norm(V.sub(B0, A0)); const out = V.norm(V.mul(V.add(A0, B0), 0.5)); const sd = V.norm(V.cross(e, out)); const up = V.cross(sd, e);
    const C = (p, s, z) => V.add(p, V.add(V.mul(sd, s * w), V.mul(up, z)));
    const q = (a, c, d, e2) => { b.tri(a, c, d, m); b.tri(d, c, e2, m); };
    const a0 = C(A0, -1, -h * 0.3), a1 = C(A0, 1, -h * 0.3), a2 = C(A0, 1, h), a3 = C(A0, -1, h), b0 = C(B0, -1, -h * 0.3), b1 = C(B0, 1, -h * 0.3), b2 = C(B0, 1, h), b3 = C(B0, -1, h);
    q(a3, a2, b3, b2); q(a2, a1, b2, b1); q(a0, a3, b0, b3); q(a1, a0, a2, a3); q(b0, b1, b3, b2);
  }
  /* ---- Körper (Flächen mit Zahlen-UV) ---- */
  function body(b, geo, scale) {
    const P = geo.P; const N = 5;
    for (const f of geo.F) { if (f.v.length !== 3) continue; const rt = V.cross(f.up, f.n); const R = Math.max(...f.v.map((k) => V.len(V.sub(P[k], f.c)))); const s = 0.5 / R; const i = f.val - 1; const cx = i % N, cy = Math.floor(i / N);
      const uv = (p) => { const l = V.sub(p, f.c); return [(cx + 0.5 + V.dot(l, rt) * s) / N, (cy + 0.5 - V.dot(l, f.up) * s) / N]; };
      f.v.forEach((k, j) => { const p = V.mul(P[k], scale); const u = uv(P[k]); b.vtx(p, f.n, u[0], u[1], 0, [j === 0 ? 1 : 0, j === 1 ? 1 : 0, j === 2 ? 1 : 0]); }); }
  }
  function edges(geo) { const E = new Map(); for (const f of geo.F) for (let i = 0; i < f.v.length; i++) { const a = f.v[i], c = f.v[(i + 1) % f.v.length]; const k = a < c ? a + ',' + c : c + ',' + a; if (!E.has(k)) E.set(k, [Math.min(a, c), Math.max(a, c)]); } return [...E.values()]; }
  /* Pseudo-Zufall nur für die Form (fest je Set, kein Regel-Zufall) */
  const prng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function build(sides, set, low) {
    const key = sides + ':' + set + ':' + (low ? 'l' : 'h'); if (meshes.has(key)) return meshes.get(key);
    const geo = d3geo(sides); const P = geo.P; const die = B(), world = B(); const E = edges(geo); const rnd = prng(set.length * 7919 + sides);
    body(die, geo, 1);
    if (set === 'weltenhain') {
      /* zwei verschlungene Wurzelbänder um zwei Achsen, je Kante zwei gedrehte Stränge, Knoten an den Ecken, Blätter */
      const axes = [V.norm(P[0]), V.norm(V.add(P[3], V.mul(P[0], 0.15)))]; const used = new Set();
      for (const ax of axes) for (const [a, c] of E) { const mid = V.norm(V.add(P[a], P[c])); if (Math.abs(V.dot(mid, ax)) < 0.33) used.add(a + ',' + c); }
      const knots = new Set();
      for (const k of used) { const [a, c] = k.split(',').map(Number); knots.add(a); knots.add(c); const A0 = P[a], C0 = P[c]; const e = V.norm(V.sub(C0, A0)); const out = V.norm(V.add(A0, C0)); const sd = V.norm(V.cross(e, out));
        const strands = low ? 1 : 2; const ph0 = rnd() * 6.28;
        for (let s = 0; s < strands; s++) { const pts = []; const M = low ? 8 : 18; for (let i = 0; i <= M; i++) { const t = i / M; const tw = ph0 + s * Math.PI + t * Math.PI * 3.2; const wob = Math.sin(t * Math.PI * 2 + ph0) * 0.025;
            const p = V.add(V.add(A0, V.mul(V.sub(C0, A0), t)), V.add(V.mul(out, 0.035 + 0.03 * Math.sin(Math.PI * t) + (low ? 0 : Math.cos(tw) * 0.02)), V.mul(sd, wob + (low ? 0 : Math.sin(tw) * 0.022)))); pts.push(p); }
          tube(die, pts, low ? 0.042 : 0.036, low ? 5 : 8, 1, (t) => 0.8 + 0.35 * Math.sin(Math.PI * t)); }
        if (!low) for (const t of [0.22, 0.5, 0.78]) { if (rnd() < 0.3) continue; const side = rnd() < 0.5 ? 1 : -1; const base = V.add(V.add(A0, V.mul(V.sub(C0, A0), t)), V.mul(out, 0.06)); const fn = V.norm(V.add(out, V.mul(sd, side * 0.9)));
          const dir = V.norm(V.add(V.mul(sd, side * 0.75), V.mul(e, (rnd() - 0.5) * 1.1))); leaf(die, base, dir, V.norm(V.add(fn, V.mul(out, 0.6))), 0.2 + rnd() * 0.06, 0.075); } }
      for (const k of knots) { sphere(die, V.mul(P[k], 1.04), low ? 0.06 : 0.07, 1, low ? 5 : 8);
        if (low) continue; /* Ranken: kurze, gekrümmte Triebe an den Ecken, enden in einem Blatt; bleiben nahe der Ecke, weg von den Zahlen */
        const n = V.norm(P[k]); const nb = E.filter(([a, c]) => a === k || c === k).map(([a, c]) => (a === k ? c : a)); for (let j = 0; j < 2; j++) { const o = P[nb[Math.floor(rnd() * nb.length)]]; const o2 = P[nb[Math.floor(rnd() * nb.length)]];
          const tgt = V.norm(V.sub(V.mul(V.add(o, o2), 0.5), P[k])); const sd2 = V.norm(V.cross(n, tgt)); const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; const curl = Math.sin(t * Math.PI * 1.4) * 0.07 * (j ? 1 : -1);
            pts.push(V.add(V.mul(P[k], 1.03 + 0.03 * Math.sin(Math.PI * t)), V.add(V.mul(tgt, t * 0.2), V.mul(sd2, curl)))); }
          tube(die, pts, 0.014, 5, 1, (t) => 1 - 0.6 * t); const end = pts[pts.length - 1]; leaf(die, end, V.norm(V.add(tgt, V.mul(sd2, j ? 0.6 : -0.6))), V.norm(V.add(n, V.mul(tgt, -0.2))), 0.17, 0.07); } }
    } else if (set === 'eisenwerk') {
      for (const [a, c] of E) { const A0 = V.add(P[a], V.mul(V.sub(P[c], P[a]), 0.1)), C0 = V.add(P[a], V.mul(V.sub(P[c], P[a]), 0.9)); beam(die, A0, C0, low ? 0.045 : 0.05, low ? 0.035 : 0.045, 4);
        if (!low) for (const t of [0.3, 0.7]) { const out = V.norm(V.add(P[a], P[c])); sphere(die, V.add(V.add(P[a], V.mul(V.sub(P[c], P[a]), t)), V.mul(out, 0.05)), 0.022, 5, 4); } }
      for (let k = 0; k < P.length; k++) { const n = V.norm(P[k]); gear(die, V.mul(P[k], 0.985), n, perp(n), 0.0, 0.08, 6, 0.06, 4, true, 6); }
      for (const f of geo.F) gear(die, V.add(f.c, V.mul(f.n, 0.004)), f.n, f.up, 0.235, 0.262, 14, low ? 0.02 : 0.03, 3, low);
    } else if (set === 'arkanum') {
      for (const [a, c] of E) { const pts = []; for (let i = 0; i <= 2; i++) pts.push(V.mul(V.add(P[a], V.mul(V.sub(P[c], P[a]), i / 2)), 1.006)); tube(die, pts, low ? 0.02 : 0.015, 5, 3); }
      for (let k = 0; k < P.length; k++) sphere(die, V.mul(P[k], 1.01), low ? 0.035 : 0.03, 3, 5);
      /* freistehende Armillarringe in Raumlage: die Zahl in der Mitte bleibt frei, der Würfel dreht sich darin */
      const ring = (nrm, Rr, w, th, orbs) => { const e1 = perp(nrm), e2 = V.cross(nrm, e1); const K = low ? 48 : 96;
        for (let i = 0; i < K; i++) { const a0 = (i / K) * Math.PI * 2, a1 = ((i + 1) / K) * Math.PI * 2; const D = (a) => V.add(V.mul(e1, Math.cos(a)), V.mul(e2, Math.sin(a)));
          const d0 = D(a0), d1 = D(a1); const o0 = V.mul(d0, Rr), o1 = V.mul(d1, Rr), i0 = V.mul(d0, Rr - th), i1 = V.mul(d1, Rr - th); const hw = V.mul(nrm, w / 2);
          const u0 = i / K, u1 = (i + 1) / K;
          /* aussen: Runenband */ world.vtx(V.sub(o0, hw), d0, u0, 0, low ? 3 : 7); world.vtx(V.add(o0, hw), d0, u0, 1, low ? 3 : 7); world.vtx(V.sub(o1, hw), d1, u1, 0, low ? 3 : 7); world.vtx(V.sub(o1, hw), d1, u1, 0, low ? 3 : 7); world.vtx(V.add(o0, hw), d0, u0, 1, low ? 3 : 7); world.vtx(V.add(o1, hw), d1, u1, 1, low ? 3 : 7);
          /* innen und Kanten: Gold */ world.tri(V.sub(i0, hw), V.sub(i1, hw), V.add(i0, hw), 3); world.tri(V.add(i0, hw), V.sub(i1, hw), V.add(i1, hw), 3);
          world.tri(V.add(o0, hw), V.add(i0, hw), V.add(o1, hw), 3); world.tri(V.add(o1, hw), V.add(i0, hw), V.add(i1, hw), 3); world.tri(V.sub(i0, hw), V.sub(o0, hw), V.sub(i1, hw), 3); world.tri(V.sub(i1, hw), V.sub(o0, hw), V.sub(o1, hw), 3); }
        for (const a of orbs) { const d = V.add(V.mul(e1, Math.cos(a)), V.mul(e2, Math.sin(a))); const c = V.mul(d, Rr + 0.02); sphere(world, c, low ? 0.07 : 0.105, 6, low ? 7 : 12); tube(world, [V.sub(c, V.mul(nrm, 0.07)), V.add(c, V.mul(nrm, 0.07))], low ? 0.085 : 0.095, 12, 3, (t) => 0.35 + 0.0 * t); } };
      const tA = 0.62, tB = 0.72;
      ring([0, Math.cos(tA), Math.sin(tA)], 1.22, low ? 0.07 : 0.14, 0.035, low ? [] : [0.35, 2.75, 4.2]);
      ring([Math.cos(tB), 0.08, Math.sin(tB)], 1.17, low ? 0.06 : 0.12, 0.035, low ? [] : [1.35, 4.55]);
    }
    const out = { die: new Float32Array(die.a), world: new Float32Array(world.a), buf: {} };
    if (meshes.size > 12) { const k0 = meshes.keys().next().value; const o = meshes.get(k0); if (gl) Object.values(o.buf).forEach((x) => gl.deleteBuffer(x)); meshes.delete(k0); }
    meshes.set(key, out); return out;
  }
  /* ---- Zeichnen ---- */
  const persp = (fov, near, far) => { const f = 1 / Math.tan(fov / 2); return [f, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]; };
  const qmat = (q) => { const [w, x, y, z] = q; return [1 - 2 * (y * y + z * z), 2 * (x * y + w * z), 2 * (x * z - w * y), 2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x), 2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y)]; };
  function drawOne(item, q, lift) {
    const px = item.px; if (cv.width < px || cv.height < px) { cv.width = cv.height = Math.min(1024, Math.max(px, cv.width)); }
    const geom = build(item.sides, item.set, item.low); const S = SETS[item.set];
    gl.viewport(0, 0, px, px); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, px, px); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.disable(gl.SCISSOR_TEST);
    /* Schatten */
    gl.useProgram(sprog); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, sbuf); gl.enableVertexAttribArray(A.aS); gl.vertexAttribPointer(A.aS, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(U.uB, 0, -0.78 / S.fit, 0.62 * (1 + lift * 0.4) / S.fit, 0.14 * (1 + lift * 0.4) / S.fit); gl.uniform1f(U.uA, 0.55 - lift * 0.5); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(A.aS);
    /* Würfel */
    gl.useProgram(prog); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
    const cam = 7.2; const fit = item.low ? S.fit * 0.93 : S.fit; const fov = 2 * Math.atan(fit / cam) * 1.06; const pr = persp(fov, 4, 11); const pv = pr.slice(); pv[14] = pr[14] + pr[10] * -cam; pv[15] = pr[15] + pr[11] * -cam;
    gl.uniformMatrix4fv(U.uPV, false, new Float32Array(pv)); gl.uniformMatrix3fv(U.uR, false, new Float32Array(qmat(q))); gl.uniform3f(U.uT, 0, lift * 0.55, 0); gl.uniform1f(U.uCam, cam);
    gl.uniform3fv(U.uDeep, S.deep); gl.uniform3fv(U.uMid, S.mid); gl.uniform3fv(U.uGlow, S.glow); gl.uniform3fv(U.uGlyph, S.glyph); gl.uniform1f(U.uKind, S.kind); gl.uniform1f(U.uGold, item.gold ? 1 : 0); gl.uniform1f(U.uDim, item.dim ? 0.55 : 0); gl.uniform1f(U.uGS, item.low ? 1.3 : 1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas()); gl.uniform1i(U.uTex, 0);
    for (const part of ['die', 'world']) { const arr = geom[part]; if (!arr.length) continue; if (!geom.buf[part]) { geom.buf[part] = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, geom.buf[part]); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); }
      gl.bindBuffer(gl.ARRAY_BUFFER, geom.buf[part]); const st = 48; [['aP', 3, 0], ['aN', 3, 12], ['aU', 2, 24], ['aM', 1, 32], ['aX', 3, 36]].forEach(([k, n, o]) => { if (A[k] < 0) return; gl.enableVertexAttribArray(A[k]); gl.vertexAttribPointer(A[k], n, gl.FLOAT, false, st, o); });
      gl.uniform1f(U.uWorld, part === 'world' ? 1 : 0); gl.drawArrays(gl.TRIANGLES, 0, arr.length / 12); }
    ['aP', 'aN', 'aU', 'aM', 'aX'].forEach((k) => { if (A[k] >= 0) gl.disableVertexAttribArray(A[k]); });
    const x2 = item.ctx; x2.clearRect(0, 0, px, px); x2.drawImage(cv, 0, cv.height - px, px, px, 0, 0, px, px);
  }
  function mount(holder, item) {
    const r = holder.getBoundingClientRect(); const css = Math.max(24, Math.round(Math.min(r.width || 64, r.height || r.width || 64)));
    const dpr = Math.min(2, window.devicePixelRatio || 1); item.px = Math.min(512, Math.round(css * dpr)); item.low = css < 50;
    const c = document.createElement('canvas'); c.width = c.height = item.px; c.className = 'w3dc'; c.setAttribute('aria-hidden', 'true'); c.style.width = c.style.height = '100%';
    holder.innerHTML = ''; holder.appendChild(c); item.ctx = c.getContext('2d'); return c;
  }
  /* Ruhelage: Ergebnis zeigt zum Betrachter (gleiche Lage wie der bisherige Renderer) */
  const pose = (sides, value) => d3target(d3geo(sides), value, 0.3).q;
  function still(holder, sides, value, set, opt) {
    if (!supports(sides, set) || !init()) return false;
    try { const item = Object.assign({ sides, set }, opt || {}); mount(holder, item); drawOne(item, pose(sides, value), 0); holder.classList.add('w3d'); return true; } catch (e) { dead = true; console.warn('Artefaktwürfel:', e && e.message); return false; }
  }
  function tick(now) {
    raf = 0; if (dead) return;
    for (let i = act.length - 1; i >= 0; i--) { const it = act[i]; if (!it.holder.isConnected) { act.splice(i, 1); continue; }
      const t = Math.min(1, (now - it.t0) / it.dur); const e = 1 - Math.pow(1 - t, 3);
      const q = Q.mul(Q.axis(it.ax, it.A * (1 - e)), it.end); const hop = Math.abs(Math.sin(Math.PI * t * 2.2)) * Math.pow(1 - t, 1.4) * 0.5;
      try { drawOne(it, t < 1 ? q : it.end, t < 1 ? hop : 0); } catch (x) { dead = true; act.splice(0).forEach((y) => y.fail()); return; }
      if (t >= 1) { act.splice(i, 1); it.done(); } }
    if (act.length) raf = requestAnimationFrame(tick);
  }
  /* rollender Würfel; liefert { skip } oder null (dann übernimmt der bisherige Renderer) */
  function roll(holder, sides, value, set, opt) {
    if (!supports(sides, set) || !init()) return null; opt = opt || {};
    const item = { sides, set, holder, t0: performance.now(), dur: opt.dur || 850, end: pose(sides, value), ax: V.norm([vrand() - 0.5, vrand() - 0.5, vrand() - 0.5]), A: (2.2 + vrand() * 1.6) * Math.PI * 2, finished: false };
    try { mount(holder, item); } catch (e) { return null; }
    if (typeof vfxBusy === 'function') vfxBusy(1);
    item.done = () => { if (item.finished) return; item.finished = true; if (typeof vfxBusy === 'function') vfxBusy(-1); if (opt.onDone) opt.onDone(); };
    item.fail = () => { if (item.finished) return; if (opt.fallback) opt.fallback(); item.done(); };
    act.push(item); if (!raf) raf = requestAnimationFrame(tick);
    return { skip: () => { const i = act.indexOf(item); if (i >= 0) act.splice(i, 1); if (!item.finished) { try { if (!dead) drawOne(item, item.end, 0); else if (opt.fallback) opt.fallback(); } catch (e) { if (opt.fallback) opt.fallback(); } item.done(); } } };
  }
  return { supports, still, roll, ok: () => init(), sets: () => Object.keys(SETS), _build: build, _dead: () => dead, _gl: () => gl, _active: () => act.length, _cache: () => meshes.size };
})();
