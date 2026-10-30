const TYPOGRAPHIC_DASHES = /[–−]/g;
const TERMINATOR = /\s*=\s*$/;

/** Returns the report in canonical form: upper case, plain dashes, single spaces. */
export function normalize(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new TypeError('A METAR report must be a non-empty string');
  }

  return input
    .trim()
    .toUpperCase()
    .replace(TYPOGRAPHIC_DASHES, '-')
    .replace(TERMINATOR, '')
    .replace(/\s+/g, ' ');
}

export function tokenize(input) {
  const normalized = normalize(input);
  return normalized === '' ? [] : normalized.split(' ');
}
