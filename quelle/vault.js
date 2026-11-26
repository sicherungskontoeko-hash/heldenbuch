/* Fablecrown Vault – Kern (Stufe V2: zwei Geräte, Kopplung, Widerruf, Verlauf, Löschmarken; nur gegen lokalen Prüfserver).
   Ende-zu-Ende verschlüsselt mit Web Crypto (AES-GCM 256, HKDF-SHA-256), keine eigene Kryptografie.
   Aus dem Wiederherstellungsschlüssel (128 Bit Zufall) werden getrennt abgeleitet:
     Vault-ID, Wiederherstellungs-Berechtigung (Server prüft nur deren SHA-256, das Gerät speichert sie NICHT),
     Datenschlüssel und Objekt-ID-Schlüssel (der Server sieht keine Namen oder Helden-IDs).
   Jedes Gerät hat einen eigenen zufälligen Gerätezugang (einzeln widerrufbar); Kopplung über einen kurzlebigen,
   einmal verwendbaren Kopplungscode. Jede Objektversion: eigene Zufallsnonce, AAD = Vault-ID|Objekt-ID|Schema|Revision.
   Schreiben nur bedingt (If-Match: Basisrevision); fremde neuere Stände werden nie still überschrieben (Konflikt).
   Wiederholung nach Zeitüberschreitung sendet exakt dieselbe Version (keine doppelte Änderung).
   Läuft im Browser und in Node ≥ 20 (globalThis.crypto). Siehe berichte/VAULT_V0_ADR.md und VAULT_V2.md. */
