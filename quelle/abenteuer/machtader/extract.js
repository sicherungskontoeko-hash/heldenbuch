// Liest story.js und appendix.js mit Stubs statt docx ein und liefert einen strukturierten Baum.
const Module = require('module');
const WD = __dirname;
class Raw { constructor(o) { this.k = 'raw'; this.t = ((o && o.children) || []).map((c) => c.text || '').join(''); if (o && o.text) this.t = o.text; } }
class TR { constructor(o) { this.text = (o && o.text) || ''; } }
const docx = new Proxy({ Paragraph: Raw, TextRun: TR, AlignmentType: {}, PageBreak: TR }, { get: (t, k) => (k in t ? t[k] : {}) });
const C = new Proxy({}, { get: () => ['', ''] });
const L = {
  d: docx, W: 9638, SERIF: '', SANS: '', C, NONE: {}, body: {},
  runs: (t) => t,
  P: (t) => ({ k: 'p', t }),
  bullet: (t) => ({ k: 'li', t }),
  numbered: (t, ref) => ({ k: 'ol', t, ref }),
  chapter: (kicker, title, sub) => ({ k: 'chapter', kicker, title, sub }),
  scene: (title) => ({ k: 'scene', title }),
  sub: (title) => ({ k: 'sub', title }),
  label: (t) => ({ k: 'label', t }),
  box: (kind, title, children) => ({ k: kind, title, items: (children || []).map((c) => c.t || '').filter(Boolean), legend: true }),
  vorlese: (ps, title = 'Vorlesetext') => ({ k: 'vorlese', title, ps }),
  dm: (title, list) => ({ k: 'dm', title: title || 'Spielleitung', items: list }),
  loot: (list, title = 'Loot') => ({ k: 'loot', title, items: list }),
  merke: (list, title = 'Merke dir') => ({ k: 'merke', title, items: list }),
  kampf: (title, o) => Object.assign({ k: 'kampf', title }, o),
  table: (kind, head, rows, widths, opt = {}) => ({ k: 'table', kind, head, rows, boldFirst: !!opt.boldFirst }),
  probe: (title, rows) => ({ k: 'probe', title, rows }),
  spacer: () => null,
  items: (l) => l,
};
const SL = { creature: (c) => Object.assign({ k: 'creature' }, c), figure: (f) => Object.assign({ k: 'figure' }, f), statblock: (s) => Object.assign({ k: 'stat' }, s) };
const orig = Module._load;
Module._load = function (req) { if (req === './lib') return L; if (req === './statlib') return SL; if (req === 'docx') return docx; return orig.apply(this, arguments); };
const story = require(WD + '/story.js').filter(Boolean);
const appendix = require(WD + '/appendix.js').filter(Boolean);
Module._load = orig;
module.exports = { story, appendix };
if (require.main === module) {
  const kinds = {}; story.concat(appendix).forEach((n) => { kinds[n.k] = (kinds[n.k] || 0) + 1; });
  console.log(kinds);
  console.log(story.filter((n) => n.k === 'chapter' || n.k === 'scene').map((n) => (n.k === 'chapter' ? '\n# ' + n.kicker + ' · ' + n.title : '  - ' + n.title)).join('\n'));
  console.log(appendix.filter((n) => n.k === 'creature' || n.k === 'figure' || n.k === 'chapter').map((n) => n.k + ': ' + (n.title || n.name)).join('\n'));
}
