/* Import aus D&D Beyond: Charakterbogen-PDF lesen, Held nachbauen, Vorschau, übernehmen.
   Das Test-PDF wird hier erzeugt (erfundener Held) – echte Spielerdaten gehören nicht ins Repo.
   Optional: DDB_DIR=/pfad/zu/pdfs prüft zusätzlich echte Exporte (bleiben lokal).
   Aufruf: node tests/ddbimport.test.js [app.html] */
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs'); const os = require('os'); const zlib = require('zlib');
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));

/* ---------- Mini-PDF-Schreiber: Formular-Widgets ohne AcroForm, wie bei D&D Beyond ---------- */
function pdfStr(v) {
  v = String(v);
  if ([...v].every((c) => c.charCodeAt(0) < 256)) return '(' + [...v].map((c) => { const k = c.charCodeAt(0); if (c === '\\' || c === '(' || c === ')') return '\\' + c; if (c === '\n') return '\\n'; if (k > 126 || k < 32) return '\\' + k.toString(8).padStart(3, '0'); return c; }).join('') + ')';
  let h = 'FEFF'; for (const c of v) { const k = c.charCodeAt(0); h += k.toString(16).padStart(4, '0').toUpperCase(); } return '<' + h + '>';
}
function makePdf(fields, compressed) {
  const names = Object.keys(fields); const first = 4; const objs = [];
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Annots [' + names.map((n, i) => (first + i) + ' 0 R').join(' ') + '] >>');
  const wid = names.map((n) => '<<\n/AP\n<<\n/N 999 0 R\n>>\n/DA(/Helv 8 Tf 0 g)\n/F 4\n/FT/Tx\n/P 3 0 R\n/Rect[0 0 10 10]\n/Subtype/Widget\n/T' + pdfStr(n) + '\n/TU' + pdfStr(n) + '\n/Type/Annot\n' + (fields[n] === true ? '/V/Yes' : '/V' + pdfStr(fields[n])) + '\n>>');
  let out = '%PDF-1.7\n%\xd3\xf4\xcc\xe1\n'; const off = [];
  const add = (num, body) => { off[num] = out.length; out += num + ' 0 obj\n' + body + '\nendobj\n'; };
  objs.forEach((b, i) => add(i + 1, b));
  if (!compressed) wid.forEach((b, i) => add(first + i, b));
  else {
    let head = '', body = ''; wid.forEach((b, i) => { head += (first + i) + ' ' + body.length + ' '; body += b + '\n'; });
    const raw = Buffer.from(head + '\n' + body, 'latin1'); const z = zlib.deflateSync(raw);
    off[first + wid.length] = out.length;
    out += (first + wid.length) + ' 0 obj\n<< /Type /ObjStm /N ' + wid.length + ' /First ' + (head.length + 1) + ' /Filter /FlateDecode /Length ' + z.length + ' >>\nstream\n' + z.toString('latin1') + '\nendstream\nendobj\n';
  }
  const xref = out.length; out += 'xref\n0 ' + (off.length) + '\n0000000000 65535 f \n'; for (let i = 1; i < off.length; i++) out += String(off[i] || 0).padStart(10, '0') + (off[i] ? ' 00000 n \n' : ' 00000 f \n');
  out += 'trailer\n<< /Size ' + off.length + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Buffer.from(out, 'latin1');
}
const FEAT = ['=== WIZARD FEATURES ===', '', '* Spellcasting • PHB-2024 166', '', '* Scholar • PHB-2024 168', '   | Arcana •', '', '* Wizard Subclass • PHB-2024 169', '', '   | Evoker', '', '* Potent Cantrip • PHB-2024 179', '   | 1 Action',
  '=== FIGHTER FEATURES ===', '* Fighting Style • PHB-2024 91', '   | Defense • PHB-2024', 'While you are wearing armor, you gain +1 AC.', '* Second Wind • PHB-2024 91', '   | 2 / Long Rest • 1 Bonus Action',
  '=== ELF SPECIES TRAITS ===', '* Elven Lineage • PHB-2024 190', '   | High Elf Lineage •', '* Elven Lineage Spells • PHB-2024 189', '   | High Elf - Intelligence •', '* Keen Senses • PHB-2024 190',
  '=== FEATS ===', '* Magic Initiate (Wizard) • PHB-2024 201', '   | Intelligence •', '* Sage Ability Score Improvements • PHB-2024 183', '   | Increase two scores (+2 / +1) •', '* Ability Score Improvement • PHB-2024 202', '* Moon Whisper • DDBD', 'You can hear the moon. Once per Long Rest you may ask it one question.'].join(' \n');
