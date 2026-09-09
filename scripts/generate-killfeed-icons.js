const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'icons', 'killfeed');
const weaponsDir = path.join(baseDir, 'weapons');
fs.mkdirSync(weaponsDir, { recursive: true });

const svgs = {};

// 1. Headshot icon (24x24) - CS style skull/head with bullet impact
svgs['headshot.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2C7.58 2 4 5.58 4 10c0 2.38 1.05 4.52 2.72 6L6 20h3l1-1h4l1 1h3l-.72-4C18.95 14.52 20 10 20 10c0-4.42-3.58-8-8-8zm-2 15h-1.5l.38-2.5C8.3 14.07 8 13.58 8 13h2v4zm6 0h-2v-4h2c0 .58-.3 1.07-.88 1.5l.38 2.5H16zm-4-6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm6.5-1.5h-2.1c-.2-1.3-.9-2.3-2-2.9V4.5c2.5.7 4.1 3 4.1 6z" opacity="0.95"/><circle cx="12" cy="9" r="1.5" fill="#ffffff"/><line x1="12" y1="5" x2="12" y2="7" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="11" x2="12" y2="13" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/><line x1="8" y1="9" x2="10" y2="9" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/><line x1="14" y1="9" x2="16" y2="9" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/></svg>`;

// 2. Penetration / Wallbang icon (24x24) - bullet passing through wall
svgs['penetration.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffffff"><rect x="10" y="3" width="4" height="18" rx="1" fill="#ffffff" opacity="0.7"/><path d="M2 11h6v2H2zM16 11h2l4 1-4 1h-2z" fill="#ffffff"/><path d="M8 9l2 3-2 3z" fill="#ffffff"/><line x1="1" y1="12" x2="22" y2="12" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="2 2"/></svg>`;

function wrapWeaponSvg(pathD) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 24" fill="#ffffff"><path fill-rule="evenodd" clip-rule="evenodd" d="${pathD}"/></svg>`;
}

const weaponSvgs = {};

// 3. AK-47
const ak47D = 'M4 14.5l10-1.5v-3l12-.5v1.2l3 .3v-1.5l14-.3.5-1.7 4 .5.3 1.2h16v-1.5l3 .3v1.2l8 .2v2.5l-4 .5v-1l-7-.2v1l-22 .3-2 3.5-6 10-5.5-1 4.5-9-1.5-1.5-4 1.5-2 3.5h-3.5l1-4.5-2-1.5-11 2-10 1-3.5-4 1-3z';
weaponSvgs['ak47.svg'] = wrapWeaponSvg(ak47D);

// 4. M4A4 / M4A1
const m4a4D = 'M5 14l11-1.2v-2.8l9-.3v-2.2l6 .5v1.7l16-.2v-1.5l3 .3v1.2h18v2.2l-3 .3v-1l-7-.2v1l-18 .2-3 4-5 9.5-5.5-1 4-8.5-2-1.5-4 1-2.5 4h-3.5l1-5-2-1.5-10 1.5-6 1-3-4.5z';
weaponSvgs['m4a4.svg'] = wrapWeaponSvg(m4a4D);
weaponSvgs['m4a1.svg'] = wrapWeaponSvg(m4a4D);

// 5. M4A1-S (Silenced)
const m4a1sD = 'M4 14l10-1.2v-2.8l8-.3v-2l5 .5v1.5l15-.2v-1.2l2 .2v1h8v-1h22v4.2h-22v-1h-8v.8l-15 .2-3 4-4.5 8.5-5-1 3.5-7.5-2-1.5-3.5 1-2.5 4h-3l1-5-2-1.5-9 1.5-5 .8-2.5-4z';
weaponSvgs['m4a1_silencer.svg'] = wrapWeaponSvg(m4a1sD);
weaponSvgs['m4a1s.svg'] = wrapWeaponSvg(m4a1sD);

// 6. Galil AR
const galilD = 'M5 15l10-1.5v-3.5l11-.5v1.5l4 .3v-1.8l13-.2.5-1.5 3 .5v1l15 .3v-1.2l2.5.3v1l9 .2v2.2l-4 .5v-.8l-7-.2v1l-18 .3-2.5 3.5-6.5 10.5-5-1 5-9.5-2-1.5-3.5 1.2-2 3.8h-3.2l1-4.8-2-1.2-10 1.5-8 .8-3-4.2z';
weaponSvgs['galilar.svg'] = wrapWeaponSvg(galilD);

// 7. AWP Sniper Rifle
const awpD = 'M3 15.5l12-1v-2l11-.5v-4h18v4l18-.2v-1.2l4 .3v.9h12v2.5h-12v.8l-2 .3v-1.1h-16v.5l-18 .2-4 3.5-6 1.5-1 4.5-4 .5 1.5-5.5-2-1-8 .5-6-1.5-1.5-4-7.5.5-2-2.5z';
weaponSvgs['awp.svg'] = wrapWeaponSvg(awpD);

// 8. Desert Eagle (Deagle)
const deagleD = 'M25 15.5l15-1.5v-5l28-.5v4.5l-3 .5v-.5h-2v1.5l-21 .5-2 3-5 9.5-6.5-1.5 4-8-2-1-4 .5-1.5 2h-3l1-4-2-1-7 1.5-5.5-1.5 1-3.5 11.5-.5z';
weaponSvgs['deagle.svg'] = wrapWeaponSvg(deagleD);

// 9. Glock-18
const glockD = 'M27 15l14-1v-4.5l26-.3v4l-3 .5v-.5h-2v1.5l-20 .5-1.5 2.5-4.5 9-6-1.5 3.5-7.5-2-1-3 .5-1.5 2h-3l1-4-2-1-6 1-4.5-1.5.5-3.5 11-.2z';
weaponSvgs['glock.svg'] = wrapWeaponSvg(glockD);

// 10. USP / USP-S
const uspD = 'M28 15l13-1v-4.5l25-.3v4.2l-2 .5v-.5h-2v1.5l-19 .5-2 2.5-4.5 9-6-1.5 3.5-7.5-2-1-3.5.5-1.5 2h-3l1-4-2-1-6 1-4-1.5.5-3.5 11-.2z';
const uspsD = 'M16 15l12-1v-4.5l22-.3v-1h24v4.5h-24v-1h-2v1.5l-17 .5-2 2.5-4.5 9-6-1.5 3.5-7.5-2-1-3.5.5-1.5 2h-3l1-4-2-1-5 1-4-1.5.5-3.5 10-.2z';
weaponSvgs['usp.svg'] = wrapWeaponSvg(uspD);
weaponSvgs['usp_silencer.svg'] = wrapWeaponSvg(uspsD);

// 11. Knife (Standard)
const knifeD = 'M15 13.5l14-1.5v-3.5h3.5v3.5l22-.5 18-2 3.5 3.5-14 3.5-29.5.5v3.5h-3.5v-3.5l-14 1.5-4.5-5z';
weaponSvgs['knife.svg'] = wrapWeaponSvg(knifeD);

// 12. Karambit
const karambitD = 'M14 14c2-3 6-4 9-2l12 6c3 1.5 6 1 8-1l16-12c-4 7-10 13-18 16-6 2-12 1-17-3l-7-3.5-2 2c-2.5 2.5-6.5 1.5-8-1.5-1.5-3-.5-6.5 2-8l5-1.5v-1.5z';
weaponSvgs['knife_karambit.svg'] = wrapWeaponSvg(karambitD);

// 13. Butterfly Knife
const butterflyD = 'M12 14.5l15-2.5 2.5-2 2.5 2 24-2 16-3.5 3 3.5-12 4-31 2.5-3 2-3-2-13 2.5-3.5-4.5z';
weaponSvgs['knife_butterfly.svg'] = wrapWeaponSvg(butterflyD);

for (const [filename, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(baseDir, filename), content.trim(), 'utf8');
  console.log('Wrote', filename);
}
for (const [filename, content] of Object.entries(weaponSvgs)) {
  fs.writeFileSync(path.join(weaponsDir, filename), content.trim(), 'utf8');
  console.log('Wrote weapon', filename);
}
console.log('Done generating SVG killfeed icons!');
