// Layout-Helfer für "Die Machtader"
const d = require('docx');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, PageBreak, VerticalAlign,
} = d;

const W = 9638; // Satzspiegel A4 mit 2 cm Rand (DXA)
const SERIF = 'Georgia';
const SANS = 'Calibri';

const C = {
  ink: '2B2B2B',
  red: '7A1F1F',
  brown: '5A3A1A',
  // Boxfarben: [Hintergrund, Akzent]
  vorlese: ['F6EEDC', '8B5A2B'],
  dm: ['E4EEF8', '2F5C8A'],
  kampf: ['F8E2DE', '9B2C24'],
  probe: ['ECE8F5', '5B4A8B'],
  loot: ['E3F1DF', '3D7A33'],
  wahl: ['FCF0CC', 'B7791F'],
  figur: ['F1F1EF', '3E4A59'],
  stat: ['FBF1DE', '8E3B12'],
  schwach: ['FBE1C6', 'B25A12'],
};

// --- Inline-Markup: **fett**, *kursiv* ---
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), ...base, bold: true }));
    else out.push(new TextRun({ text: t.slice(1, -1), ...base, italics: !base.italics }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

const body = { font: SANS, size: 21, color: C.ink };

function P(text, opt = {}) {
  return new Paragraph({
    children: runs(text, { ...body, ...(opt.run || {}) }),
    spacing: { before: 0, after: opt.after ?? 100, line: 276 },
    alignment: opt.align,
    keepNext: opt.keepNext,
    indent: opt.indent,
  });
}

function bullet(text, opt = {}) {
  return new Paragraph({
    children: runs(text, { ...body, ...(opt.run || {}) }),
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 0, after: 60, line: 264 },
  });
}

function numbered(text, ref = 'nums') {
  return new Paragraph({
    children: runs(text, body),
    numbering: { reference: ref, level: 0 },
    spacing: { before: 0, after: 60, line: 264 },
  });
}

// Kapitelüberschrift (neue Seite)
function chapter(kicker, title, sub) {
  const out = [];
  out.push(new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } }));
  out.push(new Paragraph({
    children: [new TextRun({ text: kicker.toUpperCase(), font: SANS, size: 20, bold: true, color: C.wahl[1], characterSpacing: 60 })],
    spacing: { before: 0, after: 40 },
  }));
  out.push(new Paragraph({
    heading: d.HeadingLevel.HEADING_1,
    children: [new TextRun({ text: title, font: SERIF, size: 48, bold: true, color: C.red })],
    spacing: { before: 0, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.wahl[1], space: 6 } },
    keepNext: true,
  }));
  if (sub) out.push(new Paragraph({
    children: [new TextRun({ text: sub, font: SERIF, size: 22, italics: true, color: C.brown })],
    spacing: { before: 80, after: 200 },
  }));
  return out;
}

// Szenenüberschrift
function scene(title) {
  return new Paragraph({
    heading: d.HeadingLevel.HEADING_2,
    children: [new TextRun({ text: title, font: SERIF, size: 30, bold: true, color: C.brown })],
    spacing: { before: 320, after: 120 },
    keepNext: true,
  });
}

function sub(title) {
  return new Paragraph({
    heading: d.HeadingLevel.HEADING_3,
    children: [new TextRun({ text: title, font: SERIF, size: 24, bold: true, color: C.red })],
    spacing: { before: 200, after: 80 },
    keepNext: true,
  });
}

// --- Boxen ---
function label(text, color, icon = '') {
  return new Paragraph({
    children: [new TextRun({ text: (icon ? icon + '  ' : '') + text.toUpperCase(), font: SANS, size: 17, bold: true, color, characterSpacing: 40 })],
    spacing: { before: 0, after: 80 },
    keepNext: true,
  });
}

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

