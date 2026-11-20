/* Zähler des Abenteuers. Jeder Zähler ist einmal definiert, damit er an jeder Stelle gleich aussieht (der Wert gilt ohnehin überall). */
const { CNT } = require('./krug-lib');
const DEF = {
  sterne: ['Sternepunkte für die Prüfung', { start: 0, min: -5, max: 15, tone: 'wahl', icon: '★',
    steps: [[-5, 'Zwick verzieht keine Miene.'], [5, '**Hoflieferant.** Ab 5 Punkten bekommen die Helden den Titel.'], [8, '**Mit Lob.** Im Palast startet der Verdacht bei 0, auch wenn Zwick am Morgen schlecht behandelt wurde.'], [11, '**Glänzend.** Zwick wird zum stillen Verbündeten und lenkt im Palast einmal die Wachen ab.']],
    hint: 'Punkte gibt es für gelöste Probleme, den Umgang mit Zwick am Morgen und gute Proben beim Probeessen. Alle Quellen stehen in Akt 3 unter „Zwick kommt“.' }],
  goblin: ['Der Goblin-Zähler', { start: 5, min: 0, max: 99, tone: 'probe', icon: '🔢',
    steps: [[5, 'Hinter der Tür: „Fünf! Fünf! Fünf!“'], [10, 'Die Goblins sind begeistert, so viele waren es lange nicht.'], [15, 'Neuer Tagesrekord. Die Goblins singen.'], [47, 'Hausrekord eingestellt. Grimsel weint vor Glück.']],
    hint: 'Jeder Blick durchs Schlüsselloch zählt einen hoch. Der Zähler läuft den ganzen Tag weiter, auch an anderen Türen.' }],
  verdacht: ['Verdacht im Palast', { start: 0, min: 0, max: 6, tone: 'kampf', icon: '👁',
    steps: [[0, 'Niemand ahnt etwas.'], [2, 'Der Hofkoch beobachtet die neuen Lieferanten.'], [4, 'Zwei Wachen folgen den Helden unauffällig. Heimlichkeit mit Nachteil.'], [6, '**Alarm.** Die Wachen rücken an. Weiter mit „Der Weg hinaus“, Flucht aus dem Palast.']],
    hint: 'Jede misslungene Probe in der Hofküche, jede auffällige Waffe und jede Panne mit der Fälschung: +1. Startwert 1, wenn Zwick am Morgen schlecht behandelt wurde (ausser bei 8 Sternepunkten).' }],
  hitze: ['Hitze des Phönixeis', { start: 0, min: 0, max: 6, tone: 'kampf', icon: '🔥',
    steps: [[0, 'Warm wie ein frisches Brot.'], [2, 'Heiss: Wer es ohne Schutz trägt, erleidet zu Beginn seines Zugs 1W6 Feuer.'], [4, 'Glühend: 2W6 Feuer pro Zug für den Träger ohne Ofenhandschuhe, Stoff fängt Feuer.'], [6, 'Es will schlüpfen. Jetzt muss es an Barnabas\' Brust, sonst ist die Magie verloren.']],
    hint: 'Steigt bei jedem Misserfolg auf dem Rückweg um 1 und in der Schlägerei immer dann, wenn das Ei zu Boden fällt.' }],
};
const C = (id) => CNT(id, DEF[id][0], DEF[id][1]);
module.exports = { C };
