/* ==== Heldenbuch-Erweiterung: Gegenstände, Inventar, Begleiter, Bestiarium, Spielleitung, Stufenaufstieg ==== */
const APP_URL = 'https://claude.ai/artifact/TKockfJH2cR2kDJKqb1CCK';
const XP_LV = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const uidX = () => Math.random().toString(36).slice(2, 9);

/* ---------- Magische Gegenstände (SRD 5.2, eigene deutsche Kurzfassung) ----------
   att = Einstimmung nötig · wpn/arm/shd = Bonus auf Waffe/Rüstung/Schild · set = Attribut auf Wert setzen
   ac/save/dc/atk(Zauberangriff)/init/speed wie Hausregeln · drink = Heilung beim Trinken · use = Nutzungen */
const MAGIC_ITEMS = {
 'weapon-1':{ name:'Waffe +1', r:'ungewöhnlich', wpn:1, text:'+1 auf Angriffs- und Schadenswürfe mit dieser Waffe.' },
 'weapon-2':{ name:'Waffe +2', r:'selten', wpn:2, text:'+2 auf Angriffs- und Schadenswürfe mit dieser Waffe.' },
 'weapon-3':{ name:'Waffe +3', r:'sehr selten', wpn:3, text:'+3 auf Angriffs- und Schadenswürfe mit dieser Waffe.' },
 'armor-1':{ name:'Rüstung +1', r:'selten', arm:1, text:'+1 RK, solange du die Rüstung trägst.' },
 'armor-2':{ name:'Rüstung +2', r:'sehr selten', arm:2, text:'+2 RK, solange du die Rüstung trägst.' },
 'armor-3':{ name:'Rüstung +3', r:'legendär', arm:3, text:'+3 RK, solange du die Rüstung trägst.' },
 'shield-1':{ name:'Schild +1', r:'ungewöhnlich', shd:1, text:'+1 RK zusätzlich zum normalen Schildbonus.' },
 'shield-2':{ name:'Schild +2', r:'selten', shd:2, text:'+2 RK zusätzlich zum normalen Schildbonus.' },
 'shield-3':{ name:'Schild +3', r:'sehr selten', shd:3, text:'+3 RK zusätzlich zum normalen Schildbonus.' },
 'ring-protection':{ name:'Ring des Schutzes', r:'selten', att:true, ac:1, save:1, text:'+1 auf RK und Rettungswürfe.' },
 'cloak-protection':{ name:'Umhang des Schutzes', r:'ungewöhnlich', att:true, ac:1, save:1, text:'+1 auf RK und Rettungswürfe.' },
 'bracers-defense':{ name:'Armschienen der Verteidigung', r:'selten', att:true, acBare:2, text:'+2 RK, solange du keine Rüstung trägst und keinen Schild führst.' },
 'stone-luck':{ name:'Glücksstein', r:'ungewöhnlich', att:true, save:1, text:'+1 auf Attributswürfe und Rettungswürfe (Rettungswürfe automatisch eingerechnet).' },
 'amulet-health':{ name:'Amulett der Gesundheit', r:'selten', att:true, set:{ con:19 }, text:'Deine Konstitution beträgt 19, sofern sie nicht schon höher ist.' },
 'gauntlets-ogre':{ name:'Handschuhe der Ogerkraft', r:'ungewöhnlich', att:true, set:{ str:19 }, text:'Deine Stärke beträgt 19, sofern sie nicht schon höher ist.' },
 'headband-intellect':{ name:'Stirnband des Intellekts', r:'ungewöhnlich', att:true, set:{ int:19 }, text:'Deine Intelligenz beträgt 19, sofern sie nicht schon höher ist.' },
 'belt-hill':{ name:'Gürtel der Hügelriesenstärke', r:'selten', att:true, set:{ str:21 }, text:'Deine Stärke beträgt 21, sofern sie nicht schon höher ist.' },
 'belt-frost':{ name:'Gürtel der Frostriesenstärke', r:'sehr selten', att:true, set:{ str:23 }, text:'Deine Stärke beträgt 23, sofern sie nicht schon höher ist.' },
 'belt-fire':{ name:'Gürtel der Feuerriesenstärke', r:'sehr selten', att:true, set:{ str:25 }, text:'Deine Stärke beträgt 25, sofern sie nicht schon höher ist.' },
 'rod-pact-1':{ name:'Stab des Paktbewahrers +1', r:'ungewöhnlich', att:true, atk:1, dc:1, use:{ n:1, reset:'long', name:'Paktplatz zurückholen' }, text:'+1 auf Zauberangriffe und Zauber-SG deiner Hexenmeisterzauber. 1× pro langer Rast: Als Magieaktion erhältst du einen Paktplatz zurück.' },
 'rod-pact-2':{ name:'Stab des Paktbewahrers +2', r:'selten', att:true, atk:2, dc:2, use:{ n:1, reset:'long', name:'Paktplatz zurückholen' }, text:'+2 auf Zauberangriffe und Zauber-SG. 1× pro langer Rast einen Paktplatz zurückholen.' },
 'rod-pact-3':{ name:'Stab des Paktbewahrers +3', r:'sehr selten', att:true, atk:3, dc:3, use:{ n:1, reset:'long', name:'Paktplatz zurückholen' }, text:'+3 auf Zauberangriffe und Zauber-SG. 1× pro langer Rast einen Paktplatz zurückholen.' },
 'wand-war-1':{ name:'Zauberstab des Kriegsmagiers +1', r:'ungewöhnlich', att:true, atk:1, text:'+1 auf Zauberangriffe; deine Zauberangriffe ignorieren halbe Deckung.' },
 'wand-war-2':{ name:'Zauberstab des Kriegsmagiers +2', r:'selten', att:true, atk:2, text:'+2 auf Zauberangriffe; ignoriert halbe Deckung.' },
 'wand-war-3':{ name:'Zauberstab des Kriegsmagiers +3', r:'sehr selten', att:true, atk:3, text:'+3 auf Zauberangriffe; ignoriert halbe Deckung.' },
 'flame-tongue':{ name:'Flammenzunge', r:'selten', att:true, extra:'2W6', extraT:'Feuer', text:'Bonusaktion: Die Klinge entflammt. Solange sie brennt, verursacht ein Treffer zusätzlich 2W6 Feuerschaden, und sie leuchtet hell in 12 m.' },
 'weapon-warning':{ name:'Waffe der Warnung', r:'ungewöhnlich', att:true, text:'Du und Verbündete in 9 m habt Vorteil auf Initiative; du wirst geweckt, wenn Gefahr droht.' },
 'boots-elven':{ name:'Elfenstiefel', r:'ungewöhnlich', text:'Deine Schritte sind lautlos: Vorteil auf Heimlichkeit, wenn du dich leise bewegst.' },
 'cloak-elven':{ name:'Elfenumhang', r:'ungewöhnlich', att:true, text:'Mit aufgesetzter Kapuze: Wahrnehmungswürfe, dich zu sehen, haben Nachteil; du hast Vorteil auf Heimlichkeit.' },
 'boots-speed':{ name:'Stiefel der Schnelligkeit', r:'selten', att:true, use:{ n:1, reset:'long', name:'Stiefel der Schnelligkeit (10 Min.)' }, text:'Bonusaktion: 10 Minuten lang verdoppelt sich deine Bewegungsrate, und Gelegenheitsangriffe gegen dich haben Nachteil.' },
 'boots-striding':{ name:'Stiefel des Schreitens und Springens', r:'ungewöhnlich', att:true, text:'Bewegungsrate mindestens 9 m, unabhängig von Last oder Rüstung; Sprungweite verdreifacht.' },
 'ring-feather':{ name:'Ring des Federfalls', r:'selten', att:true, text:'Fällst du, sinkst du mit 18 m pro Runde und nimmst keinen Fallschaden.' },
 'ring-water':{ name:'Ring des Wasserwandelns', r:'ungewöhnlich', text:'Du kannst auf Flüssigkeiten gehen, als wären sie fester Boden.' },
 'ring-resist':{ name:'Ring der Resistenz', r:'selten', att:true, text:'Resistenz gegen eine Schadensart (beim Fund festgelegt).' },
 'bag-holding':{ name:'Nimmervoller Beutel', r:'ungewöhnlich', kg:2.5, text:'Fasst bis zu 250 kg, wiegt immer 2,5 kg. Inhalt zählt nicht zu deiner Traglast.' },
 'immovable-rod':{ name:'Unbewegliches Zepter', r:'ungewöhnlich', kg:1, text:'Knopfdruck: Das Zepter steht unbeweglich in der Luft und trägt bis zu 4000 kg.' },
 'goggles-night':{ name:'Nachtsichtbrille', r:'ungewöhnlich', text:'Dunkelsicht 18 m.' },
 'pearl-power':{ name:'Perle der Macht', r:'ungewöhnlich', att:true, use:{ n:1, reset:'long', name:'Perle der Macht' }, text:'1× pro langer Rast: Erhalte einen verbrauchten Zauberplatz bis Grad 3 zurück.' },
 'cape-mountebank':{ name:'Umhang des Gauklers', r:'selten', use:{ n:1, reset:'long', name:'Umhang des Gauklers' }, text:'1× pro langer Rast: Dimensionstür wirken.' },
 'potion-heal':{ name:'Trank der Heilung', r:'gewöhnlich', drink:'2W4+2', cons:true, kg:0.5, text:'Bonusaktion: Du erhältst 2W4 + 2 TP zurück.' },
 'potion-heal-g':{ name:'Trank der grösseren Heilung', r:'ungewöhnlich', drink:'4W4+4', cons:true, kg:0.5, text:'Du erhältst 4W4 + 4 TP zurück.' },
 'potion-heal-s':{ name:'Trank der überlegenen Heilung', r:'selten', drink:'8W4+8', cons:true, kg:0.5, text:'Du erhältst 8W4 + 8 TP zurück.' },
 'potion-heal-x':{ name:'Trank der höchsten Heilung', r:'sehr selten', drink:'10W4+20', cons:true, kg:0.5, text:'Du erhältst 10W4 + 20 TP zurück.' },
 'potion-invis':{ name:'Trank der Unsichtbarkeit', r:'sehr selten', cons:true, kg:0.5, text:'1 Stunde unsichtbar; endet, wenn du angreifst, Schaden verursachst oder einen Zauber wirkst.' },
 'potion-fly':{ name:'Trank des Fliegens', r:'sehr selten', cons:true, kg:0.5, text:'1 Stunde Flugbewegung gleich deiner Bewegungsrate.' },
 'potion-giant':{ name:'Trank der Hügelriesenstärke', r:'ungewöhnlich', cons:true, kg:0.5, text:'1 Stunde lang beträgt deine Stärke 21.' },
 'potion-resist':{ name:'Trank der Resistenz', r:'ungewöhnlich', cons:true, kg:0.5, text:'1 Stunde Resistenz gegen eine Schadensart.' },
 'potion-climb':{ name:'Trank des Kletterns', r:'gewöhnlich', cons:true, kg:0.5, text:'1 Stunde Kletterbewegung gleich deiner Bewegungsrate, Vorteil auf Klettern.' },
 'spell-scroll':{ name:'Zauberschriftrolle', r:'variabel', cons:true, text:'Enthält einen Zauber. Wer ihn auf seiner Liste hat, kann ihn ohne Material wirken. Trag den Zauber im Namen ein.' }
};
const GEAR = [['Abenteurerausrüstung (Rucksack, Schlafsack, 10 Rationen …)', 15], ['Seil, 15 m', 2.5], ['Fackel', 0.5], ['Ration (1 Tag)', 1], ['Wasserschlauch', 2.5], ['Pfeile (20)', 0.5], ['Bolzen (20)', 0.75], ['Heiltrank (gewöhnlich)', 0.5], ['Heilerausrüstung', 1.5], ['Diebeswerkzeug', 0.5], ['Kletterhaken', 0.25], ['Laterne', 1], ['Öl (Flasche)', 0.5], ['Kreide', 0], ['Brecheisen', 2.5], ['Zunderbüchse', 0.5], ['Decke', 1.5], ['Zauberkomponentenbeutel', 1], ['Heiliges Symbol', 0.5], ['Arkaner Fokus', 1]];

/* ---------- Gegenstände in die Berechnung einbringen ---------- */
function itemList(ch) { return (ch.items || []).filter((x) => MAGIC_ITEMS[x.id] || x.custom); }
function itemDef(x) { return MAGIC_ITEMS[x.id] || { name: x.name || 'Gegenstand', text: x.text || '', att: !!x.attNeed }; }
function itemActive(x) { const d = itemDef(x); return (x.eq !== false) && (!d.att || x.att) && !d.cons; }
function attuneCount(ch) { return itemList(ch).filter((x) => itemDef(x).att && x.att).length; }
function itemFx(ch) {
  const out = [];
  for (const x of itemList(ch)) {
    if (!itemActive(x)) continue; const d = itemDef(x); const nm = d.name + (x.label ? ' (' + x.label + ')' : '');
    const h = { id: 'it_' + x.uid, kind: 'item', name: nm, text: d.text, ac: d.ac || 0, save: d.save || 0, dc: d.dc || 0, atk: d.atk || 0, init: 0, speed: 0 };
    if (d.arm && ch.armor && ch.armor !== 'none') h.ac += d.arm;
    if (d.shd && ch.shield) h.ac += d.shd;
    if (d.acBare && (!ch.armor || ch.armor === 'none') && !ch.shield) h.ac += d.acBare;
    if (d.use) { h.uses = d.use.n; h.reset = d.use.reset; h.name = d.use.name || nm; }
    out.push(h);
  }
  return out;
}
function itemSet(ch, abil, breakdown) {
  for (const x of itemList(ch)) { if (!itemActive(x)) continue; const d = itemDef(x); if (!d.set) continue; for (const [k, v] of Object.entries(d.set)) if (abil[k] < v) { abil[k] = v; breakdown[k].push(d.name + ' → ' + v); } }
}
function itemWpn(ch, i) { let b = 0; for (const x of itemList(ch)) { const d = itemDef(x); if (d.wpn && +x.w === i && x.eq !== false) b = Math.max(b, d.wpn); } return b; }
function itemWeight(ch) {
  let kg = 0; for (const g of ch.inv || []) kg += (+g.kg || 0) * (+g.qty || 0);
  for (const x of itemList(ch)) kg += (itemDef(x).kg || 0) * (+x.qty || 1);
  const ar = ARMOR[ch.armor]; if (ar && ar.kg) kg += ar.kg; if (ch.shield) kg += 3;
  return Math.round(kg * 10) / 10;
}
function coinsOf(ch) { if (!ch.coins) ch.coins = { pm: 0, gm: +ch.gold || 0, em: 0, sm: 0, km: 0 }; return ch.coins; }
const COIN = [['pm', 'PM', 10], ['gm', 'GM', 1], ['em', 'EM', 0.5], ['sm', 'SM', 0.1], ['km', 'KM', 0.01]];

