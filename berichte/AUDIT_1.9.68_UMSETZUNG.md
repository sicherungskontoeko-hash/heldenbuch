# Umsetzung der unabhängigen Prüfung 1.9.68

Stand: 2026-11-26. Grundlage ist der Prüfbericht «Fablecrown 1.9.68 – unabhängige Prüfung» mit 10 Befunden.

Jeder Befund wurde zuerst selbst nachvollzogen und danach bewertet. Umgesetzt wurde nur, was nach eigener Prüfung zutrifft.

| Befund | Bewertung | Umsetzung | Nachweis |
|---|---|---|---|
| FC68-01 Mehrtab, stille Überschreibung | **Zutreffend.** Bearbeitete ein Tab einen Helden, gingen Änderungen eines anderen Tabs an diesem Helden beim nächsten Speichern verloren. | Die Änderung des anderen Tabs wird nicht mehr verworfen, sondern zurückgehalten. Beim nächsten Speichern oder nach dem Tippen wird sie feldweise zusammengeführt (Drei-Wege: gemeinsamer Stand, hier, dort). Bei einem Widerspruch im selben Feld gilt der eigene Stand; der Stand des anderen Tabs bleibt als Kopie «(anderer Tab)» erhalten, mit Hinweis. Wird der Held im anderen Tab gelöscht, während er hier bearbeitet wird, bleibt er mit Hinweis erhalten. (`app.js`: `merge3`, `extMerge`, `lsExternal`) | `audit68.test.js`, 4 Fälle mit zwei echten Tabs |
| FC68-02 Änderung ohne Marke gilt als gesichert | **Zutreffend** (Vault, inaktiv). | Vor jedem Abgleich wird jedes lokale Objekt mit dem zuletzt abgeglichenen Stand verglichen (`scan`). Abweichungen werden nachträglich markiert. | `vault.test.js` FC68-02; Prüfskript des Auditors: lokal und remote gleich |
| FC68-03 Gelöschter Held lebt wieder auf | **Zutreffend** (Vault). | Ein lokal fehlendes Objekt mit bekannter Basis gilt jetzt als Löschung, nicht als Altbestand. `scan` erfasst auch Löschungen ohne Marke. Steht dem eine neuere Änderung gegenüber, entsteht ein Konflikt. | `vault.test.js` FC68-03 (2 Fälle); Prüfskript des Auditors: Konflikt statt Wiederbeleben |
| FC68-04 Speicherfehler verborgen | **Zutreffend** (Vault). | Ein Fehler beim Speichern des Vault-Zustands wird gemeldet, nicht verschluckt (Prüfung durch Zurücklesen); der Status wird «Fehler». Eine Übernahme vom Dienst gilt nur, wenn der lokale Speicher sie dauerhaft hat; sonst wird der alte Stand zurückgesetzt und die Basis nicht vorgezogen. | Statisch; **die vollständige Folge bei vollem Speicher ist nicht dynamisch geprüft** (vor V3 nachholen) |
| FC68-05 SL-Rolle nicht an Identität gebunden | **Zutreffend als Architekturgrenze.** Der Tisch ist bewusst vertrauensbasiert. | Kein Umbau. Die Grenze steht jetzt ausdrücklich in `ANLEITUNG.md`: nur für vertraute Runden; eine veränderte App kann sich als SL ausgeben. | – |
| FC68-06 Formwandler-Import mit unzulässigen Formen | **Zutreffend.** Im Spiel war die Auswahl schon begrenzt, beim Laden und Importieren nicht. | Beim Laden und Importieren werden die Formen bereinigt (`hxFormsClean` in `normChar`): nur bekannte Formen, keine doppelten, 1 Form, ab Stufe 11 zwei, auf Stufe 20 drei, Flügel ab 17; ohne Formwandler-Stufen keine Form. Bereinigen statt ablehnen, damit alte Spielstände ladbar bleiben. | `audit68.test.js` FC68-06 |
| FC68-07 Hausregel mit gleicher ID überschrieben | **Zutreffend.** | Ist eine Hausregel identisch, wird sie nicht doppelt angelegt. Weicht sie ab, kommt sie als Kopie «(importiert)» mit neuer ID dazu; die Verweise der mitgelieferten Helden werden auf die Kopie umgestellt. Das Original bleibt unverändert, mit Hinweis beim Laden. | `audit68.test.js` FC68-07 |
| FC68-08 Würfelparser akzeptiert Unsinn und Infinity | **Teilweise zutreffend.** Infinity und unbegrenzte Ausdrücke waren ein Fehler. Text um den Ausdruck herum zu tolerieren ist dagegen Absicht, weil gespeicherte Schadensangaben Text enthalten können. | Ausdrücke werden auf 200 Zeichen und 40 Terme begrenzt, Zahlen auf 1 000 000; es entstehen nur noch endliche Werte. Die freie Eingabe über die Claude-Brücke prüft die Grammatik schon vollständig. **Nicht geprüft:** ob weitere Freitextfelder direkt gewürfelt werden. | `audit68.test.js` FC68-08 |
| FC68-09 «Beide behalten» nur für Helden | **Zutreffend** (Vault). | Die Kopie funktioniert jetzt auch für Hausregeln. Misslingt sie, bleibt der Konflikt offen (`resolve` liefert dann false). | `vault.test.js` FC68-09 |
| FC68-10 Hängende HTTP-Anfrage | **Zutreffend** (Vault, Verdacht plausibel). | Anfragen werden nach 20 s abgebrochen. Das gilt als offline; die Wiederholung sendet dieselbe Version. | Statisch |

## Weitere Punkte aus dem Bericht
- **Stichworte ohne Treffer** (Wundenspiegel, Schicksalsknoten, hungriger Zahn usw.):
  - Der Befund stimmt, diese Gegenstände sind nicht in der App.
  - Im Auftragspaket dieser Runde waren sie nicht beauftragt. Sie werden nicht eigenmächtig nachgebaut.
- **Testqualität:**
  - Die neuen Tests prüfen den tatsächlich gespeicherten Folgezustand (localStorage, Inhalte beim Dienst), nicht nur Statusmeldungen.
  - Die Negativtests des Auditors für den Vault laufen jetzt mit dem erwarteten Ergebnis.
- **Freigabegates** bleiben gültig:
  - echte Geräte
  - Mehrclient-Tisch
  - Neustart und voller Speicher mit echtem Speicher
  - vor V3: Fehler-Injektion an jedem Schritt und ein realer Testserver

## Testlauf
- `vault.test.js` 42/42, `audit68.test.js` 8/8.
- Gesamtlauf: siehe Commit.
