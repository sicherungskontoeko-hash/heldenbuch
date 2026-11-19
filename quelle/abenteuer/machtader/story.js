// Geschichte: Titelseite bis Epilog
const L = require('./lib');
const { d, W, SERIF, SANS, C, P, chapter, scene, sub, vorlese, dm, loot, merke, kampf, table, probe, label, numbered, bullet, spacer } = L;
const { Paragraph, TextRun, AlignmentType, PageBreak } = d;

const out = [];
const add = (...x) => x.forEach((e) => (Array.isArray(e) ? out.push(...e) : out.push(e)));

// ---------- Titelseite ----------
const center = (text, run, before = 0, after = 0) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before, after }, children: [new TextRun({ text, ...run })] });
add(
  center('DIE MACHTADER', { font: SERIF, size: 96, bold: true, color: C.red, characterSpacing: 40 }, 3200, 120),
  center('❧   ✦   ❧', { font: SERIF, size: 28, color: C.wahl[1] }, 0, 240),
  center('Ein Eintagesabenteuer für Dungeons & Dragons 5e', { font: SERIF, size: 30, italics: true, color: C.brown }, 0, 120),
  center('Fünf Helden  ·  Stufe 3, 5 und 11  ·  rund zehn Stunden', { font: SANS, size: 22, color: '555555' }, 0, 1600),
  center('„Alles hat seinen Preis.', { font: SERIF, size: 26, italics: true, color: C.brown }, 0, 40),
  center('Die Frage ist nur, wer ihn bezahlt.“', { font: SERIF, size: 26, italics: true, color: C.brown }, 0, 0),
);

// ---------- Auf einen Blick ----------
add(chapter('Übersicht', 'Auf einen Blick', null));
add(table('figur', ['Teil', 'Stufe', 'Schauplatz', 'Endgegner', 'Dauer'], [
  ['**Kapitel 1** · Der Auftrag der Golden Scale', '3', 'Kronhafen, Fallbrück, Eschental', 'Brannok und Borka', '2½ h'],
  ['**Zwischenspiel** · Drei Jahre', '3 → 5', '–', '–', '45 min, mit Essen'],
  ['**Kapitel 2** · Die versunkene Stadt', '5', 'Grube Eschental, Ithrael', 'Morgath, der Aderfresser', '2¾ h'],
  ['**Zwischenspiel** · Zehn Jahre', '5 → 11', '–', '–', '20 min'],
  ['**Kapitel 3** · Die Galafeier', '11', 'Spiegelsaal, Goldene Raffinerie', 'Morgath-Chimäre mit Vaal', '2¾ h'],
  ['**Epilog**', '–', 'Eschental', '–', '20 min'],
], [3000, 900, 2338, 2200, 1200]));

add(L.label('So liest du dieses Buch', C.figur[1]));
add(L.box('vorlese', 'Vorlesetext', [P('Kursiver Text in dieser Farbe wird den Spielern vorgelesen.', { after: 0 })], { icon: '❧' }));
add(L.box('dm', 'Spielleitung', [P('Nur für dich: Hintergründe, Hinweise und Regeln.', { after: 0 })], { icon: '◆' }));
add(L.box('kampf', 'Kampf', [P('Gegner, Gelände, Taktik und wann der Kampf endet. Die Werte stehen im Bestiarium.', { after: 0 })], { icon: '⚔' }));
add(L.label('⚄  Probe · Lila Tabellen', C.probe[1]), P('Proben mit Schwierigkeitsgrad und den Folgen bei Erfolg und Misserfolg.'));
add(L.box('wahl', 'Merke dir', [P('Entscheidungen der Spieler, die spätere Kapitel verändern. Schreib sie auf.', { after: 0 })], { icon: '!' }));
add(L.box('loot', 'Loot', [P('Was die Helden finden, verdienen oder geschenkt bekommen.', { after: 0 })], { icon: '✦' }));

// ---------- Prolog ----------
add(chapter('Prolog', 'Die Ader unter Eschental', null));
add(vorlese([
  'Lange bevor es Königreiche gab, bauten die Ithari mit Licht. Ihre Städte glänzten wie Kristall, ihre Wächter gingen auf silbernen Füssen, und alles nährte sich aus den Adern, die tief unter der Erde fliessen: Ströme aus reinem Mana.',
  'Doch wer mit Licht baut, streitet irgendwann darum. Die Städte der Ithari führten Krieg gegeneinander, bis nur noch eine übrig war. Ihr Name war Ithrael. Und eines Tages war auch sie verschwunden.',
  'Tausend Jahre später liegt über einer dieser Adern ein kleines Dorf am Waldrand. Es heisst Eschental. Seine Bewohner wissen nichts von dem, was unter ihnen fliesst. Sie wissen nur, dass ihre Felder gut tragen, dass die Tiere im Wald zahm sind und dass der Jäger Brannok mit einer Bärin spricht, als wäre sie seine Schwester.',
  'In einer Frühlingsnacht brennt Eschental nieder.',
]));
add(dm('Spielleitung · Was wirklich geschah', [
  '**Severin Vaal**, Herr der Händlergilde Golden Scale, fand unter Eschental die Machtader. Das Dorf wollte zweimal nicht verkaufen. Also schickte Vaal Söldner mit Lampenöl. Die Dorfleute flohen in die Wälder. Die offizielle Version: ein Bestienangriff.',
  '**Brannok Hornhand** war in jener Nacht auf der Jagd und kennt nur die offizielle Version. Er greift jeden Gildenmann an, der sich nähert, weil die Gilde sich das Land seiner Familie holen will.',
  'Die Helden dienen Vaal zweimal, ohne es zu wissen: In Kapitel 1 vertreiben sie Brannok, in Kapitel 2 holen sie die Technik aus Ithrael. In Kapitel 3 kommt die Wahrheit ans Licht.',
  '**Das Muster:** Gesteuerte Wesen hängen an leuchtenden Mana-Fäden. In Kapitel 2 lernen die Helden, Fäden zu kappen. In Kapitel 3 retten sie damit Brannok.',
]));
add(merke([
  'Jeder Spieler bringt seinen Charakter auf **Stufe 3, 5 und 11** fertig gebaut mit. Der Aufstieg von 5 auf 11 passt in keine Pause.',
  'Alle Helden sind frisch aufgenommene **Gildenklingen der Golden Scale**. Jeder Spieler kennt einen Grund, warum er beigetreten ist.',
  'Was in den Zwischenjahren geschieht, erzählen die Spieler live.',
], 'Vor dem Spieltag'));

// ---------- Kapitel 1 ----------
add(chapter('Kapitel 1', 'Der Auftrag der Golden Scale', 'Stufe 3 · etwa 2½ Stunden · Kronhafen, Fallbrück, Eschental'));
add(P('Drei Monate nach dem Brand ist Eschental eine Wunde am Waldrand. Wer sich nähert, wird angegriffen: von Keilern, Wölfen, Harpyien und einer Bärin, grösser als ein Pferd. Die Golden Scale wählt die Helden, um dort aufzuräumen, und die Helden halten das für eine Ehre.'));