const HERO = {
  'CharacterName': 'Mira Funkenhand', 'PLAYER NAME': 'Testspielerin', 'CLASS  LEVEL': 'Wizard 4 / Fighter 1', 'RACE': 'High Elf', 'BACKGROUND': 'Sage', 'ALIGNMENT': 'Chaotic Good',
  'STR': '10', 'DEX': '14', 'CON': '14', 'INT': '18', 'WIS': '13', 'CHA': '8',
  'IntProf': '•', 'WisProf': '•', 'ArcanaProf': 'E', 'HistoryProf': 'P', 'InvestigationProf': 'P', 'PerceptionProf': 'P', 'SurvivalProf': 'P',
  'AC': '13', 'MaxHP': '33', 'CurrentHP': '20', 'TempHP': '4', 'Init': '+2', 'Speed': '30 ft. (Walking)', 'spellSaveDC0': '15', 'spellAtkBonus0': '+7',
  'Wpn Name': 'Dagger', 'Wpn Name 2': 'Fire Bolt', 'Wpn Name 3': 'Unarmed Strike',
  'Eq Name0': 'Dagger', 'Eq Qty0': '1', 'Eq Weight0': '1 lb.', 'Eq Name1': 'Spellbook', 'Eq Qty1': '1', 'Eq Weight1': '3 lb.', 'Eq Name2': 'Potion of Healing', 'Eq Qty2': '2', 'Eq Weight2': '1 lb.',
  'Eq Name3': 'Backpack', 'Eq Qty3': '1', 'Eq Weight3': '5 lb.', 'Eq Name4': 'Seltsamer Stein', 'Eq Qty4': '1', 'Eq Weight4': '--', 'Eq Name5': 'Leather', 'Eq Qty5': '1', 'Eq Weight5': '10 lb.',
  'GP': '12', 'SP': '5', 'PP': '1', 'EXPERIENCE POINTS': '6600',
  'spellName0': 'Fire Bolt', 'spellSource0': 'Wizard', 'spellName1': 'Mage Hand', 'spellSource1': 'Wizard', 'spellName2': 'Prestidigitation', 'spellSource2': 'Wizard', 'spellName3': 'Light', 'spellSource3': 'Wizard',
  'spellName4': 'Ray of Frost', 'spellSource4': 'Magic Initiate (Wizard)', 'spellName5': 'Minor Illusion', 'spellSource5': 'Magic Initiate (Wizard)', 'spellName6': 'Sleep', 'spellSource6': 'Magic Initiate (Wizard)',
  'spellName7': 'Magic Missile', 'spellSource7': 'Wizard', 'spellName8': 'Shield', 'spellSource8': 'Wizard', 'spellName9': "Tasha's Hideous Laughter", 'spellSource9': 'Wizard', 'spellName10': 'Detect Magic [R]', 'spellSource10': 'Wizard',
  'spellName11': "Snilloc's Snowball Swarm", 'spellSource11': 'Wizard', 'spellName12': 'Misty Step', 'spellSource12': 'Wizard',
  'FeaturesTraits1': FEAT.slice(0, 400), 'FeaturesTraits2': FEAT.slice(400),
  'ProficienciesLang': '=== ARMOR === \nLight Armor, Medium Armor, Heavy Armor, Shields \n\n=== TOOLS === \nCalligrapher\'s Supplies \n\n=== LANGUAGES === \nCommon, Elvish, Draconic',
  'PersonalityTraits ': 'Neugierig (sehr) – «immer» mit Notizbuch', 'Ideals': 'Wissen', 'Bonds': 'Grünwald’s Bibliothek', 'Flaws': 'Vergisst zu essen', 'Backstory': 'Zeile eins\nZeile zwei mit \\ Rückstrich',
  'HEIGHT': '1,70 m', 'EYES': 'Grün', 'AlliesOrganizations': '=== Allies === \n\nDie Eule \n\n=== Organizations === \n\nGilde der Funken', 'Defenses': 'Resistances - Cold', 'AdditionalSenses': 'Darkvision 60 ft.', 'Inspiration': true
};

