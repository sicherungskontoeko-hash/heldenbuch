// Figuren und Bestiarium
const L = require('./lib');
const { chapter, P } = L;
const { statblock, creature, figure } = require('./statlib');

const out = [];
const add = (...x) => x.forEach((e) => (Array.isArray(e) ? out.push(...e) : out.push(e)));

// ---------- Figuren ----------
add(chapter('Anhang', 'Die Figuren', 'Wer in diesem Abenteuer lebt, liebt und lügt'));

add(figure({ name: 'Severin Vaal', role: 'Herr der Golden Scale, später König von Erendal', fields: [
  ['Aussehen', 'Mitte vierzig, schlank, graue Schläfen, kurzer gepflegter Bart. Weinrot mit Goldstickerei, am Zeigefinger ein goldener Waagenring, den er ständig dreht. Er spricht so leise, dass man sich vorbeugt. In Kapitel 3 silbernes Haar und die Waagenkrone mit dem grünen Herzknoten.'],
  ['Geschichte', 'Sohn eines Fischhändlers aus Kronhafen. Er sah seinen Vater an einem schlechten Handel zerbrechen und schwor, nie auf der falschen Seite der Waage zu stehen. Aus kleinen Kaufleuten machte er die mächtigste Gilde des Reichs. Er hält sich nicht für böse. Er rechnet: ein verbranntes Dorf gegen ein blühendes Königreich.'],
  ['Ziel', 'Die Machtader und alles, was aus ihr fliesst, in einer Hand: seiner.'],
  ['Spielweise', 'Warm, grosszügig, nie laut. Lobt gern und zahlt gut. Wird er bedrängt, lächelt er müder.'],
  ['Schwächen', 'Er glaubt, jeder habe einen Preis, und unterschätzt Treue und Gewissen, vor allem bei Tobin. Ohne Krone, Garde und Chimäre ist er ein Mann mit einem Rapier.'],
], quote: '„Alles hat seinen Preis. Ich zahle gut.“' }));

add(figure({ name: 'Brannok Hornhand', role: 'Der Jäger von Eschental', fields: [
  ['Aussehen', 'Um die dreissig, gross und sehnig, rot geränderte Augen. In seinen dunklen Bart sind Holzperlen geflochten, eine für jedes Familienmitglied. Alter Fellmantel, Jagdspeer mit Eschenschaft.'],
  ['In Kapitel 3', 'Linker Arm und Schulter aus silbernem Ithari-Metall, drei grüne Steuerknoten im Nacken. Das Haar grau, das Gesicht eingefallen. Die Holzperlen trägt er noch.'],
  ['Geschichte', 'Sohn des Dorfjägers. Als Junge zog er ein verwaistes Bärenjunges auf: Borka. Tiere vertrauen ihm seit jeher. In der Brandnacht war er auf der Jagd. Seine Familie floh, und er hat sie nie gefunden. Im fünften Jahr fangen ihn Gildenjäger, acht Jahre verbringt er in Tobins Werkstatt.'],
  ['Ziel', 'In Kapitel 1: Niemand rührt das Land seiner Familie an. In Kapitel 3: Vaal soll bezahlen. Danach: endlich Ruhe.'],
  ['Spielweise', 'Wortkarg. Mit Tieren spricht er sanfter als mit Menschen. Seine Wut ist Trauer ohne Ort. In Kapitel 3 kämpft er gegen seinen eigenen Körper, weint und fleht.'],
  ['Schwächen', 'Borka ist alles, was ihm geblieben ist. Wer ehrlich über Eschental spricht, lässt ihn zögern.'],
], quote: '„Das hier gehört den Toten.“' }));

add(figure({ name: 'Borka', role: 'Die Bärin', fields: [
  ['Aussehen', 'Braunbärin, aufgerichtet über zweieinhalb Meter. Eingerissenes Ohr, Narbe über der Schnauze, blaue Manaadern im Fell. In Kapitel 3 Stahlplatten an Schultern und Flanken, zischende Kolben in den Vorderbeinen. Der Kopf ist noch Fell und Augen.'],
  ['Geschichte', 'Brannok zog sie mit der Flasche auf. Sie trug den Kindern von Fallbrück Honigwaben in die Stadt. Seit der Brandnacht weicht sie keinen Schritt von seiner Seite.'],
  ['Spielweise', 'Brummt leise, wenn Brannok spricht. Greift an, wenn er es will, und schützt ihn, auch wenn er es nicht will.'],
  ['Schwächen', 'Sie ist ein Tier, kein Monster. Wer ruhig mit ihr umgeht, erreicht sie.'],
] }));

add(figure({ name: 'Tobin Fink', role: 'Schreiber, Forscher, Mitwisser', fields: [
  ['Aussehen', 'In Kapitel 1 Anfang zwanzig, schmal, Tintenflecken an den Fingern, Augengläser, ein zu grosser Gildenmantel. In Kapitel 3 früh ergraut, Brandnarben an den Händen von der Werkstattarbeit.'],
  ['Geschichte', 'Vaal holte ihn als Waisenjungen von der Strasse. Tobin schuldet ihm alles. Er schrieb die Vermessungsberichte, die Eschental verdammten, fand später die Abschrift des Räumungsbefehls und schwieg. Unter Zwang baute er Brannoks Implantate. Nachts erzählte er Brannok die Wahrheit.'],
  ['Ziel', 'Vergebung. Und den Mut, einmal laut zu sagen, was er weiss.'],
  ['Spielweise', 'Nervös, höflich, stottert, wenn er lügt. Freundlichkeit trifft ihn wie ein Schlag. Er ist der Schlüssel zur Wahrheit.'],
], quote: '„Nach der Rede. Ich muss euch – die Krone, sie –“' }));

add(figure({ name: 'Mareike Torf', role: 'Wirtin des Krummen Keilers in Fallbrück', fields: [
  ['Aussehen', 'Runde Halblingsfrau, rote Wangen, Mehl an der Schürze, eine Stimme, die das ganze Gasthaus füllt.'],
  ['Geschichte', 'Führt das Gasthaus in dritter Generation. Brannok brachte ihr Wild, Borka ihren Kindern Honig. Die Version vom Bestienangriff hat sie nie geglaubt.'],
  ['Spielweise', 'Schwatzhaft und herzlich. Mag die Gilde nicht, aber Gäste, die zuhören.'],
] }));

add(figure({ name: 'Hedda Kupferzahn', role: 'Vorarbeiterin der Grube Eschental', fields: [
  ['Aussehen', 'Zwergin mit kupferrotem Bart in zwei Zöpfen, darin Eisenringe. Russ im Gesicht, Hammer am Gürtel, ein Glasauge von einem Grubenunglück.'],
  ['Geschichte', 'Vierzig Jahre Bergbau. Sie unterschrieb bei der Gilde, weil der Lohn gut war. Jeden Abend zählt sie ihre Leute persönlich, und seit die Unfälle begannen, fehlen ihr Namen.'],
  ['Spielweise', 'Laut, direkt, flucht auf Zwergisch, umarmt Leute, die sie mag, ob die wollen oder nicht.'],
] }));

