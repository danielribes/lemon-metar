/** Converts a numeric group to a number. Groups encoded with solidi give `null`. */
export const toNumber = (value) => (value === undefined || value.includes('/') ? null : Number(value));

export const toClock = (hour, minute) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
