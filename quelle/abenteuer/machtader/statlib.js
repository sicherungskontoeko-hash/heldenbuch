// Werteblöcke und Figurenkarten
const L = require('./lib');
const { d, W, SERIF, SANS, C, runs, NONE } = L;
const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType } = d;

const sb = { font: SANS, size: 19, color: '2B2B2B' };
const RED = '7A200D';
const INNER = W - 420;

function rule() {
  return new Paragraph({ children: [], spacing: { before: 20, after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.stat[1], space: 1 } } });
}
function kv(pairs) {
  // pairs: [[label, text], ...] -> eine Zeile je Paar
  return pairs.filter((p) => p[1]).map(([k, v]) => new Paragraph({
    children: [new TextRun({ text: k + ' ', font: SANS, size: 19, bold: true, color: RED }), ...runs(v, sb)],
    spacing: { before: 0, after: 30, line: 252 },
  }));
}
function mod(s) { const m = Math.floor((s - 10) / 2); return (m >= 0 ? '+' : '−') + Math.abs(m); }
function abil(a) {
  const labs = ['ST', 'GE', 'KO', 'IN', 'WE', 'CH'];
  const cw = Math.floor(INNER / 6);
  const widths = [cw, cw, cw, cw, cw, INNER - cw * 5];
  const cell = (t, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE },
    margins: { top: 10, bottom: 10, left: 40, right: 40 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: t, font: SANS, size: head ? 18 : 19, bold: head, color: head ? RED : '2B2B2B' })] })],
  });
  return new Table({
    width: { size: INNER, type: WidthType.DXA }, columnWidths: widths,
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
    rows: [
      new TableRow({ children: labs.map((l, i) => cell(l, i, true)) }),
      new TableRow({ children: a.map((s, i) => cell(`${s} (${mod(s)})`, i, false)) }),
    ],
  });
}
function section(t) {
  return new Paragraph({
    children: [new TextRun({ text: t, font: SERIF, size: 23, smallCaps: true, bold: true, color: RED })],
    spacing: { before: 90, after: 50 }, keepNext: true,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RED, space: 1 } },
  });
}
function entry([name, text]) {
  return new Paragraph({
    children: [new TextRun({ text: name + '. ', font: SANS, size: 19, bold: true, italics: true, color: '2B2B2B' }), ...runs(text, sb)],
    spacing: { before: 0, after: 50, line: 247 },
  });
}
function weakBox(list) {
  const [bg, acc] = C.schwach;
  const kids = [new Paragraph({ children: [new TextRun({ text: '▲  SCHWÄCHEN', font: SANS, size: 17, bold: true, color: acc, characterSpacing: 40 })], spacing: { before: 0, after: 60 } })];
  list.forEach((t) => kids.push(new Paragraph({ children: runs(t, sb), numbering: { reference: 'bullets', level: 0 }, spacing: { before: 0, after: 40, line: 252 } })));
  return new Table({
    width: { size: INNER, type: WidthType.DXA }, columnWidths: [INNER],
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: INNER, type: WidthType.DXA },
      shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
      borders: { top: NONE, bottom: NONE, right: NONE, left: { style: BorderStyle.SINGLE, size: 24, color: acc } },
      margins: { top: 100, bottom: 80, left: 160, right: 140 },
      children: kids,
    })] })],
  });
}

