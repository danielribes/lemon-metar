/** Elements of each summary line, in reading order. */
const SUMMARY_LINES = [
  ['station', 'time', 'nil', 'auto'],
  ['wind', 'windVariation', 'cavok', 'visibility', 'minimumVisibility', 'rvr', 'weather', 'sky'],
  ['temperature'],
  ['pressure'],
  ['recentWeather'],
  ['windShear'],
  ['trend'],
  ['remarks'],
];

const descriptionsOf = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.map((item) => item.description) : [value.description];
};

export function buildSummary(report) {
  return SUMMARY_LINES
    .map((ids) => ids.flatMap((id) => descriptionsOf(report[id])).join(' '))
    .filter((line) => line !== '')
    .join('\n');
}