add(figure({ name: 'Die Stimme von Ithrael', role: 'Ein Erinnerungskristall im Archiv', fields: [
  ['Aussehen', 'Ein Kristall, gross wie ein Mensch. Bei Berührung erscheint eine hochgewachsene Ithari-Frau ohne Haar, mit Haut wie Perlmutt und Augen ohne Pupillen.'],
  ['Geschichte', 'Die Archivarin Ytha, die letzte Ithari, die ihre Stimme aufzeichnete, bevor Morgath die Kuppel durchbrach. Kein Geist, sondern eine Aufnahme. Sie antwortet nicht auf Fragen.'],
] }));

add(figure({ name: 'Bauer Jost', role: 'Ein Mann am falschen Ort', fields: [
  ['Aussehen', 'Hager, Strohhut, zu wenig Zähne.'],
  ['Geschichte', 'Brannoks Nachbar aus Fallbrück. Er erinnert die Helden daran, dass Brannok früher für Frieden im Wald sorgte.'],
] }));

// ---------- Bestiarium Kapitel 1 ----------
add(chapter('Bestiarium', 'Kreaturen aus Kapitel 1', 'Stufe 3'));
add(L.table('stat', ['Kreatur', 'HG', 'Wo sie auftaucht'], [
  ['**Brannok Hornhand**', '3', 'Die Ruinen von Eschental'],
  ['**Borka, die Leitbärin**', '3', 'Die Ruinen von Eschental'],
  ['**Manaverseuchter Riesenkeiler**', '2', 'Die Waldstrasse, Die Ruinen von Eschental'],
  ['**Manaharpyie**', '1', 'Der Eschenwald, Die Ruinen von Eschental'],
  ['**Schreckenswolf**', '1', 'Der Eschenwald'],
  ['**Wolf**', '1/4', 'Der Eschenwald'],
], [3600, 900, L.W - 4500]));
add(P('*Riesenkeiler, Wolf, Schreckenswolf und Harpyie beruhen auf dem SRD 5.1 von Wizards of the Coast (CC BY 4.0). Alle Mana-Varianten sowie Brannok und Borka sind eigene Werte.*', { run: { size: 18, color: '666666' } }));

add(creature({
  title: 'Brannok Hornhand, der Jäger',
  look: 'Ein hagerer Jäger mit Fellmantel und Jagdspeer, die Augen rot vor Schlaflosigkeit. Er steht immer erhöht: auf einem Brunnenrand, einer Mauer, einem Ast.',
  lore: 'Kein Bandit und kein Ungeheuer. Er verteidigt die Ruinen seiner Familie gegen die Gilde, die er für Aasgeier hält. Die Tiere folgen ihm, weil sie ihm vertrauen.',
  fight: 'Er bleibt auf Distanz und schiesst. Jede Runde schickt er Borka oder einen Keiler mit einem Pfiff los. Gefährlich ist die Meute, nicht er.',
  stat: {
    name: 'Brannok Hornhand', type: 'Mittelgrosser Humanoider (Mensch), neutral',
    ac: '15 (beschlagenes Leder)', hp: '65 (10W8 + 20)', speed: '9 m', abil: [14, 16, 14, 10, 15, 11],
    details: [['Rettungswürfe', 'ST +4, GE +5'], ['Fertigkeiten', 'Heimlichkeit +5, Mit Tieren umgehen +6, Überlebenskunst +6, Wahrnehmung +6'], ['Sinne', 'passive Wahrnehmung 16'], ['Sprachen', 'Gemeinsprache, kann sich mit Tieren einfach verständigen'], ['Herausforderung', '3 (700 EP) · Übungsbonus +2']],
    traits: [
      ['Bestienband', 'Verbündete Tiere und Monstrositäten in 9 m, die Brannok sehen, können nicht verängstigt werden.'],
      ['Aufgeben', 'Bei 15 TP oder weniger hört Brannok auf zu kämpfen.'],
      ['Erinnerung an Eschental', 'Spricht eine Kreatur als Aktion ehrlich über sein Dorf (Überzeugen SG 15), greift Brannok in seinem nächsten Zug nur einmal an.'],
    ],
    actions: [
      ['Mehrfachangriff', 'Zwei Angriffe mit Jagdspeer oder Langbogen.'],
      ['Jagdspeer', '*Nah- oder Fernkampf:* +5 zum Treffen, 1,5 m oder 6/18 m. *Treffer:* 6 (1W6 + 3) Stich, zweihändig im Nahkampf 7 (1W8 + 3).'],
      ['Langbogen', '*Fernkampf:* +5 zum Treffen, 45/180 m. *Treffer:* 7 (1W8 + 3) Stich.'],
    ],
    bonus: [['Meutenbefehl', 'Ein verbündetes Tier in 18 m, das ihn hört, nutzt seine Reaktion, um sich bis zur halben Bewegungsrate zu bewegen und einmal anzugreifen.']],
    reactions: [['Deckung durch die Meute', 'Wird Brannok getroffen, während ein verbündetes Tier höchstens 1,5 m entfernt steht, erleidet stattdessen das Tier den Schaden.']],
    weak: ['Ohne Tiere neben sich ist er nur ein Jäger mit 65 TP. Trennt die Meute von ihm.', 'Er gibt bei 15 TP auf. Er will nicht sterben, er will, dass die Gilde geht.', 'Ehrliche Worte über Eschental lassen ihn zögern.'],
  },
}));

add(creature({
  title: 'Borka, die Leitbärin',
  look: 'Eine Braunbärin, grösser als ein Pferd, mit eingerissenem Ohr und blauen Manaadern im Fell.',
  lore: 'Sie wuchs bei Brannok auf und kennt nichts anderes als ihn. Seit der Spalt im Dorfplatz offen liegt, ist sie stärker und schneller wütend.',
  fight: 'Sie bleibt in Brannoks Nähe und schlägt zu, wenn er pfeift. Gerät er in Gefahr, lässt sie alles stehen und rennt zu ihm.',
  stat: {
    name: 'Borka', type: 'Grosses Tier, gesinnungslos',
    ac: '13 (natürliche Rüstung)', hp: '68 (8W10 + 24)', speed: '12 m, Klettern 9 m', abil: [20, 10, 16, 3, 13, 7],
    details: [['Fertigkeiten', 'Wahrnehmung +3'], ['Sinne', 'passive Wahrnehmung 13'], ['Sprachen', 'keine'], ['Herausforderung', '3 (700 EP) · Übungsbonus +2']],
    traits: [
      ['Scharfer Geruchssinn', 'Vorteil auf Wahrnehmung, die den Geruch nutzt.'],
      ['Manaadern', 'Borka leuchtet und kann sich nicht verstecken.'],
      ['Schutzinstinkt', 'Fällt Brannok in 9 m unter die Hälfte seiner TP, läuft Borka als Reaktion bis zu ihrer Bewegungsrate zu ihm, ohne Gelegenheitsangriffe auszulösen.'],
      ['Beruhigen', 'Eine Kreatur in 1,5 m kann als Aktion Mit Tieren umgehen SG 15 würfeln. Bei Erfolg greift Borka bis zum Ende ihres nächsten Zugs nicht an.'],
    ],
    actions: [
      ['Mehrfachangriff', 'Ein Biss und ein Klauenangriff.'],
      ['Biss', '*Nahkampf:* +7 zum Treffen, 1,5 m. *Treffer:* 9 (1W8 + 5) Stich plus 2 (1W4) Energie.'],
      ['Klauen', '*Nahkampf:* +7 zum Treffen, 1,5 m. *Treffer:* 12 (2W6 + 5) Hieb.'],
    ],
    weak: ['Ihr Schutzinstinkt lässt sich ausnutzen: Wer Brannok bedroht, zieht sie von ihrer Position weg.', 'Nur RK 13.', 'Wer ruhig mit ihr umgeht, kann sie eine Runde lang beschäftigen.'],
  },
}));

