// Regenerates the --color-tutor-N palette in public/css/theme.css and the
// matching TUTOR_COLOR_VARS array in public/js/calendarScript.js (used to
// color STAFF's Calendar view by tutor - see applyTutorColor() there).
//
// Run with `node scripts/gen-tutor-palette.js`, then paste the printed
// blocks into theme.css (both the light and dark sections) and
// calendarScript.js.
//
// Design: humans reliably tell apart maybe ~12 hues at a glance, not 48. So
// instead of cramming 48 evenly-spaced (and therefore ~6 degrees apart, too
// close) hues into one lightness, this uses HUE_COUNT well-separated hues
// (~24 degrees apart) times TIER count distinct lightness/saturation tiers.
// The array is laid out one full hue sweep per tier (all HUE_COUNT hues,
// tier 1; then all of them again, tier 2; ...), each tier's hues offset a
// little from the others - so any run of HUE_COUNT consecutive tutor-color
// slots are all clearly different hues, and colors that do land on the same
// hue family (e.g. two tutor IDs exactly HUE_COUNT apart) still differ
// clearly in brightness/saturation.

const HUE_COUNT = 12;
const TIERS = [
  { s: 88, l: 38 },  // deep
  { s: 90, l: 50 },  // rich/vivid
  { s: 85, l: 62 },  // bright
  { s: 68, l: 76 },  // pale
];
const DARK_TIERS = [
  { s: 80, l: 50 },
  { s: 85, l: 60 },
  { s: 78, l: 70 },
  { s: 62, l: 82 },
];

// Forbidden hue ranges (degrees), each [start, end) - already used by
// --color-note (amber/orange) and --color-destructive (red). Blue IS allowed
// here even though --color-lesson is also blue - the logged-in tutor's own
// events never go through this palette (see applyTutorColor()), so the only
// risk is a colleague's tutor color landing close to it, which is an
// acceptable trade-off for a wider, more vivid palette.
const FORBIDDEN = [
  [345, 360], [0, 12],   // red / destructive
  [12, 55],              // orange / amber / note
];

const ARC_START = 55;
const ARC_END = 345;
const ARC_SPAN = ARC_END - ARC_START; // 290 degrees of usable hue
const HUE_STEP = ARC_SPAN / HUE_COUNT;

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r, g, b].map(v => Math.round((v + m) * 255));
}

function buildPalette(tiers) {
  const out = [];
  tiers.forEach((tier, tierIndex) => {
    const offset = (tierIndex / tiers.length) * HUE_STEP;
    for (let i = 0; i < HUE_COUNT; i++) {
      let h = ARC_START + i * HUE_STEP + offset;
      if (h >= ARC_END) h -= ARC_SPAN;
      out.push(hslToRgb(h, tier.s, tier.l));
    }
  });
  return out;
}

const light = buildPalette(TIERS);
const dark = buildPalette(DARK_TIERS);
const COUNT = light.length;

console.log('--- theme.css :root (light) ---');
light.forEach((rgb, i) => console.log(`    --color-tutor-${i + 1}: ${rgb.join(' ')};`));

console.log('\n--- theme.css :root[data-theme="dark"] ---');
dark.forEach((rgb, i) => console.log(`    --color-tutor-${i + 1}: ${rgb.join(' ')};`));

console.log('\n--- calendarScript.js TUTOR_COLOR_VARS ---');
const varNames = light.map((_, i) => `'--color-tutor-${i + 1}'`);
const lines = [];
for (let i = 0; i < varNames.length; i += 6) {
  lines.push('  ' + varNames.slice(i, i + 6).join(', ') + (i + 6 < varNames.length ? ',' : ''));
}
console.log('const TUTOR_COLOR_VARS = [\n' + lines.join('\n') + '\n];');

console.log(`\nGenerated ${COUNT} colors: ${HUE_COUNT} hues x ${TIERS.length} tiers.`);