(async () => {
  const b = await chromium.launch(); const errs = []; const out = []; const T = (n, ok, got) => out.push({ n, ok: !!ok, got });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + target); await p.waitForTimeout(700);
  const plain = makePdf(HERO, false), packed = makePdf(HERO, true);

  /* 1. Felder lesen */
  const rd = async (buf) => p.evaluate(async (a) => { try { return await ddbFields(new Uint8Array(a)); } catch (e) { return { __err: e.message }; } }, [...buf]);
  const F1 = await rd(plain), F2 = await rd(packed);
  T('Felder werden ohne AcroForm aus den Widgets gelesen', F1.CharacterName === 'Mira Funkenhand' && F1['CLASS LEVEL'] === 'Wizard 4 / Fighter 1', [F1.CharacterName, F1['CLASS LEVEL']]);
  T('Feldnamen mit Leerzeichen am Ende werden bereinigt', F1.PersonalityTraits === HERO['PersonalityTraits '], F1.PersonalityTraits);
  T('Klammern, Umlaute und Zeilenumbrüche (Escapes) korrekt', F1.Backstory === HERO.Backstory && F1.PersonalityTraits.includes('(sehr)'), F1.Backstory);
  T('UTF-16-Werte (Hex) korrekt', F1.Bonds === 'Grünwald’s Bibliothek', F1.Bonds);
  T('Namenswert (/V/Yes) wird gelesen', F1.Inspiration === 'Yes', F1.Inspiration);
  T('Komprimierte Objektströme liefern dieselben Felder', JSON.stringify(F2) === JSON.stringify(F1), Object.keys(F2).length + ' / ' + Object.keys(F1).length);
  const bad = await rd(Buffer.from('Hallo, ich bin kein PDF'));
  T('Keine PDF-Datei: klare Meldung', bad.__err && /keine PDF/i.test(bad.__err), bad);
  const empty = await rd(makePdf({ Titel: 'Rechnung' }, false));
  T('Fremdes PDF wird nicht als Charakterbogen erkannt', await p.evaluate((F) => !ddbIsSheet(F), empty));

  /* 2. Held nachbauen */
  const R = await p.evaluate((F) => { const r = ddbBuild(F, S.hb); const c = r.c; return { ch: r.ch, rep: r.rep, ac: c.ac, hp: c.hpMax, init: c.init, speed: c.speed, label: c.classLabel, sp: c.sp.name, dc: c.spell.dc, atk: c.spell.atk, saves: Object.fromEntries(AB.map((k) => [k, c.saves[k].val])), skills: Object.fromEntries(ALL_SKILLS.map((s) => [s, c.skills[s].prof])), abil: c.abil, warn: c.warn }; }, F1);
  const ch = R.ch;
  T('Klassen mit Multiclass', R.label === 'Magier 4 / Kämpfer 1', R.label);
  T('Unterklasse Hervorrufung erkannt', ch.sub === 'evoker', ch.sub);
  T('Spezies Elf, Abstammung Hochelf, Zauberattribut INT', ch.species === 'elf' && ch.speciesChoice === 'high' && ch.speciesSpellAbility === 'int', [ch.species, ch.speciesChoice, ch.speciesSpellAbility]);
  T('Hintergrund Weiser', ch.bg === 'sage', ch.bg);
  T('Attribute stimmen exakt mit dem PDF', JSON.stringify(R.abil) === JSON.stringify({ str: 10, dex: 14, con: 14, int: 18, wis: 13, cha: 8 }), R.abil);
  T('Attributserhöhung (Stufe 4) eingeplant, Basiswerte plausibel', ch.asi['4'] && ch.asi['4'].feat === 'asi' && Object.values(ch.base).every((v) => v >= 3 && v <= 20), [ch.asi, ch.base]);
  T('RK, TP, Initiative und Bewegung wie im PDF', R.ac === 13 && R.hp === 33 && R.init === 2 && R.speed === 9, [R.ac, R.hp, R.init, R.speed]);
  T('Rüstung aus der Ausrüstung passend zur RK gewählt', ch.armor === 'leather' && !ch.shield, [ch.armor, ch.shield]);
  T('Kampfstil Verteidigung übernommen', ch.styles.includes('fs-defense'), ch.styles);
  T('Zauber-SG und Zauberangriff wie im PDF', R.dc === 15 && R.atk === 7, [R.dc, R.atk]);
  T('Rettungswürfe INT und WEI geübt', R.saves.int === 4 + 3 && R.saves.wis === 1 + 3, R.saves);
  T('Fertigkeiten wie im PDF, Arkane Kunde mit Expertise', R.skills.arc === 2 && R.skills.his === 1 && R.skills.inv === 1 && R.skills.prc === 1 && R.skills.sur === 1 && R.skills.ste === 0, R.skills);
  T('Fertigkeit ohne Heldenbuch-Quelle landet bei «übernommen»', (ch.freeSkills || []).length + (ch.extraSkills || []).length >= 1, [ch.freeSkills, ch.extraSkills]);
  T('Zaubertricks des Magiers übernommen', ['fire-bolt', 'mage-hand', 'prestidigitation', 'light'].every((x) => ch.cantrips.includes(x)), ch.cantrips);
  T('Zauber über Englischnamen und alte Eigennamen erkannt', ['magic-missile', 'shield', 'hideous-laughter', 'detect-magic', 'misty-step'].every((x) => ch.book.includes(x)), ch.book);
  T('Magie-Eingeweihter: Zauber und Attribut im Talent', ch.mi.bg && ch.mi.bg.ability === 'int' && ch.mi.bg.cantrips.includes('ray-of-frost') && ch.mi.bg.spell === 'sleep', ch.mi);
  T('Unbekannter Zauber wird gemeldet und notiert', R.rep.miss.some((x) => /Snilloc/.test(x)), R.rep.miss);
  T('Unbekanntes Talent steht mit Text in den Notizen', /Moon Whisper: You can hear the moon/.test(ch.notes), ch.notes.slice(-400));
  T('Waffe Dolch, Feuerpfeil nicht als Waffe', ch.weapons.length === 1 && ch.weapons[0].w === 'dagger', ch.weapons);
  T('Magischer Gegenstand erkannt (2 Heiltränke)', ch.items.length === 1 && ch.items[0].id === 'potion-heal' && ch.items[0].qty === 2, ch.items);
  T('Ausrüstung übersetzt, Eigenes bleibt, getragene Rüstung nicht doppelt', ch.inv.some((x) => x.n === 'Rucksack') && ch.inv.some((x) => x.n === 'Seltsamer Stein') && !ch.inv.some((x) => /Leather|Lederrüstung/.test(x.n)), ch.inv.map((x) => x.n));
  T('Münzen übernommen', ch.coins.gm === 12 && ch.coins.sm === 5 && ch.coins.pm === 1, ch.coins);
  T('Aktuelle und temporäre TP übernommen', ch.play.hp === 20 && ch.play.temp === 4, ch.play);
  T('Gesinnung und Sprachen auf Deutsch', ch.alignment === 'Chaotisch gut' && ch.languages === 'Gemeinsprache, Elfisch, Drakonisch', [ch.alignment, ch.languages]);
  T('Persönlichkeit, Verbündete und Geschichte in den Notizen', /Persönlichkeit: Neugierig/.test(ch.notes) && /Verbündete: Die Eule/.test(ch.notes) && /Organisationen: Gilde der Funken/.test(ch.notes) && /Zeile zwei/.test(ch.notes), ch.notes.slice(0, 300));
  T('Aussehen übernommen', /Grösse: 1,70 m/.test(ch.appearance) && /Augen: Grün/.test(ch.appearance), ch.appearance);
  T('Erfahrungspunkte übernommen', ch.xp === 6600, ch.xp);
  T('Gültiger Held nach Heldenbuch-Prüfung', await p.evaluate((c) => validateChar(c).length === 0, ch));

  /* 3. Bedienung: Datei wählen, Vorschau, Held anlegen */
  const tmp = path.join(os.tmpdir(), 'hb-ddb-test.pdf'); fs.writeFileSync(tmp, packed);
  await p.evaluate(() => { S.view = 'heroes'; render(); });
  T('Dateiauswahl nimmt auch PDFs', await p.evaluate(() => /\.pdf/.test($('#importFile').accept)));
  await p.setInputFiles('#importFile', tmp); await p.waitForTimeout(500);
  T('Vorschau zeigt Name, Klasse und Werte', await p.evaluate(() => S.modal === 'ddb' && /Mira Funkenhand/.test($('.ddbdlg').textContent) && /Magier 4 \/ Kämpfer 1/.test($('.ddbdlg').textContent) && /RK 13 · TP 33/.test($('.ddbdlg .ddbnum').textContent)));
  T('Vorschau nennt Nicht-Übernommenes', await p.evaluate(() => /Snilloc/.test($('.ddbdlg').textContent)));
  T('«Held anlegen» bleibt beim Scrollen sichtbar', await p.evaluate(() => { const d = $('.ddbdlg'); d.scrollTop = 0; const r = $('.ddbgo [data-act="ddbTake"]').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0 && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2).closest('[data-act="ddbTake"]'); }));
  T('Vorschau passt aufs Handy', await p.evaluate(() => { const r = $('.ddbdlg').getBoundingClientRect(); return r.left >= 0 && r.right <= 391 && document.documentElement.scrollWidth <= 391; }));
  const before = await p.evaluate(() => Object.keys(S.chars).length);
  await p.click('.ddbdlg [data-act="ddbTake"]'); await p.waitForTimeout(300);
  const after = await p.evaluate(() => { const ch = S.chars[S.cur]; const c = derive(ch, S.hb); return { n: Object.keys(S.chars).length, name: ch.name, ac: c.ac, hp: c.hpMax, modal: S.modal, stored: !!(JSON.parse(localStorage.getItem('heldenbuch') || '{}').chars || {})[ch.id] }; });
  T('«Held anlegen» legt den Helden an und wählt ihn aus', after.n === before + 1 && after.name === 'Mira Funkenhand' && after.ac === 13 && after.hp === 33 && !after.modal, after);
  T('Held ist gespeichert', after.stored, after);
  await p.waitForTimeout(900); await p.reload(); await p.waitForTimeout(700);
  T('Nach Neustart noch da, mit gleichen Werten', await p.evaluate(() => { const ch = Object.values(S.chars).find((x) => x.name === 'Mira Funkenhand'); if (!ch) return false; const c = derive(ch, S.hb); return c.ac === 13 && c.hpMax === 33 && ch.importedFrom === 'D&D Beyond'; }));
  await p.evaluate(() => { S.view = 'heroes'; render(); });
  await p.setInputFiles('#importFile', tmp); await p.waitForTimeout(400); await p.click('.ddbdlg [data-act="closeModal"]');
  T('Abbrechen legt nichts an', await p.evaluate((n) => Object.keys(S.chars).length === n && !S.modal, after.n));
  const junk = path.join(os.tmpdir(), 'hb-ddb-fremd.pdf'); fs.writeFileSync(junk, makePdf({ Titel: 'Rechnung' }, false));
  await p.setInputFiles('#importFile', junk); await p.waitForTimeout(400);
  T('Fremdes PDF: Hinweis statt Dialog', await p.evaluate(() => S.modal !== 'ddb' && /D&D Beyond/.test(document.body.textContent)));
  /* Erschaffen-Schritt zeigt übernommene Übungen und erlaubt das Entfernen */
  await p.evaluate(() => { const ch = S.chars[S.cur]; ch.freeSkills = ['sur']; ch.extraSkills = []; S.view = 'build'; S.step = 3; render(); });
  T('Erschaffen: «Übernommene Übungen» sichtbar', await p.evaluate(() => !!$('#a-free') && /Überlebenskunst/.test($('#a-free').nextElementSibling.nextElementSibling.textContent)));
  await p.evaluate(() => { const el = [...document.querySelectorAll('[data-path="freeSkills"]')][0]; el.click(); });
  T('Antippen entfernt die übernommene Übung', await p.evaluate(() => S.chars[S.cur].freeSkills.length === 0 && !derive(S.chars[S.cur], S.hb).skills.sur.prof));
  fs.unlinkSync(tmp); fs.unlinkSync(junk);

  /* 4. Optional: echte Exporte (nur lokal) */
  const dir = process.env.DDB_DIR;
  if (dir && fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((x) => /\.pdf$/i.test(x))) {
      const r = await p.evaluate(async (a) => { const F = await ddbFields(new Uint8Array(a)); if (!ddbIsSheet(F)) return { err: 'kein Bogen' }; const r = ddbBuild(F, S.hb); if (r.err) return { err: r.err }; const n = (k) => { const m = String(F[k] || '').match(/[-+]?\d+/); return m ? +m[0] : null; }; const sp = String(F.Speed || '').match(/(\d+)\s*ft/); return { name: r.ch.name, ok: r.c.ac === n('AC') && r.c.hpMax === n('MaxHP') && r.c.init === n('Init') && (!sp || r.c.speed === Math.round(+sp[1] / 5 * 15) / 10), got: [r.c.ac, n('AC'), r.c.hpMax, n('MaxHP'), r.c.init, n('Init'), r.c.speed], valid: validateChar(r.ch).length === 0 }; }, [...fs.readFileSync(path.join(dir, f))]);
      T('Echter Export ' + f.slice(0, 18) + '…: Werte wie im PDF', !r.err && r.ok && r.valid, r);
    }
  }
  T('Keine Skriptfehler', errs.length === 0, errs.slice(0, 3));
  await b.close();
  let ok = 0; for (const r of out) { console.log((r.ok ? '✔ ' : '✘ ') + r.n + (r.ok ? '' : ' → ' + JSON.stringify(r.got))); if (r.ok) ok++; }
  console.log('\n' + ok + ' / ' + out.length + ' bestanden'); process.exit(ok === out.length ? 0 : 1);
})();
