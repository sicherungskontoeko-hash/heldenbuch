/* Vorlader: lässt die bestehenden Tests in Firefox oder WebKit (Safari-Engine) laufen.
   Aufruf: HB_ENGINE=webkit node -r ./tests/_engine.js tests/m01.test.js
   Die Tests verlangen «chromium»; dieser Vorlader reicht stattdessen die gewählte Engine durch
   und entfernt Optionen, die nur Chromium kennt (Startparameter, isMobile in Firefox). */
const Module = require('module');
const ENG = process.env.HB_ENGINE || 'chromium';
if (ENG !== 'chromium') {
  const load = Module._load; let wrapped = null;
  const ctxOpts = (o) => { if (!o) return o; const c = Object.assign({}, o); if (ENG === 'firefox') delete c.isMobile; return c; };
  /* Feste Wartezeiten der Tests sind auf Chromium abgestimmt; WebKit und Firefox laufen in GitHub langsamer.
     Wartezeiten werden daher gestreckt (HB_WAIT, Standard 3). Das ändert nichts an dem, was geprüft wird. */
  const F = +(process.env.HB_WAIT || 3);
  const slowPage = (pg) => { const w = pg.waitForTimeout.bind(pg); pg.waitForTimeout = (ms) => w(ms * F); return pg; };
  const wrapCtx = (c) => { const np = c.newPage.bind(c); c.newPage = async () => slowPage(await np()); for (const pg of c.pages()) slowPage(pg); return c; };
  const wrapBrowser = (b) => {
    const nc = b.newContext.bind(b), np = b.newPage.bind(b);
    b.newContext = async (o) => wrapCtx(await nc(ctxOpts(o))); b.newPage = async (o) => slowPage(await np(ctxOpts(o))); return b;
  };
  Module._load = function (req) {
    const m = load.apply(this, arguments);
    if (req !== 'playwright' && req !== 'playwright-core') return m;
    if (!wrapped) {
      const real = m[ENG];
      const bt = Object.create(real);
      bt.launch = async (o) => { const c = Object.assign({}, o || {}); delete c.args; delete c.channel; delete c.chromiumSandbox; return wrapBrowser(await real.launch(c)); };
      bt.launchPersistentContext = async (dir, o) => wrapCtx(await real.launchPersistentContext(dir, ctxOpts(Object.assign({}, o, { args: undefined }))));
      bt.name = () => ENG;
      wrapped = new Proxy(m, { get: (t, k) => (k === 'chromium' ? bt : t[k]) });
    }
    return wrapped;
  };
}