add(scene('Die Gildenhalle von Kronhafen'));
add(vorlese(['Die Halle der Golden Scale riecht nach Wachs, Gewürzen und neuem Geld. Über dem Kamin hängt eine goldene Waage, gross wie ein Wagenrad. Heute steht ihr nicht als Bittsteller hier, sondern als neue Gildenklingen. Ein Mann mit grauen Schläfen tritt vor, dreht einen goldenen Ring am Finger und lächelt, als hätte er genau euch erwartet.']));
add(P('Vaal heftet jedem Helden ein Messingabzeichen an. Lass dabei jeden Spieler in einem Satz erzählen, was sein Charakter mit seiner neuen Unterklasse gerade gelernt hat.'));
add(vorlese(['„Bei Eschental greifen Bestien jeden an, der sich nähert. Zwei Vermessungstrupps verletzt, eine Karawane zerrissen. Dieselben Bestien haben das Dorf vor drei Monaten niedergebrannt. Ein Jäger aus dem Dorf soll sie anführen. Bringt Frieden nach Eschental. Die Gilde zahlt dreihundert Goldmünzen, und ihr seid danach keine Neulinge mehr.“'], 'Vorlesetext · Vaals Auftrag'));
add(probe('Motiv erkennen', [
  ['SG 15 bei Vaal', 'Er sagt die Wahrheit über die Angriffe. Aber er lässt etwas weg.'],
  ['SG 13 bei Tobin', 'Der junge Schreiber wird blass, als Vaal „niedergebrannt“ sagt.'],
]));
add(dm(null, [
  '**Tobin Fink**, der Gildenschreiber, begleitet die Gruppe und führt das Auftragsbuch.',
  'Fragt ein Spieler, wie Bestien Häuser anzünden, antwortet Vaal ruhig: *„Laternen, Herdfeuer, Panik. Ein Dorf aus Holz brennt schnell.“*',
]));
add(loot(['**4 Heiltränke** (je 2W4 + 2) aus dem Gildenlager', '**Gildenabzeichen** aus Messing für jeden Helden']));

add(scene('Die Waldstrasse'));
add(vorlese(['Am zweiten Reisetag hört ihr das Brüllen eines Ochsen, dann splitterndes Holz. Vor euch liegt ein umgestürzter Karren, darunter kauert ein Bauer. Um ihn kreisen Keiler, grösser als jeder, den ihr kennt. Unter ihren Borsten pulsieren Adern in hellem Blau.']));
add(kampf('Die Keiler', {
  gegner: '2 Manaverseuchte Riesenkeiler',
  gelaende: 'Waldstrasse, der umgestürzte Karren gibt halbe Deckung. Bäume am Rand nehmen den Keilern den Anlauf.',
  taktik: 'Die Keiler weichen zurück, um 6 m Anlauf für den Ansturm zu nehmen. Sie fliehen nicht.',
  ende: 'Liegst du hinter dem Zeitplan, streich diesen Kampf.',
}));
add(P('Naturkunde SG 13 nach dem Kampf: Die leuchtenden Adern stammen von Mana. Bauer **Jost** bedankt sich zitternd: *„Seit dem Brand ist der Wald verrückt. Vorher waren die Tiere ruhig. Dafür hat Brannok gesorgt.“*'));
add(loot(['**15 GM** und ein Krug Apfelmost von Bauer Jost', '**2 Manahauer** von den Riesenkeilern. Ein Alchemist in Fallbrück zahlt je 25 GM.']));

add(scene('Fallbrück und der Krumme Keiler'));
add(vorlese(['Fallbrück besteht aus einer Steinbrücke, zwanzig Häusern und einem Gasthaus, dessen Schild einen Keiler mit krummem Hauer zeigt. Drinnen ist es warm und laut. Die Wirtin, eine runde Halblingsfrau mit Mehl an der Schürze, mustert eure Abzeichen länger, als höflich wäre.']));
add(P('**Mareike Torf** mag die Gilde nicht, aber sie mag Gäste, die zuhören.'));
add(probe('Überzeugen bei Mareike', [
  ['Erfolg · SG 13', 'Vier Gerüchte nach deiner Wahl. Dazu drückt sie jedem ein Kügelchen **Bienenwachs** in die Hand: *„Für die Ohren. Im Eschenwald singen Dinge, die man nicht hören will.“*'],
  ['Teilerfolg · SG 10', 'Zwei Gerüchte.'],
  ['Misserfolg', 'Nur Gerücht 5.'],
]));
add(table('vorlese', ['W6', 'Gerücht', 'Wahr?'], [
  ['1', '*„Brannok war der beste Jäger im Tal. Seine Bärin Borka hat meinen Kindern Honigwaben gebracht.“*', 'ja'],
  ['2', '*„In der Brandnacht roch es nach Lampenöl, nicht nach Tier.“*', '**ja, Hinweis**'],
  ['3', '*„Gildenleute wollten Eschental zweimal kaufen. Die Dorfleute haben abgelehnt.“*', '**ja, Hinweis**'],
  ['4', '*„Die meisten aus Eschental sind in die Wälder geflohen. Zurück will keiner.“*', 'ja'],
  ['5', '*„Brannok hat einen Pakt mit etwas Dunklem geschlossen. Deshalb leuchten die Tiere.“*', 'nein'],
  ['6', '*„Im Dorfplatz klafft seit dem Brand ein Spalt, der nachts blau leuchtet.“*', 'ja'],
], [700, W - 700 - 1500, 1500]));
add(dm(null, [
  'Redet ein Held freundlich mit Tobin, gibt dieser zu: *„Ich habe die Vermessungsberichte geschrieben. Unter Eschental liegt etwas Wertvolles.“* Mehr weiss er noch nicht.',
  'Die Gruppe macht im Gasthaus eine **lange Rast**.',
]));
add(merke(['War die Gruppe **freundlich zu Tobin**? Das zählt in Kapitel 3.']));
add(loot(['**Bienenwachs** (bei Erfolg): Wer es in den Ohren trägt, ist taub und hört den Lockgesang der Harpyien nicht.']));

add(scene('Der Eschenwald'));
add(P('In die Stämme am Weg sind Waagen geritzt und durchgestrichen. Darunter steht: *„Kehrt um, Gildenhunde.“*'));
add(probe('Überlebenskunst SG 13 · Gruppenprobe', [
  ['Erfolg', 'Die Helden finden den Pfad und können die Harpyien überraschen.'],
  ['Teilerfolg', 'Beide Seiten bemerken sich gleichzeitig.'],
  ['Misserfolg', 'Die Harpyien überraschen die Helden.'],
]));
add(vorlese(['Zwischen den Eschen hängt ein Lied, so schön, dass es wehtut. Es kommt von oben. Auf den Ästen hocken Gestalten mit Flügeln, halb Frau, halb Vogel, und ihre Federn sind von blauen Adern durchzogen. Unten im Unterholz knurrt etwas.']));
add(kampf('Lieder im Eschenwald', {
  gegner: '3 Manaharpyien, 1 Schreckenswolf, 2 Wölfe',
  gelaende: 'Lichtung zwischen hohen Eschen. Die Harpyien sitzen in 9 m Höhe in den Ästen.',
  taktik: 'Immer nur eine Harpyie singt, die anderen holen sich bezauberte Helden. Die Wölfe kreisen ein.',
  ende: 'Harpyien unter 10 TP fliehen. Danach ruft Brannok aus den Baumkronen: *„Ich habe euch gewarnt. Geht nach Hause.“* Am Waldrand bleibt Zeit für eine **kurze Rast**.',
}));
add(loot(['**Harpyiennest** in 9 m Höhe (Athletik SG 12): 40 GM in alten Münzen, ein Silberring (25 GM) und 1 Heiltrank']));

