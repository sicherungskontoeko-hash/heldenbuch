const fs = require('fs');
const L = require('./lib');
const { d, SERIF, SANS, C } = L;
const { Document, Packer, Paragraph, TextRun, Footer, PageNumber, AlignmentType, LevelFormat, BorderStyle, Tab, TabStopType } = d;

const story = require('./story');
const appendix = require('./appendix');

const bulletLevel = { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 340, hanging: 220 } }, run: { color: C.brown } } };
const numLevel = { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } }, run: { bold: true, color: C.brown } } };

const footer = new Footer({ children: [new Paragraph({
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'C9B48A', space: 4 } },
  tabStops: [{ type: TabStopType.RIGHT, position: 9638 }],
  children: [
    new TextRun({ text: 'Die Machtader', font: SERIF, size: 17, italics: true, color: '8A7A5A' }),
    new TextRun({ children: [new Tab(), PageNumber.CURRENT], font: SANS, size: 17, color: '8A7A5A' }),
  ],
})] });

const doc = new Document({
  creator: 'Manu', title: 'Die Machtader', description: 'D&D 5e Eintagesabenteuer',
  styles: {
    default: { document: { run: { font: SANS, size: 21, color: C.ink } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SERIF, size: 48, bold: true, color: C.red }, paragraph: { spacing: { before: 0, after: 60 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SERIF, size: 30, bold: true, color: C.brown }, paragraph: { spacing: { before: 320, after: 120 }, keepNext: true, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SERIF, size: 24, bold: true, color: C.red }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: 'bullets', levels: [bulletLevel] },
    { reference: 'nums', levels: [numLevel] },
    { reference: 'z1', levels: [numLevel] },
    { reference: 'z2', levels: [numLevel] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, footer: 560 } } },
    footers: { default: footer },
    children: [...story, ...appendix],
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(__dirname + '/Die_Machtader.docx', buf); console.log('ok', buf.length); });