add(creature({
  title: 'Manaverseuchter Riesenkeiler',
  look: 'Ein Keiler so gross wie ein Ochse, die Hauer gelb und gebrochen. Unter der Haut pulsieren blaue Adern, aus dem Maul tropft schimmernder Speichel.',
  lore: 'Die Riesenkeiler der Eschwälder waren stur, aber friedlich. Seit Mana aus dem Spalt sickert, kennen sie nur noch Wut. Ohne Brannok würden sie Fallbrück überrennen.',
  fight: 'Er nimmt Anlauf und stürmt. Wer ihn verletzt, den verfolgt er.',
  stat: {
    name: 'Manaverseuchter Riesenkeiler', type: 'Grosses Tier, gesinnungslos', short: true,
    ac: '12 (natürliche Rüstung)', hp: '42 (5W10 + 15)', speed: '12 m', abil: [17, 10, 16, 2, 7, 5],
    details: [['Sinne', 'passive Wahrnehmung 8'], ['Sprachen', 'keine'], ['Herausforderung', '2 (450 EP)']],
    traits: [
      ['Ansturm', 'Bewegt er sich mindestens 6 m geradlinig auf ein Ziel zu und trifft es im selben Zug mit dem Hauer, erleidet es zusätzlich 7 (2W6) Hieb. Eine Kreatur schafft einen ST-Rettungswurf SG 13, sonst liegt sie am Boden.'],
      ['Unerbittlich (1/Rast)', 'Würde er durch 10 oder weniger Schaden auf 0 TP fallen, sinkt er stattdessen auf 1 TP.'],
      ['Rasend', 'Er greift wenn möglich die Kreatur an, die ihn zuletzt verletzt hat.'],
    ],
    actions: [['Hauer', '*Nahkampf:* +5 zum Treffen, 1,5 m. *Treffer:* 10 (2W6 + 3) Hieb plus 2 (1W4) Energie.']],
    weak: ['Der Ansturm braucht 6 m geraden Anlauf. Bäume, Mauern und schwieriges Gelände nehmen ihm die Wucht.', 'Er leuchtet und kann sich nicht verstecken.', 'Rasend: Wer ihn verletzt, lockt ihn weg.'],
  },
}));

add(creature({
  title: 'Manaharpyie',
  look: 'Oben eine Frau mit wirrem Haar und lächelndem Mund, unten ein Geier mit Krallen wie Haken. Ihre Federn sind von blauen Adern durchzogen, ihre Stimme so rein wie Glas.',
  lore: 'Harpyien nisten seit jeher in den Felsen über Eschental. Das Mana macht ihren Gesang stärker und ihren Hunger grösser. Brannok füttert sie, und sie singen für ihn.',
  fight: 'Eine singt, die anderen holen sich die Bezauberten. Sie bleiben in der Luft, solange es geht.',
  stat: {
    name: 'Manaharpyie', type: 'Mittelgrosse Monstrosität, chaotisch böse',
    ac: '11', hp: '38 (7W8 + 7)', speed: '6 m, Fliegen 12 m', abil: [12, 13, 12, 7, 10, 13],
    details: [['Sinne', 'passive Wahrnehmung 10'], ['Sprachen', 'Gemeinsprache'], ['Herausforderung', '1 (200 EP)']],
    traits: [['Manaadern', 'Kann sich nicht verstecken.']],
    actions: [
      ['Mehrfachangriff', 'Ein Krallen- und ein Knüppelangriff.'],
      ['Krallen', '*Nahkampf:* +3 zum Treffen, 1,5 m. *Treffer:* 6 (2W4 + 1) Hieb plus 2 (1W4) Energie.'],
      ['Knüppel', '*Nahkampf:* +3 zum Treffen, 1,5 m. *Treffer:* 3 (1W4 + 1) Wucht.'],
      ['Lockgesang', 'Jeder Humanoide in 90 m, der den Gesang hört, schafft einen WE-Rettungswurf SG 11 oder ist bezaubert, bis der Gesang endet. Die Harpyie braucht in jedem weiteren Zug eine Bonusaktion, um weiterzusingen. Ein bezaubertes Ziel ist kampfunfähig und geht auf direktem Weg zur Harpyie, ohne Gelegenheitsangriffen auszuweichen. Es wiederholt den Rettungswurf am Ende jedes eigenen Zugs, wenn es Schaden erleidet und bevor es gefährliches Gelände betritt. Bei Erfolg ist es 24 Stunden immun gegen diese Harpyie.'],
    ],
    weak: ['Der Gesang wirkt nur auf Hörende. Mit Mareikes **Bienenwachs** sind die Helden sicher.', 'Der Gesang endet, sobald die Sängerin kampfunfähig ist.', 'Am Boden langsam (6 m) und nur RK 11.', 'Feige: flieht unter 10 TP.'],
  },
}));

add(creature({
  title: 'Schreckenswolf',
  look: 'Ein Wolf so gross wie ein Pony, grauer Pelz, Narben am Maul, gelbe Augen im Unterholz.',
  lore: 'Er führt die Rudel des Eschenwalds an und folgt Brannoks Stimme, weil Brannok ihn als Welpen durch einen harten Winter fütterte.',
  fight: 'Er umkreist, wartet auf eine Lücke und reisst Helden zu Boden, damit das Rudel über sie herfällt.',
  stat: {
    name: 'Schreckenswolf', type: 'Grosses Tier, gesinnungslos', short: true,
    ac: '14 (natürliche Rüstung)', hp: '37 (5W10 + 10)', speed: '15 m', abil: [17, 15, 15, 3, 12, 7],
    details: [['Fertigkeiten', 'Heimlichkeit +4, Wahrnehmung +3'], ['Sinne', 'passive Wahrnehmung 13'], ['Herausforderung', '1 (200 EP)']],
    traits: [['Scharfe Sinne', 'Vorteil auf Wahrnehmung über Gehör und Geruch.'], ['Rudeltaktik', 'Vorteil auf Angriffe gegen eine Kreatur, neben der ein kampffähiger Verbündeter steht.']],
    actions: [['Biss', '*Nahkampf:* +5 zum Treffen, 1,5 m. *Treffer:* 10 (2W6 + 3) Stich. ST-Rettungswurf SG 13, sonst liegt das Ziel am Boden.']],
    weak: ['Allein verliert er die Rudeltaktik.', 'Ist das Rudel halbiert, zieht er sich zurück.'],
  },
}));

add(creature({
  title: 'Wolf', samePage: true,
  look: 'Ein grauer Waldwolf, mager nach einem langen Winter.',
  lore: 'Er läuft im Rudel der Schreckenswölfe und tut, was sie tun.',
  fight: 'Er greift Helden an, die schon am Boden liegen oder von einem anderen Wolf bedrängt werden.',
  stat: {
    name: 'Wolf', type: 'Mittelgrosses Tier, gesinnungslos', short: true,
    ac: '13 (natürliche Rüstung)', hp: '11 (2W8 + 2)', speed: '12 m', abil: [12, 15, 12, 3, 12, 6],
    details: [['Fertigkeiten', 'Heimlichkeit +4, Wahrnehmung +3'], ['Sinne', 'passive Wahrnehmung 13'], ['Herausforderung', '1/4 (50 EP)']],
    traits: [['Scharfe Sinne', 'Vorteil auf Wahrnehmung über Gehör und Geruch.'], ['Rudeltaktik', 'Vorteil auf Angriffe gegen eine Kreatur, neben der ein kampffähiger Verbündeter steht.']],
    actions: [['Biss', '*Nahkampf:* +4 zum Treffen, 1,5 m. *Treffer:* 7 (2W4 + 2) Stich. ST-Rettungswurf SG 11, sonst liegt das Ziel am Boden.']],
    weak: ['Nur 11 TP.', 'Allein flieht er.'],
  },
}));