add(scene('Die Ruinen von Eschental'));
add(vorlese([
  'Wo Eschental stand, ragen schwarze Kaminstümpfe aus der Asche. Gras wächst schon wieder zwischen den Mauern. In der Mitte des Dorfplatzes klafft ein Spalt, aus dem blaues Licht steigt. Auf dem Brunnenrand steht ein Mann mit einem Jagdspeer. Hinter ihm erhebt sich eine Bärin, grösser als ein Pferd, und in ihrem Fell glühen blaue Adern.',
  '„Ihr tragt ihre Waage“, sagt der Mann. „Ihr kommt, um zu holen, was die Bestien übrig gelassen haben. Das hier gehört den Toten. Geht. Oder kämpft.“',
]));
add(P('Brannok lässt sich nicht anwerben. Ehrliche Worte merkt er sich trotzdem. Er greift an, sobald jemand den Dorfplatz betritt oder das Gespräch endet.'));
add(kampf('Der Jäger von Eschental', {
  gegner: 'Brannok, Borka, 1 Manaverseuchter Riesenkeiler, 1 Manaharpyie',
  gelaende: 'Ruinenmauern geben halbe Deckung, der eingestürzte Glockenturm ist 4,5 m hoch. Der **Manaspalt** ist 3 m breit und 12 m lang: Wer hineingestossen wird, schafft einen GE-Rettungswurf SG 13 und hält sich fest. Sonst erleidet er 2W6 Energieschaden und hängt am Rand (Athletik SG 10 zum Hochklettern).',
  taktik: 'Brannok schiesst vom Brunnen und schickt jede Runde Borka los. Der Keiler stürmt, die Harpyie singt.',
  ende: 'Bei 15 TP oder weniger lässt Brannok den Speer fallen: *„Dann tut es. Wie eure Gilde.“*',
}));
add(L.label('!  Entscheidung · Was geschieht mit Brannok?', C.wahl[1]));
add(table('wahl', ['Die Helden …', 'Was geschieht'], [
  ['verschonen ihn', 'Brannok geht mit Borka in den Wald: *„Sagt eurer Gilde: Eschental gehört den Toten.“*'],
  ['wollen ihn töten, Borka lebt', 'Borka packt Brannok am Mantel und flieht mit ihm (24 m). Jeder Held in Reichweite erhält einen Gelegenheitsangriff.'],
  ['wollen ihn töten, Borka ist tot', 'Brannok wirft sich in den Manaspalt. Das blaue Licht verschluckt ihn. Es gibt keine Leiche.'],
  ['nehmen ihn gefangen', 'Die Gilde übernimmt ihn, Borka befreit ihn auf dem Transport. Zählt als verschont.'],
], [2800, W - 2800], { boldFirst: true }));
add(merke(['Wurde Brannok **verschont**? Lebt **Borka**? Beides verändert Kapitel 3.']));
add(P('Nachforschungen SG 15 in der Ruine des Dorfältesten: Im verkohlten Türrahmen steckt ein Armbrustbolzen mit eingeprägter Waage, dem Stempel der Golden Scale. Tobin wird kreidebleich.'));
add(loot([
  '**Gildenbolzen** mit dem Stempel der Golden Scale: Beweisstück für Kapitel 3',
  '**Holzperle aus Brannoks Bart**, im Kampf abgerissen. Zeigt ein Held sie Brannok in Kapitel 3, zählt das als ein Erfolg beim Beruhigen von Borka.',
  '**Truhe des Dorfältesten** unter verkohlten Dielen (Wahrnehmung SG 13): 30 GM und 2 Heiltränke',
]));

add(scene('Rückkehr nach Kronhafen'));
add(vorlese(['Kronhafen empfängt euch mit Fahnen. Die Golden Scale lässt Wein ausschenken, Musikanten spielen, und auf dem Gildenplatz ruft jemand eure Namen. Vaal hebt sein Glas und wartet, bis es still wird. „Ihr habt der Gilde einen grossen Dienst erwiesen. Ich vergesse nie, wem ich etwas schulde.“']));
add(P('Vaal bietet jedem Helden etwas an, das zu ihm passt: einen Posten, eine Werkstatt, ein Kommando, eine Reise. Das sind Ideen für das Zwischenspiel, keine Pflicht.'));
add(dm(null, ['Zeigen die Helden Vaal den Bolzen, bleibt er ruhig: *„Unsere Vermesser kamen nach dem Angriff zu Hilfe und schossen auf die Bestien. Gebt ihn mir, ich lasse das prüfen.“* Geben sie ihn ab, ist der Beweis verloren.']));
add(merke(['Haben die Helden den **Bolzen behalten**? Dann haben sie in Kapitel 3 einen zweiten Beweis.']));
add(loot(['**300 GM** für die Gruppe und **50 GM** Bonus pro Held', '**Voller Gildenrang** in der Golden Scale']));

// ---------- Zwischenspiel 1 ----------
add(chapter('Zwischenspiel', 'Drei Jahre', 'Die Helden steigen auf Stufe 5 · während des Mittagessens'));
add(vorlese([
  'Drei Winter ziehen über Erendal. Eure Namen werden in Gasthäusern gesungen, meist falsch, aber laut. Die Golden Scale ist reicher denn je, und wo einst Eschental brannte, dreht sich jetzt ein Förderrad aus schwarzem Eisen. Ihr seid nicht mehr die Neuen mit den Messingabzeichen. Ihr habt euch einen Platz in dieser Welt geschaffen.',
  'Erzählt uns, welchen.',
]));
add(L.label('Drei Fragen an jeden Spieler', C.brown));
add(numbered('Welche Rolle hast du jetzt in der Gesellschaft?', 'z1'), numbered('Was hast du erreicht, und was hat es dich gekostet?', 'z1'), numbered('Wer aus der Gruppe ist dir am nächsten geblieben?', 'z1'));
add(spacer(80));
add(dm('Was in der Welt geschehen ist', [
  '- Auf den Ruinen von Eschental steht die **Grube Eschental**, eine Gildenmine mit Förderturm.',
  '- Vaal sitzt jetzt auch im **Kronrat** des Königs.',
  '- Ab und zu sieht jemand einen Mann mit einer Bärin am Grat über der Grube. Auf Brannok sind 500 GM Kopfgeld ausgesetzt.',
  '- In der Grube häufen sich Unfälle: Stollen brechen ein, Bergleute verschwinden.',
]));
add(L.label('◆  Spielleitung · Antworten mit Kapitel 2 verknüpfen', C.dm[1]));
add(table('dm', ['Wenn ein Held …', 'dann in Kapitel 2 …'], [
  ['ein Gildenamt hat', 'ernennt Vaal ihn zum Leiter der Expedition. Er unterschreibt den Fundrecht-Vertrag.'],
  ['bei Militär oder Wache ist', 'kommandiert er die Grubenwache. Hedda respektiert ihn.'],
  ['Geistlicher oder Heiler ist', 'pflegt er verletzte Bergleute. Einer erzählt von „singenden Lichtern“ in der Tiefe.'],
  ['Gelehrter oder Magier ist', 'kennt er das Wort „Ithari“ von einer alten Inschrift.'],
  ['eine Familie gegründet hat', 'arbeitet ein Verwandter in der Grube.'],
  ['Händler oder Wirt ist', 'beliefert er die Grube und ist mit Hedda befreundet.'],
  ['etwas anderes macht', 'fragst du: „Warum bist du heute an der Grube?“ Die Antwort ist der Einstieg.'],
], [3000, W - 3000], { boldFirst: true }));
add(loot(['**500 GM** pro Held aus Gildenanteilen', 'Jeder Held wählt **einen ungewöhnlichen Gegenstand**. Sie stammen aus Ruinen entlang der Machtader.'], 'Loot · Drei Jahre Lohn'));
add(table('loot', ['Name', 'Regel', 'Herkunft'], [
  ['**Fadenschneider**', 'Dolch +1, Vorteil gegen Mana-Fäden und Steuerknoten', 'Ein Wartungswerkzeug der Ithari. Summt leise in der Nähe von Mana.'],
  ['**Ithari-Klinge**', 'Waffe +1', 'Weisses Metall, das nie rostet.'],
  ['**Kristallschild**', 'Schild +1', 'Eine Kristallschicht verwandelt Schläge in Licht.'],
  ['**Lichtmantel**', 'Umhang des Schutzes', 'Der Saum schimmert im Dunkeln.'],
  ['**Manaperle**', 'Perle der Macht', 'Ein Funke Machtader, in Perlmutt gefangen.'],
  ['**Fokus der Ithari**', 'Zauberstab des Kriegsmagiers +1', 'Ein Kristallstab mit leuchtenden Adern.'],
  ['**Schützenarmschienen**', 'Armschienen des Bogenschiessens', 'Von einem Ithari-Wächter, umgearbeitet für Menschenarme.'],
], [2300, 3200, W - 5500]));

