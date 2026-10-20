/* ==== Heldenbuch als eigenständige App: Speicher auf dem Gerät + Online-Tisch über MQTT (WebSocket) ====
   Wird nur in der App-Version eingebunden (nicht im Claude-Artifact). Kein eigener Server nötig:
   Ein öffentlicher MQTT-Server verteilt die Daten eines Raums an alle Geräte mit demselben Raumcode. */
var APP_MODE = 'app';
const HB_BROKERS = {
  hivemq: ['HiveMQ (Standard)', 'wss://broker.hivemq.com:8884/mqtt'],
  emqx: ['EMQX (Ersatz)', 'wss://broker.emqx.io:8084/mqtt'],
  mosquitto: ['Mosquitto (Test)', 'wss://test.mosquitto.org:8081']
};
const HB_PREFIX = 'heldenbuch-v1/';
const hbLs = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
function hbUid() { let u = hbLs.get('hb_uid', ''); if (!u) { u = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); hbLs.set('hb_uid', u); } return u; }
function hbServer() { const k = hbLs.get('hb_server', 'hivemq'); if (k === 'custom') return hbLs.get('hb_server_url', HB_BROKERS.hivemq[1]); return (HB_BROKERS[k] || HB_BROKERS.hivemq)[1]; }

/* ---------- Kleiner MQTT-3.1.1-Client (QoS 0, retained) ---------- */
class HbMqtt {
  constructor() { this.subs = new Map(); this.queue = new Map(); this.state = 'offline'; this.listeners = new Set(); this.buf = new Uint8Array(0); this.pid = 1; this.retry = 0; this.want = false; }
  onState(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  setState(s) { if (this.state === s) return; this.state = s; this.listeners.forEach((f) => { try { f(s); } catch (e) {} }); }
  start() { this.want = true; if (this.ws && (this.state === 'online' || this.state === 'verbinde')) return; this.open(); }
  stop() { this.want = false; clearTimeout(this.rt); clearInterval(this.ping); try { this.ws && this.ws.close(); } catch (e) {} this.ws = null; this.setState('offline'); }
  open() {
    clearTimeout(this.rt); this.setState('verbinde');
    let ws; try { ws = new WebSocket(hbServer(), 'mqtt'); } catch (e) { return this.later(); }
    ws.binaryType = 'arraybuffer'; this.ws = ws; this.buf = new Uint8Array(0);
    ws.onopen = () => { const id = 'hb-' + hbUid().slice(-10) + '-' + Math.random().toString(36).slice(2, 6); this.send(this.pkt(0x10, [this.str('MQTT'), [4, 0x02, 0, 60]], [this.str(id)])); };
    ws.onmessage = (ev) => { const d = new Uint8Array(ev.data); const b = new Uint8Array(this.buf.length + d.length); b.set(this.buf); b.set(d, this.buf.length); this.buf = b; this.drain(); };
    ws.onclose = () => { clearInterval(this.ping); if (this.ws === ws) { this.ws = null; this.setState('offline'); if (this.want) this.later(); } };
    ws.onerror = () => { try { ws.close(); } catch (e) {} };
  }
  later() { this.setState('offline'); const t = Math.min(30000, 1000 * Math.pow(2, this.retry++)); clearTimeout(this.rt); this.rt = setTimeout(() => this.want && this.open(), t); }
  str(s) { const u = new TextEncoder().encode(s); return [u.length >> 8, u.length & 255, ...u]; }
  len(n) { const o = []; do { let b = n % 128; n = Math.floor(n / 128); if (n > 0) b |= 128; o.push(b); } while (n > 0); return o; }
  pkt(type, varParts, payloadParts) { const body = [].concat(...varParts, ...(payloadParts || [])); return new Uint8Array([type, ...this.len(body.length), ...body]); }
  send(u8) { try { if (this.ws && this.ws.readyState === 1) { this.ws.send(u8); return true; } } catch (e) {} return false; }
  drain() {
    for (;;) {
      const b = this.buf; if (b.length < 2) return;
      let mult = 1, val = 0, i = 1, byte;
      do { if (i >= b.length) return; byte = b[i++]; val += (byte & 127) * mult; mult *= 128; } while (byte & 128);
      if (b.length < i + val) return;
      const type = b[0], body = b.slice(i, i + val); this.buf = b.slice(i + val);
      this.handle(type, body);
    }
  }
  handle(type, body) {
    const t = type >> 4;
    if (t === 2) { if (body[1] === 0) { this.retry = 0; this.setState('online'); clearInterval(this.ping); this.ping = setInterval(() => this.send(new Uint8Array([0xC0, 0])), 25000); for (const topic of this.subs.keys()) this.sub(topic); for (const [topic, [payload, retain]] of this.queue) this.pub(topic, payload, retain); this.queue.clear(); } else { this.setState('fehler'); try { this.ws.close(); } catch (e) {} } }
    else if (t === 3) { const qos = (type >> 1) & 3; const tl = (body[0] << 8) | body[1]; const topic = new TextDecoder().decode(body.slice(2, 2 + tl)); let p = 2 + tl; if (qos > 0) { const id = [body[p], body[p + 1]]; p += 2; if (qos === 1) this.send(new Uint8Array([0x40, 2, id[0], id[1]])); } const msg = new TextDecoder().decode(body.slice(p)); this.dispatch(topic, msg); }
  }
  match(filter, topic) { const f = filter.split('/'), t = topic.split('/'); for (let i = 0; i < f.length; i++) { if (f[i] === '#') return true; if (f[i] !== '+' && f[i] !== t[i]) return false; } return f.length === t.length; }
  dispatch(topic, msg) { for (const [f, fns] of this.subs) if (this.match(f, topic)) fns.forEach((fn) => { try { fn(topic, msg); } catch (e) {} }); }
  sub(topic) { const id = this.pid++ & 0xffff || 1; this.send(this.pkt(0x82, [[id >> 8, id & 255]], [this.str(topic), [0]])); }
  subscribe(topic, fn) { let s = this.subs.get(topic); if (!s) { s = new Set(); this.subs.set(topic, s); if (this.state === 'online') this.sub(topic); } s.add(fn); this.start();
    return () => { const set = this.subs.get(topic); if (!set) return; set.delete(fn); if (!set.size) { this.subs.delete(topic); const id = this.pid++ & 0xffff || 1; this.send(this.pkt(0xA2, [[id >> 8, id & 255]], [this.str(topic)])); } }; }
  pub(topic, payload, retain) { const u = new TextEncoder().encode(payload); return this.send(this.pkt(0x30 | (retain ? 1 : 0), [this.str(topic)], [Array.from(u)])); }
  publish(topic, payload, retain) { this.start(); if (this.state !== 'online' || !this.pub(topic, payload, retain)) this.queue.set(topic, [payload, retain]); }
}
const HBNET = new HbMqtt();

/* ---------- Datenschicht mit derselben Form wie die Claude-Datenbank ---------- */
const HB_CACHE = new Map();
function hbLocalKeys(prefix) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('hbdb:' + prefix + '/') && k.slice(('hbdb:' + prefix + '/').length).indexOf('/') < 0) out.push(k.slice(5)); } } catch (e) {} return out; }
function hbSnapDoc(path, val) { return { id: path.split('/').pop(), exists: val !== undefined && val !== null, data: () => (val == null ? undefined : JSON.parse(JSON.stringify(val))) }; }
function hbDoc(path) {
  const remote = path.startsWith('camp/') || path.startsWith('transfer/');
  if (!remote) return {
    id: path.split('/').pop(), path,
    set: async (d) => { hbLs.set('hbdb:' + path, JSON.stringify(d)); },
    delete: async () => { try { localStorage.removeItem('hbdb:' + path); } catch (e) {} },
    get: async () => { const v = hbLs.get('hbdb:' + path, null); return hbSnapDoc(path, v ? JSON.parse(v) : null); },
    onSnapshot: (fn) => { const v = hbLs.get('hbdb:' + path, null); setTimeout(() => fn(hbSnapDoc(path, v ? JSON.parse(v) : null)), 0); return () => {}; }
  };
  const topic = HB_PREFIX + path;
  return {
    id: path.split('/').pop(), path,
    set: async (d) => { HB_CACHE.set(path, d); HBNET.publish(topic, JSON.stringify(d), true); },
    delete: async () => { HB_CACHE.delete(path); HBNET.publish(topic, '', true); },
    get: async () => hbSnapDoc(path, HB_CACHE.get(path)),
    onSnapshot: (fn) => {
      let first = true; const t0 = setTimeout(() => { if (first) { first = false; fn(hbSnapDoc(path, HB_CACHE.get(path))); } }, 1500);
      const off = HBNET.subscribe(topic, (tp, msg) => { let v = null; try { v = msg ? JSON.parse(msg) : null; } catch (e) {} if (v == null) HB_CACHE.delete(path); else HB_CACHE.set(path, v); first = false; clearTimeout(t0); fn(hbSnapDoc(path, v)); });
      return () => { clearTimeout(t0); off(); };
    }
  };
}
function hbCollection(path) {
  const remote = path.startsWith('camp/');
  return {
    path,
    doc: (id) => hbDoc(path + '/' + (id || Math.random().toString(36).slice(2))),
    get: async () => { const keys = remote ? [...HB_CACHE.keys()].filter((k) => k.startsWith(path + '/') && k.slice(path.length + 1).indexOf('/') < 0) : hbLocalKeys(path);
      const docs = keys.map((k) => hbSnapDoc(k, remote ? HB_CACHE.get(k) : JSON.parse(hbLs.get('hbdb:' + k, 'null')))).filter((d) => d.exists); return { docs, empty: !docs.length }; },
    onSnapshot: (fn) => {
      if (!remote) { setTimeout(async () => fn(await hbCollection(path).get()), 0); return () => {}; }
      const map = new Map(); let tm = null; const emit = () => { clearTimeout(tm); tm = setTimeout(() => fn({ docs: [...map.entries()].map(([k, v]) => hbSnapDoc(k, v)), empty: !map.size }), 60); };
      const t0 = setTimeout(emit, 1200);
      const off = HBNET.subscribe(HB_PREFIX + path + '/+', (tp, msg) => { const k = tp.slice(HB_PREFIX.length); let v = null; try { v = msg ? JSON.parse(msg) : null; } catch (e) {} if (v == null) { map.delete(k); HB_CACHE.delete(k); } else { map.set(k, v); HB_CACHE.set(k, v); } emit(); });
      return () => { clearTimeout(t0); clearTimeout(tm); off(); };
    }
  };
}
const HBDB = { doc: hbDoc, collection: hbCollection };
async function hbSaveFile({ filename, data }) {
  const blob = new Blob([data], { type: 'application/json' });
  try { const file = new File([blob], filename, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return; } } catch (e) { if (e && e.name === 'AbortError') { const er = new Error('declined'); er.code = 'declined'; throw er; } }
  if (window.Capacitor) throw new Error('nodownload');
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
if (!window.claude || !window.claude.use) window.claude = { use: async (n) => (n === 'db' ? HBDB : n === 'user' ? { id: async () => hbUid() } : n === 'downloads' ? { save: hbSaveFile } : null) };
HBNET.onState(() => { try { if (typeof paintCamp === 'function') paintCamp(); const el = document.getElementById('netDot'); if (el) el.className = 'netdot ' + HBNET.state; } catch (e) {} });

/* Service Worker für die Offline-Nutzung (nur wenn über http(s) geladen) */
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol) && !window.Capacitor) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); }); }