// ---------- Bestiarium Kapitel 2 ----------
add(chapter('Bestiarium', 'Kreaturen aus Kapitel 2', 'Stufe 5'));
add(L.table('stat', ['Kreatur', 'HG', 'Wo sie auftaucht'], [
  ['**Morgath, der Aderfresser**', '10', 'Das Herz von Ithrael'],
  ['**Ithari-Wächter**', '3', 'Die Wächterhalle'],
  ['**Kristallkoloss**', '5', 'Die Wächterhalle'],
  ['**Bulette**', '5', 'Der Abstieg'],
  ['**Ankheg**', '2', 'Der Abstieg'],
], [3600, 900, L.W - 4500]));
add(P('*Bulette und Ankheg beruhen auf dem SRD 5.1. Morgath und die Konstrukte von Ithrael sind eigene Werte.*', { run: { size: 18, color: '666666' } }));

add(creature({
  title: 'Morgath, der Aderfresser',
  look: 'Ein Leib so lang wie ein Schiff, gegliedert wie ein Tausendfüssler, gepanzert mit Platten wie nasser Schiefer. Hunderte Beine enden in Sicheln. Der Kopf ist blind, ein Maul aus zwei Mandibeln, die sich öffnen wie Tore. Durch die Fugen scheint gleissendes Mana.',
  lore: 'Kein Dämon und kein Gott, sondern ein Tier, das Mana frisst. Seine Art folgt den Adern tief unter der Welt wie Fische einem Strom. Vor tausend Jahren roch Morgath das Herz von Ithrael, durchbrach die Kuppel und tötete die letzten Ithari. Seither trinkt er am Herz und steuert die Wächter mit seinen Nervenfäden. Die Grube Eschental hat ihn geweckt.',
  fight: 'Er packt mit den Mandibeln, zieht Fernkämpfer heran und speit Mana auf Gruppen. Wird er umzingelt, gräbt er sich ein und taucht anderswo auf. Er flieht nicht.',
  stat: {
    name: 'Morgath, der Aderfresser', type: 'Riesige Monstrosität, gesinnungslos',
    ac: '16 (natürliche Rüstung)', hp: '199 (19W12 + 76)', speed: '12 m, Klettern 12 m, Graben 6 m', abil: [20, 12, 18, 6, 14, 8],
    details: [['Rettungswürfe', 'KO +8, WE +6'], ['Fertigkeiten', 'Wahrnehmung +6'], ['Resistenzen', 'Energie'], ['Zustandsimmunitäten', 'liegend'], ['Sinne', 'Blindsicht 18 m, Erschütterungssinn 36 m, passive Wahrnehmung 16'], ['Sprachen', 'keine'], ['Herausforderung', '10 (5900 EP) · Übungsbonus +4']],
    traits: [
      ['Legendäre Resistenz (2/Tag)', 'Misslingt ein Rettungswurf, kann Morgath stattdessen einen Erfolg wählen.'],
      ['Fadennetz', 'Zu Beginn seines Zugs erhält Morgath 5 temporäre TP pro intaktem Faden zu den zwei Kristallsäulen. Jeder Faden hat RK 14 und 15 TP.'],
      ['Rückkopplung', 'Wird ein Faden gekappt, erleidet Morgath 10 (3W6) psychischen Schaden.'],
      ['Kernhunger', 'Fällt Morgath zum ersten Mal auf 100 TP, beisst er ins Herz. Bis zum Kampfende: Bewegungsrate +3 m, Mandibelbiss +7 (2W6) Energie, Manaspeien lädt sofort auf, Herzpuls wird verfügbar.'],
    ],
    actions: [
      ['Mehrfachangriff', 'Ein Mandibelbiss und zwei Sichelbeine.'],
      ['Mandibelbiss', '*Nahkampf:* +9 zum Treffen, 3 m. *Treffer:* 14 (2W8 + 5) Stich. Das Ziel ist gepackt (Befreien SG 17). Solange er jemanden hält, beisst er nur diese Kreatur.'],
      ['Sichelbein', '*Nahkampf:* +9 zum Treffen, 3 m. *Treffer:* 9 (1W8 + 5) Hieb.'],
      ['Manaspeien (Aufladung 5–6)', 'Kegel von 9 m. GE-Rettungswurf SG 16: 22 (5W8) Energie, die Hälfte bei Erfolg.'],
    ],
    legendary: { intro: 'Morgath hat 3 legendäre Aktionen pro Runde, jeweils am Ende des Zugs einer anderen Kreatur.', list: [
      ['Sichelbein (1)', 'Ein Angriff mit dem Sichelbein.'],
      ['Fadenpeitsche (2)', 'Eine Kreatur in 9 m schafft einen GE-Rettungswurf SG 17, sonst wird sie 4,5 m zu Morgath gezogen und liegt am Boden.'],
      ['Untertauchen (2)', 'Er gräbt sich ein und taucht bis zu 12 m entfernt wieder auf, ohne Gelegenheitsangriffe. Kreaturen in 3 m schaffen einen GE-Rettungswurf SG 17 oder liegen am Boden. Nicht, solange er jemanden gepackt hält.'],
    ] },
    lair: { title: 'Hortaktionen · Herzplatz', intro: 'Bei Initiative 20, nie zweimal hintereinander dieselbe.', list: [
      ['Kristallregen', 'Drei Punkte in 36 m, je 3 m Radius: GE-Rettungswurf SG 13, sonst 7 (2W6) Stich.'],
      ['Kuppelflackern', 'Ein Bereich mit 6 m Radius ist bis zur nächsten Initiative 20 völlig dunkel. Morgath sieht trotzdem.'],
      ['Herzpuls (nach Kernhunger)', 'Jede Kreatur in 9 m vom Herz: KO-Rettungswurf SG 14, 10 (3W6) Energie, die Hälfte bei Erfolg.'],
    ] },
    weak: ['**Die Fäden:** Jeder gekappte Faden nimmt ihm Schutz und fügt ihm 3W6 Schaden zu.', 'Schwache Rettungswürfe auf GE, IN und CH.', 'Resistent gegen Energie: *Magisches Geschoss* verpufft halb.', 'Er greift nur auf 3 m an, ausser mit dem Kegel. Fernkämpfer auf den Treppen sind sicherer.', 'Solange er jemanden gepackt hält, kann er nicht untertauchen.'],
  },
}));