function box(kind, title, children, opt = {}) {
  const [bg, acc] = C[kind];
  const kids = [];
  if (title) kids.push(label(title, acc, opt.icon));
  kids.push(...children);
  // letzten Absatz ohne Nachabstand
  return [
    new Table({
      width: { size: W, type: WidthType.DXA },
      columnWidths: [W],
      borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
      rows: [new TableRow({
        cantSplit: opt.cantSplit !== false,
        children: [new TableCell({
          width: { size: W, type: WidthType.DXA },
          shading: { fill: bg, type: ShadingType.CLEAR, color: 'auto' },
          borders: {
            top: opt.topBar ? { style: BorderStyle.SINGLE, size: 18, color: acc } : NONE,
            bottom: opt.topBar ? { style: BorderStyle.SINGLE, size: 18, color: acc } : NONE,
            right: NONE,
            left: opt.topBar ? NONE : { style: BorderStyle.SINGLE, size: 36, color: acc },
          },
          margins: { top: 140, bottom: 120, left: 220, right: 200 },
          children: kids,
        })],
      })],
    }),
    spacer(120),
  ];
}

function spacer(after = 120) {
  return new Paragraph({ children: [], spacing: { before: 0, after } });
}

// Vorlesetext
function vorlese(paras, title = 'Vorlesetext') {
  const kids = paras.map((t, i) => new Paragraph({
    children: runs(t, { font: SERIF, size: 22, italics: true, color: '3B2A1A' }),
    spacing: { before: 0, after: i === paras.length - 1 ? 0 : 100, line: 288 },
  }));
  return box('vorlese', title, kids, { icon: '❧' });
}

// Spielleitung: items = Strings; "- " am Anfang = Aufzählung
function items(list, base = body) {
  return list.map((t) => (t.startsWith('- ')
    ? new Paragraph({ children: runs(t.slice(2), base), numbering: { reference: 'bullets', level: 0 }, spacing: { before: 0, after: 50, line: 264 } })
    : new Paragraph({ children: runs(t, base), spacing: { before: 0, after: 80, line: 264 } })));
}

function dm(title, list, opt) { return box('dm', title || 'Spielleitung', items(list), { icon: '◆', ...opt }); }
function loot(list, title = 'Loot') { return box('loot', title, items(list), { icon: '✦' }); }
function merke(list, title = 'Merke dir') { return box('wahl', title, items(list), { icon: '!' }); }

// Kampfbox
function kampf(title, { gegner, gelaende, taktik, ende }) {
  const k = [];
  const line = (lab, txt) => new Paragraph({ children: [new TextRun({ text: lab + '  ', font: SANS, size: 21, bold: true, color: C.kampf[1] }), ...runs(txt, body)], spacing: { before: 0, after: 70, line: 264 } });
  k.push(new Paragraph({ children: [new TextRun({ text: title, font: SERIF, size: 24, bold: true, color: C.kampf[1] })], spacing: { before: 0, after: 80 } }));
  if (gegner) k.push(line('Gegner', gegner));
  if (gelaende) k.push(line('Gelände', gelaende));
  if (taktik) k.push(line('Taktik', taktik));
  if (ende) k.push(line('Ende', ende));
  return box('kampf', 'Kampf', k, { icon: '⚔' });
}

// Tabelle mit farbigem Kopf. rows: Arrays von Strings. widths in DXA (Summe = W)
function table(kind, headers, rows, widths, opt = {}) {
  const [bg, acc] = C[kind];
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'D0C8B8' };
  const mk = (txt, i, head, rowIdx) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: { fill: head ? acc : (rowIdx % 2 === 0 ? bg : 'FFFFFF'), type: ShadingType.CLEAR, color: 'auto' },
    borders: { top: border, bottom: border, left: border, right: border },
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: head
        ? [new TextRun({ text: txt, font: SANS, size: 19, bold: true, color: 'FFFFFF' })]
        : runs(txt, { font: SANS, size: 19, color: C.ink, bold: i === 0 && opt.boldFirst }),
      spacing: { before: 0, after: 0, line: 252 },
    })],
  });
  const tr = [];
  if (headers) tr.push(new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => mk(h, i, true)) }));
  rows.forEach((r, ri) => tr.push(new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, i, false, ri)) })));
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: tr }), spacer(140)];
}

// Probenbox: Ergebnis-Tabelle in Lila
function probe(title, rows, widths = [2400, W - 2400]) {
  return [
    label('Probe · ' + title, C.probe[1], '⚄'),
    ...table('probe', ['Ergebnis', 'Was passiert'], rows, widths, { boldFirst: true }),
  ];
}

module.exports = { d, W, SERIF, SANS, C, runs, P, bullet, numbered, chapter, scene, sub, box, vorlese, dm, loot, merke, kampf, table, probe, spacer, items, label, NONE, body };