// ---------- Kapitel 2 ----------
add(chapter('Kapitel 2', 'Die versunkene Stadt', 'Stufe 5 · etwa 2¾ Stunden · Grube Eschental, Ithrael'));
add(P('Die Grube Eschental frisst Bergleute. Unten singt etwas, und die Stollen werden nicht eingedrückt, sondern gefressen. Die Helden steigen in die Machtader hinab und finden, was die Ithari vor tausend Jahren versteckt haben.'));

add(scene('Die Grube Eschental'));
add(vorlese(['Wo vor drei Jahren Asche lag, ragt ein Förderturm aus schwarzem Eisen in den Himmel. Loren rattern, Hammerschläge hallen. Doch die Bergleute am Schachtrand reden leise, und keiner lächelt. Eine Zwergin mit russigem Bart stapft auf euch zu und spuckt aus. „Endlich. Ihr seid die, die nicht wegrennen.“']));
add(P('**Hedda Kupferzahn** leitet die Grube: *„Drei Schichten, elf Vermisste. Unten singt etwas. Und die Stollen werden nicht eingedrückt, die werden gefressen.“*'));
add(P('**Vaal** legt den **Fundrecht-Vertrag** vor: Ein Drittel von allem, was die Helden unten finden, gehört ihnen und ihren Erben. *„Ich bin ein fairer Mann. Alles hat seinen Preis.“* **Tobin Fink**, jetzt sein Forschungssekretär, flüstert: *„Die Vermesser haben unter dreihundert Metern Mauern gefunden. Gemauerte Mauern.“*'));
add(dm(null, [
  'Hedda erwähnt nebenbei: *„Vor zwei Wochen stand eine Bärin am Grat. Und ein Mann daneben. Er hat nur zugeschaut.“*',
  'Das Drittel aus dem Fundrecht-Vertrag ist der Grund, warum Vaal die Helden in Kapitel 3 loswerden will.',
]));
add(loot(['**3 Tränke der grösseren Heilung** (je 4W4 + 4) von Hedda', 'Grubenlampen, 100 m Seil, Kletterhaken']));

add(scene('Der Abstieg'));
add(vorlese(['Der Förderkorb ruckelt in die Tiefe. Das Tageslicht wird zu einem Punkt, dann ist es weg. Nach dreihundert Metern endet der Schacht in einer Spalte, aus der blaues Licht steigt. Die Wand ist warm. Irgendwo unter euch brummt etwas, tief und gleichmässig, wie ein schlafendes Herz.']));
add(P('Jeder Held würfelt mindestens einmal: Athletik, Akrobatik, Überlebenskunst, Arkane Kunde oder Wahrnehmung. *Federfall* und *Spinnenklettern* zählen als Erfolg.'));
add(probe('4 Erfolge vor 3 Fehlschlägen · SG 13', [
  ['4 Erfolge', 'Die Gruppe erreicht die Stollen leise.'],
  ['Jeder Fehlschlag', 'Steinschlag: Ein Held erleidet 2W6 Wuchtschaden.'],
  ['3 Fehlschläge', 'Die Gruppe kommt an, aber die Bulette hat sie gehört und überrascht sie.'],
]));
add(vorlese(['Die Spalte öffnet sich in eine Stollenkreuzung, die nicht von Menschenhand stammt. Die Wände sind zerfurcht wie von riesigen Zähnen. Der Boden bebt, einmal, zweimal. Dann bricht er auf.']));
add(kampf('Die Fresser im Fels', {
  gegner: '1 Bulette, 3 Ankhegs',
  gelaende: 'Stollenkreuzung mit 3 m hoher Förderkorb-Plattform, Schienen und brüchiger Decke.',
  taktik: 'Die Bulette springt in Runde 1 mitten in die Gruppe. Die Ankhegs brechen aus den Wänden, packen Helden und ziehen sie in die Tunnel.',
  ende: 'Unter 30 TP gräbt sich die Bulette ein und flieht. Liegst du hinter dem Zeitplan, nimm nur 2 Ankhegs.',
}));
add(P('Naturkunde SG 13: Auch diese Tiere tragen Manaadern. Sie jagen nicht. Sie fliehen vor etwas Grösserem weiter unten.'));
add(loot(['**Bulettenplatten** (100 GM). Ein Schmied macht daraus einen Schild.', '**2 Säureflaschen** aus den Drüsen der Ankhegs']));