add(creature({
  title: 'Ithari-Wächter',
  look: 'Eine schlanke Gestalt aus weissem Kristall und Silber, menschengross, mit Klingen statt Händen und einer glatten Maske ohne Augen. Im Nacken steckt ein leuchtender Faden.',
  lore: 'Die Ithari bauten sie, um ihre Bürger zu schützen. Morgath schob seine Nervenfäden in ihre Nacken und machte sie zu seinen Fingern. Wird der Faden gekappt, kehrt die Erinnerung an ihre alte Aufgabe zurück.',
  fight: 'Sie flankieren, schneiden und schiessen Lichtlanzen auf Zauberwirker. Ohne Furcht und ohne Hass.',
  stat: {
    name: 'Ithari-Wächter', type: 'Mittelgrosses Konstrukt, gesinnungslos', short: true,
    ac: '16 (Kristallpanzer)', hp: '75 (10W8 + 30)', speed: '9 m', abil: [16, 12, 16, 3, 10, 1],
    details: [['Immunitäten', 'Gift, psychisch; bezaubert, Erschöpfung, gelähmt, verängstigt, vergiftet'], ['Sinne', 'Dunkelsicht 18 m, passive Wahrnehmung 10'], ['Sprachen', 'versteht Ithari'], ['Herausforderung', '3 (700 EP) · Übungsbonus +2']],
    traits: [['Mana-Faden', 'Faden im Nacken (RK 14, 15 TP). Gekappt: Der Wächter senkt die Klingen und kämpft nicht mehr. Morgath erleidet Rückkopplung.']],
    actions: [
      ['Mehrfachangriff', 'Zwei Angriffe mit dem Klingenarm.'],
      ['Klingenarm', '*Nahkampf:* +5 zum Treffen, 1,5 m. *Treffer:* 10 (2W6 + 3) Hieb.'],
      ['Lichtlanze (Aufladung 5–6)', '*Fernkampf-Zauber:* +5 zum Treffen, 36 m. *Treffer:* 13 (3W8) gleissend.'],
    ],
    weak: ['**Der Faden im Nacken:** befreien statt zerstören.', 'Langsam (9 m), ausser der Lichtlanze keine Fernangriffe.', 'Konstrukte heilen nicht.'],
  },
}));

add(creature({
  title: 'Kristallkoloss',
  look: 'Ein Wächter, doppelt so hoch wie ein Mensch, aus milchigem Kristall gegossen. Fäuste gross wie Felsblöcke. Wenn er geht, klirrt der Boden.',
  lore: 'Die Ithari stellten Kolosse an die Tore ihrer Stadt. Morgath nutzt sie als Riegel: Wo ein Koloss steht, kommt niemand vorbei.',
  fight: 'Er blockiert Ausgänge, schlägt zu und stampft, wenn Helden ihn umringen.',
  stat: {
    name: 'Kristallkoloss', type: 'Grosses Konstrukt, gesinnungslos', short: true,
    ac: '17 (Kristallpanzer)', hp: '115 (11W10 + 55)', speed: '9 m', abil: [20, 8, 20, 3, 10, 1],
    details: [['Immunitäten', 'Gift, psychisch; bezaubert, Erschöpfung, gelähmt, verängstigt, vergiftet'], ['Sinne', 'Dunkelsicht 18 m, passive Wahrnehmung 10'], ['Sprachen', 'versteht Ithari'], ['Herausforderung', '5 (1800 EP) · Übungsbonus +3']],
    traits: [['Mana-Faden', 'Wie beim Wächter, aber RK 15 und 25 TP.']],
    actions: [
      ['Mehrfachangriff', 'Zwei Faustschläge.'],
      ['Faust', '*Nahkampf:* +8 zum Treffen, 1,5 m. *Treffer:* 14 (2W8 + 5) Wucht.'],
      ['Stampfen (Aufladung 5–6)', 'Jede Kreatur in 3 m: ST-Rettungswurf SG 16, sonst 13 (3W8) Wucht und am Boden. Halber Schaden bei Erfolg.'],
    ],
    weak: ['GE 8: Flächenzauber wie *Feuerball* treffen ihn hart.', 'Langsam, Reichweite nur 1,5 m. Fernkämpfer sind sicher.', 'Auch er hängt an einem Faden.'],
  },
}));

add(creature({
  title: 'Bulette',
  look: 'Ein gepanzerter Koloss mit dem Kopf eines Haifischs, kurzen, kräftigen Beinen und einer Rückenflosse aus Knochenplatten. Bergleute nennen sie Landhai.',
  lore: 'Buletten leben im Gestein und jagen alles, was Erschütterungen macht. Das Grubenhämmern lockte sie an. Jetzt flieht sie vor Morgath nach oben, wütend und hungrig.',
  fight: 'Sie springt aus dem Boden mitten in Gruppen und beisst das nächste Ziel.',
  stat: {
    name: 'Bulette', type: 'Grosse Monstrosität, gesinnungslos',
    ac: '17 (natürliche Rüstung)', hp: '94 (9W10 + 45)', speed: '12 m, Graben 12 m', abil: [19, 11, 21, 2, 10, 5],
    details: [['Fertigkeiten', 'Wahrnehmung +6'], ['Sinne', 'Dunkelsicht 18 m, Erschütterungssinn 18 m, passive Wahrnehmung 16'], ['Herausforderung', '5 (1800 EP)']],
    traits: [['Stehender Sprung', 'Weitsprung bis 9 m, Hochsprung bis 4,5 m, mit oder ohne Anlauf.']],
    actions: [
      ['Biss', '*Nahkampf:* +7 zum Treffen, 1,5 m. *Treffer:* 30 (4W12 + 4) Stich.'],
      ['Tödlicher Sprung', 'Springt sie mindestens 4,5 m, kann sie auf einem Feld mit anderen Kreaturen landen. Jede schafft einen ST- oder GE-Rettungswurf SG 16 (nach Wahl), sonst liegt sie am Boden und erleidet 14 (3W6 + 4) Wucht plus 14 (3W6 + 4) Hieb. Bei Erfolg halber Schaden, und sie wird 1,5 m zur Seite geschoben.'],
    ],
    weak: ['Sie folgt Lärm: Geworfene Steine oder *Thaumaturgie* locken sie weg.', 'Nur ein Biss pro Zug.', 'Sie kann nicht klettern: Die Förderkorb-Plattform schützt, bis sie springt.', 'Flieht unter 30 TP.'],
  },
}));

add(creature({
  title: 'Ankheg',
  look: 'Ein Insekt so gross wie ein Pferd, mit braunem Chitinpanzer und Kieferzangen, von denen Säure tropft. Es riecht nach Essig und feuchter Erde.',
  lore: 'Ankhegs graben Tunnel unter Feldern und Wäldern. Die Grube hat ihre Bauten durchschnitten. Sie sind es, die die Stollen „fressen“.',
  fight: 'Sie brechen aus den Wänden, packen einen Helden und ziehen ihn in den Tunnel.',
  stat: {
    name: 'Ankheg', type: 'Grosse Monstrosität, gesinnungslos', short: true,
    ac: '14 (natürliche Rüstung), 11 am Boden liegend', hp: '39 (6W10 + 6)', speed: '9 m, Graben 3 m', abil: [17, 11, 13, 1, 13, 6],
    details: [['Sinne', 'Dunkelsicht 18 m, Erschütterungssinn 18 m, passive Wahrnehmung 11'], ['Herausforderung', '2 (450 EP)']],
    actions: [
      ['Biss', '*Nahkampf:* +5 zum Treffen, 1,5 m. *Treffer:* 10 (2W6 + 3) Hieb plus 3 (1W6) Säure. Das Ziel ist gepackt (Befreien SG 13). Solange er es hält, beisst er nur dieses Ziel und hat dabei Vorteil.'],
      ['Säurestrahl (Aufladung 6)', 'Nur wenn er niemanden hält. Linie 9 m × 1,5 m: GE-Rettungswurf SG 13, 10 (3W6) Säure, die Hälfte bei Erfolg.'],
    ],
    weak: ['**Am Boden liegend nur RK 11:** Umstossen lohnt sich.', 'Solange er jemanden hält, keine Säure.', 'Nur 39 TP.'],
  },
}));

