/* ==== Beschreibungen: Klassen, Unterklassen, Völker, Hintergründe (eigene Texte) ==== */
const CLASS_FLAVOR = {
  bar: 'Wut ist für dich kein Kontrollverlust, sondern eine Kraftquelle. Im Kampfrausch hältst du Schläge aus, die andere fällen, und triffst härter als jeder Söldner. Du brauchst kaum Rüstung – nur Mut und einen festen Stand.',
  brd: 'Worte, Musik und gutes Timing sind deine Waffen. Du machst deine Gruppe besser, verwirrst Feinde und hast für fast jedes Problem einen Zauber oder einen Trick. Kaum eine Klasse ist so vielseitig.',
  cle: 'Eine göttliche Macht wirkt durch dich. Du heilst, schützt und segnest – und wenn nötig, schlägst du mit heiligem Licht zu. Ohne dich überlebt eine Gruppe die schweren Kämpfe selten.',
  dru: 'Du bist eine Stimme der Natur: Wind, Wurzeln und wilde Tiere hören auf dich. Du verwandelst dich in Tiergestalten, kontrollierst das Schlachtfeld und heilst die Deinen.',
  fig: 'Niemand beherrscht Waffen und Rüstungen so gründlich wie du. Mehr Angriffe, mehr Ausdauer, mehr Durchhaltevermögen – du bist die verlässliche Klinge, die steht, wenn alles fällt.',
  mon: 'Körper und Geist sind bei dir eins. Mit blitzschnellen Schlägen, Fokuspunkten und übermenschlicher Beweglichkeit bist du überall dort, wo man dich nicht erwartet – ganz ohne Rüstung.',
  pal: 'Ein heiliger Eid treibt dich an. Du trägst schwere Rüstung, schützt Verbündete mit deiner Aura und entfesselst göttliches Niederstrecken, wenn es darauf ankommt. Halb Ritter, halb Priester.',
  ran: 'Wildnis, Fährten und der Bogen sind deine Heimat. Du jagst, kundschaftest aus und markierst deine Beute mit Magie. Kein Gelände hält dich auf, kein Ziel entkommt dir lange.',
  rog: 'Du gewinnst nicht durch rohe Gewalt, sondern durch Geschick. Hinterhältige Angriffe, Schlösser, Fallen und schnelle Reflexe machen dich zum Spezialisten für alles, was Fingerspitzengefühl braucht.',
  sor: 'Die Magie liegt dir im Blut – du musst sie nicht studieren. Mit Zaubereipunkten verbiegst du deine Zauber: weiter, stärker, doppelt. Wenige Zauber, aber die beherrschst du meisterhaft.',
  wlk: 'Du hast einen Pakt mit einem mächtigen Wesen geschlossen. Deine Zauberplätze kehren nach jeder kurzen Rast zurück, und Schauerliche Anrufungen formen deine Magie nach deinem Geschmack.',
  wiz: 'Wissen ist Macht, und dein Zauberbuch ist das Werk deines Lebens. Kein anderer hat so viele Zauber zur Auswahl. Mit der richtigen Vorbereitung löst du fast jedes Problem.',
  rk: '✦ Du schreibst Macht in Stein, Stahl und Haut. Runen schützen deine Gefährten, verstärken deine Schläge und lassen sich im richtigen Moment entladen. Ein Krieger mit dem Kopf eines Gelehrten.',
  bw: '✦ Dein eigenes Blut ist dein Werkzeug. Du bezahlst Macht mit Lebenskraft, bindest Feinde mit roten Fäden und heilst oder zerstörst, wo andere nur zuschauen. Gefährlich – auch für dich selbst.',
  fk: '✦ Deine Klinge trägt einen Fluch, und du hast gelernt, ihn zu führen. Du markierst Feinde, verfolgst sie unerbittlich und lässt sie deine Flüche spüren. Halb Jäger, halb Hexer.',
  ma: '✦ Zahnräder, Dampf und Pulver statt Zauberformeln. Du baust Geräte, Rüstungen und Waffen, reparierst unterwegs und hast für jedes Problem einen Bauplan in der Tasche.'
};
const SPECIES_FLAVOR = {
  dragonborn: 'Nachfahren der Drachen, stolz und mit schuppiger Haut. Ihr Atem trägt die Macht ihrer Ahnen – Feuer, Blitz, Säure, Gift oder Kälte – und sie sind gegen dieses Element widerstandsfähig.',
  dwarf: 'Zäh, ausdauernd und tief mit Stein und Erde verbunden. Zwerge sehen im Dunkeln, widerstehen Gift und spüren, was unter ihren Füssen verborgen liegt.',
  elf: 'Langlebig und anmutig, mit Sinnen, die schärfer sind als die der meisten. Elfen schlafen nicht, sondern ruhen in Trance, und tragen ein Erbe aus Hochelfen, Waldelfen oder Drow in sich.',
  gnome: 'Klein, neugierig und voller Einfälle. Gnome haben einen wachen Geist, der sich gegen magische Einflüsse wehrt, und kennen den einen oder anderen Kniff mit Illusionen oder Tieren.',
  goliath: 'Riesenhaft und vom Blut der Riesen geprägt. Goliaths tragen die Macht von Feuer, Frost, Sturm, Stein, Wolken oder Hügeln in sich und können für kurze Zeit selbst riesig werden.',
  halfling: 'Klein, freundlich und erstaunlich mutig. Halblinge haben unverschämtes Glück, schlüpfen durch jede Lücke und lassen sich so schnell nicht einschüchtern.',
  human: 'Anpassungsfähig, ehrgeizig und überall zu Hause. Menschen lernen schnell, schöpfen nach einer Rast neue Kraft und finden in jeder Klasse ihren Platz.',
  orc: 'Kräftig, ausdauernd und kaum zu fällen. Orks verfolgen ihre Ziele mit Wucht, sehen im Dunkeln und stehen wieder auf, wenn andere liegen bleiben.',
  tiefling: 'Ein Hauch der Unterwelt liegt in ihrem Blut: Hörner, Schweif und angeborene Magie. Je nach Erbe sind Tieflinge infernalisch, abyssisch oder chthonisch geprägt.',
  mykori: '✦ Pilzwesen aus den feuchten Tiefen. Mykori sind durch ein feines Sporennetz miteinander verbunden, fühlen sich im Dunkeln wohl und können eine giftige Sporenwolke ausstossen.',
  vesperkin: '✦ Kinder der Dämmerung, halb aus Schatten gewebt. Vesperkin sehen durch Dunkelheit, verschmelzen mit ihr und springen von einem Schatten in den nächsten.',
  steinblut: '✦ In ihren Adern fliesst Mineral statt nur Blut. Steinblütige sind schwer, geduldig und hart wie Fels – und können ihre Haut für einen Augenblick zu Stein werden lassen.'
};
const BG_FLAVOR = {
  acolyte: 'Du hast im Dienst eines Tempels gelebt, Rituale gelernt und Gläubigen beigestanden.',
  criminal: 'Du kennst die dunklen Gassen, die richtigen Leute und die falschen Schlösser.',
  sage: 'Jahre in Bibliotheken haben dich gelehrt, wo Wissen steht – und wie man es findet.',
  soldier: 'Du hast Drill, Marsch und Schlacht erlebt. Disziplin ist dir in Fleisch und Blut übergegangen.',
  custom: 'Stelle dir deinen eigenen Hintergrund zusammen: zwei Fertigkeiten, ein Werkzeug, ein Talent.'
};
const SUB_FLAVOR = {
  bar: { berserker: 'Du lässt dich ganz von der Wut tragen. Im Rausch schlägst du zusätzlich zu und wirst fast unaufhaltsam.', glut: 'In dir glimmt ein Feuer, das im Kampfrausch hervorbricht. Wer dich trifft, verbrennt sich die Finger.' },
  brd: { lore: 'Du sammelst Wissen wie andere Münzen: mehr Fertigkeiten, mehr Zauber, und Worte, die Feinde aus dem Takt bringen.', stars: 'Deine Lieder folgen den Sternen. Dein Licht schützt Verbündete und fällt als Strahl auf deine Feinde.' },
  cle: { life: 'Deine Gottheit ist die Quelle allen Lebens. Niemand heilt so kraftvoll wie du.', tide: 'Du dienst den Gezeiten – Ebbe und Flut, Welle und Strömung gehorchen deinen Gebeten.' },
  dru: { land: 'Du bist mit einer Landschaft verbunden – Wüste, Eis, gemässigtes Land oder Tropen – und schöpfst ihre Zauber.', storm: 'Du trägst den Sturm in dir. Wind hebt dich, Blitze folgen deinen Schlägen.' },
  fig: { champion: 'Pure körperliche Perfektion: Du triffst öfter kritisch und hältst länger durch als alle anderen.', warden: 'Du bist der Schild deiner Gruppe. Wer deine Verbündeten angreift, bekommt es mit dir zu tun.' },
  mon: { openhand: 'Die klassische Kampfkunst: Deine Schläge werfen um, stossen weg und rauben Reaktionen.', water: 'Du bewegst dich wie Wasser – weich im Ausweichen, unaufhaltsam im Angriff.' },
  pal: { devotion: 'Der Eid der Ritterlichkeit: Ehre, Pflicht und Schutz der Schwachen. Deine Waffe leuchtet heilig.', dawn: 'Du trägst das erste Licht des Tages. Untote und Unholde fürchten deinen Glanz.' },
  ran: { hunter: 'Der klassische Jäger: Du spezialisierst dich darauf, grosse Ziele und ganze Rudel zu Fall zu bringen.', stormh: 'Deine Pfeile tragen Blitz und Donner – du jagst wie ein Gewitter.' },
  rog: { thief: 'Flinke Finger und noch flinkere Beine. Du kletterst, stiehlst und benutzt Gegenstände schneller als alle anderen.', poison: 'Du kennst jedes Gift und jede Dosis. Deine Klingen sind nie einfach nur scharf.' },
  sor: { draconic: 'Drachenblut fliesst in dir: harte Schuppen, elementare Wucht und am Ende sogar Flügel.', moon: 'Der Mond hat dich gezeichnet. Seine Phasen formen deine Magie.' },
  wlk: { fiend: 'Dein Pakt gilt einem Wesen der Unterwelt. Es belohnt jeden Sieg mit neuer Kraft.' },
  wiz: { evoker: 'Du formst rohe Energie: Feuer, Blitz und Kälte, präzise genug, um Verbündete zu verschonen.', chrono: 'Du verbiegst die Zeit – einen Herzschlag vor, einen zurück.' },
  rk: { guard: 'Deine Runen schützen: Schilde, Bollwerke und Zeichen, die Schaden abfangen.', war: 'Deine Runen sind für den Kampf geschrieben und lassen deine Klinge brennen.', shift: 'Deine Runen verändern: Wege, Orte und sogar deine eigene Gestalt.' },
  bw: { battle: 'Du kämpfst mit Blut auf der Klinge – nah, hart und mit Kriegswaffen.', vein: 'Du liest Adern wie Landkarten und bringst fremdes Blut zum Stocken.', life: 'Du nutzt dein Blut, um andere zu heilen – ein Opfer für deine Gefährten.' },
  fk: { blade: 'Fluch und Klinge sind eins. Deine Treffer sitzen tiefer, deine kritischen Treffer kommen früher.', judge: 'Du sprichst Urteile – Flüche, die schwächen und zum Schweigen bringen.', shadow: 'Du jagst aus dem Schatten und beendest die Jagd, wenn deine Beute schwach ist.' },
  ma: { combat: 'Deine Geräte sind für den Kampf gebaut: modifizierte Waffen und eine schützende Panzerung.', field: 'Du flickst Freunde und Material mitten im Gefecht.', alch: 'Tinkturen, Dämpfe und Mixturen – du baust mit Chemie.' }
};
for (const [k, t] of Object.entries(CLASS_FLAVOR)) if (CLASSES[k]) CLASSES[k].flavor = t;
for (const [k, t] of Object.entries(SPECIES_FLAVOR)) if (SPECIES[k]) SPECIES[k].flavor = t;
for (const [k, t] of Object.entries(BG_FLAVOR)) if (BACKGROUNDS[k]) BACKGROUNDS[k].flavor = t;
for (const [k, m] of Object.entries(SUB_FLAVOR)) { const C = CLASSES[k]; if (!C) continue; for (const [id, t] of Object.entries(m)) { (C.subs || []).forEach((s) => { if (s.id === id && !s.desc) s.desc = t; }); if (C.sub && C.sub.id === id && !C.sub.desc) C.sub.desc = t; } }