add(scene('Ithrael'));
add(vorlese(['Der Tunnel endet an einer Kante, und ihr blickt hinab auf eine Stadt. Türme aus weissem Stein und Kristall stehen unter einer Kuppel aus Licht, die sich wie ein zweiter Himmel über alles wölbt. Kanäle voller leuchtendem Wasser ziehen sich durch leere Strassen. Nichts bewegt sich. In der Mitte der Stadt pulsiert ein Licht, langsam, wie ein Atemzug.']));
add(P('Ithrael ist intakt, leer und still. Die Ithari sind seit tausend Jahren zu Staub zerfallen. Die Helden können drei Orte besuchen.'));
add(sub('Der Kristallmarkt'));
add(P('Werkzeuge, Lampen und Geräte liegen noch auf den Tischen. Arkane Kunde SG 13: Alles läuft mit Manasteinen. Erendal kennt solche Technik nicht.'));
add(sub('Das Archiv'));
add(P('In der Mitte der Halle steht ein Kristall, gross wie ein Mensch. Berührt ihn ein Held, erscheint die Stimme von Ithrael.'));
add(vorlese([
  'Licht sammelt sich zu einer Gestalt: eine hochgewachsene Frau ohne Haar, mit Haut wie Perlmutt und Augen ohne Pupillen. Sie sieht durch euch hindurch, als spräche sie zu jemandem, der vor tausend Jahren hier stand.',
  '„Wir bauten mit Licht, und wir stritten um Licht. Als die letzte Stadt fiel, versenkten wir Ithrael, damit das Herz niemandem gehört. Doch der Hunger kam durch die Ader. Er frass unser Licht und nahm unsere Wächter. Wer dies hört: Durchtrennt die Fäden. Unsere Wächter waren nie eure Feinde.“',
], 'Vorlesetext · Die Stimme von Ithrael'));
add(probe('Geschichte oder Arkane Kunde SG 15 an den Wandreliefs', [
  ['Erfolg', 'Die Ithari steuerten ihre Wächter mit Mana-Fäden. Ein Schnitt am Nacken versetzt sie in den Schutzmodus. **Die ganze Gruppe hat in Kapitel 2 Vorteil auf alle Proben, Fäden zu sehen und zu kappen.**'],
  ['Misserfolg', 'Die Reliefs zeigen Wächter mit leuchtenden Linien am Nacken. Mehr erschliesst sich nicht.'],
]));
add(sub('Der Aussichtsturm'));
add(P('Wahrnehmung SG 13: Auf dem Herzplatz liegt etwas Riesiges und Gegliedertes um eine pulsierende Kristallkugel gewickelt. Dutzende leuchtende Fäden laufen von ihm in die Stadt.'));
add(loot(['**Ein Fundstück pro Held** vom Kristallmarkt, je 200 GM wert: Lampen, Werkzeuge, Schmuck']));

add(scene('Die Wächterhalle'));
add(vorlese(['Die Halle ist hoch wie ein Tempel. In Nischen stehen Gestalten aus weissem Kristall und Silber, Klingen statt Händen. Als ihr eintretet, drehen sie im selben Augenblick die Köpfe. Aus jedem Nacken steigt ein feiner, leuchtender Faden zur Decke und verschwindet Richtung Stadtmitte.']));
add(merke([
  'Hier lernen die Spieler die wichtigste Regel des Abenteuers. Leg **rote Wollfäden** auf die Karte, von jedem Wächter Richtung Stadtmitte.',
  '- **Sehen:** Bonusaktion, Wahrnehmung oder Arkane Kunde SG 13. *Magie entdecken* zeigt alle Fäden.',
  '- **Angreifen:** Angriffe auf einen Faden haben Nachteil. Die Werte stehen beim Wesen im Bestiarium.',
  '- **Fadenschnitt:** Aktion in 1,5 m, Arkane Kunde oder Fingerfertigkeit SG 15. Bei Erfolg ist der Faden gekappt.',
  '- ***Magie bannen*** kappt einen Faden automatisch.',
  '- **Folge:** Ein befreiter Wächter senkt die Klingen und kämpft nicht mehr.',
  'Kommt bis Runde 2 niemand auf die Fäden, beschreib, wie ein Treffer einen Faden streift und der Wächter zusammenzuckt.',
], 'Kernregel · Mana-Fäden'));
add(kampf('Die Wächter von Ithrael', {
  gegner: '3 Ithari-Wächter, 1 Kristallkoloss',
  gelaende: 'Hohe Halle mit Nischen (halbe Deckung) und einem Ausgang zur Stadtmitte.',
  taktik: 'Der Koloss blockiert den Ausgang. Die Wächter flankieren und schiessen die Lichtlanze auf Zauberwirker.',
  ende: 'Befreite Wächter halten danach Wache. **Kurze Rast.**',
}));
add(loot(['**Schriftrolle: Magie bannen** aus einer Wächternische', '**2 Tränke der grösseren Heilung**']));

add(scene('Das Herz von Ithrael'));
add(vorlese(['Der Herzplatz ist rund, umgeben von Treppen und Kanälen. In seiner Mitte schwebt eine Kristallkugel, gross wie ein Haus, und pulsiert in tiefem Blau. Um sie gewickelt liegt ein Wesen, lang wie ein Schiff: ein Leib aus Panzerplatten, hunderte Beine wie Sicheln, Adern aus gleissendem Licht. Zwei Kristallsäulen halten Fäden, die in seinen Rücken laufen. Langsam hebt es den Kopf, und seine Mandibeln öffnen sich wie Tore.']));
add(kampf('Morgath, der Aderfresser', {
  gegner: 'Morgath',
  gelaende: 'Das Herz in der Mitte (6 m Durchmesser) blockiert Bewegung und Sicht. Zwei Kristallsäulen halten Fäden in Morgaths Rücken. Kanäle sind schwieriges Gelände, die Treppen 3 m hoch.',
  taktik: 'Morgath packt mit dem Biss, zieht Fernkämpfer mit der Fadenpeitsche heran und speit Mana auf Gruppen. Ist er umzingelt, taucht er unter. Er flieht nicht.',
  ende: 'Fällt er zum ersten Mal auf 100 TP, beisst er ins Herz: Das Licht flackert, die Kuppel bebt, er wird schneller und wütender.',
}));
add(vorlese(['Der Riesenleib erschlafft. Die Fäden erlöschen einer nach dem anderen, wie Kerzen am Morgen. Nur das Herz von Ithrael pulsiert weiter, schneller jetzt, unruhig. Risse aus Licht laufen über seine Oberfläche.']));
add(L.label('!  Entscheidung · Das Herz von Ithrael', C.wahl[1]));
add(table('wahl', ['Die Helden …', 'Was geschieht'], [
  ['sichern es', 'Fertigkeitsprobe, **3 Erfolge, SG 15**: Arkane Kunde, Geschichte, Athletik oder Wahrnehmung. Jeder Fehlschlag: Alle in 9 m schaffen einen GE-Rettungswurf SG 13 oder erleiden 2W10 Energieschaden. Am Ende ist das Herz in jedem Fall stabil.'],
  ['zerstören es', 'Das Herz hat RK 10 und 30 TP. Es zerspringt: Alle in 9 m machen einen GE-Rettungswurf SG 13, 4W10 Energieschaden, die Hälfte bei Erfolg. Ithrael beginnt zu sinken, die Helden haben 10 Minuten zur Flucht.'],
], [2000, W - 2000], { boldFirst: true }));
add(merke(['Wurde das Herz **gesichert** oder **zerstört**? Das bestimmt den Endkampf in Kapitel 3. Reich werden die Helden in beiden Fällen.']));
add(vorlese(['Oben empfangen euch Jubel und Fackeln. Hedda Kupferzahn umarmt jeden einzelnen von euch, ob er will oder nicht. Hinter ihr lässt Vaal schon die Kräne ausrichten, um den riesigen Kadaver aus der Tiefe zu holen. „Für die Forschung“, sagt er. Tobin schreibt mit, und seine Hand zittert.']));
add(P('Motiv erkennen SG 15: Vaal sieht Morgath an wie einen Schatz, nicht wie ein Ungeheuer.'));
add(loot(['**Ein Kristallsplitter pro Held** vom Herzplatz (je 100 GM)', '**Morgaths Mandibelsplitter** (500 GM)', '**Das Fundrecht**: Ein Drittel aller Funde aus Ithrael gehört den Helden. Sie werden reich.']));

