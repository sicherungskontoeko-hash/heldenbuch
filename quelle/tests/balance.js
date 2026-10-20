/* HB-20 Balance-Übersicht: feste Referenz-Builds je Klasse/Unterklasse auf Stufe 3/5/11/17/20.
   Rechnet aus dem tatsächlichen Rechenkern (derive): Angriffe pro Aktion, Schaden pro Runde (Waffe, 65 % Trefferchance,
   inkl. einmal-pro-Zug-Zusatzschaden), TP, RK und Ressourcen pro Rast. Schreibt tests/BALANCE.md. Aufruf: node tests/balance.js */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await p.goto('file://' + path.resolve(__dirname, '..', 'index.html')); await p.waitForTimeout(400);
  const rows = await p.evaluate(() => {
    const avg = (d) => { const m = /(\d+)W(\d+)/.exec(d || ''); return m ? +m[1] * (+m[2] + 1) / 2 : 0; };
    const out = [];
    for (const [cid, C] of Object.entries(CLASSES)) for (const sb of (C.subs || [])) {
      const r = { cls: C.name, sub: sb.name, own: /✦/.test(sb.name) || !!C.home, v: {} };
      for (const L of [3, 5, 11, 17, 20]) {
        const prim = C.prim[0]; const base = { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 }; base[prim] = 16; if (C.prim[1]) base[C.prim[1]] = 15;
        const ch = newChar({ cls: cid, level: L, sub: sb.id, base, bgPlus: {}, weapons: [{ w: prim === 'dex' ? 'rapier' : 'longsword' }, { w: 'longbow' }] });
        const c = derive(ch, {});
        const w = c.attacks.filter((a) => a.idx !== undefined).sort((x, y) => (avg(y.die) + y.dmod) - (avg(x.die) + x.dmod))[0] || c.attacks[0];
        const per = c.attacksPer; const hit = 0.65;
        const extraOnce = (c.dmgExtras || []).filter((x) => !x.res).reduce((s, x) => Math.max(s, x.n * (x.s + 1) / 2 + (x.flat || 0)), 0);
        const sneak = c.lv('rog') ? Math.ceil(c.lv('rog') / 2) * 3.5 : 0;
        const dpr = per * hit * (avg(w.die) + w.dmod) + (1 - Math.pow(1 - hit, per)) * (extraOnce + sneak);
        const res = c.res.map((x) => x.n.replace(/\s*\(.*\)$/, '') + ' ' + x.max + (x.reset === 'short' ? '/KR' : '/LR'));
        r.v[L] = { dpr: Math.round(dpr * 10) / 10, hp: c.hpMax, ac: c.ac, res: res.length };
        if (L === 11) r.res11 = res.join(', ');
      }
      out.push(r);
    }
    return out;
  });
  let md = '# Balance-Übersicht (Referenz-Builds)\n\nAutomatisch berechnet aus dem Rechenkern am ' + new Date().toISOString().slice(0, 10) + '. Annahmen: Hauptattribut 16, zweites 15, KON 14, beste Waffe (Langschwert oder Rapier), 65 % Trefferchance, einmal pro Zug der stärkste Zusatzschaden ohne Ressourcenkosten. Zauber, Ressourcen-Fähigkeiten und Kontrolle sind **nicht** im Schaden enthalten – die Spalte zeigt nur den Waffen-Grundschaden. ✦ = Eigenkreation.\n\n';
  md += '| Klasse | Unterklasse | SpR 3 | SpR 5 | SpR 11 | SpR 17 | SpR 20 | TP 11 | RK 11 | Ressourcen (Stufe 11) |\n|---|---|---|---|---|---|---|---|---|---|\n';
  for (const r of rows) md += '| ' + r.cls + ' | ' + r.sub + ' | ' + [3, 5, 11, 17, 20].map((L) => r.v[L].dpr).join(' | ') + ' | ' + r.v[11].hp + ' | ' + r.v[11].ac + ' | ' + (r.res11 || '–') + ' |\n';
  /* Auffälligkeiten: Eigenkreation mehr als 25 % über der SRD-Unterklasse derselben Klasse */
  md += '\n## Auffälligkeiten (Waffenschaden Stufe 11, mehr als 25 % über der SRD-Unterklasse derselben Klasse)\n\n';
  const flags = [];
  for (const r of rows) { const ref = rows.find((x) => x.cls === r.cls && !x.own); if (!ref || r === ref) continue; const d = r.v[11].dpr / Math.max(1, ref.v[11].dpr); if (d > 1.25) flags.push('- ' + r.cls + ' · ' + r.sub + ': ' + r.v[11].dpr + ' gegenüber ' + ref.v[11].dpr + ' (' + Math.round((d - 1) * 100) + ' % mehr)'); }
  md += (flags.length ? flags.join('\n') : 'Keine.') + '\n';
  fs.writeFileSync(path.join(__dirname, 'BALANCE.md'), md); console.log(rows.length + ' Unterklassen ausgewertet, ' + flags.length + ' Auffälligkeiten'); await b.close();
})();