/* ---------- Ausrüstungsblock (Bogen + Erschaffen) ---------- */
function gearBlock(c, inBuilder) {
  const ch = c.char; const P = ch.play; const co = coinsOf(ch);
  const kg = itemWeight(ch); const over = kg > c.carry; const att = attuneCount(ch);
  const am = c.attuneMax || 3; let h = '<div id="a-items"></div><h2>Magische Gegenstände <small>Einstimmung ' + att + ' / ' + am + '</small></h2>';
  if (att > am) h += '<p class="cstat bad">Du bist auf mehr als ' + am + ' Gegenstände eingestimmt – nur ' + am + ' wirken. Entferne eine Einstimmung.</p>';
  const its = itemList(ch);
  h += its.length ? '<div class="items">' + its.map((x) => {
    const d = itemDef(x); const active = itemActive(x);
    let ctl = '';
    if (d.att) ctl += chip(x.att, x.att ? 'Eingestimmt' : 'Einstimmen', 'data-act="itAtt" data-arg="' + x.uid + '" title="Kurze Rast nötig; höchstens 3 Gegenstände"');
    if (d.wpn) ctl += '<select data-xact="itW" data-uid="' + x.uid + '" aria-label="Welche Waffe"><option value="">— Waffe wählen —</option>' + ch.weapons.map((w, i) => WEAPONS[w.w] ? '<option value="' + i + '"' + (+x.w === i && x.w !== '' && x.w != null ? ' selected' : '') + '>' + WEAPONS[w.w][0] + '</option>' : '').join('') + '</select>';
    if (d.drink) ctl += '<button class="btn sm heal" data-act="itDrink" data-arg="' + x.uid + '">Trinken (' + d.drink.replace('W', 'W') + ')</button>';
    else if (d.cons) ctl += '<button class="btn sm ghost" data-act="itUse" data-arg="' + x.uid + '">Verbrauchen</button>';
    if (d.extra && active) ctl += '<button class="btn sm ghost" data-act="dmg" data-expr="' + d.extra + '" data-label="' + esc(d.name) + ': ' + d.extraT + '">+' + d.extra + ' ' + d.extraT + '</button>';
    if (d.cons) ctl += '<div class="stepper sm"><button data-act="itQty" data-arg="' + x.uid + '" data-d="-1" aria-label="weniger">−</button><b>' + (+x.qty || 1) + '</b><button data-act="itQty" data-arg="' + x.uid + '" data-d="1" aria-label="mehr">+</button></div>';
    return '<div class="itm' + (active || d.cons ? '' : ' off') + '"><div><b>' + esc(d.name) + (x.label ? ' <small>' + esc(x.label) + '</small>' : '') + '</b><small>' + esc(d.r || 'eigen') + (d.att ? ' · Einstimmung' : '') + ' · ' + esc(d.text) + (d.wpn && (x.w === '' || x.w == null) ? ' <em>Wähle die Waffe, damit der Bonus wirkt.</em>' : '') + '</small></div><div class="chips">' + ctl + '<button class="x" data-act="itDel" data-arg="' + x.uid + '" aria-label="Entfernen">×</button></div></div>';
  }).join('') + '</div>' : '<p class="empty">Noch keine magischen Gegenstände.</p>';
  h += '<div class="row">' + field('Gegenstand hinzufügen', '<select id="addItem"><option value="">— aus dem SRD wählen —</option>' + Object.entries(MAGIC_ITEMS).map(([k, d]) => '<option value="' + k + '">' + esc(d.name) + ' (' + d.r + ')</option>').join('') + '</select>') + field('Beschriftung (optional)', '<input type="text" id="itemLabel" placeholder="z. B. Langschwert, Feuer, Feenfeuer …">') + '</div>';
  h += '<h2>Münzen <small>Gesamtwert ' + (Math.round(COIN.reduce((s, [k, , v]) => s + (+co[k] || 0) * v, 0) * 100) / 100).toString().replace('.', ',') + ' GM</small></h2><div class="row coins">' + COIN.map(([k, l]) => field(l, num('coins.' + k, co[k] || 0, 'min="0"'))).join('') + '</div>';
  h += '<h2>Ausrüstung <small class="' + (over ? 'badtxt' : '') + '">' + String(kg).replace('.', ',') + ' / ' + String(c.carry).replace('.', ',') + ' kg' + (over ? ' – überladen' : '') + '</small></h2>';
  const inv = ch.inv || [];
  h += inv.length ? '<div class="items">' + inv.map((g, i) => '<div class="itm gear"><input type="text" data-bind="inv.' + i + '.n" value="' + esc(g.n) + '" aria-label="Gegenstand"><div class="chips"><div class="stepper sm"><button data-act="invQty" data-arg="' + i + '" data-d="-1" aria-label="einen verbrauchen">−</button><b>' + (+g.qty || 0) + '</b><button data-act="invQty" data-arg="' + i + '" data-d="1" aria-label="einen dazu">+</button></div><label class="kg">' + num('inv.' + i + '.kg', g.kg || 0, 'step="0.1" min="0" aria-label="Gewicht pro Stück in kg"') + '<span>kg</span></label><button class="x" data-act="invDel" data-arg="' + i + '" aria-label="Entfernen">×</button></div></div>').join('') + '</div>' : '<p class="empty">Noch keine Ausrüstung eingetragen. Rüstung und Schild werden automatisch mitgewogen.</p>';
  h += '<div class="row">' + field('Ausrüstung hinzufügen', '<select id="addGear"><option value="">— Vorlage wählen —</option>' + GEAR.map(([n, k], i) => '<option value="' + i + '">' + esc(n) + ' (' + String(k).replace('.', ',') + ' kg)</option>').join('') + '</select>') + '<button class="btn ghost" data-act="invNew">Eigener Eintrag</button></div>';
  h += field('Weitere Notizen zum Inventar', area('inventory', ch.inventory, 'Schätze, Briefe, Hinweise …', 3));
  return h;
}

/* ---------- Begleiter & Reittiere ---------- */
function spellAtkFor(c) { const x = c.spell && c.spell.byId && (c.spell.byId['find-steed'] || c.spell.byId['find-familiar']); return x ? x.atk : (c.spell && c.spell.has ? c.spell.atk : c.pb + Math.max(c.mod.cha, c.mod.wis, c.mod.int)); }
const STEED_KIND = { celestial: ['Himmlisch', 'gleissend', 'Heilende Berührung (1× pro langer Rast): Eine Kreatur in 1,5 m erhält 2W8 + Grad TP zurück.'], fey: ['Feenhaft', 'psychisch', 'Feenschritt (1× pro langer Rast): Das Ross teleportiert sich mit Reiter bis zu 18 m.'], fiend: ['Unhold', 'nekrotisch', 'Unheilvoller Blick (1× pro langer Rast): Eine Kreatur in 18 m macht einen WEI-Rettungswurf oder ist bis zum Ende deines nächsten Zuges verängstigt.'] };
const COMPANIONS = {
 steed:{ name:'Jenseitiges Ross', from:'Ross finden', stat:(c, x) => { const g = Math.max(2, +x.lvl || 2); const k = STEED_KIND[x.kind || 'celestial']; return { size:'gross, ' + k[0], ac:10 + g, hpMax:5 + 10 * g, speed:'18 m' + (g >= 4 ? ', Fliegen 18 m' : ''), ab:{ str:18, dex:12, con:14, int:6, wis:12, cha:8 }, atks:[['Jenseitiger Schlag', spellAtkFor(c), '1W8+' + g, k[1]]], traits:[['Lebensband', 'Erhältst du durch einen Zauber Grad 1+ TP zurück, erhält das Ross genauso viele zurück.'], ['Telepathie', 'Ihr versteht euch telepathisch auf 1,5 km.'], [k[0], k[2]]] }; } },
 'f-owl':{ name:'Eule', from:'Vertrauter', stat:() => ({ size:'winzig', ac:11, hpMax:1, speed:'1,5 m, Fliegen 18 m', ab:{ str:3, dex:13, con:8, int:2, wis:12, cha:7 }, atks:[['Krallen', 3, '1', 'Hieb']], traits:[['Vorbeifliegen', 'Löst keine Gelegenheitsangriffe aus, wenn es aus der Reichweite fliegt.'], ['Scharfe Sinne', 'Dunkelsicht 36 m, Vorteil auf Wahrnehmung über Gehör und Sicht.']] }) },
 'f-cat':{ name:'Katze', from:'Vertrauter', stat:() => ({ size:'winzig', ac:12, hpMax:2, speed:'12 m, Klettern 12 m', ab:{ str:3, dex:15, con:10, int:3, wis:12, cha:7 }, atks:[['Kratzen', 4, '1', 'Hieb']], traits:[['Sprung', 'Springt aus dem Stand bis zu 3 m weit.'], ['Scharfer Geruchssinn', 'Vorteil auf Wahrnehmung über Geruch.']] }) },
 'f-raven':{ name:'Rabe', from:'Vertrauter', stat:() => ({ size:'winzig', ac:12, hpMax:2, speed:'3 m, Fliegen 15 m', ab:{ str:2, dex:14, con:8, int:2, wis:12, cha:6 }, atks:[['Schnabel', 4, '1', 'Stich']], traits:[['Nachahmen', 'Ahmt Stimmen und Geräusche nach (Motiv erkennen gegen SG 10 durchschaut es).']] }) },
 'f-rat':{ name:'Ratte', from:'Vertrauter', stat:() => ({ size:'winzig', ac:10, hpMax:1, speed:'6 m, Klettern 6 m', ab:{ str:2, dex:11, con:9, int:2, wis:10, cha:4 }, atks:[['Biss', 2, '1', 'Stich']], traits:[['Dunkelsicht', '9 m. Vorteil auf Wahrnehmung über Geruch.']] }) },
 'f-bat':{ name:'Fledermaus', from:'Vertrauter', stat:() => ({ size:'winzig', ac:12, hpMax:1, speed:'1,5 m, Fliegen 9 m', ab:{ str:2, dex:15, con:8, int:2, wis:12, cha:4 }, atks:[['Biss', 4, '1', 'Stich']], traits:[['Blindsicht', '18 m, solange sie hören kann.']] }) },
 'f-spider':{ name:'Spinne', from:'Vertrauter', stat:() => ({ size:'winzig', ac:12, hpMax:1, speed:'6 m, Klettern 6 m', ab:{ str:2, dex:14, con:8, int:1, wis:10, cha:2 }, atks:[['Biss', 4, '1+1W4', 'Stich + Gift']], traits:[['Spinnenklettern', 'Klettert an Wänden und Decken.'], ['Netzsinn', 'Kennt die Position jeder Kreatur, die ihr Netz berührt.']] }) },
 'f-hawk':{ name:'Falke', from:'Vertrauter', stat:() => ({ size:'winzig', ac:13, hpMax:1, speed:'3 m, Fliegen 18 m', ab:{ str:5, dex:16, con:8, int:2, wis:14, cha:6 }, atks:[['Krallen', 5, '1', 'Hieb']], traits:[['Scharfe Sicht', 'Vorteil auf Wahrnehmung über Sicht.']] }) },
 'f-frog':{ name:'Frosch', from:'Vertrauter', stat:() => ({ size:'winzig', ac:11, hpMax:1, speed:'6 m, Schwimmen 6 m', ab:{ str:1, dex:13, con:8, int:1, wis:8, cha:3 }, atks:[], traits:[['Amphibisch', 'Atmet Luft und Wasser.'], ['Sprung', 'Springt 3 m weit, 1,5 m hoch.']] }) },
 'f-imp':{ name:'Imp', from:'Paktvertrauter', stat:() => ({ size:'winzig, Unhold', ac:13, hpMax:21, speed:'6 m, Fliegen 12 m', ab:{ str:6, dex:17, con:13, int:11, wis:12, cha:14 }, atks:[['Stachel', 5, '1W6+3+2W6', 'Stich + Gift']], traits:[['Gestaltwandel', 'Ratte, Rabe oder Spinne.'], ['Unsichtbarkeit', 'Magieaktion: unsichtbar, bis es angreift.'], ['Teufelssicht', 'Magische Dunkelheit behindert seine Dunkelsicht nicht.']] }) },
 'm-horse':{ name:'Reitpferd', from:'Reittier', stat:() => ({ size:'gross', ac:11, hpMax:13, speed:'18 m', ab:{ str:16, dex:13, con:12, int:2, wis:11, cha:7 }, atks:[['Hufe', 5, '1W8+3', 'Wucht']], traits:[] }) },
 'm-warhorse':{ name:'Schlachtross', from:'Reittier', stat:() => ({ size:'gross', ac:11, hpMax:19, speed:'18 m', ab:{ str:18, dex:12, con:13, int:2, wis:12, cha:7 }, atks:[['Hufe', 6, '2W4+4', 'Wucht']], traits:[['Niedertrampeln', 'Bewegt es sich mindestens 6 m gerade auf ein Ziel zu und trifft, macht das Ziel einen STÄ-Rettungswurf (SG 14) oder liegt.']] }) },
 'm-pony':{ name:'Pony', from:'Reittier', stat:() => ({ size:'mittelgross', ac:10, hpMax:11, speed:'12 m', ab:{ str:15, dex:10, con:13, int:2, wis:11, cha:6 }, atks:[['Hufe', 4, '1W4+2', 'Wucht']], traits:[] }) },
 'm-mule':{ name:'Maultier', from:'Reittier', stat:() => ({ size:'mittelgross', ac:10, hpMax:11, speed:'12 m', ab:{ str:14, dex:10, con:13, int:2, wis:10, cha:5 }, atks:[['Hufe', 4, '1W4+2', 'Wucht']], traits:[['Lasttier', 'Gilt beim Tragen als gross.'], ['Trittsicher', 'Vorteil gegen Umwerfen.']] }) },
 'm-mastiff':{ name:'Mastiff', from:'Tier', stat:() => ({ size:'mittelgross', ac:12, hpMax:5, speed:'12 m', ab:{ str:13, dex:14, con:12, int:3, wis:12, cha:7 }, atks:[['Biss', 3, '1W6+1', 'Stich']], traits:[['Umwerfen', 'Trifft der Biss ein höchstens grosses Ziel, liegt es.']] }) },
 'w-wolf':{ name:'Wildgefährte: Wolf', from:'✦ Wildbund-Hüter', stat:(c) => wildStat(c, 'mittelgross, Tier', '12 m', { str:12, dex:15, con:12, int:3, wis:12, cha:6 }, 'Biss', 'Stich', [['Rudeltaktik', 'Vorteil auf Angriffe, wenn ein Verbündeter in 1,5 m vom Ziel steht.']]) },
 'w-hawk':{ name:'Wildgefährte: Falke', from:'✦ Wildbund-Hüter', stat:(c) => wildStat(c, 'klein, Tier', '3 m, Fliegen 18 m', { str:6, dex:17, con:10, int:3, wis:14, cha:6 }, 'Krallen', 'Hieb', [['Vorbeifliegen', 'Löst keine Gelegenheitsangriffe aus, wenn es aus der Reichweite fliegt.']]) },
 'w-bear':{ name:'Wildgefährte: Bär', from:'✦ Wildbund-Hüter', stat:(c) => wildStat(c, 'gross, Tier', '12 m, Klettern 9 m', { str:17, dex:10, con:15, int:3, wis:12, cha:6 }, 'Pranke', 'Hieb', [['Bärenkraft', 'Vorteil auf Stärkewürfe und STÄ-Rettungswürfe.']]) },
 custom:{ name:'Eigener Begleiter', from:'eigen', stat:(c, x) => ({ size:x.size || '', ac:+x.ac || 10, hpMax:+x.hpMax || 10, speed:x.speed || '9 m', ab:null, atks:x.atkN ? [[x.atkN, +x.atkB || 0, x.atkD || '1W6', x.atkT || '']] : [], traits:x.notes ? [['Notizen', x.notes]] : [] }) }
};
function wildStat(c, size, speed, ab, an, at, tr) { const L = Math.max(3, c.lv('ran')); return { size, ac: 12 + c.pb, hpMax: 8 + 4 * L, speed, ab, atks: [[an, spellAtkFor(c), '1W6+' + c.pb, at]], traits: tr.concat([['Wildbund', 'Handelt in deinem Zug; ohne Befehl weicht es aus. Ab Stufe 7 addiert es deinen ÜB auf Rettungswürfe.']]) }; }
function compStat(c, x) { const T = COMPANIONS[x.t] || COMPANIONS.custom; return Object.assign({ name: x.name || T.name, type: T.name, from: T.from }, T.stat(c, x)); }
function compBlock(c) {
  const ch = c.char; const list = ch.comps || [];
  let h = '<section class="blk" id="compBlk" data-grp="begleiter"><h2>Begleiter & Reittiere</h2>';
  h += list.length ? list.map((x, i) => {
    const s = compStat(c, x); if (x.hp == null || x.hp > s.hpMax) x.hp = s.hpMax; const pct = Math.max(0, Math.min(100, (x.hp / s.hpMax) * 100));
    let b = '<div class="comp' + (x.hp <= 0 ? ' down' : '') + '"><div class="chd"><div><b>' + esc(s.name) + '</b><small>' + esc(s.type) + ' · ' + esc(s.from) + (s.size ? ' · ' + esc(s.size) : '') + '</small></div><button class="x" data-act="compDel" data-arg="' + i + '" aria-label="Begleiter entfernen">×</button></div>';
    b += '<div class="cvit"><span><small>RK</small><b>' + s.ac + '</b></span><span class="chp"><small>TP</small><b>' + x.hp + ' / ' + s.hpMax + '</b><i class="hpbar"><i style="width:' + pct + '%"></i></i></span><span><small>Bewegung</small><b>' + esc(s.speed) + '</b></span></div>';
    b += '<div class="hpctl"><input type="number" id="cHp' + i + '" min="0" placeholder="Wert" aria-label="Betrag"><button class="btn sm dmg" data-act="compHp" data-arg="' + i + '" data-d="dmg">Schaden</button><button class="btn sm heal" data-act="compHp" data-arg="' + i + '" data-d="heal">Heilen</button>' + (S.camp && S.combat && S.combat.active ? '<button class="btn sm ghost" data-act="compInit" data-arg="' + i + '">In die Initiative</button>' : '') + '</div>';
    if (s.ab) b += '<div class="cab">' + AB.map((a) => '<button data-act="xroll" data-mod="' + mod(s.ab[a]) + '" data-label="' + esc(s.name) + ': ' + AB_DE[a] + '"><small>' + AB_K[a] + '</small>' + s.ab[a] + ' (' + sgn(mod(s.ab[a])) + ')</button>').join('') + '</div>';
    if (s.atks.length) b += '<div class="atks">' + s.atks.map(([n, bo, d, ty]) => '<div class="atk"><div class="an"><b>' + esc(n) + '</b><small>' + esc(ty) + '</small></div><button class="rb" data-act="xroll" data-atk="1" data-mod="' + bo + '" data-label="' + esc(s.name) + ': ' + esc(n) + '">' + sgn(bo) + '</button><button class="rb dmgb" data-act="dmg" data-expr="' + esc(d) + '" data-label="' + esc(s.name) + ': ' + esc(n) + ' Schaden">' + esc(d) + '</button></div>').join('') + '</div>';
    if (s.traits.length) b += '<div class="feats">' + s.traits.map(([n, t]) => '<details><summary><b>' + esc(n) + '</b></summary><p>' + esc(t) + '</p></details>').join('') + '</div>';
    if (x.t === 'steed') b += '<div class="row">' + field('Art', sel('comps.' + i + '.kind', x.kind || 'celestial', Object.entries(STEED_KIND).map(([k, v]) => [k, v[0]]))) + field('Zaubergrad', sel('comps.' + i + '.lvl', x.lvl || 2, [2, 3, 4, 5, 6, 7, 8, 9].map((g) => [g, 'Grad ' + g]))) + field('Name', txt('comps.' + i + '.name', x.name || '', 'z. B. Sturmfeder')) + '</div>';
    else if (x.t === 'custom') b += '<details class="cedit"><summary>Werte bearbeiten</summary><div class="row">' + field('Name', txt('comps.' + i + '.name', x.name || '')) + field('Grösse/Art', txt('comps.' + i + '.size', x.size || '', 'z. B. gross, Konstrukt')) + field('RK', num('comps.' + i + '.ac', x.ac || 10)) + field('TP-Maximum', num('comps.' + i + '.hpMax', x.hpMax || 10)) + field('Bewegung', txt('comps.' + i + '.speed', x.speed || '9 m')) + '</div><div class="row">' + field('Angriff', txt('comps.' + i + '.atkN', x.atkN || '', 'z. B. Ätherstoss')) + field('Bonus', num('comps.' + i + '.atkB', x.atkB || 0)) + field('Schaden', txt('comps.' + i + '.atkD', x.atkD || '', '1W8+3')) + field('Schadensart', txt('comps.' + i + '.atkT', x.atkT || '', 'Blitz')) + '</div>' + field('Merkmale', area('comps.' + i + '.notes', x.notes || '', 'Besondere Fähigkeiten …', 3)) + '</details>';
    else b += '<div class="row">' + field('Name', txt('comps.' + i + '.name', x.name || '', s.type)) + '</div>';
    return b + '</div>';
  }).join('') : '<p class="empty">Kein Begleiter. Füge dein Reittier, einen Vertrauten oder eine eigene Kreatur (z. B. eine Äthermaschine) hinzu.</p>';
  h += '<div class="row">' + field('Begleiter hinzufügen', '<select id="addComp"><option value="">— wählen —</option>' + Object.entries(COMPANIONS).map(([k, T]) => '<option value="' + k + '">' + esc(T.name) + ' (' + esc(T.from) + ')</option>').join('') + '</select>') + '</div>';
  return h + '</section>';
}
function rawD20(mod, label, isAtk) {
  const r1 = 1 + Math.floor(rnd() * 20), r2 = 1 + Math.floor(rnd() * 20); const m = S.mode;
  const use = m === 'adv' ? Math.max(r1, r2) : m === 'dis' ? Math.min(r1, r2) : r1;
  pushLog({ label, total: use + mod, detail: (m === 'normal' ? 'W20 ' + use : (m === 'adv' ? 'Vorteil ' : 'Nachteil ') + r1 + '/' + r2) + ' ' + sgn(mod), crit: isAtk && use === 20, fumble: use === 1, sides: 20, nat: use, pair: m !== 'normal' ? [r1, r2] : null, keep: use === r1 ? 0 : 1, adv: m === 'adv' });
  return use + mod;
}