// ---------- Zwischenspiel 2 ----------
add(chapter('Zwischenspiel', 'Zehn Jahre', 'Die Helden steigen auf Stufe 11 · etwa 20 Minuten'));
add(vorlese([
  'Zehn Jahre. Zwischen Kronhafen und Eschental gleiten Manabahnen auf silbernen Schienen, schneller als jedes Pferd. In den Gassen brennen Lichtsteine statt Fackeln, und Botenkristalle tragen Nachrichten über das ganze Land. Auf dem Grund von Eschental steht die Goldene Raffinerie, eine Kathedrale aus Messingrohren, und saugt Licht aus der Tiefe.',
  'König Aldemar ist tot. Er starb ohne Erben, und die Krone schuldete der Golden Scale mehr Gold, als das Reich in zwanzig Jahren einnimmt. Der Kronrat hat Severin Vaal gekrönt, mit einer neuen Krone, in deren Mitte ein grüner Stein pulsiert.',
  'Und ihr? Ihr seid die Helden von Ithrael.',
]));
add(dm(null, ['Wurde das Herz zerstört, lies statt „saugt Licht aus der Tiefe“: *„kratzt mühsam Licht aus der Ader, seit Ithraels Herz zersprang“*.']));
add(L.label('Drei Fragen an jeden Spieler', C.brown));
add(numbered('Welche hohe Stellung hast du jetzt?', 'z2'), numbered('Was hat dir dein Anteil an Ithrael ermöglicht?', 'z2'), numbered('Wer ist neu in deinem Leben?', 'z2'));
add(spacer(80));
add(dm('Die neue Welt', [
  '- **Manatechnik:** Manabahnen (Kronhafen–Eschental in einer Stunde), Lichtsteine, Manaherde, Botenkristalle.',
  '- **Die Kehrseite:** Der Manaabbau lässt die Wildtiere rund um die Raffinerie mutieren.',
  '- **Besitz:** Die Gilde hält zwei Drittel der Rechte an Ithrael, die Helden ein Drittel. Der König soll alle Rechte an die Krone ziehen wollen.',
  '- **Brannok:** Seit acht Jahren hat ihn niemand gesehen.',
  '- **Die Einladung:** Jubiläumsgala „Zehn Jahre Ithrael“ im Spiegelsaal. Die Helden sind Ehrengäste.',
]));
add(L.label('◆  Spielleitung · Antworten mit Kapitel 3 verknüpfen', C.dm[1]));
add(table('dm', ['Wenn ein Held …', 'dann in Kapitel 3 …'], [
  ['Gildenmeister der Golden Scale ist', 'passt Vaals Lüge perfekt: „Die Helden führen heute die Gilde, die dein Dorf verbrannt hat.“ Er kann mit dem Gilden-Schwebeboot die Verfolgung aufnehmen.'],
  ['Militär oder Garde führt', 'kann er die Evakuierung befehlen und eine Militär-Manabahn anfordern.'],
  ['Geistlicher ist', 'soll er einen Segen sprechen und kann dabei unauffällig *Magie entdecken* wirken.'],
  ['Gelehrter oder Magier ist', 'kennt er Tobins Werkstatt, in der jahrelang „etwas Grosses“ gebaut wurde.'],
  ['eine Familie hat', 'ist sein Kind Ehrengast an der Gala.'],
  ['Händler ist', 'liefert er die Lichtsteine des Palasts und kennt eine Lieferbahn.'],
], [3000, W - 3000], { boldFirst: true }));
add(loot(['Die Helden sind **reich**. Gold spielt keine Rolle mehr.', 'Jeder Held wählt **einen seltenen Gegenstand** aus der Liste und **einen weiteren ungewöhnlichen** aus dem ersten Zwischenspiel.'], 'Loot · Zehn Jahre Ruhm'));
add(table('loot', ['Name', 'Regel', 'Herkunft'], [
  ['**Geschliffene Ithari-Klinge**', 'Waffe +2', 'Aus dem Waffenlager von Ithrael, nachgeschliffen.'],
  ['**Kristallrüstung**', 'Rüstung +1', 'Ithari-Platten, angepasst an einen Menschenkörper.'],
  ['**Ring der Waage**', 'Ring des Schutzes', 'Ein Ehrenring der Gilde, Geschenk Vaals zum Jahrestag.'],
  ['**Herzsplitter-Amulett**', 'Amulett der Gesundheit', 'Ein Splitter vom Herz von Ithrael, in Silber gefasst.'],
  ['**Verstärkter Fokus**', 'Zauberstab des Kriegsmagiers +2', 'Ein Kristallstab aus dem Archiv.'],
  ['**Manastiefel**', 'Stiefel der Schnelligkeit', 'Kristallsohlen, die bei jedem Schritt Funken schlagen.'],
], [2600, 3000, W - 5600]));

// ---------- Kapitel 3 ----------
add(chapter('Kapitel 3', 'Die Galafeier', 'Stufe 11 · etwa 2¾ Stunden · Spiegelsaal, Goldene Raffinerie'));
add(P('Zehn Jahre nach Ithrael feiert das Königreich sich selbst. In dieser Nacht kehrt Brannok zurück, halb Mensch, halb Maschine, und die Helden erfahren, wem sie die ganze Zeit gedient haben.'));

add(scene('Die Gala im Spiegelsaal'));
add(vorlese(['Der Spiegelsaal glitzert in tausend Lichtsteinen. Zweihundert Gäste in Samt und Seide, ein Orchester spielt das „Lied von Ithrael“, und über euch wölbt sich eine Kuppel aus Glas, hinter der die Sterne stehen. An der Stirnwand hängt ein Gemälde: ihr selbst, dreizehn Jahre jünger, vor der Kristallstadt. Auf der Empore sitzt König Severin Vaal, das Haar jetzt silbern. In seiner Krone pulsiert ein grüner Stein, langsam, wie ein Herzschlag.']));
add(P('Jeder Held hat eine kurze Begegnung, die zu seiner Position passt: ein alter Rivale, ein Bittsteller, das eigene Kind. Dann erhebt sich der König.'));
add(vorlese(['„Vor dreizehn Jahren war Eschental Asche. Heute nährt es ein Königreich. Wir verdanken das mutigen Seelen, die heute unter uns sind.“ Er nickt euch zu, und der Saal applaudiert. „Damit diese Gabe allen gehört, verkünde ich heute den Ithrael-Erlass: Alle Rechte an Ithrael gehen an die Krone über, gerecht entschädigt. Alles hat seinen Preis. Ich zahle gut.“'], 'Vorlesetext · Vaals Rede'));
add(P('Das Drittel der Helden ist weg. Lass ihre Reaktion zu. Vaal bleibt freundlich: *„Lasst uns morgen in Ruhe darüber reden.“*'));
add(probe('Hinweise an der Gala', [
  ['Motiv erkennen SG 18', 'Vaal blickt immer wieder zur Glaskuppel, als warte er auf etwas.'],
  ['Arkane Kunde SG 15', 'Der grüne Stein in der Krone ist lebendes Kristallgewebe. Wer Morgath gesehen hat, erkennt das Pulsieren wieder.'],
]));
add(dm(null, ['War die Gruppe in Kapitel 1 freundlich zu **Tobin Fink**, zieht er jetzt einen Helden zur Seite: *„Nach der Rede. Ich muss euch – die Krone, sie –“* Dann zerbricht die Kuppel. Sonst meidet Tobin alle Blicke.']));

