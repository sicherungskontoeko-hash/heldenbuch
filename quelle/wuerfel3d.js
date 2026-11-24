/* ---------- Artefaktwürfel v5 (nur Optik) ----------
   WebGL-Darstellung einzelner Würfel mit echten räumlichen Ornamenten je Set, alle 12 Sets, W4 bis W100.
   Bekommt fertige Ergebnisse und zeigt sie nur: kein Regel-Zufall (sichtbarer Zufall aus vrand()), keine Physik.
   Die Formen entstehen beim ersten Gebrauch aus Code (keine Modelldateien); höchstens 16 Formen bleiben im Speicher.
   W4 zeigt Eckzahlen (oben steht das Ergebnis), W10 zeigt 1–10, W100 sind zwei W10 (Zehner 00–90, Einer 0–9).
   Ein gemeinsamer WebGL-Kontext zeichnet nacheinander in kleine 2D-Leinwände; eine Schleife für alle rollenden Würfel,
   keine Leerlauf-Animation. Fehlt WebGL, geht der Kontext verloren oder tritt ein Fehler auf, übernimmt der SVG-Renderer. */
let W3D_FORCE_SLOW = false;
const W3D = (() => {
  /* Körper: kind 0 Kristall, 1 gebürsteter Stahl, 2 Holz, 3 Marmor, 4 Opal, 5 Eis, 6 Stein.
     fx: [Risse, Funkeln, Adern]; rim: Einlage am Flächenrand; ring: Kreis um die Zahl; out: Zahlenkontur; gs: Zahlengrösse */
  const SETS = {
    klassik: { kind: 2, deep: [0.08, 0.045, 0.02], mid: [0.4, 0.22, 0.1], glow: [1.0, 0.8, 0.4], glyph: [1.0, 0.84, 0.5], vein: [0, 0, 0], acc: [0.85, 0.6, 0.25], rim: [0.95, 0.72, 0.32], rimK: 1, fx: [0, 0, 0] },
    koenigsgold: { kind: 0, deep: [0.005, 0.005, 0.007], mid: [0.07, 0.065, 0.06], glow: [1.0, 0.78, 0.35], glyph: [1.0, 0.82, 0.45], vein: [0, 0, 0], acc: [0.86, 0.62, 0.26], rim: [0.95, 0.72, 0.32], rimK: 1, fx: [0.15, 0.6, 0] },
    drachenfeuer: { kind: 0, deep: [0.1, 0.008, 0.0], mid: [0.5, 0.05, 0.015], glow: [1.0, 0.45, 0.08], glyph: [1.0, 0.82, 0.48], vein: [1.0, 0.35, 0.04], acc: [0.62, 0.1, 0.03], fx: [1.2, 0.6, 0.9] },
    frostherz: { kind: 5, deep: [0.06, 0.25, 0.48], mid: [0.6, 0.85, 1.0], glow: [0.85, 0.96, 1.0], glyph: [0.98, 0.99, 1.0], vein: [0.9, 0.97, 1.0], acc: [0.6, 0.85, 1.0], out: [0.06, 0.22, 0.38], fx: [0, 0, 0.15] },
    arkanum: { kind: 0, deep: [0.1, 0.02, 0.2], mid: [0.42, 0.14, 0.72], glow: [0.85, 0.55, 1.0], glyph: [1.0, 0.84, 0.48], vein: [0, 0, 0], acc: [0.86, 0.62, 0.26], fx: [1, 1, 0] },
    totenbein: { kind: 6, deep: [0.12, 0.08, 0.05], mid: [0.33, 0.24, 0.15], glow: [0.45, 1.0, 0.6], glyph: [0.94, 0.88, 0.72], vein: [0, 0, 0], acc: [0.85, 0.8, 0.66], rim: [0.82, 0.76, 0.6], rimK: 0.7, fx: [0, 0, 0] },
    weltenhain: { kind: 0, deep: [0.01, 0.12, 0.05], mid: [0.07, 0.42, 0.18], glow: [0.35, 0.95, 0.45], glyph: [1.0, 0.86, 0.5], vein: [0, 0, 0], acc: [0.5, 0.33, 0.16], fx: [1, 1, 0] },
    eisenwerk: { kind: 1, deep: [0.07, 0.07, 0.08], mid: [0.2, 0.2, 0.22], glow: [1.0, 0.6, 0.3], glyph: [0.95, 0.72, 0.38], vein: [0, 0, 0], acc: [0.46, 0.48, 0.52], fx: [0, 0, 0] },
    blutmond: { kind: 0, deep: [0.02, 0.0, 0.004], mid: [0.2, 0.01, 0.03], glow: [1.0, 0.12, 0.16], glyph: [0.92, 0.92, 0.96], vein: [0.95, 0.05, 0.1], acc: [0.6, 0.02, 0.05], fx: [0.5, 0.4, 0.7] },
    himmelslicht: { kind: 3, deep: [0.74, 0.69, 0.58], mid: [0.99, 0.97, 0.91], glow: [1.0, 0.86, 0.5], glyph: [0.5, 0.32, 0.06], vein: [0.86, 0.62, 0.22], acc: [0.86, 0.62, 0.26], rim: [0.9, 0.68, 0.28], rimK: 1, fx: [0, 0, 0] },
    chaosprisma: { kind: 4, deep: [0.02, 0.02, 0.035], mid: [0.15, 0.15, 0.22], glow: [0.85, 0.75, 1.0], glyph: [1.0, 1.0, 1.0], vein: [0, 0, 0], acc: [0.6, 0.6, 0.7], out: [0.0, 0.0, 0.0], fx: [0, 0.5, 0] },
    schatten: { kind: 0, deep: [0.025, 0.025, 0.03], mid: [0.2, 0.2, 0.23], glow: [0.95, 0.14, 0.12], glyph: [1.0, 0.5, 0.46], vein: [0.7, 0.05, 0.05], acc: [0.5, 0.03, 0.03], ring: [1.0, 0.18, 0.14], fx: [0.25, 0.25, 0.3], gs: 0.84 }
  };
  const SIDES = [4, 6, 8, 10, 12, 20, 100];
  let cv = null, gl = null, prog = null, sprog = null, dead = false, tex = null, sbuf = null; const U = {}; const A = {};
  const meshes = new Map(); const act = []; let raf = 0;
  /* Abschalten zum Testen: localStorage «hb_w3d» = «0». Zu langsames Gerät (zwei Würfe hintereinander unter 20 Bildern
     pro Sekunde): für diese Sitzung die bisherige Darstellung. */
  let slow = 0, off = null;
  const isOff = () => { if (off === null) { try { off = localStorage.getItem('hb_w3d') === '0'; } catch (e) { off = false; } } return off; };
  const supports = (sides, set) => !dead && slow < 2 && !isOff() && SIDES.includes(sides) && !!SETS[set] && typeof d3geo === 'function';
  /* ---- Zahlen-Atlas: 8 × 8 Zellen ---- */
  const CELLS = 8; const C_TENS = 20, C_ZERO = 30, C_W4 = 31, C_RUNE = 35;
  /* Zahlengrösse je Würfelform: s = KS / Inkreisradius (Zellenbruchteil pro Längeneinheit) */
  const KS = { 4: 0.25, 6: 0.4, 8: 0.27, 10: 0.416, 12: 0.42, 20: 0.25 };
  const lc = (geo, f) => (geo.sides === 10 ? V.add(f.c, V.mul(f.up, -0.13)) : f.c);
  /* ---- Shader ---- */
  const VS = 'attribute vec3 aP,aN;attribute vec2 aU;attribute float aM;attribute vec3 aX;uniform mat4 uPV;uniform mat3 uR;uniform vec3 uT;uniform float uWorld,uSc;' +
    'varying vec3 vN,vW,vO,vX;varying vec2 vU;varying float vM;' +
    'void main(){mat3 R=uWorld>.5?mat3(1.):uR;vec3 w=R*(aP*uSc)+uT;vN=R*aN;vW=w;vO=aP;vU=aU;vM=aM;vX=aX;gl_Position=uPV*vec4(w,1.);}';
  const FS = 'precision highp float;varying vec3 vN,vW,vO,vX;varying vec2 vU;varying float vM;uniform sampler2D uTex;' +
    'uniform vec3 uDeep,uMid,uGlow,uGlyph,uVein,uAcc,uRim,uOut,uRing,uFx;uniform float uKind,uGold,uDim,uCam,uGS,uRimK,uOutK,uRingK,uRingR;' +
    'float h3(vec3 p){p=fract(p*.3183099+vec3(.1,.23,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}' +
    'float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}' +
    'float fb(vec3 p){return .55*n3(p)+.3*n3(p*2.1+3.1)+.15*n3(p*4.3+7.7);}' +
    'vec3 hue(float h){return clamp(abs(fract(h+vec3(0.,.333,.667))*6.-3.)-1.,0.,1.);}' +
    'vec3 env(vec3 R){float a=exp(-pow((R.x+.45)*3.6,2.))*smoothstep(-.3,.7,R.y);float b=exp(-pow((R.y-.62)*5.,2.))*smoothstep(-.8,.3,R.x);float c=smoothstep(.2,1.,R.y)*.35;return vec3(.95,.93,.88)*(a*.9+b*.55)+vec3(.55,.6,.7)*c;}' +
    'void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;vec3 V=normalize(vec3(0.,0.,uCam)-vW);vec3 L=normalize(vec3(-.55,.8,.75));vec3 L2=normalize(vec3(.8,-.15,.45));' +
    'float d=max(dot(N,L),0.),d2=max(dot(N,L2),0.);vec3 H=normalize(L+V);float fr=pow(1.-max(dot(N,V),0.),3.);vec3 R=reflect(-V,N);vec3 c;float m=vM;float sp=pow(max(dot(N,H),0.),70.);' +
    /* 0: Körperfläche mit Zahl */
    'if(m<.5){float e=min(vX.x,min(vX.y,vX.z));float f=fb(vO*3.4+2.);float inner=smoothstep(.0,.3,e);vec3 base;vec3 em=vec3(0.);float gloss=1.;' +
    ' float vn=1.-smoothstep(.0,.035,abs(fb(vO*3.1+4.)-.5));em+=uVein*vn*uFx.z*(.4+.6*inner);' +
    ' if(uKind<.5){float crack=1.-smoothstep(.0,.012,abs(n3(vO*4.2+9.)-.5));float cloud=fb(vO*2.6+1.3);base=mix(uDeep,uMid,.25+.55*cloud+.35*inner)*(.6+.6*inner);em+=uGlow*(crack*.35*inner+pow(inner,2.)*.18*cloud)*uFx.x+uGlow*step(.994,h3(floor(vO*46.)))*.8*uFx.y;}' +
    ' else if(uKind<1.5){float br=n3(vec3(vO.x*70.,vO.y*6.,vO.z*55.));base=uMid*(.55+.6*br)*(.8+.3*f);gloss=.55;}' +
    ' else if(uKind<2.5){float g=fb(vec3(vO.x*2.,vO.y*16.,vO.z*2.)+f*1.5);float rg=.5+.5*sin(vO.y*38.+g*10.+vO.x*6.);base=mix(uDeep,uMid,.2+.5*rg*(.5+.5*g)+.25*f)*(.75+.35*inner);gloss=.4;}' +
    ' else if(uKind<3.5){float w=abs(sin(vO.x*5.+vO.z*3.+fb(vO*2.3)*9.));float vg=1.-smoothstep(.0,.05,w);base=mix(uMid,uDeep,fb(vO*5.)*.55);base=mix(base,uVein*1.1,vg*.85);gloss=.75;em+=uVein*vg*.15;}' +
    ' else if(uKind<4.5){float h=dot(N,V)*.9+fb(vO*3.)*1.3+vO.y*.3;vec3 ir=hue(h);float pt=smoothstep(.45,.8,fb(vO*4.+5.));base=uDeep+ir*(.12+.42*pt)*(.35+.65*fr+.4*d);em+=ir*pt*.06+uGlow*step(.994,h3(floor(vO*46.)))*.8*uFx.y;gloss=1.3;}' +
    ' else if(uKind<5.5){float bub=step(.9,h3(floor(vO*26.)))*smoothstep(.3,.12,length(fract(vO*26.)-.5));float fro=pow(fb(vO*13.),1.5)*pow(1.-inner,2.);float cl=fb(vO*2.4+1.);base=mix(uMid,uDeep,.25+.55*inner*cl+.2*cl)+vec3(.7,.85,.95)*fro*.55;float cr=1.-smoothstep(.0,.01,abs(n3(vO*4.6+2.)-.5));em+=uGlow*(bub*.45+cr*.18*inner);gloss=1.4;}' +
    ' else{float crack=1.-smoothstep(.0,.02,abs(n3(vO*5.+3.)-.5));base=mix(uDeep,uMid,.3+.6*f)*(1.-crack*.55);gloss=.3;}' +
    ' vec2 cc=(floor(vU*8.)+.5)/8.;vec2 gu=cc+(vU-cc)/uGS;float a=texture2D(uTex,gu).a;float aS=texture2D(uTex,gu+vec2(-.001,-.001)).a;float aH=texture2D(uTex,gu+vec2(.001,.001)).a;' +
    ' vec3 lit=base*(.32+.75*d+.25*d2)+em;lit+=env(R)*(.08+.55*fr)*gloss+vec3(1.)*sp*.55*gloss;' +
    ' lit=mix(lit,lit*.55,smoothstep(.05,.0,e)*.6)+vec3(1.,.97,.9)*smoothstep(.022,.0,e)*.35*gloss;' +
    ' float rim=smoothstep(.05,.06,e)*smoothstep(.085,.074,e);lit=mix(lit,uRim*(.4+.75*d)+env(R)*.4*uRim+vec3(1.)*sp*.4,rim*uRimK);' +
    ' float rr=length(vU-cc)*8.;lit=mix(lit,uRing*1.15+vec3(.15,.0,.0),smoothstep(.016,.004,abs(rr-uRingR))*uRingK);' +
    ' vec3 gl=uGlyph*(.55+.6*d)+env(R)*.25+uGlyph*uGold*.6;gl*=1.-max(aS-a,0.)*.6;gl+=max(aH-a,0.)*.25;lit*=1.-max(aS-a,0.)*.5;' +
    ' if(uOutK>.0){float o=max(max(texture2D(uTex,gu+vec2(.0024,0.)).a,texture2D(uTex,gu-vec2(.0024,0.)).a),max(texture2D(uTex,gu+vec2(0.,.0024)).a,texture2D(uTex,gu-vec2(0.,.0024)).a));lit=mix(lit,uOut,max(o-a,0.)*uOutK);}' +
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
    'else if(m<7.5){float k=floor(vU.x*30.);vec2 uv=(vec2(3.+mod(k,5.),4.)+vec2(fract(vU.x*30.),vU.y))/8.;float r=texture2D(uTex,uv).a;vec3 b=vec3(.82,.6,.26);' +
    ' c=b*(.2+.5*d)+b*env(R)*(1.+fr)+vec3(1.,.95,.85)*pow(max(dot(N,H),0.),40.)*.7;c=mix(c,uGlow*1.25+vec3(.15),r*smoothstep(.15,.3,vU.y)*smoothstep(.85,.7,vU.y));}' +
    /* 8: Knochen */
    'else if(m<8.5){float g=fb(vO*9.+vec3(vU.x*3.));vec3 b=mix(vec3(.6,.53,.4),vec3(.94,.89,.75),g);c=b*(.3+.72*d+.25*d2)+vec3(1.,.97,.9)*pow(max(dot(N,H),0.),20.)*.22;}' +
    /* 9: Akzent (Horn, Dorn, Lack) mit leuchtender Spitze */
    'else if(m<9.5){vec3 b=mix(uAcc*.22,uAcc,smoothstep(.0,1.,vU.x));c=b*(.25+.7*d+.2*d2)+env(R)*(.12+.55*fr)+vec3(1.)*pow(max(dot(N,H),0.),50.)*.6+uGlow*pow(vU.x,6.)*.55;}' +
    /* 10: Eiskristall */
    'else if(m<10.5){vec3 b=mix(vec3(.42,.7,.94),vec3(.93,.98,1.),fr+.3*vU.x);c=b*(.35+.6*d+.2*d2)+env(R)*(.35+.9*fr)+vec3(1.)*pow(max(dot(N,H),0.),80.)*.9+uGlow*.08;}' +
    /* 11: Prismensplitter (Farbe je Splitter in vX.x) */
    'else if(m<11.5){vec3 ir=hue(vX.x+dot(N,vec3(.25,.4,.15))+vU.x*.25);c=ir*(.35+.7*d+.2*d2)+env(R)*(.2+.8*fr)+vec3(1.)*pow(max(dot(N,H),0.),60.)*.8;}' +
    /* 12: Silber */
    'else if(m<12.5){vec3 b=vec3(.74,.77,.83);c=b*(.18+.5*d+.15*d2)+b*env(R)*(1.+fr*.8)+vec3(1.)*pow(max(dot(N,H),0.),45.)*.8;}' +
    /* 13: Leuchten (Mond, Sonne, Edelstein) */
    'else if(m<13.5){c=uGlow*(.72+.45*d)+vec3(1.)*fr*.25+vec3(1.)*pow(max(dot(N,H),0.),40.)*.5;}' +
    /* 14: Höhle (Augen des Schädels), schwach glimmend */
    'else{c=vec3(.03,.025,.02)+uGlow*.35*(1.-fr);}' +
    'c=mix(c,vec3(dot(c,vec3(.3,.59,.11)))*.6,uDim);gl_FragColor=vec4(clamp(c,0.,1.),1.);}';
  const SVS = 'attribute vec2 aS;varying vec2 v;uniform vec4 uB;void main(){v=aS;gl_Position=vec4(uB.xy+aS*uB.zw,.99,1.);}';
  const SFS = 'precision mediump float;varying vec2 v;uniform float uA;void main(){float r=dot(v,v);gl_FragColor=vec4(0.,0.,0.,uA*exp(-r*3.2)*(1.-smoothstep(.8,1.,r)));}';
  const UNI = ['uPV', 'uR', 'uT', 'uWorld', 'uSc', 'uTex', 'uDeep', 'uMid', 'uGlow', 'uGlyph', 'uVein', 'uAcc', 'uRim', 'uOut', 'uRing', 'uFx', 'uKind', 'uGold', 'uDim', 'uCam', 'uGS', 'uRimK', 'uOutK', 'uRingK', 'uRingR'];
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
      for (const k of UNI) U[k] = gl.getUniformLocation(prog, k);
      U.uB = gl.getUniformLocation(sprog, 'uB'); U.uA = gl.getUniformLocation(sprog, 'uA'); A.aS = gl.getAttribLocation(sprog, 'aS');
      sbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sbuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      return true;
    } catch (e) { dead = true; if (typeof console !== 'undefined') console.warn('Artefaktwürfel: WebGL nicht verfügbar', e && e.message); return false; }
  }
  /* Zellen: 0–19 Zahlen 1–20, 20–29 Zehner 00–90, 30 «0», 31–34 W4-Flächen mit Eckzahlen, 35–39 Runen */
  function atlas() {
    if (tex) return tex; const N = CELLS, S = 2048, cs = S / N; const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    const fam = (typeof document !== 'undefined' && document.fonts && document.fonts.check && document.fonts.check('bold 40px Cinzel')) ? 'Cinzel' : 'Georgia, serif';
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const put = (i, s, mark, size, cx0, cy0, rot) => { const cx = cx0 != null ? cx0 : (i % N + 0.5) * cs, cy = cy0 != null ? cy0 : (Math.floor(i / N) + 0.5) * cs;
      let fs = cs * (size || 0.37); x.font = 'bold ' + fs + 'px ' + fam; const w = x.measureText(s).width; const mw = cs * (size ? size * 1.15 : 0.42); if (w > mw) { fs *= mw / w; x.font = 'bold ' + fs + 'px ' + fam; }
      x.save(); x.translate(cx, cy); if (rot) x.rotate(rot); x.fillText(s, 0, fs * 0.04); if (mark) x.fillRect(-cs * 0.06 * (fs / (cs * 0.37)), fs * 0.42, cs * 0.12 * (fs / (cs * 0.37)), Math.max(3, fs * 0.06)); x.restore(); };
    for (let v = 1; v <= 20; v++) put(v - 1, String(v), v === 6 || v === 9);
    for (let k = 0; k < 10; k++) put(C_TENS + k, k ? String(k * 10) : '00');
    put(C_ZERO, '0');
    /* W4: jede Fläche zeigt die Zahlen ihrer drei Ecken, jeweils aufrecht zur Ecke hin */
    const g4 = d3geo(4); g4.F.forEach((f, fi) => { const rt = V.cross(f.up, f.n); const s = KS[4] / f.ri; const i = C_W4 + fi; const ccx = (i % N + 0.5) * cs, ccy = (Math.floor(i / N) + 0.5) * cs;
      f.v.forEach((k) => { const l = V.sub(g4.P[k], f.c); const dx = V.dot(l, rt) * s, dy = -V.dot(l, f.up) * s; const len = Math.hypot(dx, dy) || 1; put(0, String(k + 1), false, 0.17, ccx + (dx / len) * 0.27 * cs, ccy + (dy / len) * 0.27 * cs, Math.atan2(dx, -dy)); }); });
    const RU = 'ᚠᚢᚦᚨᚱ'; x.font = 'bold ' + Math.round(cs * 0.62) + 'px Georgia, serif';
    for (let k = 0; k < 5; k++) { const i = C_RUNE + k; x.fillText(RU[k], (i % N + 0.5) * cs, (Math.floor(i / N) + 0.5) * cs + cs * 0.02); }
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.generateMipmap(gl.TEXTURE_2D);
    return tex;
  }
  /* ---- Geometrie-Bausteine ---- */
  function B() { const a = []; const vtx = (p, n, u, v, m, x) => a.push(p[0], p[1], p[2], n[0], n[1], n[2], u, v, m, x ? x[0] : 0, x ? x[1] : 0, x ? x[2] : 0);
    return { a, vtx, tri(p, q, r, m, u, x) { const n = V.norm(V.cross(V.sub(q, p), V.sub(r, p))); vtx(p, n, u ? u[0] : 0, u ? u[1] : 0, m, x); vtx(q, n, u ? u[0] : 0, u ? u[1] : 0, m, x); vtx(r, n, u ? u[0] : 0, u ? u[1] : 0, m, x); } }; }
  const perp = (n) => V.norm(Math.abs(n[0]) < 0.9 ? V.cross(n, [1, 0, 0]) : V.cross(n, [0, 1, 0]));
  const lerp = (a, b, t) => V.add(a, V.mul(V.sub(b, a), t));
  /* Röhre entlang einer Punktfolge (glatte Normalen), uv.x läuft entlang; x: Zusatzwert (z. B. Farbton) */
  function tube(b, pts, rad, seg, m, radFn, x) {
    const rings = []; let ref = perp(V.sub(pts[1], pts[0]));
    for (let i = 0; i < pts.length; i++) { const t = V.norm(V.sub(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)])); ref = V.norm(V.sub(ref, V.mul(t, V.dot(ref, t)))); const bi = V.cross(t, ref); const r = radFn ? radFn(i / (pts.length - 1)) * rad : rad;
      const ring = []; for (let k = 0; k <= seg; k++) { const an = (k / seg) * Math.PI * 2; const nn = V.add(V.mul(ref, Math.cos(an)), V.mul(bi, Math.sin(an))); ring.push([V.add(pts[i], V.mul(nn, r)), nn, k / seg]); } rings.push(ring); }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < seg; k++) { const a = rings[i][k], c = rings[i][k + 1], d = rings[i + 1][k], e = rings[i + 1][k + 1]; const u0 = i / (rings.length - 1), u1 = (i + 1) / (rings.length - 1);
      b.vtx(a[0], a[1], u0, a[2], m, x); b.vtx(d[0], d[1], u1, d[2], m, x); b.vtx(c[0], c[1], u0, c[2] + 1 / seg, m, x); b.vtx(c[0], c[1], u0, c[2] + 1 / seg, m, x); b.vtx(d[0], d[1], u1, d[2], m, x); b.vtx(e[0], e[1], u1, e[2] + 1 / seg, m, x); }
  }
  function sphere(b, c, r, m, seg) { seg = seg || 10; for (let i = 0; i < seg; i++) for (let k = 0; k < seg * 2; k++) { const P = (ii, kk) => { const th = (ii / seg) * Math.PI, ph = (kk / (seg * 2)) * Math.PI * 2; const n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]; return [V.add(c, V.mul(n, r)), n]; };
    const a = P(i, k), bb = P(i + 1, k), cc = P(i, k + 1), d = P(i + 1, k + 1); for (const [p, n] of [a, cc, bb, bb, cc, d]) b.vtx(p, n, 0, 0, m); } }
  /* Kegel/Horn vom Fuss zur Spitze; bend: seitliche Krümmung (quadratisch), x: Zusatzwert */
  function cone(b, base, dir, len, rad, m, seg, bend, x) { const M = bend ? 6 : 1; const pts = []; for (let i = 0; i <= M; i++) { const t = i / M; let p = V.add(base, V.mul(dir, len * t)); if (bend) p = V.add(p, V.mul(bend, t * t)); pts.push(p); }
    tube(b, pts, rad, seg, m, (t) => Math.max(0.03, Math.pow(1 - t, 0.9)), x); }
  /* facettierte Spitze (Kristall, Dorn): Schaft bis tipK, dann Spitze; uv.x 0 am Fuss, 1 an der Spitze */
  function prism(b, base, dir, len, rad, seg, m, x, tipK) { tipK = tipK == null ? 0.6 : tipK; const e1 = perp(dir), e2 = V.cross(dir, e1);
    const ring = (t, r) => { const c = V.add(base, V.mul(dir, len * t)); const o = []; for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2 + 0.3; o.push(V.add(c, V.add(V.mul(e1, Math.cos(a) * r), V.mul(e2, Math.sin(a) * r)))); } return o; };
    const r0 = ring(0, rad), r1 = ring(tipK, rad * 0.82), tip = V.add(base, V.mul(dir, len));
    const face = (p, q, r, u0, u1, u2) => { const n = V.norm(V.cross(V.sub(q, p), V.sub(r, p))); b.vtx(p, n, u0, 0, m, x); b.vtx(q, n, u1, 0, m, x); b.vtx(r, n, u2, 0, m, x); };
    for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; if (tipK > 0) { face(r0[i], r0[j], r1[i], 0, 0, tipK); face(r1[i], r0[j], r1[j], tipK, 0, tipK); face(r1[i], r1[j], tip, tipK, tipK, 1); } else face(r0[i], r0[j], tip, 0, 0, 1); } }
  /* Ring (Röhre auf einem Kreis) um die Achse n */
  function hoop(b, c, n, r, rad, m, K, seg) { const e1 = perp(n), e2 = V.cross(n, e1); const pts = []; for (let i = 0; i <= K; i++) { const a = (i / K) * Math.PI * 2; pts.push(V.add(c, V.add(V.mul(e1, Math.cos(a) * r), V.mul(e2, Math.sin(a) * r)))); } tube(b, pts, rad, seg, m); }
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
      b.tri(ti0, to0, ti1, m); b.tri(ti1, to0, to1, m); b.tri(bo0, to0, bo1, m); b.tri(bo1, to0, to1, m); if (r0 > 0) { b.tri(ti0, ti1, bi0, m); b.tri(bi0, ti1, bi1, m); }
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
  /* Kantenrahmen: Röhren auf allen Kanten, Kugeln an den Ecken */
  function frame(b, P, E, rad, m, seg, joint, k) { k = k || 1.004; for (const [a, c] of E) tube(b, [V.mul(P[a], k), V.mul(P[c], k)], rad, seg, m); if (joint) for (const p of P) sphere(b, V.mul(p, k), joint, m, seg > 5 ? 6 : 4); }
  /* Abstand eines Punktes zur nächsten Flächenkante */
  function inr(P, f, c) { let r = 9; for (let i = 0; i < f.v.length; i++) { const a = P[f.v[i]], d = P[f.v[(i + 1) % f.v.length]]; const e = V.norm(V.sub(d, a)); const w = V.sub(c, a); r = Math.min(r, V.len(V.sub(w, V.mul(e, V.dot(w, e))))); } return r; }
  /* ---- Körper (Flächen mit Zahlen-UV); Vielecke als Fächer, Kantenabstand in vX ---- */
  function body(b, geo, cellOf) {
    const P = geo.P; const N = CELLS; const k = KS[geo.sides] || 0.25;
    geo.F.forEach((f, fi) => { const rt = V.cross(f.up, f.n); const s = k / f.ri; const i = cellOf(f, fi); const cx = i % N, cy = Math.floor(i / N); const L = lc(geo, f);
      const uv = (p) => { const l = V.sub(p, L); return [(cx + 0.5 + V.dot(l, rt) * s) / N, (cy + 0.5 - V.dot(l, f.up) * s) / N]; };
      if (f.v.length === 3) { f.v.forEach((m, j) => { const u = uv(P[m]); b.vtx(P[m], f.n, u[0], u[1], 0, [j === 0 ? 1 : 0, j === 1 ? 1 : 0, j === 2 ? 1 : 0]); }); return; }
      const uc = uv(f.c); for (let j = 0; j < f.v.length; j++) { const p = P[f.v[j]], q = P[f.v[(j + 1) % f.v.length]]; const mid = V.mul(V.add(p, q), 0.5); const ap = V.len(V.sub(mid, f.c)); const e0 = ap / (3 * f.ri);
        const up = uv(p), uq = uv(q); b.vtx(f.c, f.n, uc[0], uc[1], 0, [e0, 1, 1]); b.vtx(p, f.n, up[0], up[1], 0, [0, 1, 1]); b.vtx(q, f.n, uq[0], uq[1], 0, [0, 1, 1]); } });
  }
  function edges(geo) { const E = new Map(); for (const f of geo.F) for (let i = 0; i < f.v.length; i++) { const a = f.v[i], c = f.v[(i + 1) % f.v.length]; const k = a < c ? a + ',' + c : c + ',' + a; if (!E.has(k)) E.set(k, [Math.min(a, c), Math.max(a, c)]); } return [...E.values()]; }
  /* Pseudo-Zufall nur für die Form (fest je Set, kein Regel-Zufall) */
  const prng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  /* Zahlenzelle je Fläche: lab '' normal, 't' Zehner (W100), 'u' Einer (W100) */
  const cellFn = (sides, lab) => (f, fi) => sides === 4 ? C_W4 + fi : lab === 't' ? C_TENS + (f.val - 1) : lab === 'u' ? (f.val === 10 ? C_ZERO : f.val - 1) : f.val - 1;
  /* ---- Ornamente je Set ---- */
  const DECO = {
    klassik(o) { const { die, P, E, low } = o; frame(die, P, E, low ? 0.03 : 0.024, 3, low ? 4 : 6, low ? 0 : 0.036);
      if (!low) for (const p of P) prism(die, V.mul(p, 0.98), V.norm(p), 0.12, 0.055, 4, 3, null, 0); },
    koenigsgold(o) { const { die, P, E, low, top } = o; frame(die, P, E, low ? 0.03 : 0.026, 3, low ? 4 : 6, low ? 0 : 0.038);
      P.forEach((p, i) => { if (i === top) return; prism(die, V.mul(p, 0.96), V.norm(p), low ? 0.16 : 0.22, low ? 0.07 : 0.065, 4, 3, null, 0); });
      if (top < 0) return;
      /* Krone auf der Schmuckecke: Reif, Zacken mit Perlen, Edelstein */
      const n = V.norm(P[top]); const c0 = V.mul(P[top], 1.05); const e1 = perp(n), e2 = V.cross(n, e1); hoop(die, c0, n, 0.23, low ? 0.036 : 0.032, 3, low ? 12 : 28, low ? 4 : 6);
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const rd = V.add(V.mul(e1, Math.cos(a)), V.mul(e2, Math.sin(a))); const base = V.add(c0, V.mul(rd, 0.23)); const dir = V.norm(V.add(n, V.mul(rd, 0.3)));
        prism(die, base, dir, 0.24, 0.05, 4, 3, null, 0); if (!low) sphere(die, V.add(base, V.mul(dir, 0.25)), 0.034, 3, 5); }
      sphere(die, V.add(c0, V.mul(n, 0.07)), low ? 0.1 : 0.095, 13, low ? 6 : 9); },
    drachenfeuer(o) { const { die, P, E, low, rnd } = o; for (const [a, c] of E) tube(die, [V.mul(P[a], 1.004), V.mul(P[c], 1.004)], low ? 0.034 : 0.03, low ? 4 : 6, 9, (t) => 0.7 + 0.5 * Math.sin(Math.PI * t));
      if (!low) for (const [a, c] of E) { const mid = lerp(P[a], P[c], 0.5); prism(die, V.mul(mid, 0.99), V.norm(mid), 0.12, 0.045, 4, 9, null, 0); }
      /* zwei geschwungene Hörner an gegenüberliegenden Ecken, Dornen an den übrigen */
      const { top, bot } = o;
      P.forEach((p, i) => { const n = V.norm(p); if (i === top || i === bot) { const sd = V.norm(V.cross(n, [0.2, 0.3, 1])); cone(die, V.mul(p, 0.88), n, low ? 0.44 : 0.52, low ? 0.16 : 0.15, 9, low ? 6 : 9, V.mul(sd, 0.24)); }
        else prism(die, V.mul(p, 0.95), n, (low ? 0.17 : 0.2) + rnd() * 0.06, low ? 0.08 : 0.075, 4, 9, null, 0); }); },
    frostherz(o) { const { die, P, E, low, rnd } = o; frame(die, P, E, low ? 0.02 : 0.015, 12, 4, 0);
      /* Eiskristalle: ein grosser Kristall je Ecke, kleinere seitlich und auf den Kanten */
      for (const p of P) { const n = V.norm(p); prism(die, V.mul(p, 0.9), n, low ? 0.32 : 0.38, low ? 0.11 : 0.1, 6, 10, null, 0.55);
        if (!low) for (let j = 0; j < 3; j++) { const sd = perp(n); const a = (j / 3) * Math.PI * 2 + rnd(); const t = V.add(V.mul(sd, Math.cos(a)), V.mul(V.cross(n, sd), Math.sin(a))); prism(die, V.mul(p, 0.92), V.norm(V.add(n, V.mul(t, 0.85))), 0.17 + rnd() * 0.06, 0.055, 6, 10, null, 0.5); } }
      if (!low) for (const [a, c] of E) { const mid = lerp(P[a], P[c], 0.5); prism(die, V.mul(mid, 0.98), V.norm(mid), 0.1 + rnd() * 0.05, 0.045, 6, 10, null, 0.5); } },
    arkanum(o) { const { die, world, P, E, low, sides } = o;
      for (const [a, c] of E) { const pts = []; for (let i = 0; i <= 2; i++) pts.push(V.mul(lerp(P[a], P[c], i / 2), 1.006)); tube(die, pts, low ? 0.02 : 0.015, 5, 3); }
      for (let k = 0; k < P.length; k++) sphere(die, V.mul(P[k], 1.01), low ? 0.035 : 0.03, 3, 5);
      if (sides !== 20) { /* kleinere Würfel: Kristallkugeln auf Stielen an zwei gegenüberliegenden Ecken */
        for (const i of (o.top < 0 ? [0] : [o.top, o.bot])) { const n = V.norm(P[i]); tube(die, [V.mul(P[i], 0.98), V.mul(P[i], 1.1)], 0.024, 5, 3); hoop(die, V.mul(n, 1.1), n, 0.06, 0.016, 3, 12, 4); sphere(die, V.mul(n, 1.2), low ? 0.1 : 0.1, 6, low ? 6 : 10); }
        return; }
      /* freistehende Armillarringe in Raumlage: die Zahl in der Mitte bleibt frei, der Würfel dreht sich darin */
      const ring = (nrm, Rr, w, th, orbs) => { const e1 = perp(nrm), e2 = V.cross(nrm, e1); const K = low ? 48 : 96;
        for (let i = 0; i < K; i++) { const a0 = (i / K) * Math.PI * 2, a1 = ((i + 1) / K) * Math.PI * 2; const D = (a) => V.add(V.mul(e1, Math.cos(a)), V.mul(e2, Math.sin(a)));
          const d0 = D(a0), d1 = D(a1); const o0 = V.mul(d0, Rr), o1 = V.mul(d1, Rr), i0 = V.mul(d0, Rr - th), i1 = V.mul(d1, Rr - th); const hw = V.mul(nrm, w / 2);
          const u0 = i / K, u1 = (i + 1) / K; const mb = low ? 3 : 7;
          /* aussen: Runenband */ world.vtx(V.sub(o0, hw), d0, u0, 0, mb); world.vtx(V.add(o0, hw), d0, u0, 1, mb); world.vtx(V.sub(o1, hw), d1, u1, 0, mb); world.vtx(V.sub(o1, hw), d1, u1, 0, mb); world.vtx(V.add(o0, hw), d0, u0, 1, mb); world.vtx(V.add(o1, hw), d1, u1, 1, mb);
          /* innen und Kanten: Gold */ world.tri(V.sub(i0, hw), V.sub(i1, hw), V.add(i0, hw), 3); world.tri(V.add(i0, hw), V.sub(i1, hw), V.add(i1, hw), 3);
          world.tri(V.add(o0, hw), V.add(i0, hw), V.add(o1, hw), 3); world.tri(V.add(o1, hw), V.add(i0, hw), V.add(i1, hw), 3); world.tri(V.sub(i0, hw), V.sub(o0, hw), V.sub(i1, hw), 3); world.tri(V.sub(i1, hw), V.sub(o0, hw), V.sub(o1, hw), 3); }
        for (const a of orbs) { const d = V.add(V.mul(e1, Math.cos(a)), V.mul(e2, Math.sin(a))); const c = V.mul(d, Rr + 0.02); sphere(world, c, low ? 0.07 : 0.105, 6, low ? 7 : 12); tube(world, [V.sub(c, V.mul(nrm, 0.07)), V.add(c, V.mul(nrm, 0.07))], low ? 0.085 : 0.095, 12, 3, () => 0.35); } };
      const tA = 0.62, tB = 0.72;
      ring([0, Math.cos(tA), Math.sin(tA)], 1.22, low ? 0.07 : 0.14, 0.035, low ? [] : [0.35, 2.75, 4.2]);
      ring([Math.cos(tB), 0.08, Math.sin(tB)], 1.17, low ? 0.06 : 0.12, 0.035, low ? [] : [1.35, 4.55]); },
    totenbein(o) { const { die, P, E, low } = o; /* Knochen mit verdickten Enden auf jeder Kante, Gelenkknöpfe und Knochendornen */
      for (const [a, c] of E) { const pts = []; for (let i = 0; i <= 4; i++) pts.push(V.mul(lerp(P[a], P[c], 0.06 + 0.88 * i / 4), 1.01 + 0.015 * Math.sin(Math.PI * i / 4)));
        tube(die, pts, low ? 0.034 : 0.03, low ? 4 : 6, 8, (t) => 0.8 + 0.8 * (Math.pow(1 - t, 6) + Math.pow(t, 6))); }
      P.forEach((p, i) => { if (i === o.top) return; sphere(die, V.mul(p, 1.01), low ? 0.065 : 0.062, 8, low ? 4 : 7); if (!low) cone(die, V.mul(p, 0.98), V.norm(p), 0.2, 0.06, 8, 6, V.mul(perp(V.norm(p)), 0.06)); });
      if (o.top < 0) return; /* Schädel: Hirnschale, Kiefer, Augenhöhlen; schaut beim Höchstwert zum Betrachter */
      const q = o.pose; const fw0 = Q.rot([q[0], -q[1], -q[2], -q[3]], [0, 0, 1]); const n = V.norm(P[o.top]); const fw = V.norm(V.sub(fw0, V.mul(n, V.dot(fw0, n)))); const sd = V.cross(n, fw);
      const K = 1.55; const c = V.add(V.mul(n, 1.0 + 0.13 * K), V.mul(fw, 0.03)); const sg = low ? 6 : 10;
      sphere(die, c, 0.135 * K, 8, sg); sphere(die, V.add(c, V.add(V.mul(n, -0.09 * K), V.mul(fw, 0.06 * K))), 0.085 * K, 8, sg - 2);
      for (const k of [-1, 1]) sphere(die, V.add(c, V.add(V.add(V.mul(fw, 0.1 * K), V.mul(sd, k * 0.05 * K)), V.mul(n, -0.01 * K))), 0.036 * K, 14, low ? 4 : 6);
      sphere(die, V.add(c, V.add(V.mul(fw, 0.125 * K), V.mul(n, -0.06 * K))), 0.018 * K, 14, 4); },
    weltenhain(o) { const { die, P, E, low, rnd } = o;
      /* zwei verschlungene Wurzelbänder um zwei Achsen, je Kante zwei gedrehte Stränge, Knoten an den Ecken, Blätter */
      const axes = [V.norm(P[0]), V.norm(V.add(P[Math.min(3, P.length - 1)], V.mul(P[0], 0.15)))]; const used = new Set();
      for (const ax of axes) for (const [a, c] of E) { const mid = V.norm(V.add(P[a], P[c])); if (Math.abs(V.dot(mid, ax)) < 0.33) used.add(a + ',' + c); }
      if (used.size < 3) for (const [a, c] of E) used.add(a + ',' + c);
      const knots = new Set();
      for (const k of used) { const [a, c] = k.split(',').map(Number); knots.add(a); knots.add(c); const A0 = P[a], C0 = P[c]; const e = V.norm(V.sub(C0, A0)); const out = V.norm(V.add(A0, C0)); const sd = V.norm(V.cross(e, out));
        const strands = low ? 1 : 2; const ph0 = rnd() * 6.28;
        for (let s = 0; s < strands; s++) { const pts = []; const M = low ? 8 : 14; for (let i = 0; i <= M; i++) { const t = i / M; const tw = ph0 + s * Math.PI + t * Math.PI * 3.2; const wob = Math.sin(t * Math.PI * 2 + ph0) * 0.025;
            const p = V.add(V.add(A0, V.mul(V.sub(C0, A0), t)), V.add(V.mul(out, 0.035 + 0.03 * Math.sin(Math.PI * t) + (low ? 0 : Math.cos(tw) * 0.02)), V.mul(sd, wob + (low ? 0 : Math.sin(tw) * 0.022)))); pts.push(p); }
          tube(die, pts, low ? 0.042 : 0.036, low ? 5 : 7, 1, (t) => 0.8 + 0.35 * Math.sin(Math.PI * t)); }
        if (!low) for (const t of [0.22, 0.5, 0.78]) { if (rnd() < 0.3) continue; const side = rnd() < 0.5 ? 1 : -1; const base = V.add(V.add(A0, V.mul(V.sub(C0, A0), t)), V.mul(out, 0.06)); const fn = V.norm(V.add(out, V.mul(sd, side * 0.9)));
          const dir = V.norm(V.add(V.mul(sd, side * 0.75), V.mul(e, (rnd() - 0.5) * 1.1))); leaf(die, base, dir, V.norm(V.add(fn, V.mul(out, 0.6))), 0.2 + rnd() * 0.06, 0.075); } }
      for (const k of knots) { sphere(die, V.mul(P[k], 1.04), low ? 0.06 : 0.07, 1, low ? 5 : 7);
        if (low) continue; /* Ranken: kurze, gekrümmte Triebe an den Ecken, enden in einem Blatt; bleiben nahe der Ecke, weg von den Zahlen */
        const n = V.norm(P[k]); const nb = E.filter(([a, c]) => a === k || c === k).map(([a, c]) => (a === k ? c : a)); for (let j = 0; j < 2; j++) { const o1 = P[nb[Math.floor(rnd() * nb.length)]]; const o2 = P[nb[Math.floor(rnd() * nb.length)]];
          const tgt = V.norm(V.sub(V.mul(V.add(o1, o2), 0.5), P[k])); const sd2 = V.norm(V.cross(n, tgt)); const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; const curl = Math.sin(t * Math.PI * 1.4) * 0.07 * (j ? 1 : -1);
            pts.push(V.add(V.mul(P[k], 1.03 + 0.03 * Math.sin(Math.PI * t)), V.add(V.mul(tgt, t * 0.2), V.mul(sd2, curl)))); }
          tube(die, pts, 0.014, 5, 1, (t) => 1 - 0.6 * t); const end = pts[pts.length - 1]; leaf(die, end, V.norm(V.add(tgt, V.mul(sd2, j ? 0.6 : -0.6))), V.norm(V.add(n, V.mul(tgt, -0.2))), 0.17, 0.07); } } },
    eisenwerk(o) { const { die, P, E, low, geo } = o;
      for (const [a, c] of E) { const A0 = lerp(P[a], P[c], 0.1), C0 = lerp(P[a], P[c], 0.9); beam(die, A0, C0, low ? 0.045 : 0.05, low ? 0.035 : 0.045, 4);
        if (!low) for (const t of [0.3, 0.7]) { const out = V.norm(V.add(P[a], P[c])); sphere(die, V.add(lerp(P[a], P[c], t), V.mul(out, 0.05)), 0.022, 5, 4); } }
      for (let k = 0; k < P.length; k++) { const n = V.norm(P[k]); gear(die, V.mul(P[k], 0.985), n, perp(n), 0.0, 0.08, 6, 0.06, 4, true, 6); }
      if (geo.sides !== 4) for (const f of geo.F) { const c = lc(geo, f); const r = Math.min(inr(P, f, c), f.ri) * 0.86; gear(die, V.add(c, V.mul(f.n, 0.004)), f.n, f.up, r * 0.9, r, Math.max(8, Math.round(14 * r / 0.262)), low ? 0.02 : 0.03, 3, low); } },
    blutmond(o) { const { die, P, E, low, top } = o; for (const [a, c] of E) tube(die, [V.mul(P[a], 1.004), V.mul(P[c], 1.004)], low ? 0.026 : 0.02, low ? 4 : 5, 9);
      P.forEach((p, i) => { const n = V.norm(p); const sd = V.norm(V.cross(n, [0.3, 1, 0.2])); if (i === top) { /* Blutmond zwischen zwei Sichelhörnern */
          sphere(die, V.mul(n, 1.15), low ? 0.17 : 0.16, 13, low ? 7 : 12); for (const sg of [-1, 1]) cone(die, V.add(V.mul(p, 0.95), V.mul(sd, sg * 0.08)), V.norm(V.add(n, V.mul(sd, sg * 0.9))), 0.3, low ? 0.06 : 0.055, 9, low ? 5 : 7, V.add(V.mul(n, 0.18), V.mul(sd, -sg * 0.1))); return; }
        /* sichelförmige Dornen, tangential geschwungen */ cone(die, V.mul(p, 0.94), n, low ? 0.24 : 0.3, low ? 0.08 : 0.075, 9, low ? 5 : 7, V.mul(sd, low ? 0.12 : 0.16)); }); },
    himmelslicht(o) { const { die, P, E, low, rnd, top } = o; frame(die, P, E, low ? 0.026 : 0.02, 3, low ? 4 : 6, low ? 0 : 0.03);
      P.forEach((p, i) => { const n = V.norm(p); if (i === top) { /* Sonnenscheibe mit Strahlenkranz */ const c0 = V.mul(p, 1.05); gear(die, c0, n, perp(n), 0.0, 0.18, 14, 0.04, 3, low); sphere(die, V.add(c0, V.mul(n, 0.045)), 0.11, 13, low ? 6 : 9);
          if (!low) for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; const sd = perp(n); const t = V.add(V.mul(sd, Math.cos(a)), V.mul(V.cross(n, sd), Math.sin(a))); prism(die, V.add(c0, V.mul(t, 0.19)), V.norm(V.add(t, V.mul(n, 0.2))), j % 2 ? 0.12 : 0.2, 0.028, 4, 3, null, 0); } return; }
        prism(die, V.mul(p, 0.96), n, (low ? 0.16 : 0.22) + rnd() * 0.05, low ? 0.045 : 0.04, 4, 3, null, 0); }); },
    chaosprisma(o) { const { die, P, E, low, rnd } = o; frame(die, P, E, low ? 0.018 : 0.013, 12, 4, 0);
      /* bunte Kristallsplitter an Ecken und Kanten, jeder mit eigenem Farbton */
      P.forEach((p) => { const n = V.norm(p); const sd = perp(n); const t = V.mul(V.add(V.mul(sd, rnd() - 0.5), V.mul(V.cross(n, sd), rnd() - 0.5)), 0.8); prism(die, V.mul(p, 0.9), V.norm(V.add(n, t)), (low ? 0.26 : 0.3) + rnd() * 0.1, low ? 0.12 : 0.11, 3, 11, [rnd(), 0, 0], 0); });
      if (!low) for (const [a, c] of E) { const mid = lerp(P[a], P[c], 0.3 + rnd() * 0.4); const n = V.norm(mid); const sd = perp(n); const t = V.mul(V.add(V.mul(sd, rnd() - 0.5), V.mul(V.cross(n, sd), rnd() - 0.5)), 1.2); prism(die, V.mul(mid, 0.96), V.norm(V.add(n, t)), 0.15 + rnd() * 0.07, 0.065, 3, 11, [rnd(), 0, 0], 0); } },
    schatten(o) { const { die, P, E, low } = o; frame(die, P, E, low ? 0.022 : 0.016, 4, low ? 4 : 5, low ? 0 : 0.028);
      for (const p of P) prism(die, V.mul(p, 0.96), V.norm(p), low ? 0.16 : 0.2, low ? 0.055 : 0.05, 4, 9, null, 0); }
  };
  function build(sides, set, low, lab) {
    lab = lab || ''; const key = sides + ':' + set + ':' + (low ? 'l' : 'h') + lab; if (meshes.has(key)) return meshes.get(key);
    const geo = d3geo(sides); const P = geo.P; const die = B(), world = B(); const E = edges(geo); const rnd = prng(set.length * 7919 + sides);
    body(die, geo, cellFn(sides, lab));
    /* Schmuckecke: die Ecke, die beim Höchstwert oben steht (wie auf den Referenzbildern); W4 hat keine */
    let top = -1; if (sides !== 4) { const q = pose(sides, sides); let best = -9; P.forEach((p, i) => { const y = Q.rot(q, p)[1]; if (y > best) { best = y; top = i; } }); }
    const bot = top < 0 ? -1 : P.reduce((bi, p, i) => (V.dot(p, P[top]) < V.dot(P[bi], P[top]) ? i : bi), 0);
    const deco = DECO[set]; if (deco) deco({ die, world, geo, P, E, low, rnd, sides, top, bot, pose: sides !== 4 ? pose(sides, sides) : null });
    const out = { die: new Float32Array(die.a), world: new Float32Array(world.a), buf: {} };
    /* Bildausschnitt: alles muss hineinpassen, der Körper soll möglichst gross sein */
    let r = 0; for (const arr of [out.die, out.world]) for (let i = 0; i < arr.length; i += 12) r = Math.max(r, Math.hypot(arr[i], arr[i + 1], arr[i + 2]));
    out.fit = Math.max(1.1, r * 1.02); out.tris = (out.die.length + out.world.length) / 36;
    if (meshes.size >= 16) { const k0 = meshes.keys().next().value; const o = meshes.get(k0); if (gl) Object.values(o.buf).forEach((x) => gl.deleteBuffer(x)); meshes.delete(k0); }
    meshes.set(key, out); return out;
  }
  /* ---- Zeichnen ---- */
  const persp = (fov, near, far) => { const f = 1 / Math.tan(fov / 2); return [f, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]; };
  const qmat = (q) => { const [w, x, y, z] = q; return [1 - 2 * (y * y + z * z), 2 * (x * y + w * z), 2 * (x * z - w * y), 2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x), 2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y)]; };
  /* Ringradius um die Zahl (in Zellen), passend zur Fläche */
  const RINGR = { 6: 0.37, 8: 0.24, 10: 0.33, 12: 0.38, 20: 0.23 };
  /* ein Würfel in die WebGL-Leinwand (px × px) */
  function render(item, p, px) {
    const S = SETS[item.set]; const fit = p.geom.fit * (item.low ? 0.95 : 1); const l = p.lift;
    gl.viewport(0, 0, px, px); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, px, px); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.disable(gl.SCISSOR_TEST);
    /* Schatten */
    gl.useProgram(sprog); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, sbuf); gl.enableVertexAttribArray(A.aS); gl.vertexAttribPointer(A.aS, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(U.uB, 0, -0.78 / fit, 0.62 * (1 + l * 0.4) / fit, 0.14 * (1 + l * 0.4) / fit); gl.uniform1f(U.uA, 0.55 - l * 0.5); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(A.aS);
    /* Würfel */
    gl.useProgram(prog); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
    const cam = 7.2; const fov = 2 * Math.atan(fit / cam) * 1.06; const pr = persp(fov, 4, 11); const pv = pr.slice(); pv[14] = pr[14] + pr[10] * -cam; pv[15] = pr[15] + pr[11] * -cam;
    gl.uniformMatrix4fv(U.uPV, false, new Float32Array(pv)); gl.uniform1f(U.uCam, cam); gl.uniform1f(U.uSc, 1);
    const z3 = [0, 0, 0]; const v3 = (k, v) => gl.uniform3fv(U[k], v || z3);
    v3('uDeep', S.deep); v3('uMid', S.mid); v3('uGlow', S.glow); v3('uGlyph', S.glyph); v3('uVein', S.vein); v3('uAcc', S.acc); v3('uRim', S.rim); v3('uOut', S.out); v3('uRing', S.ring); v3('uFx', S.fx);
    gl.uniform1f(U.uKind, S.kind); gl.uniform1f(U.uGold, item.gold ? 1 : 0); gl.uniform1f(U.uDim, item.dim ? 0.55 : 0); gl.uniform1f(U.uGS, (item.low ? 1.3 : 1) * (S.gs || 1));
    const real = item.sides === 100 ? 10 : item.sides; gl.uniform1f(U.uRimK, S.rim ? S.rimK || 1 : 0); gl.uniform1f(U.uOutK, S.out ? 1 : 0); gl.uniform1f(U.uRingK, S.ring && RINGR[real] ? 1 : 0); gl.uniform1f(U.uRingR, RINGR[real] || 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas()); gl.uniform1i(U.uTex, 0);
    gl.uniformMatrix3fv(U.uR, false, new Float32Array(qmat(p.q))); gl.uniform3f(U.uT, 0, l * 0.55, 0); const geom = p.geom;
    for (const part of ['die', 'world']) { const arr = geom[part]; if (!arr.length) continue; if (!geom.buf[part]) { geom.buf[part] = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, geom.buf[part]); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); }
      gl.bindBuffer(gl.ARRAY_BUFFER, geom.buf[part]); const st = 48; [['aP', 3, 0], ['aN', 3, 12], ['aU', 2, 24], ['aM', 1, 32], ['aX', 3, 36]].forEach(([k, n, o]) => { if (A[k] < 0) return; gl.enableVertexAttribArray(A[k]); gl.vertexAttribPointer(A[k], n, gl.FLOAT, false, st, o); });
      gl.uniform1f(U.uWorld, part === 'world' ? 1 : 0); gl.drawArrays(gl.TRIANGLES, 0, arr.length / 12); }
    ['aP', 'aN', 'aU', 'aM', 'aX'].forEach((k) => { if (A[k] >= 0) gl.disableVertexAttribArray(A[k]); });
  }
  /* parts: [{ geom, q, lift }] – ein Würfel oder zwei nebeneinander (W100) */
  function drawOne(item, parts) {
    const W = item.pw, H = item.ph, n = parts.length; const cell = n > 1 ? Math.min(H, Math.floor(W / 2)) : Math.min(W, H);
    if (cv.width < cell || cv.height < cell) { cv.width = cv.height = Math.min(1024, Math.max(cell, cv.width)); }
    const x2 = item.ctx; x2.clearRect(0, 0, W, H);
    parts.forEach((p, j) => { render(item, p, cell); const dx = n > 1 ? (j === 0 ? W / 2 - cell : W / 2) : (W - cell) / 2; x2.drawImage(cv, 0, cv.height - cell, cell, cell, Math.round(dx), Math.round((H - cell) / 2), cell, cell); });
  }
  function mount(holder, item) {
    const r = holder.getBoundingClientRect(); /* Layoutgrösse (ohne laufende Drehung/Skalierung der Würfelschale) */ const w = Math.max(24, Math.round(holder.offsetWidth || r.width || 64)), h = Math.max(24, Math.round(holder.offsetHeight || r.height || r.width || 64));
    const dpr = Math.min(2, window.devicePixelRatio || 1); const dual = item.sides === 100; const cssCell = dual ? Math.min(h, w / 2) : Math.min(w, h);
    item.pw = Math.min(dual ? 1024 : 512, Math.round(w * dpr)); item.ph = Math.min(512, Math.round(h * dpr)); item.low = cssCell < 50;
    const c = document.createElement('canvas'); c.width = item.pw; c.height = item.ph; c.className = 'w3dc'; c.setAttribute('aria-hidden', 'true'); c.style.width = c.style.height = '100%';
    holder.innerHTML = ''; holder.appendChild(c); item.ctx = c.getContext('2d'); return c;
  }
  /* Ruhelage: Ergebnis zeigt zum Betrachter; W4: die Ecke mit dem Ergebnis zeigt nach oben */
  function pose(sides, value) {
    if (sides === 4) { const g = d3geo(4); const k = Math.max(0, Math.min(3, value - 1)); const f = g.F.find((x) => x.v.includes(k)) || g.F[0];
      let q = Q.fromTo(f.n, [0, 0, 1]); const up = Q.rot(q, V.sub(g.P[k], f.c)); q = Q.mul(Q.axis([0, 0, 1], Math.atan2(up[0], up[1])), q); return Q.mul(Q.axis([1, -0.6, 0], 0.3), q); }
    return d3target(d3geo(sides), value, 0.3).q;
  }
  /* W100: Zehner 0–9 (00–90) und Einer 0–9; 100 = 00 und 0 */
  const split = (value) => { const v = ((value - 1) % 100 + 100) % 100 + 1; return [Math.floor((v % 100) / 10), v % 10]; };
  /* Teile eines Würfels: W100 = Zehner (00–90) und Einer (0–9) */
  function plan(sides, value, set, low) {
    if (sides !== 100) return [{ geom: build(sides, set, low), end: pose(sides, value) }];
    const [tens, units] = split(value);
    return [{ geom: build(10, set, low, 't'), end: pose(10, tens + 1) }, { geom: build(10, set, low, 'u'), end: pose(10, units || 10) }];
  }
  function still(holder, sides, value, set, opt) {
    if (!supports(sides, set) || !init()) return false;
    try { const item = Object.assign({ sides, set }, opt || {}); mount(holder, item); drawOne(item, plan(sides, value, set, item.low).map((p) => ({ geom: p.geom, q: p.end, lift: 0 }))); holder.classList.add('w3d'); return true; } catch (e) { dead = true; console.warn('Artefaktwürfel:', e && e.message); return false; }
  }
  function frame0(it, now) {
    const t = Math.min(1, (now - it.t0) / it.dur); const e = 1 - Math.pow(1 - t, 3);
    return { t, parts: it.parts.map((p, j) => { const hop = Math.abs(Math.sin(Math.PI * t * 2.2 + j * 0.6)) * Math.pow(1 - t, 1.4) * 0.5; return { geom: p.geom, q: t < 1 ? Q.mul(Q.axis(p.ax, p.A * (1 - e)), p.end) : p.end, lift: t < 1 ? hop : 0 }; }) };
  }
  function tick(now) {
    raf = 0; if (dead) return;
    for (let i = act.length - 1; i >= 0; i--) { const it = act[i]; if (!it.holder.isConnected) { act.splice(i, 1); continue; }
      const f = frame0(it, now); if (it.last) (it.gaps || (it.gaps = [])).push(now - it.last); it.last = now;
      try { drawOne(it, f.parts); } catch (x) { dead = true; act.splice(0).forEach((y) => y.fail()); return; }
      if (f.t >= 1) { act.splice(i, 1); it.done(); const g = (it.gaps || []).slice().sort((a, b) => a - b); if (g.length >= 6 && !document.hidden && !(navigator.webdriver && !W3D_FORCE_SLOW)) { /* in automatischen Tests nur auf Wunsch */ const med = g[g.length >> 1]; slow = med > 50 ? slow + 1 : 0; } } }
    if (act.length) raf = requestAnimationFrame(tick);
  }
  /* rollender Würfel; liefert { skip } oder null (dann übernimmt der bisherige Renderer) */
  function roll(holder, sides, value, set, opt) {
    if (!supports(sides, set) || !init()) return null; opt = opt || {};
    const item = { sides, set, holder, t0: performance.now(), dur: opt.dur || 850, finished: false };
    try { mount(holder, item); item.parts = plan(sides, value, set, item.low).map((p) => Object.assign(p, { ax: V.norm([vrand() - 0.5, vrand() - 0.5, vrand() - 0.5]), A: (2.2 + vrand() * 1.6) * Math.PI * 2 })); } catch (e) { return null; }
    if (typeof vfxBusy === 'function') vfxBusy(1);
    item.done = () => { if (item.finished) return; item.finished = true; if (typeof vfxBusy === 'function') vfxBusy(-1); if (opt.onDone) opt.onDone(); };
    item.fail = () => { if (item.finished) return; if (opt.fallback) opt.fallback(); item.done(); };
    act.push(item); if (!raf) raf = requestAnimationFrame(tick);
    const endParts = () => item.parts.map((p) => ({ geom: p.geom, q: p.end, lift: 0 }));
    return { skip: () => { const i = act.indexOf(item); if (i >= 0) act.splice(i, 1); if (!item.finished) { try { if (!dead) drawOne(item, endParts()); else if (opt.fallback) opt.fallback(); } catch (e) { if (opt.fallback) opt.fallback(); } item.done(); } } };
  }
  return { supports, still, roll, ok: () => init(), sets: () => Object.keys(SETS), _build: build, _pose: pose, _split: split, _dead: () => dead, _gl: () => gl, _active: () => act.length, _cache: () => meshes.size, _slow: (v) => { if (v !== undefined) slow = v; return slow; },
    _tris: (sides, set, low) => plan(sides, sides === 100 ? 55 : 1, set, low).reduce((s, p) => s + p.geom.tris, 0) };
})();