/* ---------- Bestiarium (SRD 5.2, Werte gerundet; eigene deutsche Fassung) ----------
   [Name, HG, RK, TP, TP-Würfel, Bewegung, Initiative, Angriffe [Name, Bonus, Schaden, Art], Merkmale] */
const BESTIARY = {
 bandit:['Bandit','1/8',12,11,'2W8+2','9 m',1,[['Krummsäbel',3,'1W6+1','Hieb'],['Leichte Armbrust',3,'1W8+1','Stich']],''],
 'bandit-captain':['Banditenhauptmann','2',15,52,'8W8+16','9 m',3,[['Krummsäbel',5,'1W6+3','Hieb'],['Dolch',5,'1W4+3','Stich']],'Mehrfachangriff: zwei Angriffe. Parade (Reaktion): +2 RK gegen einen Nahkampfangriff.'],
 cultist:['Kultist','1/8',12,9,'2W8','9 m',1,[['Ritualsichel',3,'1W4+1','Hieb']],'Vorteil auf Rettungswürfe gegen bezaubert und verängstigt.'],
 'cult-fanatic':['Kultfanatiker','2',13,44,'8W8+8','9 m',2,[['Dolch',4,'1W4+2','Stich']],'Mehrfachangriff: zwei Dolche. Zauber (SG 11): Befehl, Person festhalten, Spirituelle Waffe.'],
 guard:['Wache','1/8',16,11,'2W8+2','9 m',1,[['Speer',3,'1W6+1','Stich']],''],
 thug:['Schläger','1/2',11,32,'5W8+10','9 m',0,[['Streitkolben',4,'1W6+2','Wucht'],['Schwere Armbrust',2,'1W10','Stich']],'Mehrfachangriff: zwei Nahkampfangriffe. Rudeltaktik.'],
 veteran:['Krieger-Veteran','3',17,65,'10W8+20','9 m',1,[['Langschwert',5,'1W8+3','Hieb'],['Schwere Armbrust',3,'1W10+1','Stich']],'Mehrfachangriff: zwei Langschwerthiebe.'],
 knight:['Ritter','3',18,52,'8W8+16','9 m',0,[['Grossschwert',5,'2W6+3','Hieb']],'Mehrfachangriff: zwei Angriffe. Mutig: Vorteil gegen verängstigt.'],
 priest:['Priester','2',13,38,'7W8+7','9 m',0,[['Streitkolben',4,'1W6+2','Wucht']],'Zauber (SG 13): Heilendes Wort, Spirituelle Wächter, Lenkendes Geschoss.'],
 mage:['Magier','6',15,81,'18W8','9 m',2,[['Arkaner Stoss',6,'3W8+3','Energie']],'Mehrfachangriff: drei Arkane Stösse. Zauber (SG 14): Feuerball, Kältekegel, Schild, Nebelschritt.'],
 assassin:['Assassine','8',16,97,'15W8+30','9 m',4,[['Kurzschwert',7,'1W6+4+6W6','Stich + Gift'],['Leichte Armbrust',7,'1W8+4+6W6','Stich + Gift']],'Mehrfachangriff: drei Angriffe. Hinterhältig, Ausweichen.'],
 goblin:['Goblin-Krieger','1/4',15,10,'3W6','9 m',2,[['Krummsäbel',4,'1W6+2','Hieb'],['Kurzbogen',4,'1W6+2','Stich']],'Flinke Flucht: Rückzug oder Verstecken als Bonusaktion.'],
 'goblin-boss':['Goblin-Boss','1',17,21,'6W6','9 m',2,[['Krummsäbel',4,'1W6+2','Hieb'],['Kurzbogen',4,'1W6+2','Stich']],'Mehrfachangriff: zwei Angriffe. Flinke Flucht.'],
 hobgoblin:['Hobgoblin-Krieger','1/2',18,11,'2W8+2','9 m',1,[['Langschwert',3,'2W10+1','Hieb'],['Langbogen',3,'1W10+1','Stich']],'Kampfvorteil: +1W6 Schaden, wenn ein Verbündeter neben dem Ziel steht.'],
 kobold:['Kobold-Krieger','1/8',14,7,'3W6-3','9 m',2,[['Dolch',4,'1W4+2','Stich']],'Rudeltaktik. Empfindlich gegen Sonnenlicht.'],
 gnoll:['Gnoll-Krieger','1/2',15,27,'6W8','9 m',1,[['Speer',4,'1W8+2','Stich'],['Langbogen',3,'1W8+1','Stich']],'Toben: Bringt er eine Kreatur auf 0 TP, bewegt er sich halb und greift als Bonusaktion an.'],
 skeleton:['Skelett','1/4',14,13,'2W8+4','9 m',2,[['Kurzschwert',5,'1W6+3','Stich'],['Kurzbogen',5,'1W6+3','Stich']],'Verwundbar gegen Wucht, immun gegen Gift und Erschöpfung.'],
 zombie:['Zombie','1/4',8,15,'2W8+6','6 m',-2,[['Schlag',3,'1W8+1','Wucht']],'Untote Zähigkeit: Fällt auf 0 TP, KON-Rettungswurf (SG 5 + Schaden), bei Erfolg 1 TP (nicht bei gleissendem Schaden oder Krit).'],
 ghoul:['Ghul','1',12,22,'5W8','9 m',2,[['Klauen',4,'2W4+2','Hieb'],['Biss',2,'2W6+2','Stich']],'Klauen: KON-Rettungswurf (SG 10) oder 1 Minute gelähmt (nicht Elfen).'],
 shadow:['Schatten','1/2',12,27,'5W8+5','12 m',2,[['Stärkeentzug',4,'2W6+2','nekrotisch']],'Getroffene verlieren 1W4 Stärke bis zur Rast; bei Stärke 0 tot. Schattenschleicher im Dunkeln.'],
 wight:['Grabunhold','3',14,82,'11W8+33','9 m',2,[['Lebensentzug',4,'1W6+2+1W6','Hieb + nekrotisch'],['Langbogen',4,'1W8+2','Stich']],'Mehrfachangriff: zwei Angriffe. Empfindlich gegen Sonnenlicht.'],
 ghost:['Geist','4',11,45,'10W8','0 m, Fliegen 12 m',1,[['Welkende Berührung',5,'3W8+3','nekrotisch']],'Körperlos, Entsetzlicher Anblick (WEI SG 13), Besessenheit (CHA SG 13).'],
 mummy:['Mumie','3',11,58,'9W8+18','6 m',-1,[['Fauler Hieb',5,'2W6+3+3W6','Wucht + nekrotisch']],'Treffer: Mumienfäule. Furchteinflössender Blick (WEI SG 11).'],
 'vampire-spawn':['Vampirbrut','5',16,90,'12W8+36','9 m',3,[['Klaue',6,'2W4+3','Hieb'],['Biss',6,'1W6+3+3W6','Stich + nekrotisch']],'Regeneration 10 (ausser gleissend/Sonne), Spinnenklettern, Vampirschwächen.'],
 wolf:['Wolf','1/4',12,11,'2W8+2','12 m',2,[['Biss',4,'1W6+2','Stich']],'Rudeltaktik. Treffer wirft höchstens mittelgrosse Ziele um.'],
 'dire-wolf':['Schreckenswolf','1',14,22,'3W10+6','15 m',2,[['Biss',5,'1W10+3','Stich']],'Rudeltaktik. Treffer wirft höchstens grosse Ziele um.'],
 'giant-rat':['Riesenratte','1/8',13,7,'2W6','9 m',3,[['Biss',5,'1W4+3','Stich']],'Rudeltaktik, Dunkelsicht.'],
 boar:['Wildschwein','1/4',11,13,'2W8+4','12 m',0,[['Hauer',3,'1W6+1','Hieb']],'Sturmangriff: +1W6 nach 6 m Anlauf, Ziel liegt (STÄ SG 11).'],
 'brown-bear':['Braunbär','1',11,22,'3W10+6','12 m',1,[['Biss',5,'1W8+3','Stich'],['Klaue',5,'1W4+3','Hieb']],'Mehrfachangriff: Biss und Klaue.'],
 'giant-spider':['Riesenspinne','1',14,26,'4W10+4','9 m, Klettern 9 m',3,[['Biss',5,'1W8+3+2W6','Stich + Gift']],'Netz (Aufladung 5–6): GES SG 13 oder festgesetzt. Spinnenklettern.'],
 owlbear:['Eulenbär','3',13,59,'7W10+21','12 m',1,[['Zerfleischen',7,'2W8+5','Hieb']],'Mehrfachangriff: zwei Zerfleischen.'],
 ogre:['Oger','2',11,68,'8W10+24','12 m',-1,[['Zweihandknüppel',6,'2W8+4','Wucht'],['Wurfspeer',6,'2W6+4','Stich']],''],
 minotaur:['Minotaurus','3',14,85,'10W10+30','12 m',0,[['Zweihandaxt',6,'2W12+4','Hieb'],['Aufspiessen',6,'3W8+4','Stich']],'Sturmangriff mit Aufspiessen nach 3 m: STÄ SG 14 oder liegt.'],
 gargoyle:['Gargyl','2',15,67,'9W8+27','9 m, Fliegen 18 m',0,[['Klaue',4,'1W6+2','Hieb']],'Mehrfachangriff: zwei Klauen. Resistenz gegen nichtmagische Waffen.'],
 werewolf:['Werwolf','3',15,71,'11W8+22','9 m',1,[['Klaue',5,'2W4+3','Hieb'],['Biss',5,'1W8+3','Stich']],'Mehrfachangriff: zwei Angriffe. Biss: Fluch der Lykanthropie (KON SG 12).'],
 troll:['Troll','5',15,94,'9W10+45','9 m',1,[['Zerreissen',7,'2W6+4','Hieb']],'Mehrfachangriff: drei Angriffe. Regeneration 15 (ausser Feuer oder Säure).'],
 'hill-giant':['Hügelriese','5',13,105,'10W12+40','12 m',-1,[['Riesenknüppel',8,'3W8+5','Wucht'],['Felsbrocken',8,'3W10+5','Wucht']],'Mehrfachangriff: zwei Angriffe.'],
 basilisk:['Basilisk','3',15,52,'8W8+16','6 m',-1,[['Biss',5,'2W6+3+2W6','Stich + Gift']],'Versteinernder Blick: KON SG 12, sonst festgesetzt, danach versteinert.'],
 mimic:['Mimik','2',12,58,'9W8+18','4,5 m',1,[['Biss',5,'1W8+3+1W8','Stich + Säure'],['Pseudopodium',5,'1W8+3','Wucht']],'Klebrig: Getroffene sind gepackt (SG 13). Gestaltwandel.'],
 'gelatinous-cube':['Gallertwürfel','2',6,63,'6W10+30','4,5 m',-4,[['Pseudopodium',4,'3W6','Säure']],'Verschlingen: GES SG 12, sonst 3W6 Säure und gefangen. Durchsichtig.'],
 imp:['Imp','1',13,21,'6W4+6','6 m, Fliegen 12 m',3,[['Stachel',5,'1W6+3+2W6','Stich + Gift']],'Unsichtbarkeit, Gestaltwandel, Magieresistenz.'],
 'hell-hound':['Höllenhund','3',15,58,'7W8+21','15 m',1,[['Biss',5,'1W8+3+2W6','Stich + Feuer']],'Feueratem (Aufladung 5–6): 4,5-m-Kegel, GES SG 12, 6W6 Feuer. Rudeltaktik.'],
 'fire-elemental':['Feuerelementar','5',13,93,'11W10+33','15 m',3,[['Berührung',6,'2W6+3','Feuer']],'Mehrfachangriff: zwei Berührungen. Entzündet Getroffene (1W10 pro Zug). Feuergestalt.'],
 'black-wyrmling':['Schwarzer Drachennestling','2',17,33,'6W8+6','9 m, Fliegen 18 m',2,[['Biss',4,'1W10+2+1W4','Stich + Säure']],'Säureatem (Aufladung 5–6): 4,5-m-Linie, GES SG 11, 5W8 Säure.'],
 'red-wyrmling':['Roter Drachennestling','4',17,75,'10W8+30','9 m, Fliegen 18 m',0,[['Biss',6,'1W10+4+1W6','Stich + Feuer']],'Feueratem (Aufladung 5–6): 4,5-m-Kegel, GES SG 13, 7W6 Feuer.'],
 wyvern:['Wyvern','6',14,127,'15W10+45','6 m, Fliegen 24 m',0,[['Biss',7,'2W6+4','Stich'],['Stachel',7,'2W6+4+7W6','Stich + Gift']],'Mehrfachangriff: Biss und Stachel. Gift: KON SG 14, halber Giftschaden bei Erfolg.'],
 commoner:['Gemeiner Bürger','0',10,4,'1W8','9 m',0,[['Knüppel',2,'1W4','Wucht']],''],
 noble:['Adliger','1/8',15,9,'2W8','9 m',1,[['Rapier',3,'1W8+1','Stich']],'Parade (Reaktion): +2 RK gegen einen Nahkampfangriff.'],
 acolyte:['Akolyth','1/4',10,11,'2W8+2','9 m',0,[['Streitkolben',2,'1W6','Wucht']],'Zauber (SG 12): Heilige Flamme, Segnen, Wunden heilen.'],
 scout:['Kundschafter','1/2',13,16,'3W8+3','9 m',2,[['Kurzschwert',4,'1W6+2','Stich'],['Langbogen',4,'1W8+2','Stich']],'Mehrfachangriff: zwei Angriffe. Vorteil auf Wahrnehmung mit Sicht und Gehör.'],
 spy:['Spion','1',12,27,'6W8','9 m',2,[['Kurzschwert',4,'1W6+2','Stich'],['Handarmbrust',4,'1W6+2','Stich']],'Mehrfachangriff: zwei Angriffe. Hinterhältiger Angriff +2W6 (1× pro Zug). Raffinierte Aktion.'],
 berserker:['Berserker','2',13,67,'9W8+27','9 m',1,[['Zweihandaxt',5,'1W12+3','Hieb']],'Tollkühn: Vorteil auf Angriffe, Angriffe gegen ihn haben Vorteil.'],
 druid:['Druide','2',11,44,'8W8+8','9 m',1,[['Kampfstab',4,'1W6+2','Wucht']],'Zauber (SG 12): Verstricken, Donnerwoge, Mondstrahl, Rindenhaut.'],
 gladiator:['Gladiator','5',16,112,'15W8+45','9 m',2,[['Speer',7,'2W6+4','Stich'],['Schildstoss',7,'2W4+4','Wucht']],'Mehrfachangriff: drei Angriffe. Parade (Reaktion): +3 RK. Mutig.'],
 'black-bear':['Schwarzbär','1/2',11,19,'3W8+6','12 m, Klettern 9 m',0,[['Biss',4,'1W6+2','Stich'],['Klaue',4,'1W4+2','Hieb']],'Mehrfachangriff: Biss und Klaue.'],
 crocodile:['Krokodil','1/2',12,13,'2W10+2','6 m, Schwimmen 9 m',0,[['Biss',4,'1W8+2','Stich']],'Treffer: gepackt (SG 12). Hält 15 Minuten die Luft an.'],
 lion:['Löwe','1',12,22,'4W10','15 m',2,[['Biss',5,'1W8+3','Stich'],['Klaue',5,'1W6+3','Hieb']],'Rudeltaktik. Anspringen: nach 6 m Anlauf STÄ SG 13 oder liegend.'],
 'giant-eagle':['Rieseneadler','1',13,26,'4W10+4','3 m, Fliegen 24 m',3,[['Schnabel',5,'1W6+3','Stich'],['Krallen',5,'2W6+3','Hieb']],'Mehrfachangriff. Scharfe Sicht.'],
 'giant-scorpion':['Riesenskorpion','3',15,52,'7W10+14','12 m',1,[['Klaue',4,'1W8+2','Wucht'],['Stachel',4,'1W10+2+4W10','Stich + Gift']],'Mehrfachangriff: zwei Klauen und Stachel. Klaue packt (SG 12). Gift: KON SG 12, halb bei Erfolg.'],
 mammoth:['Mammut','6',13,126,'11W12+55','12 m',-1,[['Stosszähne',10,'4W8+7','Stich'],['Stampfen',10,'4W10+7','Wucht']],'Sturmangriff: nach 6 m Anlauf STÄ SG 18 oder liegend; Stampfen gegen Liegende als Bonusaktion.'],
 'rust-monster':['Rostmonster','1/2',14,27,'5W8+5','12 m',1,[['Biss',3,'1W8+1','Stich']],'Rostfühler: Nichtmagisches Metall, das es berührt, korrodiert (Waffen −1, Rüstung −1 RK).'],
 'ochre-jelly':['Ockergallerte','2',8,52,'6W10+18','3 m, Klettern 3 m',-2,[['Pseudopodium',4,'3W6+2','Säure']],'Teilt sich bei Blitz- oder Hiebschaden. Spinnenklettern.'],
 ankheg:['Ankheg','2',14,45,'6W10+12','9 m, Graben 3 m',0,[['Biss',5,'2W6+3+1W6','Hieb + Säure']],'Biss packt (SG 13). Säurespray (Aufladung 6): 9-m-Linie, GES SG 13, 3W6 Säure.'],
 griffon:['Greif','2',12,59,'7W10+21','9 m, Fliegen 24 m',2,[['Schnabel',6,'1W8+4','Stich'],['Klauen',6,'2W6+4','Hieb']],'Mehrfachangriff: Schnabel und Klauen. Scharfe Sicht.'],
 hippogriff:['Hippogreif','1',11,26,'4W10+4','12 m, Fliegen 18 m',1,[['Schnabel',5,'1W10+3','Stich'],['Klauen',5,'2W6+3','Hieb']],'Mehrfachangriff.'],
 centaur:['Zentaur','2',12,45,'6W10+12','15 m',2,[['Pike',6,'1W10+4','Stich'],['Langbogen',4,'2W6+2','Stich']],'Mehrfachangriff: zwei Angriffe. Sturmangriff +3W6.'],
 satyr:['Satyr','1/2',13,31,'7W8','12 m',3,[['Rammen',3,'2W4+1','Wucht'],['Kurzbogen',5,'1W6+3','Stich']],'Magieresistenz. Panflöte: bezaubernde, verängstigende oder einschläfernde Melodie (WEI SG 13).'],
 dryad:['Dryade','1',11,22,'5W8','9 m',1,[['Ranke',2,'1W6+1','Wucht']],'Baumschritt. Feenbezauberung (WEI SG 14). Spricht mit Pflanzen und Tieren.'],
 harpy:['Harpyie','1',11,38,'7W8+7','6 m, Fliegen 12 m',1,[['Klaue',3,'2W4+1','Hieb']],'Lockender Gesang: WEI SG 11 oder bezaubert und bewegt sich auf die Harpyie zu.'],
 manticore:['Mantikor','3',14,68,'8W10+24','9 m, Fliegen 15 m',3,[['Biss',5,'1W8+3','Stich'],['Klaue',5,'1W6+3','Hieb'],['Schwanzstachel',5,'1W8+3','Stich']],'Mehrfachangriff: drei Angriffe. Stachelsalve (Fernkampf 30/60 m), 24 Stacheln.'],
 hydra:['Hydra','8',15,184,'16W12+80','9 m, Schwimmen 9 m',1,[['Biss',8,'1W10+5','Stich']],'Mehrere Köpfe (5): ein Biss pro Kopf. Abgeschlagene Köpfe wachsen doppelt nach, ausser nach Feuerschaden. Kann die Luft anhalten.'],
 chimera:['Chimäre','6',14,114,'12W10+48','9 m, Fliegen 18 m',0,[['Biss',7,'2W6+4','Stich'],['Hörner',7,'1W12+4','Wucht'],['Klauen',7,'2W6+4','Hieb']],'Mehrfachangriff: drei Angriffe. Feueratem (Aufladung 5–6): 4,5-m-Kegel, GES SG 15, 7W8 Feuer.'],
 medusa:['Medusa','6',15,127,'17W8+51','9 m',2,[['Schlangenhaar',5,'1W4+2+4W6','Stich + Gift'],['Langbogen',5,'1W8+2+2W6','Stich + Gift']],'Mehrfachangriff. Versteinernder Blick: KON SG 14, erst festgesetzt, dann versteinert.'],
 ettin:['Ettin','4',12,85,'10W10+30','12 m',-1,[['Streitaxt',7,'2W8+5','Hieb'],['Morgenstern',7,'2W8+5','Stich']],'Mehrfachangriff: Axt und Morgenstern. Zwei Köpfe: Vorteil auf Wahrnehmung, schwer zu überraschen.'],
 otyugh:['Otyugh','5',14,104,'11W10+44','9 m',0,[['Biss',6,'2W8+3','Stich'],['Tentakel',6,'1W8+3','Wucht']],'Mehrfachangriff: Biss und zwei Tentakel. Biss überträgt Krankheit (KON SG 15). Telepathie.'],
 banshee:['Todesfee','4',12,58,'13W8','0 m, Fliegen 12 m',2,[['Verderbende Berührung',4,'3W6+2','nekrotisch']],'Körperlos. Klagen (1× pro Tag): KON SG 13 oder 0 TP, bei Erfolg 3W6 psychisch.'],
 specter:['Gespenst','1',12,22,'5W8','0 m, Fliegen 15 m',2,[['Lebensentzug',4,'3W6','nekrotisch']],'Körperlos. Getroffene: KON SG 10, sonst sinkt das TP-Maximum.'],
 wraith:['Schreckgespenst','5',13,67,'9W8+27','0 m, Fliegen 18 m',3,[['Lebensentzug',6,'4W8+3','nekrotisch']],'Körperlos. Erschafft aus Getöteten ein Gespenst.'],
 'flesh-golem':['Fleischgolem','5',9,127,'15W8+60','9 m',-1,[['Schlag',7,'2W8+4','Wucht']],'Mehrfachangriff: zwei Schläge. Blitzabsorption, Magieresistenz, Abneigung gegen Feuer.'],
 'green-hag':['Grüne Vettel','3',17,82,'11W8+33','9 m',1,[['Klaue',6,'2W8+4','Hieb']],'Amphibisch. Illusionen, Unsichtbarkeit, ahmt Stimmen nach.'],
 'night-hag':['Nachtvettel','5',17,112,'15W8+45','9 m',2,[['Klaue',7,'2W8+4','Hieb']],'Magieresistenz. Gestaltwandel, Ätherisch, Albtraumheimsuchung.'],
 'will-o-wisp':['Irrlicht','2',19,27,'11W4','0 m, Fliegen 15 m',9,[['Schock',4,'2W8','Blitz']],'Unsichtbar nach Belieben. Verzehrt Leben von Sterbenden.'],
 sahuagin:['Sahuagin','1/2',12,22,'4W8+4','9 m, Schwimmen 12 m',0,[['Biss',3,'1W4+1','Stich'],['Speer',3,'1W6+1','Stich']],'Mehrfachangriff. Blutrausch: Vorteil gegen Verletzte. Hai-Telepathie.'],
 bugbear:['Grottenschrat-Krieger','1',14,33,'6W8+6','9 m',2,[['Packende Hand',4,'2W6+2','Wucht'],['Leichter Hammer',4,'3W4+2','Wucht']],'Hinterhältig: +2W6 gegen Überraschte. Lange Arme (Reichweite 3 m).'],
 'stone-giant':['Steinriese','7',17,126,'11W12+55','12 m',2,[['Keule',9,'3W8+6','Wucht'],['Felsbrocken',9,'4W10+6','Wucht']],'Mehrfachangriff: zwei Angriffe. Felsen fangen (Reaktion).'],
 'frost-giant':['Frostriese','8',15,149,'12W12+72','12 m',-1,[['Zweihandaxt',9,'3W12+6','Hieb'],['Felsbrocken',9,'4W10+6','Wucht']],'Mehrfachangriff: zwei Angriffe. Immun gegen Kälte.'],
 'fire-giant':['Feuerriese','9',18,162,'13W12+78','9 m',-1,[['Zweihandschwert',11,'6W6+7','Hieb'],['Felsbrocken',11,'4W10+7','Wucht']],'Mehrfachangriff: zwei Angriffe. Immun gegen Feuer.'],
 vampire:['Vampir','13',16,144,'17W8+68','12 m, Klettern 12 m',4,[['Waffenloser Schlag',9,'1W8+4','Wucht'],['Biss',9,'1W6+4+3W6','Stich + nekrotisch']],'Legendär. Regeneration 20 (ausser gleissend/Wasser). Bezaubern (WEI SG 17), Gestaltwandel, Vampirschwächen.'],
 'adult-red':['Ausgewachsener roter Drache','17',19,256,'19W12+133','12 m, Fliegen 24 m',0,[['Biss',14,'2W10+8+2W6','Stich + Feuer'],['Klaue',14,'2W6+8','Hieb']],'Mehrfachangriff: Biss und zwei Klauen. Feueratem (Aufladung 5–6): 18-m-Kegel, GES SG 21, 18W6 Feuer. Legendäre Aktionen und Widerstände.'],
 /* ---------- Eigene Kreaturen (✦ Heldenbuch-Erfindungen) ---------- */
 'x-schlund':['✦ Gedächtnisschlund','6',14,135,'18W10+36','6 m, Graben 6 m',0,[['Biss',7,'2W8+4','Stich']],'Ein Kopf pro verschlungenem Opfer (Start: 3 Köpfe, je ein Biss). Lied des Vergessens: Wer es hört, macht täglich einen WEI-Rettungswurf (SG 15), sonst nimmt er den Schlund nicht wahr und vergisst seine Opfer vollständig. Schriftliche Notizen wirken gegen das Vergessen.'],
 'x-aschewurm':['✦ Aschenwurm','2',13,45,'6W10+12','9 m, Graben 6 m',1,[['Biss',5,'2W6+3','Stich']],'Glutbauch: Wer ihn im Nahkampf trifft, erleidet 1W6 Feuerschaden. Aschewolke (Aufladung 5–6): 3-m-Kugel, KON SG 12 oder 1 Runde blind.'],
 'x-nebelspinne':['✦ Nebelweberin','3',14,52,'8W10+8','9 m, Klettern 9 m',3,[['Biss',5,'1W10+3+2W6','Stich + psychisch']],'Nebelnetz (Aufladung 5–6): 6-m-Würfel aus Nebel, darin festgesetzt bei GES SG 13 und stark verdeckt. Sieht durch Nebel.'],
 'x-glockenkraehe':['✦ Glockenkrähenschwarm','1',12,24,'7W8-7','3 m, Fliegen 15 m',2,[['Schnäbel',4,'2W6','Stich']],'Schwarm. Totenläuten: Läutet, wenn in 18 m jemand stirbt – Kreaturen in 9 m: WEI SG 11 oder verängstigt.'],
 'x-moosriese':['✦ Moosriese','5',15,110,'13W10+39','9 m',-1,[['Wurzelfaust',7,'2W10+4','Wucht']],'Mehrfachangriff: zwei Fäuste. Verwurzeln: Kreaturen in 3 m, STÄ SG 15 oder festgesetzt. Regeneration 10 bei Regen oder im Wald (ausser nach Feuer).'],
 'x-spiegelwicht':['✦ Spiegelwicht','2',15,33,'6W8+6','9 m',3,[['Splitterklinge',5,'1W8+3','Hieb']],'Spiegelbild: Nimmt das Aussehen der letzten Kreatur an, die es angesehen hat. Splittern (Reaktion): Halbiert Schaden, danach Splitterregen 2W6 in 1,5 m.'],
 'x-knochenharfner':['✦ Knochenharfner','4',13,75,'10W8+30','9 m',2,[['Saitenhieb',6,'2W8+3','Hieb']],'Untot. Klagelied (Aufladung 5–6): Kreaturen in 9 m, WEI SG 14 oder 3W8 psychisch und kampfunfähig bis zum Ende ihres nächsten Zuges.'],
 'x-sumpflaterne':['✦ Sumpflaterne','1/2',15,18,'4W6+4','0 m, Fliegen 9 m',3,[['Irrlichtfunken',5,'2W6','Blitz']],'Lockruf: Eine Kreatur in 18 m, WEI SG 12 oder sie bewegt sich in ihrem Zug auf die Laterne zu.'],
 'x-eisenmotte':['✦ Eisenmotte','1/4',13,9,'2W6+2','3 m, Fliegen 12 m',2,[['Rostflügel',4,'1W4+2','Hieb']],'Frisst Metall: Ein Treffer gegen nichtmagische Metallrüstung senkt deren RK dauerhaft um 1 (bis zur Reparatur).'],
 'x-schattenhund':['✦ Schattenhund','3',13,52,'8W8+16','15 m',3,[['Biss',5,'2W6+3','Stich + nekrotisch']],'Rudeltaktik. Schattensprung: Teleport 9 m von Schatten zu Schatten als Bonusaktion. Im Licht: Nachteil auf Angriffe.'],
 'x-kristallkrabbe':['✦ Kristallkrabbe','2',17,39,'6W8+12','6 m, Schwimmen 6 m',0,[['Schere',5,'2W6+3','Hieb']],'Treffer packt (SG 13). Prisma: Wird sie von einem Zauber mit Strahl getroffen, lenkt sie ihn auf eine Kreatur in 9 m um (1× pro Runde).'],
 'x-runenwaechter':['✦ Runenwächter','6',18,104,'11W10+44','9 m',-1,[['Steinfaust',8,'2W10+5','Wucht']],'Konstrukt. Mehrfachangriff: zwei Fäuste. Bannrune: Zauber Grad 3 oder niedriger, die ihn als Ziel haben, scheitern bei 1–3 auf W6. Erwacht, wenn jemand die Runen auf seiner Brust berührt.'],
 'x-aderfuerst':['✦ Aderfürst','7',16,127,'15W8+60','9 m, Fliegen 9 m',3,[['Blutklinge',8,'2W8+4+2W6','Hieb + nekrotisch']],'Mehrfachangriff: zwei Blutklingen. Blutband: heilt die Hälfte des nekrotischen Schadens. Roter Nebel (Aufladung 5–6): 6-m-Kugel, KON SG 15, 6W8 nekrotisch.'],
 'young-red':['Junger roter Drache','10',18,178,'17W10+85','12 m, Fliegen 24 m',0,[['Biss',10,'2W10+6+1W6','Stich + Feuer'],['Klaue',10,'2W6+6','Hieb']],'Mehrfachangriff: Biss und zwei Klauen. Feueratem (Aufladung 5–6): 9-m-Kegel, GES SG 17, 16W6 Feuer.']
};
function npcState(x) { if (!x.hpMax) return ''; if (x.hp <= 0) return 'besiegt'; const p = x.hp / x.hpMax; return p >= 1 ? 'unverletzt' : p > 0.5 ? 'leicht verletzt' : p > 0.25 ? 'schwer verletzt' : 'am Ende'; }
function npcBits(x) {
  if (!x.hpMax) return '';
  const dm = isDM() || !S.meta.dm;
  if (!dm) return '<span class="nst">' + npcState(x) + '</span>';
  const M = x.mid && BESTIARY[x.mid];
  return '<span class="nhp' + (x.hp <= 0 ? ' dead' : '') + '">RK ' + x.ac + ' · TP ' + x.hp + '/' + x.hpMax + '</span><span class="nctl"><input type="number" id="nh_' + x.id + '" placeholder="TP" aria-label="Betrag"><button class="btn sm dmg" data-act="npcHp" data-arg="' + x.id + '" data-d="dmg">−</button><button class="btn sm heal" data-act="npcHp" data-arg="' + x.id + '" data-d="heal">+</button>' + (M ? M[7].map((a, j) => '<button class="btn sm ghost" data-act="npcAtk" data-arg="' + x.id + '" data-j="' + j + '" title="' + esc(a[0] + ' ' + sgn(a[1]) + ', ' + a[2] + ' ' + a[3]) + '">' + esc(a[0]) + '</button>').join('') : '') + '</span>';
}
function bestiaryAdder() {
  return '<div class="fgrp"><b>Aus dem Bestiarium</b><div class="chips"><select id="mobSel" aria-label="Monster"><option value="">— Monster wählen —</option>' + Object.entries(BESTIARY).sort((a, b) => a[1][0].localeCompare(b[1][0], 'de')).map(([k, m]) => '<option value="' + k + '">' + esc(m[0]) + ' (HG ' + m[1] + ')</option>').join('') + '</select><input type="number" id="mobN" value="1" min="1" max="12" aria-label="Anzahl"><label class="chk"><input type="checkbox" id="mobRoll"> TP würfeln</label><button class="btn ghost sm" data-act="mobAdd">Hinzufügen</button></div></div>';
}
function bestiaryView() {
  const q = (S.mq || '').toLowerCase();
  const list = Object.entries(BESTIARY).filter(([, m]) => !q || m[0].toLowerCase().includes(q)).sort((a, b) => a[1][0].localeCompare(b[1][0], 'de'));
  return '<div class="hero-intro banner" style="' + bannerStyle('drache') + '"><h1>Bestiarium</h1><p>Kreaturen aus dem SRD 5.2 – tippe Angriff und Schaden an, um zu würfeln. Am Tisch fügt die Spielleitung sie direkt in die Initiative ein.</p><button class="btn" data-act="encOpen">Begegnung planen</button></div><section class="blk"><h2>Bestiarium <small>' + Object.keys(BESTIARY).length + ' Kreaturen aus dem SRD 5.2</small></h2><div class="row"><label class="fld"><span>Suchen</span><input type="text" id="mq" value="' + esc(S.mq || '') + '" placeholder="z. B. Goblin"></label></div><div class="mobs">' + list.map(([k, m]) => '<details class="mob"><summary><b>' + esc(m[0]) + '</b><small>HG ' + m[1] + ' · RK ' + m[2] + ' · TP ' + m[3] + ' (' + m[4] + ') · ' + esc(m[5]) + '</small></summary><div class="atks">' + m[7].map((a) => '<div class="atk"><div class="an"><b>' + esc(a[0]) + '</b><small>' + esc(a[3]) + '</small></div><button class="rb" data-act="xroll" data-atk="1" data-mod="' + a[1] + '" data-label="' + esc(m[0]) + ': ' + esc(a[0]) + '">' + sgn(a[1]) + '</button><button class="rb dmgb" data-act="dmg" data-expr="' + esc(a[2]) + '" data-label="' + esc(m[0]) + ': ' + esc(a[0]) + ' Schaden">' + esc(a[2]) + '</button></div>').join('') + '</div>' + (m[8] ? '<p>' + esc(m[8]) + '</p>' : '') + '</details>').join('') + '</div></section>';
}