add(scene('Der Angriff'));
add(vorlese([
  'Die Glaskuppel explodiert. Scherben regnen wie Hagel, Gäste schreien. Durch das Loch stürzen Gestalten mit Flügeln aus Stahl, ihr Kreischen schneidet in die Ohren. Mit einem Krachen landet eine Bärin auf der Tanzfläche, halb Fell, halb Eisenplatten. Auf ihrem Rücken ein Mann, halb Fleisch, halb Silber, eine Harpunenkette in der Faust. Er sieht euch nicht an. Er sieht den König an.',
  '„VAAL!“',
  'Er springt auf die Empore zu. Der König hebt die Hand an seine Krone. Mitten im Sprung erstarrt der Mann. Tränen laufen über sein Gesicht, und langsam, ruckartig, dreht er sich zu euch um.',
]));
add(P('Wer eine passive Wahrnehmung von 15 hat, sieht, wie Vaal am Stein seiner Krone dreht. Wurde Brannok in Kapitel 1 verschont, presst er hervor: *„Lauft! Ich kann nicht –“* Sonst zischt er: *„Ihr. Gildenhunde.“*'));
add(kampf('Die Nacht im Spiegelsaal', {
  gegner: 'Brannok die Halbmaschine, Borka die Eisenbärin, 3 Mechaharpyien',
  gelaende: 'Drei **Manalüster** über der Tanzfläche (Kette RK 15, 20 TP). Ein stürzender Lüster trifft alles in 3 m Radius: GE-Rettungswurf SG 15 oder 28 (8W6) Wuchtschaden, die Hälfte bei Erfolg. Glasscherben sind schwieriges Gelände, die Empore ist 3 m hoch.',
  taktik: 'Die Mechaharpyien greifen im Sturzflug an und kreischen auf Gruppen. Borka schützt Brannok. Brannok zieht Zauberwirker mit der Harpune zu sich.',
  ende: 'Ist Brannok befreit oder bewusstlos, legt sich Borka zu ihm. Die Harpyien kämpfen noch eine Runde und fliehen dann.',
}));
add(dm('Gäste in Gefahr', [
  'Am Ende jeder Runde packt jede Mechaharpyie, die nicht mit einem Helden im Nahkampf steht, einen Gast und steigt auf. Ein Treffer im nächsten Zug lässt sie den Gast fallen. Zähl die geretteten Gäste.',
  'Die **Garde** evakuiert die Gäste und schirmt den König ab. Sie kämpft nicht gegen die Helden.',
]));
add(L.label('!  Wichtig · Brannok befreien', C.wahl[1]));
add(P('Brannok ist kein Feind, sondern ein Gefangener in seinem eigenen Körper. Jeder dieser Wege befreit ihn:'));
add(table('wahl', ['Weg', 'Wie'], [
  ['Steuerknoten', 'Drei Knoten im Nacken (RK 17, je 25 TP). Regeln wie Mana-Fäden, aber Sehen SG 15 und Fadenschnitt SG 17. *Magie bannen* braucht einen Wurf gegen SG 16. Sind alle drei zerstört, ist er frei.'],
  ['Die Krone', 'An der Garde vorbei (Athletik oder Akrobatik SG 15), dann Vaal die Krone entreissen (Athletik oder Fingerfertigkeit gegen seine Athletik). Oder die Krone zerstören (RK 19, 30 TP, Nachteil). Die Krone glüht grell auf, alle Gäste sehen es.'],
  ['Borka', 'Aktion in 1,5 m, Mit Tieren umgehen SG 18 (SG 20, wenn sie in Kapitel 1 starb). Jeder Erfolg: Sie greift eine Runde nicht an. Nach **3 Erfolgen** (2, wenn Brannok verschont wurde) legt sie sich hin, und Brannok reisst sich los. Die Holzperle aus Kapitel 1 zählt als ein Erfolg.'],
  ['Erinnerung', 'Wer ihn bei seinem Namen und mit Eschental anspricht (Aktion, Überzeugen SG 15), lässt ihn zaudern: nur ein Angriff in seinem nächsten Zug.'],
  ['Bewusstlos', 'Bei 0 TP frag nach, ob der Angriff tödlich sein soll. Standard ist bewusstlos. Die Steuerung erlischt, Heilung weckt ihn befreit.'],
], [1900, W - 1900], { boldFirst: true }));
add(dm(null, [
  'Immer wenn Brannoks Wille durchbricht, dreht Vaal an der Krone. Wahrnehmung SG 15 im Kampf: Vaal berührt die Krone, und Brannok zuckt. *Magie entdecken* zeigt eine feine grüne Linie zwischen Krone und Nacken.',
  'Arkane Kunde SG 15 an einer Mechakreatur: Die Stahlteile laufen über Manaleitungen. **Blitzschaden überlastet sie.**',
]));
add(loot(['**3 Manakerne** aus den Mechaharpyien (je 250 GM)']));

add(scene('Die Wahrheit'));
add(vorlese(['Brannok sinkt auf die Knie. Borka legt ihren schweren Kopf an seine Schulter. Als er spricht, klingt seine Stimme rau, als hätte er sie jahrelang nicht benutzt. „Dreizehn Jahre habe ich die Falschen gehasst.“ Er hebt die Hand aus Silber und zeigt auf die Empore. „Er hat Eschental angezündet. Sein Schreiber hat es mir gesagt, im Dunkeln, während sie mich zusammengeschraubt haben.“']));
add(P('**Tobin Fink** tritt vor und hält eine Abschrift hoch. Unter Vaals Siegel steht: *„Eschental ist zu räumen. Art und Mittel nach Ermessen. Offizielle Ursache: Bestien.“* War die Gruppe in Kapitel 1 nicht freundlich zu Tobin, gibt er das Papier erst nach Überzeugen SG 15 heraus. Der Gildenbolzen aus Kapitel 1 ist der zweite Beweis.'));
add(vorlese(['Vaal sieht euch an. Kein Zorn, keine Angst. Nur ein müdes Lächeln, wie bei einem Händler, dem ein Geschäft geplatzt ist. „Alles hat seinen Preis. Ihr hättet ihn bezahlen sollen.“ Er zieht an einem Hebel in der Empore. Der Boden unter ihm klappt auf, und er ist verschwunden.']));
add(dm(null, [
  'Vaal flieht durch eine Bodenluke zur königlichen Manabahn. Lass die Spieler es versuchen. Setzen sie ihn mit einem wirklich cleveren Plan doch fest, erwacht die Chimäre ohne Pilot, und der Endkampf findet ohne Vaal statt.',
  'Brannok weiss, wohin Vaal flieht: *„Eschental. Er hat dort etwas gebaut. Aus dem Ding von unten.“*',
]));
add(loot(['**Tobins Abschrift** des Räumungsbefehls (Beweis)']));

add(scene('Die Fahrt nach Eschental'));
add(P('Die Helden nutzen ihre Macht: Gilden-Schwebeboot, Militär-Manabahn, Lieferbahn oder die nächste Bahn. Die Fahrt dauert eine Stunde und zählt als **kurze Rast**.'));
add(P('Ist Brannok dabei, fragt er leise: *„Warum habt ihr mich damals gehen lassen?“* oder *„Ihr wolltet mich töten. Warum sollte ich euch jetzt trauen?“* Jede ehrliche Antwort reicht. Er kämpft mit ihnen.'));

