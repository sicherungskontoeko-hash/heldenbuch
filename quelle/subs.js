/* ==== Zusätzliche, selbst erfundene Unterklassen für die SRD-Klassen (✦ = eigene Erfindung, kein SRD) ==== */
const NEW_SUBS = {
 bar:{ id:'glut', name:'✦ Pfad der Glutseele', feats:[
  [3,'Glutrausch','Solange dein Kampfrausch aktiv ist, verursacht dein Kampfrausch-Bonus Feuer- statt Waffenschaden, und jede Kreatur, die dich im Nahkampf trifft, erleidet 1W6 Feuerschaden.'],
  [6,'Hitzeschleier','Resistenz gegen Feuerschaden. Im Kampfrausch kannst du nicht verängstigt werden.'],
  [10,'Flammensprung','Bonusaktion im Kampfrausch: Du springst bis zu 6 m, ohne Gelegenheitsangriffe auszulösen. Kreaturen deiner Wahl in 1,5 m vom Landepunkt machen einen GES-Rettungswurf (SG 8 + ÜB + KON) gegen 2W6 Feuerschaden, bei Erfolg die Hälfte.'],
  [14,'Unlöschbar','Fällst du im Kampfrausch auf 0 TP, hast du stattdessen 1 TP, und jede Kreatur in 3 m erleidet 4W6 Feuerschaden. 1× pro langer Rast.']],
  res:(l)=> l>=14?[{k:'unl',n:'Unlöschbar',max:1,reset:'long'}]:[] },
 brd:{ id:'stars', name:'✦ Schule der Sternlieder', spells:{3:['starry-wisp']}, feats:[
  [3,'Leitstern','Gibst du Bardische Inspiration, darf das Ziel den Würfel auch als Reaktion zu seiner RK gegen einen Angriff addieren. Du lernst Sternenfunke als zusätzlichen Zaubertrick.'],
  [3,'Himmelskunde','Übung in Arkane Kunde und Naturkunde; nachts weisst du immer, wo Norden ist und wie spät es ist.'],
  [6,'Sternenmantel','Bonusaktion, 1 Bardische Inspiration: 1 Minute lang strahlt von dir in 6 m gedämpftes Sternenlicht. Verbündete darin addieren 1W4 zu Rettungswürfen gegen Zauber.'],
  [14,'Sternenfall','Würfelst du Bardische Inspiration, kannst du einmal pro Zug zusätzlich einer Kreatur in 18 m gleissenden Schaden in Höhe des Würfels zufügen (GES-Rettungswurf gegen deinen Zauber-SG verhindert).']] },
 cle:{ id:'tide', name:'✦ Domäne der Gezeiten', spells:{3:['create-or-destroy-water','fog-cloud','gust-of-wind','misty-step'],5:['water-walk','sleet-storm'],7:['control-water','ice-storm'],9:['cone-of-cold','commune']}, feats:[
  [3,'Gezeitenschub','Göttliche Macht fokussieren: Kreaturen deiner Wahl in 9 m machen einen STÄ-Rettungswurf; bei Misserfolg erleiden sie 2W8 + Klerikerstufe Wuchtschaden und werden 3 m verschoben, bei Erfolg die Hälfte.'],
  [3,'Kind des Wassers','Du hast Schwimmbewegung gleich deiner Bewegungsrate und kannst 1 Stunde lang die Luft anhalten.'],
  [6,'Ebbe und Flut','Heilst du eine Kreatur mit einem Zauber, darfst du sie bis zu 3 m verschieben, ohne Gelegenheitsangriffe auszulösen; eine andere Kreatur in 3 m davon erleidet 1W8 Kälteschaden.'],
  [17,'Herr der Gezeiten','Resistenz gegen Kälte- und Wuchtschaden. Einmal pro langer Rast kannst du Wasser kontrollieren ohne Zauberplatz und ohne Konzentration wirken.']],
  res:(l)=> l>=17?[{k:'tide17',n:'Wasser kontrollieren (gratis)',max:1,reset:'long'}]:[] },
 dru:{ id:'storm', name:'✦ Zirkel des Sturmwalds', spells:{3:['fog-cloud','gust-of-wind','thunderwave','shatter'],5:['call-lightning','wind-wall'],7:['ice-storm','freedom-of-movement'],9:['tree-stride','insect-plague']}, feats:[
  [3,'Sturmgestalt','Statt Tiergestalt kannst du eine Nutzung ausgeben, um 1 Minute lang Sturm um dich zu tragen: Fliegen 3 m (Schweben), und einmal pro Zug verursacht ein Treffer oder Zauber +1W8 Blitz- oder Schallschaden.'],
  [6,'Blitzableiter','Resistenz gegen Blitz- und Schallschaden. Wirkt eine Kreatur in 18 m einen Blitzzauber, kannst du die Hälfte des Schadens auf ein anderes Ziel in 9 m umlenken (Reaktion).'],
  [10,'Rauschende Kronen','In Sturmgestalt: Kreaturen deiner Wahl, die ihren Zug in 3 m von dir beginnen, machen einen STÄ-Rettungswurf oder werden 3 m weggestossen.'],
  [14,'Auge des Sturms','Sturmgestalt gibt dir zusätzlich Flugbewegung 18 m, und Fernkampfangriffe gegen dich haben Nachteil.']] },
 fig:{ id:'warden', name:'✦ Klingenwächter', feats:[
  [3,'Wachsame Haltung','Bonusaktion: Bis zu deinem nächsten Zug kannst du als Reaktion einen Angriff machen, wenn eine Kreatur in deiner Reichweite einen Verbündeten angreift. ÜB-mal pro langer Rast.'],
  [3,'Schutzwall','Steht ein Verbündeter in 1,5 m von dir, erhält er +1 RK.'],
  [7,'Taktischer Blick','Du kannst als Bonusaktion eine Kreatur in 18 m mustern und erfährst RK, ob sie Resistenzen hat und ihren höchsten Rettungswurf.'],
  [10,'Gegenschlag','Verfehlt dich eine Kreatur im Nahkampf, kannst du als Reaktion einen Angriff gegen sie machen.'],
  [15,'Unerschütterlich','Du hast Vorteil auf Rettungswürfe gegen verängstigt, bezaubert und Umwerfen; Verbündete in 3 m teilen den Vorteil gegen verängstigt.'],
  [18,'Bollwerk','Wachsame Haltung kostet keine Nutzung mehr, und deine Reaktionsangriffe verursachen +1W8 Schaden.']],
  res:(l,c)=>[{k:'wach',n:'Wachsame Haltung',max:l>=18?0:c.pb,reset:'long'}].filter((r)=>r.max) },
 mon:{ id:'water', name:'✦ Weg des fliessenden Wassers', feats:[
  [3,'Wasserpeitsche','1 Fokuspunkt, als Teil der Angriffsaktion: Ein waffenloser Schlag reicht 9 m weit; trifft er, kannst du das Ziel 3 m zu dir ziehen oder umwerfen (STÄ-Rettungswurf).'],
  [6,'Gegenströmung','Reaktion, wenn du von einem Nahkampfangriff getroffen wirst, 1 Fokuspunkt: Der Schaden sinkt um 1W10 + WEI-Mod, und du bewegst dich 3 m, ohne Gelegenheitsangriffe auszulösen.'],
  [11,'Strudel','2 Fokuspunkte, Aktion: Kreaturen in 3 m machen einen STÄ-Rettungswurf gegen 4W10 Wuchtschaden und sind bis zum Ende deines nächsten Zuges festgesetzt; bei Erfolg die Hälfte.'],
  [17,'Ozeanseele','Du kannst unter Wasser atmen, hast Schwimmbewegung gleich deiner Bewegungsrate und Resistenz gegen Kälte- und Wuchtschaden.']] },
 pal:{ id:'dawn', name:'✦ Eid der Morgenröte', spells:{3:['guiding-bolt','sanctuary'],5:['see-invisibility','continual-flame'],9:['daylight','protection-from-energy'],13:['fire-shield','death-ward'],17:['flame-strike','greater-restoration']}, feats:[
  [3,'Morgenglanz','Göttliche Macht fokussieren: Bonusaktion, 1 Minute lang strahlt deine Waffe helles Licht in 9 m. Untote und Unholde darin haben Nachteil auf Angriffe, und deine Waffentreffer verursachen +CHA-Mod gleissenden Schaden.'],
  [3,'Erstes Licht','Göttliche Macht fokussieren: Aktion, bis zu CHA-Mod Verbündete in 9 m erhalten 1W8 + Paladinstufe temporäre TP.'],
  [7,'Aura der Dämmerung','Du und Verbündete in deiner Aura haben Resistenz gegen nekrotischen Schaden und können nicht blind gemacht werden, solange du bei Bewusstsein bist.'],
  [15,'Sonnenfestung','Fällt ein Verbündeter in deiner Aura auf 0 TP, kannst du als Reaktion bewirken, dass er stattdessen 1 TP hat. ÜB-mal pro langer Rast.'],
  [20,'Avatar der Morgenröte','Aktion, 1× pro langer Rast: 10 Minuten lang Flugbewegung 18 m, Feinde, die ihren Zug in deiner Aura beginnen, erleiden 10 gleissenden Schaden, und deine Göttlichen Niederstrecken verursachen +2W8.']],
  res:(l,c)=>(l>=15?[{k:'sonne',n:'Sonnenfestung',max:c.pb,reset:'long'}]:[]).concat(l>=20?[{k:'avatar',n:'Avatar der Morgenröte',max:1,reset:'long'}]:[]) },
 ran:{ id:'stormh', name:'✦ Sturmjäger', spells:{3:['thunderwave'],5:['gust-of-wind'],9:['lightning-bolt'],13:['ice-storm'],17:['conjure-elemental']}, feats:[
  [3,'Blitzschuss','Einmal pro Zug, wenn du mit einer Waffe triffst, kannst du +1W6 Blitzschaden verursachen (1W8 ab Stufe 11).'],
  [3,'Wetterkunde','Du weisst das Wetter der nächsten 24 Stunden und hast Vorteil auf Überlebenskunst bei Sturm, Regen oder Schnee.'],
  [7,'Sturmschritt','Wenn du die Aktion Spurt nutzt, kannst du 3 m fliegen und Gelegenheitsangriffe gegen dich haben Nachteil.'],
  [11,'Kettenblitz','Löst dein Blitzschuss aus, springt der Blitz auf eine zweite Kreatur in 3 m: GES-Rettungswurf gegen deinen Zauber-SG oder sie erleidet denselben Blitzschaden.'],
  [15,'Donnerherz','Resistenz gegen Blitz- und Schallschaden. Wirst du getroffen, kannst du als Reaktion den Angreifer 3 m wegstossen und ihm 2W8 Schallschaden zufügen.']] },
 rog:{ id:'poison', name:'✦ Giftmischer', feats:[
  [3,'Giftkunde','Übung mit Giftmischerzubehör. Bei einer langen Rast stellst du ÜB Dosen Gift her (Bonusaktion zum Auftragen): Der nächste Treffer verursacht +2W6 Giftschaden, und das Ziel macht einen KON-Rettungswurf (SG 8 + ÜB + GES) oder ist bis zum Ende deines nächsten Zuges vergiftet.'],
  [3,'Giftfest','Resistenz gegen Giftschaden und Vorteil auf Rettungswürfe gegen vergiftet.'],
  [9,'Schleichende Toxine','Dein Hinterhältiger Angriff kann statt Waffenschaden Giftschaden verursachen; Kreaturen mit Resistenz gegen Gift behandeln ihn als normal.'],
  [13,'Lähmendes Gift','Eine Giftdosis kann statt vergiftet auch gelähmt bis zum Ende deines nächsten Zuges bewirken (nur einmal pro Kreatur und langer Rast).'],
  [17,'Meistermischer','Deine Gifte ignorieren Immunität gegen Gift, und du stellst doppelt so viele Dosen her.']],
  res:(l,c)=>[{k:'gift',n:'Giftdosen',max:c.pb*(l>=17?2:1),reset:'long'}] },
 sor:{ id:'moon', name:'✦ Mondblut-Zauberei', spells:{3:['faerie-fire','silence','sleep','moonbeam'],5:['blink','dispel-magic'],7:['greater-invisibility','polymorph'],9:['mislead','dream']}, feats:[
  [3,'Mondphasen','Nach einer langen Rast wählst du eine Phase: Vollmond (+ÜB auf Heilung durch deine Zauber), Neumond (Vorteil auf Heimlichkeit, Dunkelsicht 18 m) oder Sichel (+1 auf Zauber-SG für Bezauberungen).'],
  [6,'Silberschleier','Bonusaktion, 2 Zaubereipunkte: Du teleportierst dich bis zu 9 m und hinterlässt ein Trugbild, das Angreifern Nachteil gibt, bis zum Beginn deines nächsten Zuges.'],
  [14,'Mondfinsternis','Reaktion, wenn dich ein Angriff trifft, 3 Zaubereipunkte: Du wirst bis zum Ende deines nächsten Zuges unsichtbar und erleidest nur die Hälfte des Schadens.'],
  [18,'Avatar des Mondes','Bonusaktion, 5 Zaubereipunkte: 1 Minute lang Flugbewegung 12 m, und alle drei Phasen wirken gleichzeitig.']] },
 wlk:{ id:'shadowblade', name:'✦ Schutzherr der Schattenklinge', desc:'Dein Schutzherr ist ein Wesen aus dem Raum zwischen Licht und Dunkel. Es leiht dir eine Klinge aus Schatten – und die Fähigkeit, selbst zum Schatten zu werden.', spells:{3:['wrathful-smite','fog-cloud','darkness','misty-step'],5:['blink','fear'],7:['greater-invisibility','phantasmal-killer'],9:['mislead','hold-monster']}, feats:[
  [3,'Schattenzauber','Immer vorbereitet: Zorniger Niederschlag, Nebelwolke, Dunkelheit, Nebelschritt (ab 5: Blinzeln, Furcht; ab 7: Mächtige Unsichtbarkeit, Phantastischer Mörder; ab 9: Irreführen, Monster festhalten).'],
  [3,'Schattenwaffe','Übung mit mittelschwerer Rüstung, Schilden und Kriegswaffen. Mit Nahkampfwaffen, die du führst, kannst du CHA statt STÄ oder GES für Angriff und Schaden nutzen.'],
  [3,'Schattenmal','Bonusaktion, ÜB-mal pro langer Rast: Schatten heften sich 1 Minute an eine Kreatur in 18 m. Sie kann sich vor dir nicht verstecken, und einmal pro Zug verursacht dein Waffentreffer gegen sie +1W6 nekrotischen Schaden (1W8 ab Stufe 10). Nach dem Treffer darfst du dich bis 3 m in einen freien Bereich neben ihr teleportieren.'],
  [6,'Schattenmantel','Reaktion, wenn dich ein Angriff trifft, 1 Nutzung Schattenmal: Du zerfliesst zu Schatten – der Schaden wird halbiert, und du teleportierst dich bis 6 m in gedämpftes Licht oder Dunkelheit.'],
  [10,'Schattenhunger','Resistenz gegen nekrotischen Schaden. Fällt eine Kreatur mit deinem Schattenmal auf 0 TP, erhältst du 1 Nutzung zurück und darfst das Mal sofort ohne Aktion auf eine Kreatur in 9 m davon setzen.'],
  [14,'Klinge der Nacht','Trifft dein Schattenmal-Schaden, macht das Ziel einen KON-Rettungswurf gegen deinen Zauber-SG oder ist bis zum Beginn deines nächsten Zuges blind. 1× pro langer Rast: Für 1 Minute kostet Schattenmantel keine Nutzung.']],
  res:(l,c)=>[{k:'smal',n:'Schattenmal',max:c.pb,reset:'long'}].concat(l>=14?[{k:'snacht',n:'Klinge der Nacht (1 Minute)',max:1,reset:'long'}]:[]) },
 wiz:{ id:'chrono', name:'✦ Schule der Chronomantie', feats:[
  [3,'Zeitsprung','Reaktion, wenn eine Kreatur in 9 m einen W20-Wurf macht: Sie würfelt neu und muss das neue Ergebnis nehmen. INT-Mod-mal pro langer Rast.'],
  [3,'Chronomantische Studien','Zauber, die Zeit oder Geschwindigkeit beeinflussen (Hast, Verlangsamen, Zeitstopp, Rasender Rückzug), kostet dich halb so viel Gold und Zeit zu kopieren.'],
  [6,'Augenblick verlängern','Wirkst du Hast oder Verlangsamen, ist Konzentration nicht nötig, solange das Ziel du selbst ist.'],
  [10,'Zeitschleife','Fällst du auf 0 TP, kannst du stattdessen auf die TP zurückspringen, die du zu Beginn deines letzten Zuges hattest. 1× pro langer Rast.'],
  [14,'Ewiger Moment','Aktion, 1× pro langer Rast: Eine Kreatur in 18 m macht einen WEI-Rettungswurf oder ist 1 Minute lang in der Zeit eingefroren (gelähmt, immun gegen Schaden; Wiederholung am Ende jedes Zuges).']],
  res:(l,c)=>[{k:'zeitsprung',n:'Zeitsprung',max:Math.max(1,c.mod.int),reset:'long'}].concat(l>=10?[{k:'schleife',n:'Zeitschleife',max:1,reset:'long'}]:[]).concat(l>=14?[{k:'moment',n:'Ewiger Moment',max:1,reset:'long'}]:[]) }
};
const SRD_SUB_RES = { mon:['wob'], wlk:['dol','hth'], bar:['ip'], dru:['nr','ns'], pal:['nimbus'], sor:['wings','dcomp'] };
for (const [id, nsub] of Object.entries(NEW_SUBS)) {
  const C = CLASSES[id]; if (!C || C.subs) continue;
  C.subs = [{ id: C.sub.id, name: C.sub.name, feats: C.subFeats, spells: C.sub.spells }, nsub];
  C.subDefault = true;
  const orig = C.res;
  C.res = (l, c) => {
    const e = (c.classes || []).find((x) => x.id === id); const sid = e ? e.subId : C.sub.id;
    let r = orig ? orig(l, c) : [];
    if (sid !== C.sub.id) r = r.filter((x) => !(SRD_SUB_RES[id] || []).includes(x.k));
    if (l >= 3) { const sb = C.subs.find((s) => s.id === sid); if (sb && sb.res) r = r.concat(sb.res(l, c)); }
    return r;
  };
}