/* ---------- Spielleitung: Gruppenrast, Handouts, Beute & EP ---------- */
function dmTools() {
  if (!S.camp) return '';
  const M = S.meta; const ps = Object.entries(S.table);
  let h = '';
  if (isDM()) {
    h += '<section class="blk dmtools"><h2>Spielleitung</h2><div class="dmgrid">';
    h += '<div class="fgrp tdm"><b>Stimmung der Runde</b><p class="hint">Alle am Tisch sehen das Heldenbuch in dieser Stimmung (jeder kann es für sich abschalten).</p>' + themeSwatches(true) + '</div>';
    h += '<div class="fgrp"><b>Rast für die ganze Gruppe</b><p class="hint">Setzt bei allen verbundenen Helden die Rast-Ressourcen zurück.</p><div class="chips"><button class="btn sm ghost" data-act="grpRest" data-arg="short">Kurze Rast</button><button class="btn sm ghost" data-act="grpRest" data-arg="long">Lange Rast</button></div></div>';
    h += '<div class="fgrp"><b>Beute & Erfahrung verteilen</b><div class="row">' + field('An', '<select id="gTo"><option value="all">Alle am Tisch</option>' + ps.filter(([u]) => u !== UID).map(([u, p]) => '<option value="' + u + '">' + esc(p.char) + '</option>').join('') + '</select>') + field('EP (je Held)', '<input type="number" id="gXp" min="0" placeholder="0">') + field('Gold (je Held)', '<input type="number" id="gGm" min="0" placeholder="0">') + '</div><div class="row">' + field('Gegenstand', '<select id="gItem"><option value="">— kein Gegenstand —</option>' + Object.entries(MAGIC_ITEMS).map(([k, d]) => '<option value="' + k + '">' + esc(d.name) + '</option>').join('') + '</select>') + field('Oder freier Eintrag', '<input type="text" id="gText" placeholder="z. B. Karte zur Schwarzen Feste">') + '</div><div class="chips"><button class="btn sm" data-act="gift">Verteilen</button></div></div>';
    h += '<div class="fgrp"><b>Handout teilen</b><div class="row">' + field('Titel', '<input type="text" id="hoT" placeholder="z. B. Brief des Barons">') + '</div>' + field('Text', '<textarea id="hoX" rows="3" placeholder="Was die Gruppe lesen soll …"></textarea>') + '<div class="chips"><button class="btn sm" data-act="hoAdd">Teilen</button></div></div>';
    h += '<div class="fgrp"><b>Deine Notizen <small>nur für dich</small></b>' + '<textarea id="dmNote" rows="5" placeholder="Geheimnisse, Pläne, Werte …">' + esc(dmNoteGet()) + '</textarea></div>';
    h += '</div></section>';
  }
  const ho = (M.handouts || []).slice().reverse();
  if (ho.length) h += '<section class="blk"><h2>Handouts</h2>' + ho.map((x) => '<details class="ho"><summary><b>' + esc(x.title || 'Handout') + '</b><small>' + ago(x.t) + '</small>' + (isDM() ? '<button class="x" data-act="hoDel" data-arg="' + x.id + '" aria-label="Handout löschen">×</button>' : '') + '</summary><p>' + esc(x.text).replace(/\n/g, '<br>') + '</p></details>').join('') + '</section>';
  return h;
}
function dmNoteGet() { try { return localStorage.getItem('heldenbuch_dm_' + S.camp) || ''; } catch (e) { return S.dmNote || ''; } }
function dmNoteSet(v) { S.dmNote = v; try { localStorage.setItem('heldenbuch_dm_' + S.camp, v); } catch (e) {} if (DB && UID) { clearTimeout(timers.dmn); timers.dmn = setTimeout(() => { DB.collection('data/users/' + UID).doc('n_' + S.camp).set({ kind: 'n', json: JSON.stringify({ camp: S.camp, text: v }) }).catch(() => {}); }, 800); } }
function applyMeta() {
  const ch = cur(); if (!ch || !S.camp) return; const P = ch.play; const M = S.meta;
  P.camps = P.camps || {}; if (!P.camps[S.camp]) { P.camps[S.camp] = Date.now(); P.restSeen = M.rest ? M.rest.id : ''; P.gifts = (M.gifts || []).map((g) => g.id); P.hoSeen = (M.handouts || []).length; commit(false); return; }
  let changed = false;
  if (M.rest && M.rest.id !== P.restSeen) { P.restSeen = M.rest.id; if (!P.dead) { if (M.rest.kind === 'short') shortRestOpen(ch); else doRest(ch, M.rest.kind, true); bannerToast(M.rest.kind === 'long' ? 'Lange Rast' : 'Kurze Rast', 'Die Spielleitung hat für alle eine Rast eingelegt.'); } changed = true; }
  P.gifts = P.gifts || [];
  for (const g of M.gifts || []) {
    if (P.gifts.includes(g.id)) continue; P.gifts.push(g.id); changed = true;
    if ((g.to !== 'all' && g.to !== UID) || g.from === UID) continue;
    if (g.t < P.camps[S.camp]) continue;
    const got = [];
    if (+g.xp) { ch.xp = (+ch.xp || 0) + +g.xp; got.push(g.xp + ' EP'); }
    if (+g.gm) { const co = coinsOf(ch); co.gm = (+co.gm || 0) + +g.gm; got.push(g.gm + ' GM'); }
    if (g.item && MAGIC_ITEMS[g.item]) { ch.items = ch.items || []; ch.items.push({ uid: uidX(), id: g.item, att: false, eq: true, qty: 1, w: '' }); got.push(MAGIC_ITEMS[g.item].name); }
    if (g.text) { ch.inv = ch.inv || []; ch.inv.push({ n: g.text, qty: 1, kg: 0 }); got.push(g.text); }
    if (got.length) { bannerToast('Beute erhalten', got.join(', ')); pushLog({ label: 'Von der Spielleitung', total: '✦', detail: got.join(', ') }); }
  }
  const nho = (M.handouts || []).length; if (nho > (P.hoSeen || 0)) { const last = M.handouts[nho - 1]; if (last) bannerToast('Neues Handout', last.title || ''); P.hoSeen = nho; changed = true; }
  if (changed) commit(S.view !== 'camp');
}

