export const DESCRIPTORS = ['MI', 'BC', 'PR', 'DR', 'BL', 'SH', 'TS', 'FZ'];
export const PRECIPITATION = ['DZ', 'RA', 'SN', 'SG', 'PL', 'GR', 'GS', 'UP'];
export const OBSCURATION = ['BR', 'FG', 'FU', 'VA', 'DU', 'SA', 'HZ'];
export const OTHER = ['PO', 'SQ', 'FC', 'SS', 'DS'];
export const PHENOMENA = [...PRECIPITATION, ...OBSCURATION, ...OTHER];

/** Regex source of a weather group without its intensity or proximity qualifier. */
export const WEATHER_GROUP =
  `(?<descriptor>${DESCRIPTORS.join('|')})?(?<phenomena>(?:${PHENOMENA.join('|')})*)`;

/** Splits a run of two-letter codes, keeping report order: the first one predominates. */
export const splitPhenomena = (phenomena) => phenomena.match(/../g) ?? [];

export const hasPrecipitation = (phenomena) =>
  phenomena.some((code) => PRECIPITATION.includes(code));