// ---------- Bestiarium Kapitel 3 ----------
add(chapter('Bestiarium', 'Kreaturen aus Kapitel 3', 'Stufe 11'));
add(L.table('stat', ['Kreatur', 'HG', 'Wo sie auftaucht'], [
  ['**Brannok, die Halbmaschine**', '10', 'Der Angriff'],
  ['**Borka, die Eisenbärin**', '9', 'Der Angriff'],
  ['**Mechaharpyie**', '4', 'Der Angriff'],
  ['**Mechakeiler**', '6', 'Die Goldene Raffinerie'],
  ['**Morgath-Chimäre**', '18', 'Die Goldene Raffinerie'],
  ['**König Severin Vaal**', '2', 'Die Gala, Die Goldene Raffinerie'],
], [3600, 900, L.W - 4500]));
add(L.merke(['**Überlastung:** Alle Mechakreaturen laufen über Manaleitungen. Blitzschaden stört sie für eine Runde. Was genau passiert, steht in jedem Werteblock.'], 'Gilt für alle Mechakreaturen'));

add(creature({
  title: 'Brannok, die Halbmaschine',
  look: 'Ein ergrauter Mann, halb Fleisch, halb Silber. Der linke Arm endet in einer Klaue aus Ithari-Metall, um die Schulter windet sich eine Harpunenkette. Im Nacken glühen drei grüne Steuerknoten. Er weint, während er kämpft.',
  lore: 'Acht Jahre in Tobins Werkstatt, Morgaths Nervenfäden im Nacken. Vaal log ihm vor, die Helden hätten sein Dorf verbrannt. Tobin erzählte ihm nachts die Wahrheit, deshalb geht Brannok zuerst auf Vaal los.',
  fight: 'Er reisst Zauberwirker mit der Harpune zu sich, Borka deckt ihn. Manchmal hält er inne und fleht die Helden an, ihn aufzuhalten.',
  stat: {
    name: 'Brannok, die Halbmaschine', type: 'Mittelgrosser Humanoider (Mensch mit Implantaten), neutral',
    ac: '18 (Ithari-Panzerplatten)', hp: '195 (23W8 + 92)', speed: '12 m, Klettern 9 m', abil: [20, 16, 18, 10, 16, 12],
    details: [['Rettungswürfe', 'ST +9, GE +7, WE +7'], ['Fertigkeiten', 'Athletik +9, Mit Tieren umgehen +11, Wahrnehmung +11'], ['Resistenzen', 'Gift · immun gegen verängstigt'], ['Sinne', 'Dunkelsicht 18 m, passive Wahrnehmung 21 · Gemeinsprache, versteht Tiere'], ['Herausforderung', '10 (5900 EP) · Übungsbonus +4']],
    traits: [
      ['Bestienband', 'Verbündete Tiere in 9 m, auch mechanische, können nicht verängstigt werden.'],
      ['Gesteuert', 'Drei Steuerknoten im Nacken (RK 17, je 25 TP). Sehen SG 15, Fadenschnitt SG 17, *Magie bannen* SG 16.'],
      ['Zerrissener Wille', 'Zu Beginn jedes Zugs W20: Bei **1–4** (**1–8**, wenn in Kapitel 1 verschont) greift er nicht an, sondern bewegt sich nur und spricht. Vaal kann mit der Krone neu würfeln lassen.'],
      ['Erinnerung an Eschental', 'Aktion, Überzeugen SG 15 mit Namen und Dorf: nur ein Angriff in seinem nächsten Zug.'],
      ['Überlastung', 'Nach Blitzschaden würfelt er den nächsten Zerrissenen Willen zweimal, das niedrigere Ergebnis zählt.'],
    ],
    actions: [
      ['Mehrfachangriff', 'Zwei Mechaklauen und eine Harpunenkette.'],
      ['Mechaklaue', '*Nahkampf:* +9 zum Treffen, 1,5 m. *Treffer:* 16 (2W10 + 5) Hieb plus 7 (2W6) Energie.'],
      ['Harpunenkette', '*Nah- oder Fernkampf:* +9 zum Treffen, 9 m. *Treffer:* 12 (2W6 + 5) Stich. ST-Rettungswurf SG 17, sonst wird das Ziel 6 m zu Brannok gezogen.'],
    ],
    bonus: [['Meutenbefehl', 'Ein Tier in 18 m bewegt sich halb und greift einmal an. Befreit übernimmt er damit einen Mechakeiler.']],
    weak: ['**Die drei Steuerknoten** im Nacken. Alle Wege zur Befreiung: Kapitel 3, Der Angriff.', 'Sein Wille ist nicht gebrochen: In manchen Zügen greift er nicht an.', 'Name und Eschental lassen ihn zaudern, Blitzschaden stört die Steuerung.', 'Wer Borka beruhigt, befreit ihn.'],
  },
}));

add(creature({
  title: 'Borka, die Eisenbärin',
  look: 'Dieselbe Bärin, dieselben Augen, das eingerissene Ohr. Doch Schultern und Flanken sind mit Stahlplatten verschraubt, in den Vorderbeinen zischen Kolben. Wenn sie läuft, klingt es wie eine Schmiede.',
  lore: 'Vaals Jäger fingen sie mit Brannok. Tobin panzerte sie, weil Vaal ein Tier wollte, das niemand aufhält. Starb sie in Kapitel 1, wurde sie aus ihren Überresten neu gebaut. Sie erkennt Brannok trotzdem.',
  fight: 'Sie stürmt auf jeden zu, der Brannok bedroht, und schlägt zurück, wenn er getroffen wird.',
  stat: {
    name: 'Borka, die Eisenbärin', type: 'Grosses Tier (mechanisch verstärkt), gesinnungslos',
    ac: '17 (Stahlplatten)', hp: '189 (18W10 + 90)', speed: '12 m, Klettern 9 m', abil: [23, 10, 20, 3, 13, 7],
    details: [['Rettungswürfe', 'ST +10, KO +9'], ['Fertigkeiten', 'Wahrnehmung +5'], ['Resistenzen', 'Gift'], ['Sinne', 'passive Wahrnehmung 15'], ['Herausforderung', '9 (5000 EP) · Übungsbonus +4']],
    traits: [
      ['Gebundene Seele', 'Wird Brannok befreit oder fällt er auf 0 TP, hört Borka sofort auf zu kämpfen.'],
      ['Kolbenansturm', 'Nach 6 m geradem Anlauf und einem Klauentreffer: zusätzlich 9 (2W8) Wucht, ST-Rettungswurf SG 18 oder am Boden.'],
      ['Beruhigen', 'Aktion in 1,5 m: Mit Tieren umgehen SG 18 (SG 20, wenn neu gebaut). Erfolg: Borka greift eine Runde nicht an. Nach 3 Erfolgen (2, wenn Brannok verschont wurde) ist Brannok befreit.'],
      ['Überlastung', 'Erleidet sie Blitzschaden, kann sie bis zum Ende ihres nächsten Zugs keine Reaktionen nutzen.'],
    ],
    actions: [
      ['Mehrfachangriff', 'Ein Biss und zwei Klauenangriffe.'],
      ['Biss', '*Nahkampf:* +10 zum Treffen, 1,5 m. *Treffer:* 17 (2W10 + 6) Stich.'],
      ['Klauen', '*Nahkampf:* +10 zum Treffen, 1,5 m. *Treffer:* 15 (2W8 + 6) Hieb.'],
    ],
    reactions: [['Schutz des Meisters', 'Wird Brannok in 3 m getroffen, macht Borka einen Klauenangriff gegen den Angreifer, falls er in Reichweite ist.']],
    weak: ['Bricht Brannoks Steuerung, hört sie sofort auf.', 'Ruhiger Umgang beschäftigt sie und befreit am Ende Brannok.', 'Blitzschaden lähmt ihre Reflexe.', 'Der Kolbenansturm braucht 6 m Anlauf.'],
  },
}));