/* ---------- Rast (gemeinsam für Knopf und Spielleitung) ---------- */
function doRest(ch, kind, silent, fromDialog) {
  const c = derive(ch, S.hb); const P = ch.play;
  if (P.dead) return;
  if (!fromDialog && typeof restGate === 'function' && !restGate(ch, kind)) return;
  if (kind === 'long') { P.hp = c.hpMax; P.temp = 0; P.hdUsed = 0; P.hdBy = {}; P.relRage = 0; P.stable = false; P.ws = null; P.fxDur = {}; P.fxSrc = {}; P.localFight = false; P.slots = {}; P.pact = 0; P.res = {}; P.ds = [0, 0]; P.exh = Math.max(0, (+P.exh || 0) - 1); P.raging = false; P.conc = null; P.fx = {}; if (ch.species === 'human') P.insp = true; (ch.comps || []).forEach((x) => { x.hp = compStat(c, x).hpMax; }); pushLog({ label: 'Lange Rast', total: '✓', detail: 'TP, Trefferwürfel, Zauberplätze und Ressourcen zurückgesetzt' }); }
  else { P.pact = 0; P.relRage = 0; c.res.forEach((r) => { if (r.reset === 'short') P.res[r.k] = 0; else if (r.note && P.res[r.k]) P.res[r.k] = Math.max(0, P.res[r.k] - 1); }); const tired = c.lv('ran') >= 10 && (+P.exh || 0) > 0; if (tired) P.exh = P.exh - 1; pushLog({ label: 'Kurze Rast', total: '✓', detail: 'Ressourcen der kurzen Rast (und Paktplätze) sind zurück.' + (tired ? ' Unermüdlich: Erschöpfung −1.' : '') }); }
  commit();
}

