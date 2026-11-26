/* Vault V2: Kern gegen den lokalen Prüfserver (tools/vault-mock.js; keine Cloud, kein Netz).
   Zwei bis drei simulierte Geräte mit eigenem lokalem Bestand. Geprüft nach Akzeptanzmatrix FC-32 (V-02 … V-22).
   Simuliert: Netz, Server, Geräte. Nicht geprüft: echte Handys/Tablets (V-24), echter Dienst (V3).
   Aufruf: node tests/vault.test.js */
const V = require('../vault.js'); const { createMock } = require('../tools/vault-mock.js');
let pass = 0, fail = 0; const T = (n, ok, info) => { if (ok) pass++; else fail++; console.log((ok ? '✔ ' : '✘ ') + n + (ok || info === undefined ? '' : '  → ' + JSON.stringify(info).slice(0, 600))); };
const J = (x) => JSON.parse(JSON.stringify(x));
let CLOCK = 1e12; const now = () => CLOCK;
function Device(name, M, o = {}) {
  const data = { c: {}, h: {} }; let store = null; const d = { name, data, M };
  d.make = () => { d.v = new V.Vault({ api: (m, p, x) => d.M.handle(m, p, x), debounce: 0, now: o.now || now,
    store: { load: () => (store ? JSON.parse(store) : null), save: (s) => { store = s ? JSON.stringify(s) : null; } },
    read: (k, id) => (data[k][id] === undefined ? undefined : J(data[k][id])),
    apply: (k, id, x) => { if (x === null) delete data[k][id]; else data[k][id] = J(x); return true; },
    validate: (k, x) => (k === 'c' ? (x && typeof x.name === 'string' && x.play && typeof x.play.hp === 'number' && x.play.hp >= 0 ? null : 'Heldenformat ungültig') : k === 'h' ? (x && typeof x.name === 'string' ? null : 'Hausregel ungültig') : 'unbekannte Art'),
    list: () => [...Object.keys(data.c).map((i) => ['c', i]), ...Object.keys(data.h).map((i) => ['h', i])],
    copy: (k, x) => { const id = x.id + '_k'; data[k][id] = Object.assign(J(x), { id, name: x.name + ' (anderes Gerät)' }); d.v.mark(k, id, true); } }); return d.v; };
  d.make(); d.store = () => store;
  d.set = (k, id, x) => { data[k][id] = J(x); d.v.mark(k, id, true); };
  d.edit = (id, fn) => { fn(data.c[id]); d.v.mark('c', id, true); };
  d.del = (k, id) => { delete data[k][id]; d.v.mark(k, id, true); };
  return d;
}
const held = (id, name, hp, hbRef) => ({ id, name, cls: 'wiz', level: 5, play: { hp, slots: { 1: 2, 2: 1 }, res: { arcRec: 1 } }, inv: [{ n: 'Seil', qty: 1 }], notes: 'Geheime Notiz von ' + name, hb: hbRef ? [hbRef] : [] });
(async () => {
  const rec0 = V.newRecovery();
  T('Wiederherstellungsschlüssel: 26 Zeichen in Vierergruppen, wieder einlesbar', /^([A-Z2-8]{4}-){6}[A-Z2-8]{2}$/.test(rec0) && V.fmtRecovery(V.parseRecovery(rec0)) === rec0, rec0);
  let bad0 = ''; try { V.parseRecovery(rec0.slice(0, -1) + '0'); } catch (e) { bad0 = e.code; } let badL = ""; try { V.parseRecovery(rec0.slice(0, -2)); } catch (e) { badL = e.code; }
  T('Ungültige Zeichen und falsche Länge werden abgelehnt (ein vertippter gültiger Schlüssel führt zu «unbekannt», siehe V-10)', bad0 === "recovery" && badL === "recovery", { bad0, badL });

  /* V-02 Aktivieren, erste Sicherung scheitert → nichts gilt als gesichert, lokal intakt */
  const M = createMock({ now }); const tab = Device('Tablet', M);
  tab.data.h.hb_eis = { id: 'hb_eis', name: 'Eisklinge' }; tab.data.c.c_ilva = held('c_ilva', 'Ilva', 30, 'hb_eis'); tab.data.c.c_borin = held('c_borin', 'Borin', 44);
  const before = JSON.stringify(tab.data);
  M.fault = { status: 500, keep: true }; let ce = ''; try { await tab.v.create('Tablet'); } catch (e) { ce = e.message; } M.fault = null;
  T('V-02 Anlegen scheitert am Server: Fehler gemeldet, nichts eingerichtet, lokale Daten unverändert', /500/.test(ce) && !tab.v.on && JSON.stringify(tab.data) === before, ce);
  const rec = await tab.v.create('Tablet'); M.fault = { status: 503, keep: true }; await tab.v.sync(); const st503 = tab.v.status; M.fault = null;
  T('V-02 Erste Sicherung scheitert (503): Status «später», nicht «gesichert», lokal unverändert', st503 === 'später' && JSON.stringify(tab.data) === before, st503);
  await tab.v.sync();
  T('V-02 Erste Sicherung danach vollständig: 3 Objekte, Status gesichert', tab.v.status === 'gesichert' && Object.keys(Object.values(M.db)[0].obj).length === 3, tab.v.status);
  const ts = tab.store();
  T('Gerät speichert weder Wiederherstellungsschlüssel noch -berechtigung (nur Gerätezugang)', !ts.includes(rec.replace(/-/g, '')) && !ts.includes(rec) && !ts.includes((await V.rootKeys(rec)).rauth) && !/rauth/.test(ts), ts.slice(0, 120));

  /* V-03 Tablet → Handy (Kopplungscode) → Handy spielt → Tablet */
  const P = await tab.v.pair(); const han = Device('Handy', M); await han.v.connect(P.code, 'Handy');
  T('V-03 Handy über Kopplungscode verbunden, Bestand vollständig da', han.v.status === 'gesichert' && JSON.stringify(han.data) === JSON.stringify(tab.data), han.v.status);
  han.edit('c_ilva', (c) => { c.play.hp = 12; c.play.slots[1] = 0; c.play.res.arcRec = 0; c.inv.push({ n: 'Heiltrank', qty: 2 }); c.notes += ' · Drache gesehen'; }); await han.v.sync();
  await tab.v.sync();
  T('V-03 Tablet übernimmt exakt: TP, Zauberplätze, Ressourcen, Inventar, Notizen', JSON.stringify(tab.data.c.c_ilva) === JSON.stringify(han.data.c.c_ilva) && tab.data.c.c_ilva.play.hp === 12 && tab.v.status === 'gesichert', tab.data.c.c_ilva);
  tab.edit('c_ilva', (c) => { c.play.hp = 20; }); await tab.v.sync(); await han.v.sync();
  T('V-03 Zurück aufs Handy: wieder gleich, ohne Konflikt', han.data.c.c_ilva.play.hp === 20 && !han.v.st.conf.length && !tab.v.st.conf.length);

  /* V-12 Kein Klartext beim Dienst (Protokoll aller Anfragen und gespeicherte Daten) */
  const seen = JSON.stringify(M.db) + M.log.join('\n');
  T('V-12 Dienst sieht keine Namen, IDs, Notizen, Werte, Gerätenamen', !/Ilva|Borin|c_ilva|hb_eis|Eisklinge|Geheime|Heiltrank|Tablet|Handy|"hp"|slots/.test(seen), seen.match(/Ilva|Borin|c_ilva|Tablet|Handy/));

  /* V-05 Verschiedene Helden auf beiden Geräten */
  tab.edit('c_ilva', (c) => { c.play.hp = 19; }); han.edit('c_borin', (c) => { c.play.hp = 40; }); await tab.v.sync(); await han.v.sync(); await tab.v.sync();
  T('V-05 Verschiedene Helden geändert: beide Stände überall, kein Konflikt', tab.data.c.c_borin.play.hp === 40 && han.data.c.c_ilva.play.hp === 19 && !tab.v.st.conf.length && !han.v.st.conf.length);

  /* V-04 Beide offline, gleicher Held */
  M.down = true; tab.edit('c_borin', (c) => { c.play.hp = 5; c.notes = 'Tablet-Stand'; }); han.edit('c_borin', (c) => { c.play.hp = 33; c.notes = 'Handy-Stand'; });
  await tab.v.sync(); await han.v.sync(); const off = [tab.v.status, han.v.status]; M.down = false;
  await tab.v.sync(); await han.v.sync();
  const cf = han.v.st.conf[0];
  T('V-04 Offline-Änderungen beider Geräte: Status offline, danach Konflikt statt Verlust, beide Stände erhalten', off.join() === 'offline,offline' && tab.v.status === 'gesichert' && han.v.status === 'konflikt' && cf && cf.mine.notes === 'Handy-Stand' && cf.theirs.notes === 'Tablet-Stand' && han.data.c.c_borin.notes === 'Handy-Stand', { off, st: han.v.status, cf });
  han.edit('c_borin', (c) => { c.play.hp = 31; }); await han.v.sync();
  T('Während offenem Konflikt: weitere Änderung lädt nicht still hoch', tab.data.c.c_borin.notes === 'Tablet-Stand' && han.v.st.conf.length === 1 && M.db[han.v.st.vid].obj[cf.oid].rev === cf.rev);
  await han.v.resolve(cf.oid, 'both'); await tab.v.sync();
  T('V-04 Auflösen «beide behalten»: Handy-Stand gilt, Tablet-Stand als Kopie, auf beiden Geräten', han.v.status === 'gesichert' && tab.data.c.c_borin.play.hp === 31 && tab.data.c.c_borin_k && tab.data.c.c_borin_k.notes === 'Tablet-Stand' && han.data.c.c_borin_k.notes === 'Tablet-Stand', Object.keys(tab.data.c));

  /* V-06 Parallele Schreibvorgänge mit derselben Basis, falsche Uhr */
  const odd = Device('Laptop', M, { now: () => 0 }); await odd.v.connect(rec, 'Laptop');
  tab.edit('c_ilva', (c) => { c.play.hp = 1; }); odd.edit('c_ilva', (c) => { c.play.hp = 2; });
  await Promise.all([tab.v.sync(), odd.v.sync()]);
  const winners = [tab.v.st.conf.length, odd.v.st.conf.length].filter((n) => n === 0).length;
  T('V-06 Parallel, gleiche Basis, Uhr falsch: genau ein Gerät gewinnt, das andere meldet Konflikt', winners === 1 && tab.v.st.conf.length + odd.v.st.conf.length === 1, [tab.v.st.conf.length, odd.v.st.conf.length]);
  const loser = tab.v.st.conf.length ? tab : odd; await loser.v.resolve(loser.v.st.conf[0].oid, 'theirs'); await tab.v.sync(); await odd.v.sync(); await han.v.sync();
  T('Auflösen «anderes Gerät gilt»: alle drei Geräte gleich', tab.data.c.c_ilva.play.hp === odd.data.c.c_ilva.play.hp && han.data.c.c_ilva.play.hp === tab.data.c.c_ilva.play.hp && !tab.v.st.conf.length && !odd.v.st.conf.length);

  /* V-07 Zeitüberschreitung NACH erfolgreichem Upload, Wiederholung */
  const vobj = () => M.db[tab.v.st.vid].obj; const oidI = await (await V.useKeys(tab.v.st)).oid('c', 'c_ilva');
  const r0 = vobj()[oidI].rev; tab.edit('c_ilva', (c) => { c.play.hp = 7; }); M.fault = { after: true, on: 'PUT' }; await tab.v.sync(); const stT = tab.v.status;
  await tab.v.sync(); await tab.v.sync();
  T('V-07 Timeout nach Ausführung: Status offline, Wiederholung ohne zweite Änderung, danach gesichert', stT === 'offline' && vobj()[oidI].rev === r0 + 1 && tab.v.status === 'gesichert' && !tab.v.st.conf.length && M.log.some((l) => /"rev":/.test(l)), { stT, rev: vobj()[oidI].rev, r0 });
  tab.edit('c_ilva', (c) => { c.play.hp = 8; }); M.fault = { after: true, on: 'PUT' }; await tab.v.sync(); tab.edit('c_ilva', (c) => { c.play.hp = 9; }); await tab.v.sync();
  T('V-07 Timeout, dann weitere Änderung: alte Version bestätigt, neue folgt, kein falscher Konflikt', vobj()[oidI].rev === r0 + 3 && !tab.v.st.conf.length && tab.v.status === 'gesichert', { rev: vobj()[oidI].rev, c: tab.v.st.conf });

  /* V-08 App während Sicherung geschlossen → Neustart setzt fort */
  tab.edit('c_ilva', (c) => { c.play.hp = 10; }); M.down = true; await tab.v.sync(); M.down = false; tab.make(); const pend = tab.v.load().dirty.length;
  await tab.v.sync(); await han.v.sync();
  T('V-08 Neustart nach abgebrochener Sicherung: Warteschlange erhalten, genau einmal hochgeladen', pend === 1 && han.data.c.c_ilva.play.hp === 10 && vobj()[oidI].rev === r0 + 4, { pend, rev: vobj()[oidI].rev });

  /* V-09 Neues Gerät nur mit Wiederherstellungsschlüssel */
  const neu = Device('Neues Handy', M); await neu.v.connect(rec, 'Neues Handy');
  T('V-09 Wiederherstellung ohne altes Gerät: alle Helden und Hausregeln, Verweise intakt', JSON.stringify(neu.data) === JSON.stringify(tab.data) && neu.data.c.c_ilva.hb[0] === 'hb_eis' && neu.data.h.hb_eis, Object.keys(neu.data.c));

  /* V-10 Falscher Schlüssel, Manipulation, Vertauschen */
  const fremd = Device('Fremd', M); let e10 = ''; try { await fremd.v.connect(V.newRecovery(), 'x'); } catch (e) { e10 = e.code; }
  T('V-10 Falscher Schlüssel: kein Zugriff, nichts eingerichtet', e10 === 'auth' && !fremd.v.on, e10);
  const o1 = vobj()[oidI]; const keep = J(o1); const ct = Buffer.from(o1.box.ct, 'base64'); ct[3] ^= 4; o1.box.ct = ct.toString('base64'); o1.rev++; o1.hist.push({ rev: o1.rev, box: o1.box });
  const snapN = JSON.stringify(neu.data); await neu.v.sync(); const bad1 = neu.v.bad.slice(); vobj()[oidI] = keep;
  T('V-10 Verändertes Chiffrat: abgelehnt, gemeldet, lokale Daten unverändert, nicht «gesichert»', bad1.length === 1 && /beschädigt/.test(bad1[0].why) && JSON.stringify(neu.data) === snapN && neu.v.status === 'fehler', { bad1, st: neu.v.status });
  const ob = vobj(); const ks = Object.keys(ob); const a0 = J(ob[ks[0]]), a1 = J(ob[ks[1]]); ob[ks[0]] = Object.assign(J(a1), { rev: 999 }); ob[ks[1]] = Object.assign(J(a0), { rev: 999 });
  await neu.v.sync(); const bad2 = neu.v.bad.length; ob[ks[0]] = a0; ob[ks[1]] = a1;
  T('V-10 Vertauschte Objekte / falsche Revision (AAD): beide abgelehnt, lokal unverändert', bad2 === 2 && JSON.stringify(neu.data) === snapN, bad2);

  /* V-11 Fremder Vault, abgelaufene und wiederverwendete Kopplung, widerrufenes Gerät */
  const M2 = createMock({ now }); const x = Device('X', M2); x.data.c.c_x = held('c_x', 'Xena', 9); await x.v.create('X'); await x.v.sync();
  const r11 = await M.handle('GET', '/v1/vault/' + x.v.st.vid + '/meta', { auth: tab.v.auth() }); const r11b = await M2.handle('GET', '/v1/vault/' + x.v.st.vid + '/meta', { auth: tab.v.auth() });
  T('V-11 Fremder Vault mit eigenem Gerätezugang: verweigert', r11.status === 401 || r11.status === 404 ? r11b.status === 401 : false, [r11.status, r11b.status]);
  let e11a = '', e11b = ''; const used = Device('Z', M); try { await used.v.connect(P.code, 'Z'); } catch (e) { e11a = e.code + ' ' + e.message; }
  const P2 = await tab.v.pair(); CLOCK += 11 * 60000; try { await Device('Y', M).v.connect(P2.code, 'Y'); } catch (e) { e11b = e.message; }
  T('V-11 Kopplungscode wiederverwendet bzw. nach 10 Minuten: verweigert (kein Dauerzugang)', /auth/.test(e11a) && /abgelaufen/.test(e11b) && !used.v.on, { e11a, e11b });
  const devs = await tab.v.devices(); const hd = devs.find((d) => d.name === 'Handy');
  T('Geräteliste zeigt Namen (verschlüsselt beim Dienst) und markiert dieses Gerät', devs.length >= 4 && hd && devs.filter((d) => d.me).length === 1 && devs.find((d) => d.me).name === 'Tablet', devs.map((d) => d.name));
  const hanBefore = JSON.stringify(han.data); await tab.v.revoke(hd.did); han.edit('c_ilva', (c) => { c.play.hp = 3; }); await han.v.sync();
  T('V-11 Widerrufenes Gerät: gesperrt, kein Upload, lokale Daten bleiben (Änderung lokal erhalten)', han.v.status === 'gesperrt' && tab.data.c.c_ilva.play.hp === 10 && han.data.c.c_ilva.play.hp === 3 && hanBefore.length > 10, han.v.status);

  /* V-13 Verlauf: fehlerhafte Änderung, Rückkehr als neue Revision */
  tab.edit('c_ilva', (c) => { c.inv = []; c.notes = 'versehentlich gelöscht'; }); await tab.v.sync(); await neu.v.sync();
  const H = await tab.v.history('c', 'c_ilva'); const good = H.find((h) => h.data && h.data.inv.length > 1); const revBefore = vobj()[oidI].rev;
  await tab.v.restore('c', 'c_ilva', good.rev); await neu.v.sync();
  T('V-13 Verlauf: früherer Stand wiederhergestellt als neue Revision, anderes Gerät übernimmt', H.length >= 5 && vobj()[oidI].rev === revBefore + 1 && neu.data.c.c_ilva.inv.length > 1 && JSON.stringify(neu.data.c.c_ilva) === JSON.stringify(good.data), { n: H.length, rev: vobj()[oidI].rev });

  /* V-14 Löschen mit Löschmarke; altes Gerät belebt nicht wieder; Entkoppeln löscht lokal nichts */
  M.down = true; odd.edit('c_borin_k', (c) => { c.play.hp = 1; }); await odd.v.sync(); M.down = false;
  tab.del('c', 'c_borin_k'); await tab.v.sync(); await neu.v.sync(); await odd.v.sync();
  T('V-14 Löschung erreicht andere Geräte; altes Gerät mit Offline-Änderung: Konflikt statt Wiederbeleben', !neu.data.c.c_borin_k && !tab.data.c.c_borin_k && odd.v.st.conf.length === 1 && odd.v.st.conf[0].theirs === null && odd.data.c.c_borin_k, { neu: Object.keys(neu.data.c), conf: odd.v.st.conf.length });
  await odd.v.resolve(odd.v.st.conf[0].oid, 'theirs');
  T('Konflikt «anderes Gerät gilt» bei Löschung: Held auch dort entfernt', !odd.data.c.c_borin_k && odd.v.status === 'gesichert', odd.v.status);
  const oddData = JSON.stringify(odd.data); await odd.v.leave();
  T('V-14 Entkoppeln: dieses Gerät aus dem Vault entfernt, lokale Daten unverändert', !odd.v.on && JSON.stringify(odd.data) === oddData && !(await tab.v.devices()).some((d) => d.name === 'Laptop'));

  /* V-15 Fremde Formatversion, ungültige verschachtelte Felder */
  const K = await V.useKeys(tab.v.st); const oidF = await K.oid('c', 'c_bad'); const vv = M.db[tab.v.st.vid];
  vv.obj[oidF] = { rev: 1, box: Object.assign(await V.seal(K, oidF, 1, { kind: 'c', id: 'c_bad', data: held('c_bad', 'Kaputt', 3) }), { v: 3 }), hist: [] };
  const oidG = await K.oid('c', 'c_neg'); vv.obj[oidG] = { rev: 1, box: await V.seal(K, oidG, 1, { kind: 'c', id: 'c_neg', data: Object.assign(held('c_neg', 'Negativ', 3), { play: { hp: -4 } }) }), hist: [] };
  const s15 = JSON.stringify(neu.data); await neu.v.sync();
  T('V-15 Unbekannte Formatversion und ungültige Felder: nicht übernommen, gemeldet, Bestand unverändert', neu.v.bad.length === 2 && JSON.stringify(neu.data) === s15 && neu.v.bad.some((b) => /Format/.test(b.why)) && neu.v.bad.some((b) => /ungültig/.test(b.why)), neu.v.bad);
  delete vv.obj[oidF]; delete vv.obj[oidG];

  /* V-16 Zu gross: ehrlicher Status, Rest wird gesichert */
  const Ms = createMock({ now, maxBytes: 3000 }); const sm = Device('Klein', Ms); sm.data.c.c_a = held('c_a', 'Ana', 5); sm.data.c.c_big = Object.assign(held('c_big', 'Gross', 5), { notes: 'x'.repeat(5000) });
  await sm.v.create('K'); await sm.v.sync();
  T('V-16 Objekt zu gross: gemeldet, Status nicht «gesichert», übrige Helden gesichert', sm.v.status === 'fehler' && sm.v.bad.some((b) => /gross/.test(b.why)) && Object.keys(Object.values(Ms.db)[0].obj).length === 1, { st: sm.v.status, bad: sm.v.bad });

  /* V-19 Zweites Gerät mit eigenem, unabhängigem Bestand */
  const alt = Device('Altes Tablet', M); alt.data.c.c_ilva = held('c_ilva', 'Ilva (alt)', 30); alt.data.c.c_solo = held('c_solo', 'Solo', 11); const altBefore = J(alt.data);
  await alt.v.connect(rec, 'Altes Tablet'); await tab.v.sync();
  T('V-19 Verbinden mit eigenem Bestand: gleicher Held → Konflikt (nichts ersetzt), eigener Held hochgeladen, fehlende ergänzt', alt.data.c.c_ilva.name === 'Ilva (alt)' && alt.v.st.conf.length === 1 && tab.data.c.c_solo && alt.data.c.c_borin && JSON.stringify(alt.data.c.c_solo) === JSON.stringify(altBefore.c.c_solo), { conf: alt.v.st.conf.length, tab: Object.keys(tab.data.c) });

  /* V-20 Wiederanlauf nach 429/500/Dienst aus; begrenzte Wartezeit */
  tab.edit('c_ilva', (c) => { c.play.hp = 15; }); M.fault = { status: 429, body: { retryMs: 30000 } }; await tab.v.sync(); const w429 = tab.v.wait;
  M.down = true; const ws = []; for (let i = 0; i < 12; i++) { await tab.v.sync(); ws.push(tab.v.wait); } M.down = false; await tab.v.sync();
  T('V-20 429 mit Serverfrist, Offline mit wachsender, gedeckelter Wartezeit, danach gesichert', w429 === 30000 && Math.max(...ws) === 300000 && ws[0] < ws[3] && tab.v.status === 'gesichert' && tab.v.wait === 0, { w429, ws });
  const calls0 = M.calls; M.fault = { status: 401, keep: true }; await tab.v.sync(); await tab.v.sync(); M.fault = null;
  T('V-20 401: gesperrt, kein Endlosfeuer (keine geplanten Wiederholungen)', tab.v.status === 'gesperrt' && M.calls - calls0 === 2 && !tab.v.t, { st: tab.v.status, n: M.calls - calls0 });

  /* V-21 Leistung: 200 Änderungen an 5 Helden */
  const Mp = createMock({ now }); const pf = Device('Perf', Mp); await pf.v.create('P'); await pf.v.sync(); const t0 = Date.now(); const puts0 = Mp.log.filter((l) => l.startsWith('PUT /v1/vault/') && l.includes('/obj/')).length;
  for (let i = 0; i < 200; i++) pf.set('c', 'c' + (i % 5), Object.assign(held('c' + (i % 5), 'H' + (i % 5), 30 - (i % 20)), { inv: Array.from({ length: 40 }, (_, k) => ({ n: 'Gegenstand ' + k, qty: 1 })) }));
  await pf.v.sync(); const ms = Date.now() - t0; const puts = Mp.log.filter((l) => l.startsWith('PUT /v1/vault/') && l.includes('/obj/')).slice(puts0); const bytes = puts.reduce((a, l) => a + l.length, 0);
  T('V-21 200 Änderungen → 5 Uploads gebündelt, < 1 s, Datenmenge klein', puts.length === 5 && ms < 1000 && bytes < 60000, { uploads: puts.length, ms, bytes });

  /* V-22 Vault-Daten beim Dienst löschen; lokale Daten bleiben */
  M.fault = null; const keepTab = JSON.stringify(tab.data); const vidT = tab.v.st.vid; const ok22 = await tab.v.destroy().catch(() => false);
  const r22 = await M.handle('POST', '/v1/vault/' + vidT + '/dev', { body: { rauth: (await V.rootKeys(rec)).rauth, dev: { did: 'a'.repeat(32), tok: 'b'.repeat(64) } } });
  T('V-22 Löschen: Vault beim Dienst weg (auch mit Schlüssel nicht mehr erreichbar), lokale Daten unverändert', ok22 === true && !M.db[vidT] && r22.status === 401 && JSON.stringify(tab.data) === keepTab && !tab.v.on, { ok22, r22: r22.status });
  console.log('\n' + pass + ' / ' + (pass + fail) + ' bestanden'); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ABBRUCH ' + e.stack); process.exit(1); });