// s: {name, type, ac, hp, speed, abil:[6], details:[[k,v]], traits:[[n,t]], actions, bonus, reactions, legendary:{intro,list}, lair:{intro,list}, extra:[{title, list(strings)}], weak:[...] }
function statblock(s) {
  const k = [];
  k.push(new Paragraph({ children: [new TextRun({ text: s.name, font: SERIF, size: 32, bold: true, smallCaps: true, color: RED })], spacing: { before: 0, after: 20 }, keepNext: true }));
  k.push(new Paragraph({ children: [new TextRun({ text: s.type, font: SANS, size: 19, italics: true, color: '2B2B2B' })], spacing: { before: 0, after: 0 } }));
  k.push(rule());
  k.push(...kv([['Rüstungsklasse', s.ac], ['Trefferpunkte', s.hp], ['Bewegungsrate', s.speed]]));
  k.push(rule());
  k.push(abil(s.abil));
  k.push(rule());
  k.push(...kv(s.details));
  k.push(rule());
  (s.traits || []).forEach((t) => k.push(entry(t)));
  if (s.actions) { k.push(section('Aktionen')); s.actions.forEach((t) => k.push(entry(t))); }
  if (s.bonus) { k.push(section('Bonusaktionen')); s.bonus.forEach((t) => k.push(entry(t))); }
  if (s.reactions) { k.push(section('Reaktionen')); s.reactions.forEach((t) => k.push(entry(t))); }
  if (s.legendary) {
    k.push(section('Legendäre Aktionen'));
    k.push(new Paragraph({ children: runs(s.legendary.intro, sb), spacing: { before: 0, after: 60, line: 252 } }));
    s.legendary.list.forEach((t) => k.push(entry(t)));
  }
  if (s.lair) {
    k.push(section(s.lair.title || 'Hortaktionen'));
    k.push(new Paragraph({ children: runs(s.lair.intro, sb), spacing: { before: 0, after: 60, line: 252 } }));
    s.lair.list.forEach((t) => k.push(entry(t)));
  }
  (s.extra || []).forEach((x) => {
    k.push(section(x.title));
    x.list.forEach((t) => k.push(Array.isArray(t) ? entry(t) : new Paragraph({ children: runs(t, sb), numbering: { reference: 'bullets', level: 0 }, spacing: { before: 0, after: 40, line: 252 } })));
  });
  if (s.weak) { k.push(new Paragraph({ children: [], spacing: { before: 60, after: 0 } })); k.push(weakBox(s.weak)); }

  return [
    new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: [W],
      borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
      rows: [new TableRow({ cantSplit: !!s.short, children: [new TableCell({
        width: { size: W, type: WidthType.DXA },
        shading: { fill: C.stat[0], type: ShadingType.CLEAR, color: 'auto' },
        borders: { top: { style: BorderStyle.SINGLE, size: 36, color: C.stat[1] }, bottom: { style: BorderStyle.SINGLE, size: 36, color: C.stat[1] }, left: NONE, right: NONE },
        margins: { top: 120, bottom: 120, left: 220, right: 200 },
        children: k,
      })] })],
    }),
    L.spacer(200),
  ];
}

// Kreatur-Eintrag im Bestiarium: Text + Werteblock
function creature(c) {
  const out = [];
  out.push(new Paragraph({
    heading: d.HeadingLevel.HEADING_2, pageBreakBefore: !c.samePage, keepNext: true,
    children: [new TextRun({ text: c.title || c.stat.name, font: SERIF, size: 34, bold: true, color: C.brown })],
    spacing: { before: c.samePage ? 360 : 0, after: 120 },
  }));
  const lab = (k, v) => L.P(`**${k}.** ${v}`, { keepNext: true });
  if (c.look) out.push(lab('Aussehen', c.look));
  if (c.lore) out.push(lab('Geschichte', c.lore));
  if (c.fight) out.push(lab('Im Kampf', c.fight));
  out.push(new Paragraph({ children: [], keepNext: true, spacing: { before: 0, after: 60 } }));
  out.push(...statblock(c.stat));
  return out;
}

// Figurenkarte
function figure(f) {
  const [bg, acc] = C.figur;
  const head = new Paragraph({ children: [new TextRun({ text: f.name, font: SERIF, size: 30, bold: true, color: 'FFFFFF' })], spacing: { before: 0, after: 10 } });
  const role = new Paragraph({ children: [new TextRun({ text: f.role, font: SANS, size: 19, italics: true, color: 'E8E8E8' })], spacing: { before: 0, after: 0 } });
  const rows = [];
  const cell = (children, fill, margins) => new TableCell({
    width: { size: W, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR, color: 'auto' },
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE },
    margins, children,
  });
  rows.push(new TableRow({ cantSplit: true, children: [cell([head, role], acc, { top: 120, bottom: 120, left: 220, right: 200 })] }));
  const kids = [];
  f.fields.forEach(([k, v]) => kids.push(new Paragraph({
    children: [new TextRun({ text: k + '  ', font: SANS, size: 20, bold: true, color: acc }), ...runs(v, { font: SANS, size: 20, color: '2B2B2B' })],
    spacing: { before: 0, after: 90, line: 264 },
  })));
  if (f.quote) kids.push(new Paragraph({ children: runs(f.quote, { font: SERIF, size: 21, italics: true, color: C.brown }), spacing: { before: 40, after: 0 } }));
  rows.push(new TableRow({ children: [cell(kids, bg, { top: 140, bottom: 140, left: 220, right: 200 })] }));
  return [
    new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE }, rows }),
    L.spacer(200),
  ];
}

module.exports = { statblock, creature, figure };
