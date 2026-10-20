/* ==== Kontexthilfe: kleine „?“-Knöpfe mit Erklärungen ==== */
const HELP = {
  zug: ['Zugleiste', [
    'Oben siehst du, was dir in diesem Zug noch bleibt: Aktion (A), Bonusaktion (B), Reaktion (R) und Bewegung.',
    'Tippe auf eine Pille, um alle passenden Möglichkeiten zu sehen – Angriffe, Zauber, Klassenmerkmale, Tränke und Standardaktionen. Mit dem Stern ★ legst du Favoriten an, die immer direkt sichtbar sind.',
    'Angriffe und Zauber zählen automatisch mit. Im Kampf (am Tisch oder mit „⚔ Kampfmodus“) gelten die Zugregeln: Ist etwas verbraucht, blockiert die App die Aktion. Ausserhalb eines Kampfes zählt sie nur mit. Unter Hausregeln → Regeloptionen kannst du „Regeln streng durchsetzen“ ausschalten, dann warnt sie nur.',
    'D&D 2024: Pro Zug darfst du nur einen Zauberplatz verbrauchen (Zaubertricks und Gratiswirkungen zählen nicht). Fähigkeiten „1× pro Zug“ wie Hinterhältiger Angriff oder Kolossjäger lassen sich nur einmal anwählen.',
    'Im Kampf am Tisch kannst du oben ein Ziel wählen. Dann wirken seine Zustände automatisch: z. B. Vorteil gegen ein liegendes Ziel im Nahkampf, kritischer Treffer gegen ein bewusstloses Ziel, Mal des Jägers nur gegen das markierte Ziel.',
    '„Neuer Zug“ setzt alles zurück. Im Kampf am Tisch passiert das automatisch, wenn du an der Reihe bist.']],
  zustand: ['Zustände', [
    'Aktive Zustände stehen als Chips oben. Mit „+ Zustand“ setzt du einen neuen; ein Tipp auf einen Chip entfernt ihn.',
    'Die App berücksichtigt Zustände bei deinen Würfen, z. B. Nachteil bei „vergiftet“ oder automatisch misslungene STÄ- und GES-Rettungswürfe bei „gelähmt“.',
    'Erschöpfung zählt in Stufen: Jede Stufe zieht 2 von allen W20-Würfen ab und verringert die Bewegung um 1,5 m. Bei Stufe 6 stirbt der Charakter.']],
  res: ['Ressourcen', [
    'Hier stehen alle Fähigkeiten mit begrenzten Nutzungen – Kampfrausch, Göttliche Macht, Talente und vieles mehr.',
    'Gefüllte Kreise sind noch verfügbar. Ein Tipp verbraucht eine Nutzung, ein weiterer gibt sie zurück.',
    '„Kurze Rast“ und „Lange Rast“ füllen genau die Ressourcen wieder auf, die laut Regeln dabei zurückkehren.']],
  slots: ['Zauberplätze', [
    'Jeder Kreis ist ein Zauberplatz des angegebenen Grades. Wirkst du über die Zauberliste, wird automatisch ein passender Platz verbraucht.',
    'Paktmagie (Hexenmeister) wird getrennt angezeigt und kehrt schon nach einer kurzen Rast zurück.',
    'Höhere Plätze verstärken viele Zauber: Die App rechnet den zusätzlichen Schaden oder die zusätzlichen Ziele mit ein.']],
  angriff: ['Angriffe', [
    'Ein Tipp auf den Angriffsbonus würfelt den Angriff. Danach erscheint der Trefferdialog: Dort wählst du „Treffer“ oder „Kritisch“ und kannst Zusatzschaden wie Göttliches Niederstrecken oder Hinterhältigen Angriff dazunehmen.',
    'Waffenmeisterschaften (z. B. Umstossen, Verlangsamen) stehen bei der Waffe und werden im Dialog angeboten.',
    'Mit „Rechenweg“ siehst du, woraus sich Bonus und Schaden zusammensetzen.']],
  effekt: ['Effekte im Kampf', [
    'Effekte sind laufende Zauber und Zustände mit Dauer, z. B. Segnen für 10 Runden. Die App zählt die Runden bei jedem „Nächster Zug“ herunter.',
    'Effekte aus Konzentrationszaubern enden automatisch, wenn deine Konzentration endet.',
    'Erinnerungen an Rettungswürfe („am Ende des Zuges wiederholen“) erscheinen genau dann, wenn die betroffene Kreatur dran ist.']],
  kampf: ['Kampf & Initiative', [
    'Alle am Tisch sehen dieselbe Initiativeleiste. Die Spielleitung fügt Monster aus dem Bestiarium hinzu und klickt sich mit „Nächster Zug“ durch die Runde.',
    'Auf ein Monster tippen öffnet seine Karte: TP, Zustände, Angriffe und Notizen. Mehrere Monster kannst du auswählen und gemeinsam Schaden oder Rettungswürfe abhandeln.',
    'Der Begegnungsplaner berechnet die Schwierigkeit nach den SRD-5.2-Erfahrungsbudgets für deine Gruppe.']],
  planer: ['Begegnungsplaner', [
    'Wähle Monster und Anzahl. Die App summiert die Erfahrungspunkte und vergleicht sie mit dem Budget der Gruppe: niedrig, mittel oder hoch.',
    'Mit „Gruppeninitiative“ würfeln gleiche Monster gemeinsam – das spart Zeit bei grossen Gruppen.',
    'Begegnungen kannst du speichern und später mit einem Klick in den Kampf übernehmen.']],
  rechenweg: ['Rechenweg', [
    'Ist „Rechenweg“ eingeschaltet, steht unter jedem Wert klein, woraus er sich zusammensetzt – Attribut, Übungsbonus, Gegenstände, Talente.',
    'So siehst du sofort, warum deine RK 17 ist oder woher ein +1 auf Rettungswürfe kommt.']],
  undo: ['Rückgängig', [
    'Fast jede Änderung am Bogen lässt sich zurücknehmen: TP, Ressourcen, Zauberplätze, Inventar, Münzen, Stufe.',
    'Nach einer Änderung erscheint unten kurz „↶ Rückgängig“. Am Computer geht es auch mit Strg+Z. Bis zu 25 Schritte pro Held werden gemerkt.',
    'Folgenschwere Knöpfe wie „Lange Rast“ oder „Kampf beenden“ fragen vorher nach.']],
  tisch: ['Am Tisch', [
    'Am Tisch spielt ihr gemeinsam: Würfe, Initiative, Effekte und Handouts sind für alle sichtbar, die im selben Raum sind.',
    'Die Spielleitung erstellt einen Raum und teilt den Code. Spielerinnen und Spieler treten mit diesem Code bei – ein Konto braucht es nicht.',
    'Mit dem Schalter oben bestimmst du, wer deine Würfe sieht: alle, nur die Spielleitung oder niemand (verdeckt).']],
  boost: ['Nachbessern', [
    'Nach einem Wurf zeigt die App, was du noch draufpacken darfst: Heldeninspiration, Glückskind, Taktischer Verstand und ähnliche Fähigkeiten.',
    'Bekommst du von anderen einen Bonus (z. B. Segnen +1W4 oder Bardische Inspiration), wählst du den Würfel unter „Von Verbündeten“.']],
  build: ['Helden erstellen', [
    'Gehe die Schritte oben der Reihe nach durch: Klasse, Spezies, Hintergrund, Attribute, Zauber, Abschluss. Du kannst jederzeit zurückspringen.',
    'Unterklassen werden ab Stufe 3 wählbar. Mit ✦ markierte Inhalte sind Eigenkreationen des Heldenbuchs, alles andere stammt aus dem SRD 5.2.',
    'Fehlt noch etwas, zeigt die App einen Hinweis mit Link zur passenden Stelle.']],
  auto: ['Was rechnet die App – was entscheidet die SL?', [
    'Automatisch: deine Werte, Angriffs- und Schadenswürfe, Zauberplätze, Ressourcen, Aktionsökonomie, Dauer deiner Wirkungen, deine Zustände, Konzentrationsproben bei eigenem Schaden, Rasten.',
    'Mit „SL entscheidet“ markiert: ob ein Angriff trifft (RK des Ziels), Rettungswürfe und Konzentration von Gegnern, Resistenz/Immunität/Verwundbarkeit, Abstand, Deckung, Sicht, Positionen (Stoss) und Beschwörungen.',
    'Die App rät nie: Wo sie etwas nicht wissen kann, fragt sie nach oder zeigt den SG an.']],
  regeln: ['Regeloptionen', [
    'Standard ist D&D 2024 nach SRD 5.2. Jede abweichende Einstellung ist eine Hausregel und wird so markiert.',
    'Die Optionen gelten auf diesem Gerät. Sprecht am Tisch ab, welche Hausregeln ihr nutzt.']],
  sub: ['Unterklassen', [
    'Ab Stufe 3 wählst du eine Unterklasse. Sie gibt deiner Klasse eine Richtung und bringt auf bestimmten Stufen eigene Merkmale.',
    'Die erste Unterklasse jeder SRD-Klasse stammt aus dem SRD 5.2. Alle mit ✦ markierten sind Eigenkreationen des Heldenbuchs – mit eigenen Ideen, Namen und Regeln. Frag deine Spielleitung, ob sie am Tisch erlaubt sind.',
    'Ressourcen, Zusatzschaden und Aktionen der gewählten Unterklasse erscheinen automatisch auf dem Bogen, in der Zugleiste und im Trefferdialog.']],
  attr: ['Attributswerte', [
    'Standardwerte: Verteile 15, 14, 13, 12, 10 und 8 auf die sechs Attribute. Punktekauf: 27 Punkte, jeder Wert zwischen 8 und 15. Gewürfelt / frei: Trage eigene Werte ein, z. B. aus 4W6, bei denen der niedrigste Würfel wegfällt.',
    'Der Hintergrund gibt zusätzlich +2/+1 oder dreimal +1 auf die angegebenen Attribute.',
    'Der Modifikator (in Klammern) ist das, was bei Würfen zählt: (Wert − 10) ÷ 2, abgerundet.']]
};
function helpBtn(k) { return '<button class="hlp" data-act="help" data-arg="' + k + '" aria-label="Hilfe: ' + esc(HELP[k][0]) + '" title="Erklärung">?</button>'; }
XA.help = (t, a) => {
  const h = HELP[a]; if (!h) return; const m = $('#modal'); S.modal = 'help';
  m.innerHTML = '<div class="dlg helpdlg" role="dialog" aria-modal="true" aria-label="' + esc(h[0]) + '"><div class="dph"><b>' + esc(h[0]) + '</b><button class="x" data-act="closeModal" aria-label="Schliessen">×</button></div>' + h[1].map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>';
  m.hidden = false;
};
/* nach jedem Rendern die passenden Überschriften mit „?“ versehen */
const HELP_HEADS = [[/^Zustände/, 'zustand'], [/^Ressourcen/, 'res'], [/^Zauberplätze/, 'slots'], [/^Angriffe/, 'angriff'], [/^Kampf/, 'kampf'], [/^Begegnung planen/, 'planer'], [/^Am Tisch|^Als Spielleitung|^Würfe am Tisch/, 'tisch'], [/^Klasse wählen/, 'build'], [/^Unterklasse$/, 'sub'], [/^Attributswerte/, 'attr'], [/^Effekt/, 'effekt'], [/^Regeloptionen/, 'regeln'], [/^Würfe am Tisch|^Deine Würfe/, 'auto']];
function addHelp() {
  document.querySelectorAll('#view h2, #view h3, #modal h3').forEach((h) => {
    if (h.querySelector('.hlp')) return; const tx = h.textContent.trim();
    const m = HELP_HEADS.find(([re]) => re.test(tx)); if (m) h.insertAdjacentHTML('beforeend', ' ' + helpBtn(m[1]));
  });
  const tb = document.querySelector('.turnblk .tbar'); if (tb && !tb.querySelector('.hlp')) tb.insertAdjacentHTML('beforeend', helpBtn('zug'));
  const mx = document.querySelector('.mnav .mexp'); if (mx && !mx.parentNode.querySelector('.hlp[data-arg=rechenweg]')) mx.insertAdjacentHTML('afterend', helpBtn('rechenweg'));
  const ub = document.querySelector('.mnav .undobtn, .undobtn'); if (ub && !ub.parentNode.querySelector('.hlp[data-arg=undo]')) ub.insertAdjacentHTML('afterend', helpBtn('undo'));
  const bb = document.querySelector('#boostBar .bbh'); if (bb && !bb.querySelector('.hlp')) bb.querySelector('.x').insertAdjacentHTML('beforebegin', helpBtn('boost'));
}