add(creature({
  title: 'Mechaharpyie',
  look: 'Eine Harpyie mit Flügeln aus gestanzten Stahlfedern und Krallen aus Ithari-Metall. Das Gesicht ist noch das einer Frau, aber ihr Kreischen kommt aus einem Messingrohr in der Kehle.',
  lore: 'Nachfahren der Harpyien von Eschental, gefangen und von Tobin umgebaut. Sie gehorchen Brannoks Bestienband, nicht Vaal.',
  fight: 'Sie stürzen sich aus der zerbrochenen Kuppel, schlagen zu und steigen wieder auf. Sie kreischen auf Gruppen und schnappen sich Gäste.',
  stat: {
    name: 'Mechaharpyie', type: 'Mittelgrosse Monstrosität (mechanisch verstärkt), chaotisch böse', short: true,
    ac: '15 (Stahlfedern)', hp: '90 (12W8 + 36)', speed: '6 m, Fliegen 18 m', abil: [12, 16, 16, 7, 10, 14],
    details: [['Sinne', 'passive Wahrnehmung 10'], ['Sprachen', 'Gemeinsprache'], ['Herausforderung', '4 (1100 EP) · Übungsbonus +2']],
    traits: [
      ['Vorbeiflug', 'Löst keine Gelegenheitsangriffe aus, wenn sie aus der Reichweite eines Feindes fliegt.'],
      ['Sturzflug', 'Nach mindestens 9 m Flug auf ein Ziel und einem Treffer: zusätzlich 7 (2W6) Hieb.'],
      ['Überlastung', 'Erleidet sie Blitzschaden, verliert sie bis zum Ende ihres nächsten Zugs Vorbeiflug, und ihr Flug halbiert sich.'],
    ],
    actions: [
      ['Mehrfachangriff', 'Zwei Angriffe mit den Stahlkrallen.'],
      ['Stahlkrallen', '*Nahkampf:* +5 zum Treffen, 1,5 m. *Treffer:* 10 (2W6 + 3) Hieb.'],
      ['Kreischen (Aufladung 5–6)', 'Jede Kreatur in 9 m: KO-Rettungswurf SG 13, sonst 14 (4W6) Schall und bis Ende ihres nächsten Zugs taub. Halber Schaden bei Erfolg.'],
    ],
    weak: ['Am Boden langsam (6 m).', 'Blitzschaden stört ihre Flügel.', 'Ohne Brannok fliehen sie nach einer Runde.', 'Wer einen Gast trägt, lässt ihn bei einem Treffer fallen.'],
  },
}));

add(creature({
  title: 'Mechakeiler',
  look: 'Ein Riesenkeiler mit Stahlpanzer von der Schnauze bis zum Schwanz. Die Hauer sind geschliffene Ithari-Klingen, aus den Flanken steigt Dampf.',
  lore: 'Enkel der Keiler von Eschental, umgebaut als Wachtiere der Raffinerie. Sie gehorchen der Krone. Doch Brannok kennt ihre Art seit seiner Kindheit, und ihr Blut erinnert sich an ihn.',
  fight: 'Er nimmt Anlauf, rammt Helden um und trampelt auf ihnen herum. Vaal schickt ihn auf Heiler.',
  stat: {
    name: 'Mechakeiler', type: 'Grosses Tier (mechanisch verstärkt), gesinnungslos', short: true,
    ac: '17 (Stahlpanzer)', hp: '126 (12W10 + 60)', speed: '12 m', abil: [20, 10, 20, 2, 9, 5],
    details: [['Resistenzen', 'Gift'], ['Sinne', 'passive Wahrnehmung 9'], ['Herausforderung', '6 (2300 EP) · Übungsbonus +3']],
    traits: [
      ['Ansturm', 'Nach 6 m geradem Anlauf und einem Treffer: zusätzlich 10 (3W6) Hieb, ST-Rettungswurf SG 16 oder am Boden.'],
      ['Unerbittlich (1/Tag)', 'Würde er durch 20 oder weniger Schaden auf 0 TP fallen, sinkt er stattdessen auf 1 TP.'],
      ['Gesteuert', 'Gehorcht Vaal. Ein befreiter Brannok übernimmt ihn mit einer Bonusaktion ohne Wurf.'],
      ['Überlastung', 'Erleidet er Blitzschaden, kann er bis zum Ende seines nächsten Zugs keine Bonusaktionen nutzen.'],
    ],
    actions: [['Stahlhauer', '*Nahkampf:* +8 zum Treffen, 1,5 m. *Treffer:* 21 (3W10 + 5) Stich.']],
    bonus: [['Trampeln', '*Nahkampf* gegen ein liegendes Ziel: +8 zum Treffen, 1,5 m. *Treffer:* 14 (2W8 + 5) Wucht.']],
    weak: ['Ohne 6 m Anlauf kein Ansturm.', 'Blitzschaden: kein Trampeln.', 'Ein befreiter Brannok übernimmt ihn sofort.'],
  },
}));

