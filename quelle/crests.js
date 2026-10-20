/* Klassen-Wappen als Strichzeichnungen (eigene Gestaltung), Rahmen 64×64 */
const CREST = {
 bar: '<path d="M16 50 46 20M48 50 18 20"/><path d="M40 12c8 1 13 6 14 14-5-3-9-3-12 0l-6-6c3-3 3-7 4-8z"/><path d="M24 12c-8 1-13 6-14 14 5-3 9-3 12 0l6-6c-3-3-3-7-4-8z"/>',
 brd: '<ellipse cx="25" cy="42" rx="12" ry="11"/><circle cx="25" cy="42" r="3.5"/><path d="M33 34 50 13M47 10l7 7M45 16l4 4"/><path d="M19 37l12 10"/>',
 cle: '<circle cx="32" cy="32" r="9"/><path d="M32 9v8M32 47v8M9 32h8M47 32h8M16 16l5.5 5.5M42.5 42.5 48 48M48 16l-5.5 5.5M21.5 42.5 16 48"/>',
 dru: '<path d="M32 54C16 44 14 26 32 10c18 16 16 34 0 44z"/><path d="M32 54V18M32 30l-8-6M32 38l9-7M32 46l-7-5"/>',
 fig: '<path d="M14 14 44 44M50 14 20 44"/><path d="M40 48l8-8M16 40l8 8"/><path d="M32 30c6 0 11-2 11-2v12c0 7-5 12-11 15-6-3-11-8-11-15V28s5 2 11 2z"/>',
 mon: '<path d="M32 32a3 3 0 1 1 6 0 7 7 0 1 1-14 0 11 11 0 1 1 22 0 15 15 0 1 1-30 0 19 19 0 1 1 38 0"/>',
 pal: '<path d="M32 10c8 4 15 5 20 5v15c0 12-8 20-20 25-12-5-20-13-20-25V15c5 0 12-1 20-5z"/><path d="M32 20v24M23 30h18"/><circle cx="32" cy="30" r="3"/>',
 ran: '<path d="M18 10c18 8 18 36 0 44"/><path d="M18 10v44"/><path d="M10 32h40M44 26l7 6-7 6M14 28l-4 4 4 4"/>',
 rog: '<path d="M40 10 22 40l4 4 18-30z"/><path d="M18 38l10 10M14 50l6-6"/><path d="M16 44c-3 1-5 3-6 6 3-1 5-3 6-6z"/>',
 sor: '<path d="M32 54c-11 0-17-8-15-17 2-7 8-10 8-18 6 4 8 10 7 15 4-2 6-6 6-10 7 5 10 12 8 19-2 7-7 11-14 11z"/><path d="M32 54c-4 0-7-3-6-7 1-3 4-5 4-9 4 3 6 7 5 10"/>',
 wlk: '<path d="M8 32c7-11 15-16 24-16s17 5 24 16c-7 11-15 16-24 16S15 43 8 32z"/><circle cx="32" cy="32" r="8"/><path d="M32 26v12" stroke-width="3.6"/>',
 wiz: '<path d="M10 18c8-3 15-2 22 3v32c-7-5-14-6-22-3z"/><path d="M54 18c-8-3-15-2-22 3v32c7-5 14-6 22-3z"/><path d="M43 26l1.6 3.4 3.4 1.6-3.4 1.6L43 36l-1.6-3.4L38 31l3.4-1.6z"/>',
 rk: '<path d="M20 10h24l6 12-4 32H18l-4-32z"/><path d="M32 18v28M32 24l8 6M32 32l-8 6"/>',
 bw: '<path d="M32 8c10 14 16 22 16 30a16 16 0 0 1-32 0c0-8 6-16 16-30z"/><path d="M24 40c0 4 3 7 7 8"/>',
 fk: '<path d="M44 8 22 42l4 3L48 11z"/><path d="M16 40l12 9M18 52l6-5"/><path d="M38 30c6 2 11 7 12 14M34 38c4 3 6 7 6 12" stroke-dasharray="3 4"/>',
 ma: '<circle cx="32" cy="32" r="8"/><path d="M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4 4M42 42l4 4M46 18l-4 4M22 42l-4 4"/><circle cx="32" cy="32" r="16"/>',
 npc: '<path d="M16 50 46 20M48 50 18 20M40 26l6-6 4 4-6 6M24 26l-6-6-4 4 6 6"/>'
};
function crestSvg(cls) { return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (CREST[cls] || CREST.fig) + '</svg>'; }
