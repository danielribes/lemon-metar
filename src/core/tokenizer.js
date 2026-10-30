const TYPOGRAPHIC_DASHES = /[–−]/g;
const CONTROL_CHARACTERS = /[\0-\x08\x0E-\x1F\x7F]/g;
const TERMINATOR = /\s*=\s*$/;

/** Returns the report in canonical form: upper case, plain dashes, single spaces. */
export function normalize(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new TypeError('A METAR report must be a non-empty string');
  }

  return input
    .replace(CONTROL_CHARACTERS, '')
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