/* ---------- Erfahrung & Stufenaufstieg ---------- */
function xpLine(c) {
  const ch = c.char; const xp = +ch.xp || 0; const L = c.level; const nx = XP_LV[L] ?? null; const ready = nx != null && xp >= nx;
  return '<div class="xpline" data-grp="kampf faehig"><span>EP <b>' + xp.toLocaleString('de-CH') + '</b>' + (nx != null ? ' / ' + nx.toLocaleString('de-CH') + ' für Stufe ' + (L + 1) : ' · Höchststufe') + '</span><input type="number" id="xpAdd" min="0" placeholder="EP" aria-label="Erfahrungspunkte hinzufügen"><button class="btn sm ghost" data-act="xpAdd">Hinzufügen</button>' + (L < 20 ? '<button class="btn sm' + (ready ? ' glowbtn' : ' ghost') + '" data-act="lvlUp">Stufenaufstieg' + (ready ? ' möglich!' : '') + '</button>' : '') + '</div>';
}
function lvlUpOpen() {
  const ch = cur(); const c = derive(ch, S.hb); if (c.level >= 20) return;
  S.lu = S.lu || { cls: ch.cls, roll: null };
  const opts = [[ch.cls, CLASSES[ch.cls].name + ' ' + (c.lv(ch.cls)) + ' → ' + (c.lv(ch.cls) + 1)]].concat((ch.multi || []).map((m) => [m.cls, CLASSES[m.cls].name + ' ' + m.level + ' → ' + (+m.level + 1)]));
  const id = S.lu.cls; const C = CLASSES[id]; const nl = c.lv(id) + 1; const e = c.classes.find((x) => x.id === id);
  const gain = C.feats.filter((f) => f[0] === nl).map((f) => [f[1], f[2]]);
  if (nl >= 3 && e) e.subFeats.filter((f) => f[0] === nl).forEach((f) => gain.push([f[1] + ' (' + e.subName + ')', f[2]]));
  if ((C.asi || []).includes(nl) && !gain.some((g) => /Attributswert/.test(g[0]))) gain.push(['Attributswerterhöhung oder Talent', 'Erhöhe ein Attribut um 2 oder zwei um 1 – oder wähle ein Talent. Du wählst es nach dem Aufstieg im Erschaffen-Bereich.']);
  if (nl === 19) gain.push(['Epische Gabe', 'Wähle eine Epische Gabe oder eine Attributswerterhöhung.']);
  if (C.options) { const o0 = C.options.n(nl - 1), o1 = C.options.n(nl); if (o1 > o0) gain.push([C.options.label, 'Du lernst ' + (o1 - o0) + ' weitere (jetzt ' + o1 + ').']); }
  if (nl === 3 && C.subs && !e.subChosen) gain.push(['Unterklasse', 'Du wählst nach dem Aufstieg deine Unterklasse.']);
  const avg = C.hd / 2 + 1; const con = c.mod.con;
  const hpTxt = ch.hpMode === 'roll' ? (S.lu.roll ? 'Gewürfelt: ' + S.lu.roll + ' ' + sgn(con) + ' = <b>' + Math.max(1, S.lu.roll + con) + ' TP</b>' : '<button class="btn sm" data-act="luRoll">W' + C.hd + ' würfeln</button>') : 'Durchschnitt ' + avg + ' ' + sgn(con) + ' = <b>' + Math.max(1, avg + con) + ' TP</b>';
  const pbNew = 2 + Math.floor(c.level / 4);
  const m = $('#modal'); S.modal = 'lvl';
  m.innerHTML = '<div class="dlg lvlup" role="dialog" aria-modal="true" aria-labelledby="luT"><h2 id="luT">Stufenaufstieg auf Stufe ' + (c.level + 1) + '</h2>' +
    (opts.length > 1 ? '<div class="chips">' + opts.map(([k, l]) => chip(k === id, l, 'data-act="luCls" data-arg="' + k + '"')).join('') + '</div>' : '') +
    '<p class="hint">Neue Klasse? <button class="link" data-act="luMulti">Multiclassing im Erschaffen-Bereich</button></p>' +
    '<div class="lurow"><span>Trefferpunkte</span><div>' + hpTxt + '</div></div>' +
    (pbNew > c.pb ? '<div class="lurow"><span>Übungsbonus</span><div>' + sgn(c.pb) + ' → <b>' + sgn(pbNew) + '</b></div></div>' : '') +
    '<div class="lurow"><span>Neu</span><div>' + (gain.length ? gain.map(([n, t]) => '<details><summary><b>' + esc(n) + '</b></summary><p>' + esc(t) + '</p></details>').join('') : 'Keine neuen Merkmale auf dieser Stufe – aber mehr TP und ggf. mehr Ressourcen.') + '</div></div>' +
    '<p class="hint">Zauberplätze, Ressourcen und Angriffe werden automatisch neu berechnet. Offene Auswahlen (z. B. Talente, Zauber) zeigt der Bogen danach an.</p>' +
    '<div class="chips"><button class="btn ghost" data-act="closeModal">Abbrechen</button><button class="btn big" data-act="luGo"' + (ch.hpMode === 'roll' && !S.lu.roll ? ' disabled' : '') + '>Aufsteigen</button></div></div>';
  m.hidden = false;
}
function lvlUpGo() {
  const ch = cur(); const before = derive(ch, S.hb); const id = S.lu.cls; const nl = before.lv(id) + 1;
  if (id === ch.cls) { ch.level = nl; if (ch.hpMode === 'roll') ch.hpRolls[nl] = S.lu.roll; }
  else { const mm = ch.multi.find((x) => x.cls === id); if (!mm) return; mm.level = nl; if (ch.hpMode === 'roll') { mm.hpRolls = mm.hpRolls || {}; mm.hpRolls[nl] = S.lu.roll; } }
  const after = derive(ch, S.hb); const P = ch.play; P.hp = Math.min(after.hpMax, (P.hp ?? before.hpMax) + (after.hpMax - before.hpMax));
  S.lu = null; S.modal = null; $('#modal').hidden = true;
  pushLog({ label: 'Stufenaufstieg', total: after.level, detail: CLASSES[id].name + ' ' + nl + ' · TP-Maximum ' + before.hpMax + ' → ' + after.hpMax, share: true });
  bannerToast('Stufe ' + after.level + '!', ch.name + ' ist aufgestiegen.');
  commit();
}

/* ---------- Klassenoptionen einsetzen (Runen, Riten, Flüche, Module) ---------- */
const OPT_RES = { runes: 'rune', rites: 'blood', curses: null, modules: 'cells' };
function optCost(key, text) {
  if (key === 'runes') return /Aktivierung/.test(text) ? 1 : 0;
  const m = /(\d+)\s+(?:Blutladung|Blutladungen|Zelle|Zellen)/.exec(text); return m ? +m[1] : 0;
}
function optDice(key, text, c, lvl) {
  const die = RW_DIE(lvl); const out = []; const abK = { INT: 'int', KON: 'con', CHA: 'cha' };
  let t = text; if (key === 'runes') { const i = t.indexOf('Aktivierung'); if (i < 0) return []; t = t.slice(i); }
  const modOf = (k) => (k ? (c.mod[abK[k]] >= 0 ? '+' : '') + c.mod[abK[k]] : '');
  const kind = (i) => /TP|heil|temporäre/.test(t.slice(i, i + 70)) ? 'TP' : /Schaden|schaden/.test(t.slice(i, i + 70)) ? 'Schaden' : 'Wurf';
  const re = /(\d+)\s+(?:Runen|Blut|Fluch)würfel(?:\s*\+\s*(INT|KON|CHA)-Mod)?|(\d+W\d+)(?:\s*\+\s*(INT|KON|CHA)-Mod)?/g; let m;
  while ((m = re.exec(t))) {
    if (t[m.index - 1] === '+' || /^\s*pro zusätzlich/.test(t.slice(m.index + m[0].length))) continue;
    if (/^\s*(?:von|abzieh)/.test(t.slice(m.index + m[0].length)) ) { out.push({ expr: (m[1] ? m[1] + die : m[3]), what: 'Abzug' }); continue; }
    out.push({ expr: m[1] ? m[1] + die + modOf(m[2]) : m[3] + modOf(m[4]), what: kind(m.index) });
  }
  return out.slice(0, 2);
}
function optBlock(c) {
  const sets = (c.optSets || []).filter((o) => (o.use || o.chosen).length && OPT_RES.hasOwnProperty(o.key));
  if (!sets.length) return '';
  const P = c.char.play;
  return '<section class="blk" id="optBlk" data-grp="faehig kampf"><h2>Klassenoptionen <small>antippen zum Einsetzen – verbraucht Ressourcen und würfelt</small></h2>' + sets.map((o) => {
    const rk = OPT_RES[o.key]; const r = rk && c.res.find((x) => x.k === rk); const left = r ? r.max - (+P.res[rk] || 0) : null;
    return '<h3>' + o.label + (r ? ' <small>' + r.n + ': ' + left + ' / ' + r.max + '</small>' : '') + '</h3><div class="optuse">' + (o.use || o.chosen).map((k) => { const it = o.items.find((x) => x.k === k); const cost = optCost(o.key, it.text); const dice = optDice(o.key, it.text, c, o.lvl);
      return '<div class="ou"><div><b>' + esc(it.name) + '</b><small>' + esc(it.text) + '</small></div><div class="chips">' + (cost || dice.length ? '<button class="btn sm"' + (r && cost > left ? ' disabled' : '') + ' data-act="optUse" data-set="' + o.key + '" data-arg="' + k + '">' + (cost ? 'Einsetzen (' + cost + ')' : 'Würfeln') + '</button>' : '<span class="hint" style="margin:0">dauerhaft aktiv</span>') + '</div></div>'; }).join('') + '</div>';
  }).join('') + '</section>';
}
function optUse(ch, key, k) {
  const c = derive(ch, S.hb); const o = (c.optSets || []).find((x) => x.key === key); if (!o) return; const it = o.items.find((x) => x.k === k); if (!it) return;
  const rk = OPT_RES[key]; const cost = optCost(key, it.text); const P = ch.play;
  if (rk && cost) { const r = c.res.find((x) => x.k === rk); const used = +P.res[rk] || 0; if (!r || used + cost > r.max) { pushLog({ label: it.name, total: '✗', detail: 'Nicht genug ' + (r ? r.n : 'Ressourcen') }); return; } P.res[rk] = used + cost; }
  const dice = optDice(key, it.text, c, o.lvl);
  pushLog({ label: it.name + ' eingesetzt', total: '✦', detail: (cost ? cost + ' ' + (rk === 'rune' ? 'Aktivierung' : rk === 'blood' ? 'Blutladung(en)' : 'Zelle(n)') + ' verbraucht · ' : '') + it.text.replace(/^[^:]+:\s*/, '').slice(0, 140), share: true });
  dice.forEach((d, i) => setTimeout(() => rollDmg(d.expr, it.name + ': ' + d.what), 500 + i * 400));
  commit();
}