add(scene('Die Goldene Raffinerie'));
add(vorlese([
  'Wo einst Eschental stand, erhebt sich eine Kathedrale aus Messingrohren und Kränen. In ihrer Mitte glüht der Schacht der Machtader so hell, dass ihr die Augen zusammenkneift. Und im Schacht bewegt sich etwas, das ihr kennt: Morgath. Sein Leib ist mit Stahl verplattet, Kabel laufen in seinen Rücken, und auf seinem Nacken sitzt eine Kapsel aus Kristall. Darin Vaal, die Krone gleissend grün.',
  'Seine Stimme hallt verstärkt durch die Halle. „Ihr hättet unterschreiben sollen.“',
]));
add(P('Mitten in der Halle liegt ein alter Herdstein, eingefasst in Messing wie ein Grundstein. Brannok bleibt davor stehen. Es ist der Herd seines Elternhauses.'));
add(kampf('Morgath erwacht', {
  gegner: 'Morgath-Chimäre mit Vaal in der Kapsel, 1 Mechakeiler',
  gelaende: '**Manarohre** (RK 15, 20 TP) platzen zu Dampfwolken mit 3 m Radius: KO-Rettungswurf SG 16 oder 18 (4W8) Energieschaden, halb bei Erfolg. Laufstege in 6 m Höhe, Förderkräne. Wer in den Kernschacht fällt, wird herausgeschleudert, erleidet 22 (4W10) Energieschaden und landet liegend 6 m daneben.',
  taktik: 'Phase 1: Kernkanone auf Gruppen, Stampfen gegen Nahkämpfer, Fadenstoss auf den stärksten Helden, der Keiler auf Heiler. Phase 2: Raserei, immer das nächste Ziel.',
  ende: 'Morgath fällt in Phase 2 oder wird von Brannok gebändigt.',
}));
add(dm('Was den Kampf verändert', [
  '- **Brannok kämpft mit**, wenn er befreit wurde: Er hat nur noch 100 TP, und du führst ihn. In seinem ersten Zug übernimmt er mit einer Bonusaktion den Mechakeiler.',
  '- **Herz gesichert** (Kapitel 2): Vaal hat es in die Raffinerie eingebaut. Die Chimäre nutzt Hortaktionen.',
  '- **Herz zerstört:** Die Chimäre läuft mit einem Nachbau und hat einen Instabilen Kern.',
  '- **Pilotenkapsel** in 9 m Höhe: erreichbar durch Fliegen, Klettern (Athletik SG 18) oder Fernangriffe. Zerstört sie die Gruppe, stürzt Vaal heraus, und Phase 2 beginnt sofort.',
]));
add(vorlese(['Die Kapsel zerspringt. Vaal stürzt heraus und schlägt hart auf den Boden. Über ihm reisst Morgath die Kabel aus seinem Rücken, Stahlplatten fallen klirrend herab, und zum ersten Mal seit dreizehn Jahren brüllt das Tier mit seiner eigenen Stimme.'], 'Vorlesetext · Phase 2'));
add(P('Ohne Vaal ist Morgath wieder ein Tier: rasend, ohne Plan, immer auf die nächste Kreatur, auch auf Vaal am Boden. Die Helden können Vaal retten, damit er vor Gericht kommt.'));
add(merke(['**Die Bändigung:** Ist Brannok dabei, kann er Morgath als Aktion bändigen: Mit Tieren umgehen gegen SG 20. Jeder Held in 9 m kann ihm mit der Helfen-Aktion Vorteil geben. Jeder Erfolg: Morgath macht in seinem nächsten Zug nur einen Angriff. Nach **3 Erfolgen** legt sich Morgath nieder und sinkt sterbend zurück in die Ader.'], 'Wichtig'));
add(vorlese(['Der Riesenleib sinkt in das Licht zurück, aus dem er einst kam. Auf dem Boden liegt die Krone, ein Riss läuft quer durch den grünen Stein, und das Pulsieren wird langsamer, langsamer, bis es aufhört. Alles, was Vaal gesteuert hat, hält still.'], 'Vorlesetext · Das Ende'));
add(loot([
  '**Ithari-Schildbrosche** von Vaal (selten): Als Reaktion +5 RK gegen einen Treffer. 3 Ladungen, lädt sich bei Morgengrauen auf.',
  '**Die gebrochene Waagenkrone**: ohne Kraft, aber der Beweis, der Vaal stürzt',
]));

// ---------- Epilog ----------
add(chapter('Epilog', 'Die Ader schweigt', null));
add(vorlese(['Der Morgen über Eschental ist still. Die Raffinerie schweigt, und zum ersten Mal seit dreizehn Jahren riecht die Luft hier nach Gras statt nach Asche. In Kronhafen läuten die Glocken, aber diesmal nicht für einen König. Sie läuten, weil auf jedem Marktplatz ausgerufen wird, was in jener Frühlingsnacht wirklich geschah.']));
add(table('wahl', ['Wenn …', 'dann …'], [
  ['Brannok lebt', 'Er wird Hüter der Machtader. Eschental wird neu aufgebaut, und die geflohenen Dorfleute kehren zurück, darunter Brannoks Mutter und Schwester, die all die Jahre in einem Fischerdorf an der Küste lebten. Tobin entfernt Borkas Stahlplatten.'],
  ['Brannok tot ist', 'Seine Familie kehrt zurück und pflanzt eine Esche auf dem alten Herdstein. Borka bleibt bei den Ruinen, und Kinder bringen ihr Honigwaben.'],
  ['Vaal gefangen ist', 'Der Kronrat stösst ihn vom Thron und stellt ihn vor Gericht. Tobin sagt aus und wird begnadigt.'],
  ['Vaal tot ist', 'Der Kronrat sucht einen neuen König und schaut dabei auf die Helden.'],
  ['Vaal geflohen ist', 'Sein Steckbrief hängt in jeder Stadt.'],
  ['das Herz gesichert wurde', 'Die Technik aus Ithrael wird Allgemeingut. Die befreiten Wächter schützen die Stadt in der Tiefe.'],
  ['das Herz zerstört wurde', 'Ithrael ruht. Die Manatechnik wächst langsamer, aber die Tiere um Eschental beruhigen sich.'],
  ['viele Gäste gerettet wurden', 'Barden singen ein neues Lied: „Die Nacht im Spiegelsaal“.'],
], [2600, W - 2600], { boldFirst: true }));
add(P('Zum Schluss sagt jeder Spieler in einem Satz, was sein Charakter in den nächsten zehn Jahren tut.'));
add(loot(['Lebt Brannok, schenkt er jedem Helden eine **Holzperle aus seinem Bart**: *„Für die Familie, die ich wiedergefunden habe.“*']));
add(vorlese(['Monate später sitzt Tobin Fink allein im Archiv von Ithrael. Hinter dem grossen Kristall findet er einen zweiten, kleiner, staubig, vergessen. Als er ihn berührt, spricht eine Stimme, die er noch nie gehört hat. Sie spricht von der Mutterader. Und von Städten, die nicht versenkt wurden.'], 'Vorlesetext · Ein letzter Blick'));

module.exports = out;