(function (root) {
  'use strict';
  const C = root.crypto && root.crypto.subtle ? root.crypto : typeof require === 'function' ? require('crypto').webcrypto : null;
  if (!C) { root.FcVault = { available: false }; return; } /* ohne Web Crypto (unsicherer Kontext): Vault nicht anbieten */
  const te = new TextEncoder(), td = new TextDecoder();
  const SCHEMA = 2;
  const A32 = 'ABCDEFGHIJKLMNPQRSTUVWXYZ2345678'; /* A–Z ohne O, dazu 2–8: keine Verwechslung von 0/O, 1/I */
  const hex = (u) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
  const b64 = (u) => { let s = ''; for (let i = 0; i < u.length; i += 0x4000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x4000)); return (root.btoa || ((x) => Buffer.from(x, 'binary').toString('base64')))(s); };
  const ub64 = (s) => { const t = (root.atob || ((x) => Buffer.from(x, 'base64').toString('binary')))(s); const u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
  const rnd = (n) => C.getRandomValues(new Uint8Array(n));
  function vErr(code, msg) { const e = new Error(msg); e.code = code; return e; }
  function fmtRecovery(u) { let bits = 0, val = 0, out = ''; for (const b of u) { val = ((val << 8) | b) & 0xffff; bits += 8; while (bits >= 5) { out += A32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits) out += A32[(val << (5 - bits)) & 31]; return out.match(/.{1,4}/g).join('-'); }
  const newRecovery = () => fmtRecovery(rnd(16));
  function parseRecovery(s) { const t = String(s || '').toUpperCase().replace(/[\s-]/g, ''); if (t.length !== 26 || /[^A-Z2-8]/.test(t)) throw vErr('recovery', 'Schlüssel ungültig (26 Zeichen, Buchstaben und Ziffern 2–8).');
    let bits = 0, val = 0; const out = []; for (const ch of t) { const i = A32.indexOf(ch); if (i < 0) throw vErr('recovery', 'Schlüssel ungültig.'); val = ((val << 5) | i) & 0xffff; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
    if (out.length !== 16 || (val & ((1 << bits) - 1))) throw vErr('recovery', 'Schlüssel ungültig (Tippfehler?).'); return new Uint8Array(out); }
  const SALT = te.encode('fablecrown-vault-salt-v1');
  async function hk(raw, info, n) { const k = await C.subtle.importKey('raw', raw, 'HKDF', false, ['deriveBits']); return new Uint8Array(await C.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: SALT, info: te.encode(info) }, k, n)); }
  /* Wurzel: nur beim Anlegen und Wiederherstellen im Speicher, danach verworfen */
  async function rootKeys(recovery) { const raw = typeof recovery === 'string' ? parseRecovery(recovery) : recovery;
    return { vid: hex(await hk(raw, 'fablecrown-vault-id-v1', 128)), rauth: hex(await hk(raw, 'fablecrown-vault-auth-v1', 256)), enc: b64(await hk(raw, 'fablecrown-vault-enc-v1', 256)), oid: b64(await hk(raw, 'fablecrown-vault-oid-v1', 256)) }; }
  /* Gerät: Datenschlüssel nicht exportierbar importiert */
  async function useKeys(M) { const enc = await C.subtle.importKey('raw', ub64(M.enc), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']); const ok = await C.subtle.importKey('raw', ub64(M.oid), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return { vid: M.vid, enc, oid: async (kind, id) => hex(new Uint8Array(await C.subtle.sign('HMAC', ok, te.encode(kind + ':' + id)))).slice(0, 32) }; }
  const aad = (vid, oid, rev) => te.encode(vid + '|' + oid + '|' + SCHEMA + '|' + rev);
  async function seal(K, oid, rev, data) { const iv = rnd(12); const ct = new Uint8Array(await C.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(K.vid, oid, rev) }, K.enc, te.encode(JSON.stringify(data)))); return { v: SCHEMA, iv: b64(iv), ct: b64(ct) }; }
  async function open(K, oid, rev, box) { if (!box || box.v !== SCHEMA || typeof box.iv !== 'string' || typeof box.ct !== 'string') throw vErr('format', 'Unbekanntes Format.');
    let pt; try { pt = await C.subtle.decrypt({ name: 'AES-GCM', iv: ub64(box.iv), additionalData: aad(K.vid, oid, rev) }, K.enc, ub64(box.ct)); } catch (e) { throw vErr('decrypt', 'Daten beschädigt oder falscher Schlüssel.'); }
    return JSON.parse(td.decode(pt)); }
  async function sha(s) { return hex(new Uint8Array(await C.subtle.digest('SHA-256', te.encode(s)))); }
  /* Kopplung: der Code (128 Bit) liefert Kennung und Schlüssel des einmaligen Pakets */
  async function pairKeys(code) { const raw = parseRecovery(code); const key = await C.subtle.importKey('raw', await hk(raw, 'fablecrown-vault-pair-key-v2', 256), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']); return { pid: hex(await hk(raw, 'fablecrown-vault-pair-id-v2', 128)), key }; }
  const PAIR_AAD = (pid) => te.encode('fablecrown-pair|' + pid);
  const newDev = () => ({ did: hex(rnd(16)), tok: hex(rnd(32)) });
  const KEYSEP = '\u0000';

  /* Client. Lokale Daten bleiben führend. Die App liefert:
     read(kind,id) → Daten | undefined (nicht vorhanden), apply(kind,id,data|null) → true (übernommen) / false (abgelehnt),
     validate(kind,data) → Fehlertext | null, list() → [[kind,id]…], store {load(), save(st)}, optional copy(kind,data), onStatus(s). */
  class Vault {
    constructor(o) { this.o = o; this.api = o.api; this.st = null; this.K = null; this.status = 'aus'; this.wait = 0; this.t = null; this.debounce = o.debounce == null ? 8000 : o.debounce; this.now = o.now || (() => Date.now()); this.gen = new Map(); this.bad = []; }
    get on() { return !!(this.st && this.st.vid); }
    load() { const s = this.o.store.load(); this.st = s && s.v === 2 && s.vid ? s : null; return this.st; }
    save() { if (this.st) this.o.store.save(this.st); }
    set(s) { if (this.status !== s) { this.status = s; if (this.o.onStatus) try { this.o.onStatus(s); } catch (e) {} } }
    auth() { return { did: this.st.did, tok: this.st.tok }; }
    async ready() { if (!this.st) this.load(); if (!this.st) throw vErr('init', 'Vault nicht eingerichtet.'); if (!this.K) this.K = await useKeys(this.st); return this; }
    fresh(M, dev) { this.st = { v: 2, vid: M.vid, enc: M.enc, oid: M.oid, did: dev.did, tok: dev.tok, base: {}, hash: {}, map: {}, dirty: [], fly: {}, conf: [], ok: 0, since: this.now() }; this.K = null; this.save(); }
    async hello(name) { await this.ready(); const box = await seal(this.K, 'dev-' + this.st.did, 0, { name: String(name || 'Gerät').slice(0, 40), at: this.now() }); return this.call('PUT', '/dev/' + this.st.did, { box }); }
    async call(m, p, body) { return this.api(m, '/v1/vault/' + this.st.vid + p, { auth: this.auth(), body }); }
    /* Neu anlegen: liefert den Wiederherstellungsschlüssel genau einmal zurück */
    async create(name) {
      const rec = newRecovery(); const R = await rootKeys(rec); const dev = newDev();
      const r = await this.api('POST', '/v1/vault/' + R.vid, { body: { rauth: R.rauth, dev } }); if (r.status !== 201) throw vErr('create', 'Vault konnte nicht angelegt werden (' + r.status + ').');
      this.fresh(R, dev); await this.hello(name).catch(() => {}); for (const [k, i] of this.o.list()) this.mark(k, i, true); this.save(); return rec;
    }
    /* Verbinden mit Kopplungscode (zuerst versucht) oder Wiederherstellungsschlüssel. Lokale Daten werden NICHT ersetzt:
       Gleiche Helden mit anderem Stand werden Konflikte, fehlende kommen dazu, nur lokale werden hochgeladen. */
    async connect(code, name) {
      const dev = newDev(); let M = null;
      const P = await pairKeys(code); const r = await this.api('POST', '/v1/pair/' + P.pid, { body: { dev } });
      if (r.status === 200 && r.body && r.body.box) { try { M = JSON.parse(td.decode(await C.subtle.decrypt({ name: 'AES-GCM', iv: ub64(r.body.box.iv), additionalData: PAIR_AAD(P.pid) }, P.key, ub64(r.body.box.ct)))); } catch (e) { throw vErr('pair', 'Kopplungspaket beschädigt.'); } if (!M || M.vid !== r.body.vid) throw vErr('pair', 'Kopplungspaket passt nicht.'); }
      else if (r.status === 410) throw vErr('pair', 'Kopplungscode abgelaufen oder schon verwendet – auf dem anderen Gerät einen neuen erzeugen.');
      else { const R = await rootKeys(code); const q = await this.api('POST', '/v1/vault/' + R.vid + '/dev', { body: { rauth: R.rauth, dev } }); if (q.status !== 201) throw vErr('auth', q.status === 401 || q.status === 404 ? 'Schlüssel unbekannt oder Vault gelöscht.' : 'Verbinden fehlgeschlagen (' + q.status + ').'); M = { vid: R.vid, enc: R.enc, oid: R.oid }; }
      this.fresh(M, dev); await this.hello(name).catch(() => {}); for (const [k, i] of this.o.list()) this.mark(k, i, true); this.save();
      return this.sync();
    }
    mark(kind, id, quiet) { if (!this.st) return; const key = kind + KEYSEP + id; if (!this.st.dirty.includes(key)) this.st.dirty.push(key); this.gen.set(key, (this.gen.get(key) || 0) + 1); this.save(); if (!quiet) { this.set('wartet'); this.schedule(); } }
    schedule(ms) { if (this.t || (!this.debounce && ms == null)) return; this.t = setTimeout(() => { this.t = null; this.sync().catch(() => {}); }, Math.max(ms == null ? this.debounce : ms, this.wait)); }
    stop() { clearTimeout(this.t); this.t = null; }
    fail(r) { if (r === 'offline') { this.set('offline'); this.wait = Math.min(300000, (this.wait || 2000) * 2); }
      else if (r.status === 401 || r.status === 403 || r.status === 404) { this.set('gesperrt'); this.wait = 0; this.stop(); return 'gesperrt'; }
      else if (r.status === 429 || r.status >= 500) { this.set('später'); this.wait = Math.min(300000, Math.max(2000, (r.body && r.body.retryMs) || (this.wait || 2000) * 2)); }
      else this.set('fehler'); this.save(); if (this.debounce) this.schedule(); return this.status; }
    async req(m, p, body) { try { return await this.call(m, p, body); } catch (e) { return null; } }
    plain(kind, id, data) { return data === undefined || data === null ? { kind, id, del: true } : { kind, id, data }; }
    async remote(oid) { const r = await this.req('GET', '/obj/' + oid); if (!r || r.status !== 200) return null; const d = await open(this.K, oid, r.body.rev, r.body.box); return { rev: r.body.rev, d }; }
    /* Abgleich: neuere Stände holen (geprüft, ohne laufende lokale Änderung zu überfahren), dann hochladen */
    async sync() { if (root.navigator && root.navigator.locks) return root.navigator.locks.request('fablecrown-vault', () => this.sync0()); return this.sync0(); }
    async sync0() {
      this.load(); await this.ready(); const S = this.st; this.bad = [];
      const r = await this.req('GET', '/meta'); if (!r) return this.fail('offline'); if (r.status !== 200) return this.fail(r);
      for (const [oid, rev] of Object.entries(r.body || {})) {
        if (rev <= (S.base[oid] || 0)) continue;
        let g; try { g = await this.remote(oid); } catch (e) { this.bad.push({ oid, why: e.message }); continue; } if (!g) return this.fail('offline');
        const { kind, id } = g.d; const key = kind + KEYSEP + id; if (typeof kind !== 'string' || typeof id !== 'string' || (await this.K.oid(kind, id)) !== oid) { this.bad.push({ oid, why: 'Zuordnung falsch' }); continue; }
        S.map[oid] = key; const theirs = g.d.del ? null : g.d.data;
        if (theirs !== null) { const why = this.o.validate(kind, theirs); if (why) { this.bad.push({ oid, kind, id, why }); continue; } }
        const h = await sha(JSON.stringify(this.plain(kind, id, theirs))); const local = this.o.read(kind, id); const lh = await sha(JSON.stringify(this.plain(kind, id, local)));
        if (h === lh) { S.base[oid] = g.rev; S.hash[oid] = h; delete S.fly[oid]; this.undirty(key); continue; }
        const f = S.fly[oid]; if (f && f.rev === g.rev && f.h === h) { S.base[oid] = g.rev; S.hash[oid] = h; delete S.fly[oid]; continue; } /* eigene, schon angekommene Version */
        /* Nie überfahren: lokaler Stand, der nicht genau dem zuletzt abgeglichenen entspricht (auch beim ersten Verbinden) */
        const dirty = S.dirty.includes(key); const mine = local !== undefined ? dirty || lh !== S.hash[oid] : dirty && !!S.base[oid];
        if (mine || S.conf.some((c) => c.oid === oid)) { this.conflict(key, oid, local, theirs, g.rev); continue; }
        if (this.o.apply(kind, id, theirs) === false) { this.bad.push({ oid, kind, id, why: 'nicht übernommen' }); continue; }
        S.base[oid] = g.rev; S.hash[oid] = h; this.undirty(key);
      }
      this.save(); return this.flush0();
    }
    undirty(key) { const i = this.st.dirty.indexOf(key); if (i >= 0) this.st.dirty.splice(i, 1); }
    conflict(key, oid, mine, theirs, rev) { const S = this.st; S.conf = S.conf.filter((c) => c.oid !== oid); const [kind, id] = key.split(KEYSEP);
      S.conf.push({ oid, kind, id, mine: mine === undefined ? null : mine, theirs, rev, at: this.now() }); this.undirty(key); delete S.fly[oid]; }
    async flush() { if (root.navigator && root.navigator.locks) return root.navigator.locks.request('fablecrown-vault', () => this.flush0()); return this.flush0(); }
    async flush0() {
      await this.ready(); const S = this.st; let sent = 0;
      for (const key of S.dirty.slice()) {
        const [kind, id] = key.split(KEYSEP); const oid = await this.K.oid(kind, id); S.map[oid] = key;
        if (S.conf.some((c) => c.oid === oid)) continue; /* offener Konflikt: erst entscheiden */
        const g0 = this.gen.get(key) || 0; const local = this.o.read(kind, id);
        if ((local === undefined || local === null) && !S.base[oid] && !S.fly[oid]) { this.undirty(key); continue; }
        const plain = this.plain(kind, id, local); const h = await sha(JSON.stringify(plain));
        if (!S.fly[oid] && S.hash[oid] === h) { this.undirty(key); continue; }
        for (let pass = 0; pass < 2; pass++) {
          let f = S.fly[oid]; const resend = !!f && f.h !== h; /* alte, evtl. schon angekommene Version zuerst bestätigen */
          if (!f) { const b = S.base[oid] || 0; f = S.fly[oid] = { base: b, rev: b + 1, h, box: await seal(this.K, oid, b + 1, plain) }; this.save(); }
          const r = await this.req('PUT', '/obj/' + oid, { ifMatch: f.base, rev: f.rev, box: f.box });
          if (!r) return this.fail('offline');
          if (r.status === 200 || r.status === 201) { S.base[oid] = f.rev; S.hash[oid] = f.h; delete S.fly[oid]; sent++; this.wait = 0; if (resend) continue; if ((this.gen.get(key) || 0) === g0) this.undirty(key); break; }
          if (r.status === 409) { delete S.fly[oid]; let g = null; try { g = await this.remote(oid); } catch (e) {} if (!g) return this.fail('offline'); const theirs = g ? (g.d.del ? null : g.d.data) : null;
            if ((await sha(JSON.stringify(this.plain(kind, id, theirs)))) === h) { S.base[oid] = g.rev; S.hash[oid] = h; this.undirty(key); break; }
            this.conflict(key, oid, local, theirs, g.rev); break; }
          if (r.status === 413) { delete S.fly[oid]; this.bad.push({ oid, kind, id, why: 'zu gross für den Vault' }); break; }
          return this.fail(r);
        }
      }
      this.save();
      if (S.conf.length) this.set('konflikt'); else if (this.bad.length) this.set('fehler'); else if (S.dirty.length) this.set('wartet'); else { S.ok = this.now(); this.save(); this.set('gesichert'); }
      return sent;
    }
    /* Konflikt entscheiden: 'mine' (dieses Gerät gilt), 'theirs' (anderes Gerät gilt), 'both' (fremder Stand als Kopie dazu) */
    async resolve(oid, how) { await this.ready(); const S = this.st; const c = S.conf.find((x) => x.oid === oid); if (!c) return false;
      if (how === 'theirs') { if (this.o.apply(c.kind, c.id, c.theirs) === false) return false; S.base[oid] = c.rev; S.hash[oid] = await sha(JSON.stringify(this.plain(c.kind, c.id, c.theirs))); }
      else { if (how === 'both' && c.theirs && this.o.copy) this.o.copy(c.kind, c.theirs); S.base[oid] = c.rev; delete S.hash[oid]; const key = c.kind + KEYSEP + c.id; if (!S.dirty.includes(key)) S.dirty.push(key); }
      S.conf = S.conf.filter((x) => x.oid !== oid); this.save(); await this.flush(); return true; }
    /* Verlauf: frühere Stände (Server hält begrenzt viele), Rückkehr als NEUE Revision */
    async history(kind, id) { await this.ready(); const oid = await this.K.oid(kind, id); const r = await this.req('GET', '/obj/' + oid + '/hist'); if (!r || r.status !== 200) return null;
      const out = []; for (const x of r.body || []) { try { const d = await open(this.K, oid, x.rev, x.box); out.push({ rev: x.rev, at: x.at, del: !!d.del, data: d.del ? null : d.data }); } catch (e) { out.push({ rev: x.rev, at: x.at, bad: e.message }); } } return out.sort((a, b) => b.rev - a.rev); }
    async restore(kind, id, rev) { const h = await this.history(kind, id); const x = h && h.find((y) => y.rev === rev); if (!x || x.bad || x.del) return false; if (this.o.validate(kind, x.data)) return false;
      if (this.o.apply(kind, id, x.data) === false) return false; this.mark(kind, id, true); this.save(); await this.flush(); return true; }
    async devices() { await this.ready(); const r = await this.req('GET', '/dev'); if (!r || r.status !== 200) return null; const out = [];
      for (const d of r.body || []) { let name = 'Gerät'; try { if (d.box) name = (await open(this.K, 'dev-' + d.did, 0, d.box)).name; } catch (e) { name = '(unlesbar)'; } out.push({ did: d.did, name, at: d.at, seen: d.seen, me: d.did === this.st.did }); } return out; }
    async revoke(did) { await this.ready(); const r = await this.req('DELETE', '/dev/' + did); return !!r && r.status === 200; }
    /* Kopplungscode für ein weiteres Gerät: einmal verwendbar, läuft nach Serverfrist ab (Prüfserver: 10 Minuten) */
    async pair() { await this.ready(); const code = newRecovery(); const P = await pairKeys(code); const iv = rnd(12);
      const ct = new Uint8Array(await C.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: PAIR_AAD(P.pid) }, P.key, te.encode(JSON.stringify({ vid: this.st.vid, enc: this.st.enc, oid: this.st.oid }))));
      const r = await this.req('POST', '/pair', { pid: P.pid, box: { iv: b64(iv), ct: b64(ct) } }); if (!r || r.status !== 201) throw vErr('pair', 'Kopplung nicht möglich' + (r ? ' (' + r.status + ')' : ' (offline)') + '.'); return { code, exp: r.body && r.body.exp }; }
    /* Entkoppeln: nur dieses Gerät, lokale Daten bleiben. Löschen: alle Vault-Daten beim Dienst, lokale Daten bleiben. */
    async leave() { if (!this.load()) return true; await this.ready().catch(() => {}); await this.req('DELETE', '/dev/' + this.st.did); this.stop(); this.o.store.save(null); this.st = null; this.K = null; this.set('aus'); return true; }
    async destroy() { await this.ready(); const r = await this.req('DELETE', ''); if (!r || r.status !== 200) return false; this.stop(); this.o.store.save(null); this.st = null; this.K = null; this.set('aus'); return true; }
  }
  const api = { newRecovery, parseRecovery, fmtRecovery, rootKeys, useKeys, seal, open, sha, Vault, SCHEMA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FcVault = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