/* ---------- WhatsApp-Einladung ---------- */
function inviteText() { if (isApp()) return appInviteText(); return 'Komm an unseren Tisch im Heldenbuch! ⚔\n' + APP_URL + '\nKampagne: ' + (S.camp || 'unsere-kampagne') + '\n(Beim ersten Mal lädt dich die Spielleitung per E-Mail als Bearbeiter ein.)'; }
function inviteHtml() {
  const t = encodeURIComponent(inviteText());
  return '<div class="invite"><a class="btn wa" href="https://wa.me/?text=' + t + '" target="_blank" rel="noopener">Per WhatsApp einladen</a><button class="btn ghost sm" data-act="invCopy">Einladung kopieren</button></div>';
}

/* ---------- Druck ---------- */
function printSheet() { try { S.view = 'sheet'; render(); setTimeout(() => window.print(), 200); } catch (e) { pushLog({ label: 'Drucken', total: '✗', detail: 'Drucken ist in dieser Ansicht nicht möglich. Öffne den Bogen im Browser und drücke Strg+P.' }); } }

/* ---------- Zusatzaktionen ---------- */
const XA = {
  itAtt: (t, a, p, ch) => { const x = itemList(ch).find((i) => i.uid === a); if (!x) return; if (!x.att && attuneCount(ch) >= (derive(ch, S.hb).attuneMax || 3)) { pushLog({ label: 'Einstimmung', total: '✗', detail: 'Du bist schon auf ' + attuneCount(ch) + ' Gegenstände eingestimmt (Maximum).' }); return; } x.att = !x.att; commit(); },
  itDel: (t, a, p, ch) => { ch.items = (ch.items || []).filter((i) => i.uid !== a); commit(); },
  itQty: (t, a, p, ch) => { const x = itemList(ch).find((i) => i.uid === a); if (!x) return; x.qty = Math.max(0, (+x.qty || 1) + +t.dataset.d); if (!x.qty) ch.items = ch.items.filter((i) => i !== x); commit(); },
  itUse: (t, a, p, ch) => { const x = itemList(ch).find((i) => i.uid === a); if (!x) return; pushLog({ label: itemDef(x).name, total: '✦', detail: itemDef(x).text, share: true }); XA.itQty({ dataset: { d: -1 } }, a, p, ch); },
  itDrink: (t, a, p, ch) => { const x = itemList(ch).find((i) => i.uid === a); if (!x) return; const d = itemDef(x); const r = rollExpr(d.drink); const c = derive(ch, S.hb); const P = ch.play; if (P.hp <= 0) { P.ds = [0, 0]; wakeUp(P); } P.hp = Math.min(c.hpMax, P.hp + r.total); pushLog({ label: d.name, total: r.total, detail: r.detail + ' · TP jetzt ' + P.hp + '/' + c.hpMax, groups: r.groups, sides: 4, nat: r.total }); XA.itQty({ dataset: { d: -1 } }, a, p, ch); },
  invQty: (t, a, p, ch) => { const g = ch.inv[+a]; if (!g) return; g.qty = Math.max(0, (+g.qty || 0) + +t.dataset.d); commit(); },
  invDel: (t, a, p, ch) => { ch.inv.splice(+a, 1); commit(); },
  invNew: (t, a, p, ch) => { ch.inv = ch.inv || []; ch.inv.push({ n: 'Neuer Gegenstand', qty: 1, kg: 0 }); commit(); },
  compDel: (t, a, p, ch) => { ch.comps.splice(+a, 1); commit(); },
  compHp: (t, a, p, ch) => { const x = ch.comps[+a]; const n = Math.max(0, +$('#cHp' + a).value || 0); if (!x || !n) return; const s = compStat(derive(ch, S.hb), x); x.hp = t.dataset.d === 'dmg' ? Math.max(0, x.hp - n) : Math.min(s.hpMax, x.hp + n); if (x.hp <= 0) pushLog({ label: s.name, total: '0', detail: x.t === 'steed' ? 'Das Ross verschwindet, bis du Ross finden erneut wirkst.' : 'Bei 0 TP' }); commit(); },
  compInit: (t, a, p, ch) => { const x = ch.comps[+a]; const c = S.combat; if (!x || !c) return; const s = compStat(derive(ch, S.hb), x); const b = s.ab ? mod(s.ab.dex) : 0; const r = 1 + Math.floor(rnd() * 20); saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).concat([{ id: uidX(), name: s.name + ' (' + ch.name.replace(/^Beispiel:\s*/, '') + ')', v: r + b, dex: b, ally: true }]), t: Date.now() })); pushLog({ label: s.name + ': Initiative', total: r + b, detail: 'W20 ' + r + ' ' + sgn(b), sides: 20, nat: r }); },
  xroll: (t) => rawD20(+t.dataset.mod, t.dataset.label, !!t.dataset.atk),
  npcHp: (t, a) => { const c = S.combat; if (!c) return; const n = Math.max(0, +($('#nh_' + a) || {}).value || 0); if (!n) return; const npcs = (c.npcs || []).map((x) => x.id === a ? Object.assign({}, x, { hp: t.dataset.d === 'dmg' ? Math.max(0, x.hp - n) : Math.min(x.hpMax, x.hp + n) }) : x); const x = npcs.find((y) => y.id === a); const dead = x && x.hp <= 0 && (c.npcs.find((y) => y.id === a) || {}).hp > 0; if (dead) pushLog({ label: x.name + ' besiegt', total: '†', detail: 'Auf 0 TP', share: true }); saveCombat(Object.assign({}, c, { npcs, t: Date.now(), log: dead ? clog(c, x.name + ' ist besiegt') : c.log })); },
  npcAtk: (t, a) => { const x = (S.combat.npcs || []).find((y) => y.id === a); const M = x && BESTIARY[x.mid]; if (!M) return; const at = M[7][+t.dataset.j]; const tot = rawD20(at[1], x.name + ': ' + at[0], true); setTimeout(() => rollDmg(at[2], x.name + ': ' + at[0] + ' (' + at[3] + ')'), 700); return tot; },
  mobAdd: () => { const id = $('#mobSel').value; const M = BESTIARY[id]; const c = S.combat; if (!M || !c) return; const n = Math.max(1, Math.min(12, +$('#mobN').value || 1)); const rollHp = $('#mobRoll').checked; const add = [];
    const same = (c.npcs || []).filter((x) => x.mid === id).length;
    for (let i = 0; i < n; i++) { const r = 1 + Math.floor(rnd() * 20); const hp = rollHp ? Math.max(1, rollExpr(M[4]).total) : M[3]; add.push({ id: uidX(), mid: id, name: M[0] + (n > 1 || same ? ' ' + (same + i + 1) : ''), v: r + M[6], dex: M[6], hp, hpMax: hp, ac: M[2] }); }
    saveCombat(Object.assign({}, c, { npcs: (c.npcs || []).concat(add), t: Date.now(), log: clog(c, n + '× ' + M[0] + ' tritt dem Kampf bei') })); pushLog({ label: n + '× ' + M[0], total: add.map((x) => x.v).join(', '), detail: 'Initiative gewürfelt' + (rollHp ? ' · TP gewürfelt' : '') }); },
  grpRest: (t, a) => { if (typeof restGate === 'function' && !restGate(cur(), a)) return; const id = uidX(); cur().play.restSeen = id; saveMeta({ rest: { id, kind: a, t: Date.now() } }); doRest(cur(), a); },
  gift: () => { const to = $('#gTo').value; const g = { id: uidX(), to, from: UID, xp: +$('#gXp').value || 0, gm: +$('#gGm').value || 0, item: $('#gItem').value || '', text: ($('#gText').value || '').trim(), t: Date.now() }; if (!g.xp && !g.gm && !g.item && !g.text) { $('#gXp').focus(); return; } saveMeta({ gifts: (S.meta.gifts || []).concat([g]).slice(-30) }); pushLog({ label: 'Beute verteilt', total: '✦', detail: [g.xp && g.xp + ' EP', g.gm && g.gm + ' GM', g.item && MAGIC_ITEMS[g.item].name, g.text].filter(Boolean).join(', ') + ' an ' + (to === 'all' ? 'alle' : (S.table[to] || {}).char) }); },
  hoAdd: () => { const title = ($('#hoT').value || '').trim(); const text = ($('#hoX').value || '').trim(); if (!text) { $('#hoX').focus(); return; } saveMeta({ handouts: (S.meta.handouts || []).concat([{ id: uidX(), title, text, t: Date.now() }]).slice(-20) }); },
  hoDel: (t, a) => { saveMeta({ handouts: (S.meta.handouts || []).filter((x) => x.id !== a) }); },
  invCopy: async (t) => { try { await navigator.clipboard.writeText(inviteText()); t.textContent = 'Kopiert ✓'; } catch (e) { openModal('export', inviteText()); } },
  xpAdd: (t, a, p, ch) => { const n = +$('#xpAdd').value || 0; if (!n) { $('#xpAdd').focus(); return; } ch.xp = Math.max(0, (+ch.xp || 0) + n); commit(); },
  lvlUp: () => { S.lu = null; lvlUpOpen(); },
  luCls: (t, a) => { S.lu.cls = a; S.lu.roll = null; lvlUpOpen(); },
  luRoll: () => { const C = CLASSES[S.lu.cls]; const r = 1 + Math.floor(rnd() * C.hd); S.lu.roll = r; pushLog({ label: 'Trefferpunkte (Stufenaufstieg)', total: r, detail: 'W' + C.hd + ' ' + r, sides: C.hd, nat: r }); lvlUpOpen(); },
  luGo: () => lvlUpGo(),
  luMulti: () => { S.modal = null; $('#modal').hidden = true; S.view = 'build'; S.step = 0; render(); setTimeout(() => { const el = document.getElementById('a-multi'); if (el) el.scrollIntoView({ block: 'start' }); }, 50); },
  optUse: (t, a, p, ch) => optUse(ch, t.dataset.set, a),
  print: () => printSheet()
};
function xChange(t) {
  const ch = cur();
  if (t.id === 'addItem' && t.value) { ch.items = ch.items || []; const d = MAGIC_ITEMS[t.value]; const lab = ($('#itemLabel') || {}).value || ''; const ex = d.cons && ch.items.find((x) => x.id === t.value && (x.label || '') === lab.trim()); if (ex) ex.qty = (+ex.qty || 1) + 1; else ch.items.push({ uid: uidX(), id: t.value, att: false, eq: true, qty: 1, w: d.wpn && ch.weapons.length === 1 ? 0 : '', label: lab.trim() }); commit(); return true; }
  if (t.id === 'addGear' && t.value !== '') { const g = GEAR[+t.value]; ch.inv = ch.inv || []; const ex = ch.inv.find((x) => x.n === g[0]); if (ex) ex.qty = (+ex.qty || 0) + 1; else ch.inv.push({ n: g[0], qty: 1, kg: g[1] }); commit(); return true; }
  if (t.id === 'addComp' && t.value) { ch.comps = ch.comps || []; const x = { t: t.value, name: '', hp: null }; if (t.value === 'steed') { x.kind = 'celestial'; x.lvl = 2; } if (t.value === 'custom') { x.name = 'Eigener Begleiter'; x.ac = 12; x.hpMax = 20; } ch.comps.push(x); commit(); return true; }
  if (t.dataset && t.dataset.xact === 'itW') { const x = itemList(ch).find((i) => i.uid === t.dataset.uid); if (x) { x.w = t.value === '' ? '' : +t.value; commit(); } return true; }
  return false;
}
document.addEventListener('input', (ev) => { const t = ev.target; if (t.id === 'dmNote') dmNoteSet(t.value); if (t.id === 'mq') { S.mq = t.value; const pos = t.selectionStart; render(); const n = $('#mq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } });

/* ---------- Bogen-Abschnitte auf dem Handy ---------- */
const SHEET_GROUPS = [['kampf', 'Kampf'], ['werte', 'Werte'], ['zauber', 'Zauber'], ['faehig', 'Fähigkeiten'], ['gear', 'Ausrüstung'], ['begleiter', 'Begleiter'], ['notiz', 'Notizen']];
function sheetNav(c) {
  const g = mgOf(c);
  const list = SHEET_GROUPS.filter(([k]) => k !== 'zauber' || c.spell.has || c.extraSpells.length);
  return '<nav class="mnav" aria-label="Seiten des Bogens">' + list.map(([k, l]) => '<button class="' + (g === k ? 'on' : '') + '" data-act="mg" data-arg="' + k + '">' + l + '</button>').join('') + '<button class="mexp' + (typeof explainOn === 'function' && explainOn() ? ' on' : '') + '" data-act="explain" title="Rechenweg aller Werte anzeigen">Rechenweg</button>' + '<button class="mall' + (g === 'alle' ? ' on' : '') + '" data-act="mg" data-arg="alle" title="Alles auf einer Seite">Alles</button>' + (typeof S !== 'undefined' ? '<button class="undobtn" data-act="undo" title="Letzte Änderung rückgängig (Strg+Z)"' + (S.undo && S.undo.some((u) => u.id === S.cur) ? '' : ' disabled') + '>↶ <span>Rückgängig</span> <b>' + ((S.undo || []).filter((u) => u.id === S.cur).length || '') + '</b></button>' : '') + '</nav>';
}
XA.mg = (t, a) => { S.mg = a; try { localStorage.setItem('heldenbuch_mg', a); } catch (e) {} render(); const n = document.querySelector('.mnav'); if (n) { const top = n.getBoundingClientRect().top + window.scrollY - 70; if (window.scrollY > top) window.scrollTo(0, top); } };
function mgOf(c) { if (S.mg === undefined) { try { S.mg = localStorage.getItem('heldenbuch_mg') || 'kampf'; } catch (e) { S.mg = 'kampf'; } } if (S.mg === 'alle' && window.innerWidth <= 820) return 'kampf'; return S.mg === 'zauber' && !(c.spell.has || c.extraSpells.length) ? 'kampf' : (S.mg || 'kampf'); }

/* ---------- Untere Navigation (Handy) ---------- */
const NAV_ICON = {
  heroes: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.6-3.6 3.4-6 7-6s6.4 2.4 7 6"/>',
  sheet: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>',
  build: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/><circle cx="12" cy="12" r="2.5"/>',
  camp: '<path d="M4 20l8-15 8 15z"/><path d="M12 20v-6"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
};
function bnavHtml() {
  const main = [['heroes', 'Helden'], ['sheet', 'Bogen'], ['build', 'Erschaffen'], ['camp', 'Tisch']];
  const moreOn = ['spells', 'mobs', 'hb', 'help'].includes(S.view);
  const btn = (k, l, act, on) => '<button class="' + (on ? 'on' : '') + '" data-act="' + act + '" data-arg="' + k + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + NAV_ICON[k] + '</svg><span>' + l + '</span>' + (k === 'camp' && S.combat && S.combat.active ? '<i class="dot"></i>' : '') + '</button>';
  return '<div class="bn">' + main.map(([k, l]) => btn(k, l, 'view', S.view === k)).join('') + btn('more', 'Mehr', 'more', moreOn || S.more) + '</div>' +
    (S.more ? '<div class="bmore">' + [['spells', 'Zauberbuch'], ['mobs', 'Bestiarium'], ['hb', 'Hausregeln'], ['help', 'Hilfe & Anleitung']].map(([k, l]) => '<button class="' + (S.view === k ? 'on' : '') + '" data-act="view" data-arg="' + k + '">' + l + '</button>').join('') + '<button data-act="themeOpen">Stimmung: ' + THEMES[themeNow()].name + '</button></div>' : '');
}
XA.more = () => { S.more = !S.more; const bn = $('#bnav'); if (bn) bn.innerHTML = bnavHtml(); };

/* ---------- Hilfe ---------- */
function helpView() {
  const sec = (t, items) => '<section class="blk"><h2>' + t + '</h2><ul class="help">' + items.map((x) => '<li>' + x + '</li>').join('') + '</ul></section>';
  const app = typeof APP_MODE !== 'undefined' && APP_MODE === 'app';
  return '<div class="camp helpv"><div class="hero-intro banner" style="' + bannerStyle('magier') + '"><h1>So funktioniert das Heldenbuch</h1><p>Alles Wichtige auf einen Blick. Tippe auf hervorgehobene Werte, um zu würfeln.</p></div>' +
    sec('Helden erschaffen', ['Unter <b>Erschaffen</b> gehst du Schritt für Schritt durch Klasse, Herkunft, Attribute, Fertigkeiten, Zauber und Ausrüstung.', 'Rote Hinweise rechts (auf dem Handy oben) zeigen, was noch fehlt – antippen bringt dich direkt zum richtigen Feld.', 'Alle Werte (RK, TP, Angriffe, Zauber-SG, Plätze) rechnet die App automatisch.']) +
    sec('Spielen', ['Auf dem <b>Bogen</b> tippst du Attribute, Fertigkeiten, Rettungswürfe oder Angriffe an – die App würfelt mit Animation und beachtet Vor-/Nachteil und Zustände.', 'Auf dem Handy wechselst du oben im Bogen zwischen <b>Kampf, Werte, Zauber, Fähigkeiten, Ausrüstung, Begleiter</b> und <b>Notizen</b>.', 'Zauber wirken zieht den Platz automatisch ab. Konzentration, Segnen, Mal des Jägers usw. werden verfolgt.', 'Bei 0 TP würfelst du Todesrettungswürfe. Nach drei Fehlschlägen entscheidet die Spielleitung über Gnade.', 'Der Würfelbecher unten links würfelt beliebige Würfel (bis 30 Stück).']) +
    sec('Gemeinsam spielen', [app ? 'Unter <b>Tisch</b> erstellt die Spielleitung einen Raum. Den <b>Raumcode</b> schickst du per WhatsApp – Mitspieler tippen ihn ein und sind verbunden (Handy und PC gemischt).' : 'Unter <b>Tisch</b> treten alle derselben Kampagne bei. Mitspieler musst du einmal per E-Mail als Bearbeiter einladen.', 'Die Spielleitung startet den Kampf, alle würfeln Initiative, und wer am Zug ist, sieht seinen Bildschirm leuchten.', 'Monster fügst du aus dem Bestiarium hinzu; Spieler sehen nur ihren Zustand, nicht die genauen TP.', 'Rast, Beute, EP und Handouts verteilt die Spielleitung für alle mit einem Tipp.']) +
    sec('Sichern', [app ? 'Deine Helden werden auf diesem Gerät gespeichert. Mit <b>Exportieren</b> sicherst du sie als Datei oder überträgst sie auf ein anderes Gerät.' : 'Deine Helden werden in deinem Claude-Konto gespeichert. Mit <b>Exportieren</b> erhältst du zusätzlich eine Datei.']) +
    '<p class="hint">Regeln nach dem SRD 5.2 (CC-BY-4.0), eigene deutsche Zusammenfassung. Mit ✦ markierte Inhalte sind eigene Erfindungen.</p></div>';
}

/* ---------- App-Version: Raum erstellen/beitreten, Status, Übertragung ---------- */
function isApp() { return typeof APP_MODE !== 'undefined' && APP_MODE === 'app'; }
const WEB_APP = 'https://sicherungskontoeko-hash.github.io/heldenbuch/';
function appLink(code) { if (!/^https?:/.test(location.protocol) || /^https?:\/\/localhost/.test(location.href)) return WEB_APP + '#raum=' + encodeURIComponent(code); const srv = hbLs.get('hb_server', 'hivemq'); return location.origin + location.pathname + '#raum=' + encodeURIComponent(code) + (srv !== 'hivemq' && srv !== 'custom' ? '&srv=' + srv : ''); }
function appInviteText() { const code = S.camp || ''; const l = appLink(code); return 'Komm an unseren Tisch im Heldenbuch! ⚔\n' + (l ? l + '\n' : '') + 'Raumcode: ' + code + '\nÖffne das Heldenbuch, tippe unten auf „Tisch“ und gib den Code ein.'; }
function newRoomCode(name) { const base = campSlug(name || '').slice(0, 20) || 'runde'; const abc = 'abcdefghjkmnpqrstuvwxyz23456789'; let r = ''; for (let i = 0; i < 8; i++) r += abc[Math.floor(rnd() * abc.length)]; return base + '-' + r; }
function appCampStatus() {
  if (typeof HB_NOCRYPTO !== 'undefined' && HB_NOCRYPTO) return '<p class="cstat bad">Online-Tisch nicht verfügbar: Dieser Browser bietet keine sichere Verschlüsselung (WebCrypto). Öffne die App über https oder als installierte App – unverschlüsselt sendet das Heldenbuch nie.</p>';
  const st = HBNET.state; const name = (Object.entries(HB_BROKERS).find(([k]) => k === hbLs.get('hb_server', 'hivemq')) || [0, ['eigener Server']])[1][0];
  if (st === 'online') return '<p class="cstat ok">● Online' + (!S.share ? ' – du würfelst verdeckt' : S.secret ? ' – nur die Spielleitung sieht deine Würfe' : ' – deine Würfe werden geteilt') + ' <small>(' + esc(name) + ')</small></p>';
  if (st === 'verbinde') return '<p class="cstat">◌ Verbinde mit dem Tisch …</p>';
  return '<p class="cstat bad">Keine Verbindung zum Tisch. Prüfe das Internet – die App verbindet sich automatisch neu. Wenn es so bleibt, wählt alle unter „Verbindung“ einen anderen Server.</p>';
}
function serverPicker() {
  const cur = hbLs.get('hb_server', 'hivemq');
  return '<details class="srv"><summary>Verbindung</summary><p class="hint">Alle am Tisch müssen denselben Server nutzen. Die Tischdaten laufen über diesen öffentlichen Server, sind aber Ende-zu-Ende verschlüsselt: Der Server sieht weder Raumcode noch Inhalte, und ohne Raumcode kann niemand mitlesen oder Daten einschleusen. Teile den Code nur mit deiner Gruppe und schreib nichts Vertrauliches in den Tisch.</p><div class="chips">' + Object.entries(HB_BROKERS).map(([k, v]) => chip(cur === k, v[0], 'data-act="srv" data-arg="' + k + '"')).join('') + chip(cur === 'custom', 'Eigener Server', 'data-act="srv" data-arg="custom"') + '</div>' + (cur === 'custom' ? '<label class="fld"><span>WebSocket-Adresse (wss://…)</span><input type="text" id="srvUrl" value="' + esc(hbLs.get('hb_server_url', '')) + '" placeholder="wss://mein-server:8084/mqtt"></label><button class="btn sm ghost" data-act="srvSave">Speichern</button>' : '') + '</details>';
}
function appJoinHtml() {
  return '<div class="campjoin"><div class="hero-intro banner" style="' + bannerStyle('waldlaeufer') + '"><h1>Gemeinsamer Tisch</h1><p>Handys und PCs spielen zusammen: Alle im selben Raum sehen Würfe, Initiative und die Gruppe live. Kein Konto nötig.</p></div>' +
    '<section class="panel"><h2>Als Spielleitung: Raum erstellen</h2><p class="hint">Gib deiner Runde einen Namen – die App hängt einen Zufallscode an, damit niemand Fremdes hineinfindet.</p><div class="row"><label class="fld"><span>Name der Runde</span><input type="text" id="roomName" placeholder="z. B. Schatten von Valdris" autocomplete="off"></label></div><div class="chips"><button class="btn big" data-act="roomNew">Raum erstellen</button></div></section>' +
    '<section class="panel"><h2>Als Spieler: Raum beitreten</h2><p class="hint">Den Raumcode bekommst du von deiner Spielleitung, z. B. per WhatsApp. Er ist gleichzeitig der Schlüssel für die Verschlüsselung.</p><div class="row"><label class="fld"><span>Raumcode</span><input type="text" id="campCode" placeholder="z. B. schatten-von-valdris-k7m2q" autocomplete="off" autocapitalize="none"></label></div><div class="chips"><button class="btn big" data-act="campJoin">Beitreten</button></div>' + serverPicker() + '</section></div>';
}
function transferHtml() {
  return '<section class="panel transfer"><h2>Helden zwischen Geräten übertragen</h2><p class="hint">Vom Handy auf den PC oder umgekehrt: Auf dem alten Gerät „Senden“ tippen, auf dem neuen Gerät den Code eingeben. Beide Geräte brauchen Internet.</p><div class="row"><button class="btn ghost" data-act="txSend">Aktiven Helden senden</button><label class="fld"><span>Code empfangen</span><input type="text" id="txCode" placeholder="z. B. 4K7M2Q" autocomplete="off" autocapitalize="characters"></label><button class="btn ghost" data-act="txRecv">Empfangen</button></div>' + (S.txCode ? '<p class="txcode">Code: <b>' + esc(S.txCode) + '</b> <small>– gültig, bis er empfangen wurde</small></p>' : '') + '</section>';
}
XA.roomNew = () => { const code = newRoomCode(($('#roomName') || {}).value); joinCamp(code); setTimeout(() => { if (!S.meta.dm) saveMeta({ dm: UID }); }, 1800); };
XA.srv = (t, a) => { hbLs.set('hb_server', a); HBNET.stop(); if (S.camp) HBNET.start(); render(); };
XA.srvSave = () => { const v = ($('#srvUrl').value || '').trim(); if (!/^wss?:\/\//.test(v)) { $('#srvUrl').focus(); return; } hbLs.set('hb_server_url', v); HBNET.stop(); HBNET.start(); render(); };
XA.txSend = (t, a, p, ch) => { const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 6; i++) c += abc[Math.floor(rnd() * abc.length)]; S.txCode = c; HBDB.doc('transfer/' + c).set({ heldenbuch: 1, chars: [ch], hb: Object.values(S.hb), t: Date.now() }); pushLog({ label: 'Übertragung bereit', total: c, detail: 'Gib diesen Code auf dem anderen Gerät ein.' }); render(); };
XA.txRecv = () => { const c = ($('#txCode').value || '').trim().toUpperCase(); if (!c) { $('#txCode').focus(); return; } const d = HBDB.doc('transfer/' + c); let done = false; const off = d.onSnapshot((snap) => { if (done) return; if (!snap.exists) { pushLog({ label: 'Übertragung', total: '…', detail: 'Noch nichts gefunden – ist das andere Gerät online und der Code richtig?' }); return; } done = true; try { importJson(JSON.stringify(snap.data())); d.delete(); S.txCode = ''; } catch (e) { pushLog({ label: 'Übertragung', total: '✗', detail: 'Die Daten waren beschädigt.' }); } setTimeout(off, 100); }); };
function appAutoJoin() { const m = /raum=([^&]+)/.exec(location.hash || ''); if (!m) return; const sv = /srv=([a-z]+)/.exec(location.hash); if (sv && HB_BROKERS[sv[1]]) hbLs.set('hb_server', sv[1]); try { history.replaceState(null, '', location.pathname); } catch (e) {} S.view = 'camp'; setTimeout(() => joinCamp(decodeURIComponent(m[1])), 300); }

/* ---------- Banner und Porträts ---------- */
const BANNER_OF = { paladin: 'helden', waldlaeufer: 'tisch', drache: 'bestiarium', magier: 'hilfe' };
function bannerStyle(k) { const b = BANNER[BANNER_OF[k] || k]; return b ? '--art:url(' + b + ')' : (ART[k] ? '--art:url(' + ART[k] + ')' : ''); }
function portraitPicker(ch) {
  const cur = ch.portrait || '';
  const opt = (val, inner, label) => '<button class="ppk' + (cur === val ? ' on' : '') + '" data-act="portrait" data-arg="' + val + '" title="' + esc(label) + '">' + inner + '<small>' + esc(label) + '</small></button>';
  const ini = (ch.name || '?').replace(/^Beispiel:\s*/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return '<div class="ppick" id="a-portrait">' + opt('', '<span class="sigil crest" style="--h:' + (HUE[ch.cls] || 'var(--gold)') + '">' + crestSvg(ch.cls) + '</span>', 'Klassen-Wappen') + opt('ini', '<span class="sigil" style="--h:' + (HUE[ch.cls] || 'var(--gold)') + '">' + esc(ini) + '</span>', 'Initialen') +
    Object.keys(ART).map((k) => opt('art:' + k, '<span class="sigil art" style="background-image:url(' + ART[k] + ')"></span>', ART_INFO[k][0])).join('') +
    (ch.portraitImg ? opt('img', '<span class="sigil art" style="background-image:url(' + ch.portraitImg + ')"></span>', 'Eigenes Bild') : '') +
    '<label class="ppk up"><span class="sigil" style="--h:var(--faint)"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 16V5M7 10l5-5 5 5M5 19h14"/></svg></span><small>Bild hochladen</small><input type="file" id="pimgFile" accept="image/*" hidden></label></div>';
}
XA.portrait = (t, a, p, ch) => { ch.portrait = a; commit(); };
document.addEventListener('change', (ev) => {
  const t = ev.target; if (!t || t.id !== 'pimgFile' || !t.files || !t.files[0]) return;
  const f = t.files[0]; const img = new Image(); const url = URL.createObjectURL(f);
  img.onload = () => { const c = document.createElement('canvas'); const s = 192; c.width = s; c.height = s; const x = c.getContext('2d'); const k = Math.max(s / img.width, s / img.height); const w = img.width * k, h = img.height * k; x.drawImage(img, (s - w) / 2, (s - h) / 2.6, w, h); URL.revokeObjectURL(url);
    const ch = cur(); ch.portraitImg = c.toDataURL('image/jpeg', 0.82); ch.portrait = 'img'; commit(); };
  img.onerror = () => { URL.revokeObjectURL(url); pushLog({ label: 'Bild', total: '✗', detail: 'Dieses Bild konnte nicht geladen werden.' }); };
  img.src = url; t.value = '';
});