add(creature({
  title: 'Die Morgath-Chimäre',
  look: 'Morgath, wiedererweckt und verplattet. Stahlringe umschliessen den Leib, Kabel bündeln sich im Rücken wie Sehnen, aus einer Kanone im Rachen glüht das Licht der Machtader. Auf dem Nacken thront Vaal in einer Kapsel aus Kristall.',
  lore: 'Vaal liess Morgaths Kadaver bergen. Tobin fand heraus, dass in ihm noch ein Funke lebte, und Vaal befahl, ihn zu wecken. Zehn Jahre wuchs unter der Raffinerie eine Waffe heran, die nur einem gehorcht. Die Waagenkrone trägt Morgaths Herzknoten: Wer sie trägt, führt das Tier.',
  fight: 'In Phase 1 kämpft sie wie ein General. In Phase 2 ist Morgath nur noch ein rasendes Tier.',
  stat: {
    name: 'Morgath-Chimäre · Phase 1', type: 'Gigantische Monstrosität (biomechanisch), gesinnungslos',
    ac: '19 (Stahlpanzer)', hp: '245 (14W20 + 98)', speed: '12 m, Klettern 12 m', abil: [26, 10, 24, 6, 12, 8],
    details: [['Rettungswürfe', 'ST +14, KO +13, WE +7'], ['Immunitäten', 'Gift, psychisch; bezaubert, gelähmt, liegend, verängstigt, vergiftet'], ['Sinne', 'Blindsicht 18 m, Erschütterungssinn 36 m, passive Wahrnehmung 11'], ['Sprachen', 'keine (Vaal spricht durch die Kapsel)'], ['Herausforderung', '18 (20 000 EP für beide Phasen) · Übungsbonus +6']],
    traits: [
      ['Legendäre Resistenz (3/Tag)', 'Gilt für beide Phasen zusammen.'],
      ['Belagerungsmonster', 'Doppelter Schaden an Objekten und Gebäuden.'],
      ['Pilotenkapsel', 'Vaal sitzt in 9 m Höhe in einer Kristallkapsel (RK 20, 60 TP, immun gegen Gift und psychisch) mit vollständiger Deckung. Zerstört: Vaal stürzt heraus (3W6 Wucht, liegend), Phase 2 beginnt.'],
      ['Herz von Ithrael (gesichert)', 'Die Chimäre nutzt die Hortaktionen der Raffinerie.'],
      ['Instabiler Kern (zerstört)', '30 TP weniger, keine Hortaktionen, Kernkanone lädt nur bei 6. Bei Initiative 20 W6: Bei 1–2 erleidet die Chimäre 15 Energie.'],
      ['Phasenwechsel', 'Bei 0 TP oder zerstörter Kapsel beginnt Phase 2 mit 100 TP (oder den verbleibenden TP, falls mehr).'],
      ['Überlastung', 'Erleidet sie Blitzschaden, kann sie bis zum Ende ihres nächsten Zugs keine Bonusaktionen nutzen.'],
    ],
    actions: [
      ['Mehrfachangriff', 'Ein Mandibelbiss und zwei Sichelbeine.'],
      ['Mandibelbiss', '*Nahkampf:* +14 zum Treffen, 4,5 m. *Treffer:* 24 (3W10 + 8) Stich plus 9 (2W8) Energie. Das Ziel ist gepackt (Befreien SG 20).'],
      ['Sichelbein', '*Nahkampf:* +14 zum Treffen, 4,5 m. *Treffer:* 17 (2W8 + 8) Hieb.'],
      ['Kernkanone (Aufladung 5–6)', 'Linie 36 m × 3 m: GE-Rettungswurf SG 20, 55 (10W10) Energie, die Hälfte bei Erfolg.'],
    ],
    bonus: [['Fadenspinner', 'Der Mechakeiler in 36 m nutzt seine Reaktion für volle Bewegung und einen Angriff.']],
    legendary: { intro: '3 legendäre Aktionen pro Runde, am Ende des Zugs einer anderen Kreatur.', list: [
      ['Kriechen (1)', 'Halbe Bewegung ohne Gelegenheitsangriffe.'],
      ['Sichelhieb (2)', 'Ein Angriff mit dem Sichelbein.'],
      ['Fadenstoss (2)', 'Vaal schiesst einen Steuerfaden auf eine Kreatur in 18 m: WE-Rettungswurf SG 19, sonst bis Ende ihres nächsten Zugs bezaubert. Vaal bestimmt ihre Bewegung, und sie greift ein Ziel seiner Wahl an.'],
      ['Stampfen (3)', 'Jede Kreatur in 6 m: ST-Rettungswurf SG 20, sonst 13 (3W8) Wucht und am Boden. Halber Schaden bei Erfolg.'],
    ] },
    lair: { title: 'Hortaktionen · Raffinerie', intro: 'Nur mit gesichertem Herz. Bei Initiative 20, nie zweimal hintereinander dieselbe.', list: [
      ['Manadampf', 'Bereich mit 6 m Radius: KO-Rettungswurf SG 18, 18 (4W8) Energie, die Hälfte bei Erfolg.'],
      ['Kran schwingt', 'Linie 18 m × 3 m: GE-Rettungswurf SG 18, 22 (4W10) Wucht und am Boden. Halber Schaden bei Erfolg.'],
      ['Kernpuls', 'Die Chimäre erhält 30 temporäre TP.'],
    ] },
    extra: [{ title: 'Phase 2 · Morgath entfesselt', list: [
      'RK 17, 100 TP, Bewegungsrate 15 m. Kapsel, Fadenspinner und Fadenstoss entfallen.',
      ['Raserei', 'Greift immer die nächste Kreatur an, auch Vaal.'],
      ['Mehrfachangriff', 'Ein Mandibelbiss und drei Sichelbeine.'],
      ['Manaspeien (Aufladung 5–6)', 'Ersetzt die Kernkanone. Kegel von 12 m: GE-Rettungswurf SG 20, 44 (8W10) Energie, die Hälfte bei Erfolg.'],
      ['Legendäre Aktionen', 'Kriechen (1), Sichelhieb (2), Stampfen (3).'],
      ['Bändigung', 'Brannok kann Morgath bändigen (Kapitel 3, Die Goldene Raffinerie).'],
    ] }],
    weak: ['**Die Pilotenkapsel:** Wer sie zerstört, wirft Vaal heraus und überspringt den Rest von Phase 1.', 'Schwache Rettungswürfe auf GE, IN und CH.', 'Blitzschaden kappt Vaals Befehl an den Keiler für eine Runde.', 'Herz zerstört: Der Kern schadet ihr selbst.', 'Phase 2: Morgath lässt sich weglocken und von Brannok bändigen.'],
  },
}));

add(creature({
  title: 'König Severin Vaal',
  look: 'Ein silberhaariger Mann in Weinrot und Gold, der Waagenring am Finger, die Krone mit dem grünen Herzknoten auf dem Kopf. Er kämpft nicht. Er lässt kämpfen.',
  lore: 'Seine Geschichte steht bei den Figuren. Ohne Krone, Garde und Chimäre ist er ein alternder Händler mit einem Rapier.',
  fight: 'An der Gala steht er hinter der Garde und dreht an der Krone. In der Raffinerie sitzt er in der Kapsel.',
  stat: {
    name: 'König Severin Vaal', type: 'Mittelgrosser Humanoider (Mensch), rechtschaffen böse', short: true,
    ac: '15 (Ithari-Schildbrosche)', hp: '52 (8W8 + 16)', speed: '9 m', abil: [10, 12, 14, 16, 14, 18],
    details: [['Rettungswürfe', 'WE +4, CH +6'], ['Fertigkeiten', 'Geschichte +5, Motiv erkennen +6, Täuschen +8, Überzeugen +8'], ['Sinne', 'passive Wahrnehmung 12'], ['Sprachen', 'Gemeinsprache, Zwergisch, Ithari'], ['Herausforderung', '2 (450 EP)']],
    traits: [
      ['Waagenkrone', 'Bonusaktion: Vaal dreht am Herzknoten, Brannok wiederholt seinen Wurf für Zerrissenen Willen. Bemerken: Wahrnehmung SG 15.'],
      ['Garde', 'Wer zu Vaal will, drängt sich an der Garde vorbei: Athletik oder Akrobatik SG 15. Die Garde greift nicht an.'],
    ],
    actions: [['Rapier', '*Nahkampf:* +3 zum Treffen, 1,5 m. *Treffer:* 5 (1W8 + 1) Stich.']],
    reactions: [['Ithari-Schildbrosche (3/Tag)', '+5 RK gegen einen Angriff, der ihn treffen würde.']],
    weak: ['**Die Krone:** Wer sie ihm entreisst, nimmt ihm alle Macht über Brannok.', 'Die Garde schützt ihn, kämpft aber nicht für ihn.', 'Nur 52 TP.', 'Er redet gern über Preise. Wer ihn zum Reden bringt, gewinnt Zeit.'],
  },
}));

module.exports = out;
