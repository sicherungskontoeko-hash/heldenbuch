/* Fablecrown Vault – Kern (Stufe V1, nur lokal mit Prüfserver; noch nicht in die App eingebunden, nichts aktiv).
   Ende-zu-Ende verschlüsselt mit Web Crypto (AES-GCM 256, HKDF-SHA-256), keine eigene Kryptografie.
   Aus dem Wiederherstellungsschlüssel (128 Bit Zufall) werden getrennt abgeleitet:
     Vault-ID (öffentlich), Zugangsschlüssel (Server prüft nur dessen SHA-256), Datenschlüssel (bleibt beim Gerät),
     Objekt-ID-Schlüssel (der Server sieht keine Namen oder Helden-IDs).
   Jede Objektversion: eigene Zufallsnonce, AAD = Vault-ID|Objekt-ID|Schema|Revision (Vertauschen, Zurückspielen fällt auf).
   Schreiben nur bedingt (If-Match: Basisrevision): fremde neuere Stände werden nie still überschrieben (Konflikt).
   Läuft im Browser und in Node ≥ 20 (globalThis.crypto). Siehe berichte/VAULT_V0_ADR.md. */
(function (root) {
  'use strict';
  const C = root.crypto && root.crypto.subtle ? root.crypto : require('crypto').webcrypto;
  const te = new TextEncoder(), td = new TextDecoder();
  const SCHEMA = 1;
  const A32 = 'ABCDEFGHIJKLMNPQRSTUVWXYZ2345678'; /* 32 Zeichen: A–Z ohne O, dazu 2–8 (keine 0/O-, 1/I-Verwechslung durch fehlende 0, 1, 9) */
  const hex = (u) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
  const b64 = (u) => { let s = ''; for (let i = 0; i < u.length; i += 0x4000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x4000)); return (root.btoa || ((x) => Buffer.from(x, 'binary').toString('base64')))(s); };
  const ub64 = (s) => { const t = (root.atob || ((x) => Buffer.from(x, 'base64').toString('binary')))(s); const u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
  function newRecovery() { const u = C.getRandomValues(new Uint8Array(16)); return fmtRecovery(u); }
  function fmtRecovery(u) { let bits = 0, val = 0, out = ''; for (const b of u) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += A32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits) out += A32[(val << (5 - bits)) & 31]; return out.match(/.{1,4}/g).join('-'); }
  function parseRecovery(s) { const t = String(s || '').toUpperCase().replace(/[\s-]/g, ''); if (t.length !== 26 || /[^A-Z2-8]/.test(t) || /O/.test(t)) throw vErr('recovery', 'Wiederherstellungsschlüssel ungültig (26 Zeichen).'); let bits = 0, val = 0; const out = [];
    for (const ch of t) { const i = A32.indexOf(ch); if (i < 0) throw vErr('recovery', 'Wiederherstellungsschlüssel ungültig.'); val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
    if (out.length !== 16) throw vErr('recovery', 'Wiederherstellungsschlüssel ungültig.'); return new Uint8Array(out); }
  function vErr(code, msg) { const e = new Error(msg); e.code = code; return e; }
  async function keys(recovery) {
    const raw = typeof recovery === 'string' ? parseRecovery(recovery) : recovery;
    const base = await C.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey', 'deriveBits']);
    const salt = te.encode('fablecrown-vault-salt-v1');
    const bits = async (info, n) => new Uint8Array(await C.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode(info) }, base, n));
    const enc = await C.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode('fablecrown-vault-enc-v1') }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const oidKey = await C.subtle.importKey('raw', await bits('fablecrown-vault-oid-v1', 256), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const vid = hex(await bits('fablecrown-vault-id-v1', 128)); const auth = hex(await bits('fablecrown-vault-auth-v1', 256));
    return { vid, auth, enc, oid: async (kind, id) => hex(new Uint8Array(await C.subtle.sign('HMAC', oidKey, te.encode(kind + ':' + id)))).slice(0, 32) };
  }
  const aad = (vid, oid, rev) => te.encode(vid + '|' + oid + '|' + SCHEMA + '|' + rev);
  async function seal(K, oid, rev, data) { const iv = C.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await C.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(K.vid, oid, rev) }, K.enc, te.encode(JSON.stringify(data)))); return { v: SCHEMA, iv: b64(iv), ct: b64(ct) }; }
  async function open(K, oid, rev, box) { if (!box || box.v !== SCHEMA || typeof box.iv !== 'string' || typeof box.ct !== 'string') throw vErr('format', 'Unbekanntes Format.');
    let pt; try { pt = await C.subtle.decrypt({ name: 'AES-GCM', iv: ub64(box.iv), additionalData: aad(K.vid, oid, rev) }, K.enc, ub64(box.ct)); } catch (e) { throw vErr('decrypt', 'Daten beschädigt oder falscher Schlüssel.'); }
    return JSON.parse(td.decode(pt)); }

  /* Client: lokale Daten bleiben führend; die Warteschlange lädt gebündelt hoch und hält bei Fehlern fest. */
  class Vault {
    constructor(o) { this.api = o.api; this.K = null; this.rec = o.recovery; this.base = o.base || {}; this.q = new Map(); this.conflicts = []; this.status = 'aus'; this.wait = 0; this.validate = o.validate || (() => null); this.debounce = o.debounce == null ? 8000 : o.debounce; this.t = null; this.now = o.now || (() => Date.now()); }
    async init() { this.K = await keys(this.rec); const r = await this.api('POST', '/v1/vault/' + this.K.vid, { auth: this.K.auth }); if (r.status !== 200 && r.status !== 201) throw vErr('auth', 'Vault nicht erreichbar (' + r.status + ').'); this.status = 'bereit'; return this; }
    put(kind, id, data) { this.q.set(kind + '\u0000' + id, { kind, id, data }); this.status = 'wartet'; this.schedule(); }
    schedule() { if (this.t || !this.debounce) return; this.t = setTimeout(() => { this.t = null; this.flush().catch(() => {}); }, Math.max(this.debounce, this.wait)); }
    async flush() {
      if (!this.K) throw vErr('init', 'Vault nicht eingerichtet.'); let sent = 0;
      for (const [k, it] of Array.from(this.q)) {
        const oid = await this.K.oid(it.kind, it.id); const baseRev = this.base[oid] || 0; const rev = baseRev + 1;
        const box = await seal(this.K, oid, rev, { kind: it.kind, id: it.id, data: it.data });
        let r; try { r = await this.api('PUT', '/v1/vault/' + this.K.vid + '/obj/' + oid, { auth: this.K.auth, ifMatch: baseRev, body: { rev, box } }); } catch (e) { this.status = 'offline'; this.wait = Math.min(300000, (this.wait || 2000) * 2); return sent; }
        if (r.status === 200 || r.status === 201) { this.base[oid] = rev; this.q.delete(k); sent++; this.wait = 0; continue; }
        if (r.status === 409) { this.conflicts.push({ kind: it.kind, id: it.id, oid, mine: it.data, theirsRev: r.body && r.body.rev }); this.q.delete(k); this.status = 'konflikt'; continue; }
        if (r.status === 401 || r.status === 403) { this.status = 'gesperrt'; return sent; }
        if (r.status === 429 || r.status >= 500) { this.status = 'später'; this.wait = Math.min(300000, Math.max(2000, (r.body && r.body.retryMs) || (this.wait || 2000) * 2)); return sent; }
        this.status = 'fehler'; return sent;
      }
      if (this.status !== 'konflikt') this.status = 'gesichert'; return sent;
    }
    /* Alles holen (Wiederherstellung, zweites Gerät): entschlüsseln, prüfen, erst dann übergeben – nie ungeprüft übernehmen */
    async pull() {
      const r = await this.api('GET', '/v1/vault/' + this.K.vid + '/obj', { auth: this.K.auth }); if (r.status !== 200) throw vErr('pull', 'Abruf fehlgeschlagen (' + r.status + ').');
      const out = [], bad = [];
      for (const [oid, o] of Object.entries(r.body || {})) {
        try { const d = await open(this.K, oid, o.rev, o.box); const why = this.validate(d.kind, d.data); if (why) { bad.push({ oid, why }); continue; } this.base[oid] = o.rev; out.push(d); } catch (e) { bad.push({ oid, why: e.message }); }
      }
      return { items: out, bad };
    }
  }
  const api = { newRecovery, parseRecovery, fmtRecovery, keys, seal, open, Vault, SCHEMA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FcVault = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
