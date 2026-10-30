/** Joins items as `a, b and c`. */
export function joinList(items, conjunction) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items.at(-1)}`;
}

/** Declares a noun with the grammar its adjectives must agree with. */
export const noun = (text, gender = 'm', plural = false) => ({ text, gender, plural });

/** Declares an adjective by its four forms, with optional text after it. */
export const adjective = (forms, suffix = '') => ({ forms: forms.split(' '), suffix });

function agree({ forms, suffix }, { gender, plural }) {
  const index = (gender === 'f' ? 1 : 0) + (plural ? 2 : 0);
  return `${forms[index]}${suffix}`;
}

/** A list is plural, and feminine only if every noun is. */
const agreementOf = (nouns) => ({
  gender: nouns.every((item) => item.gender === 'f') ? 'f' : 'm',
  plural: nouns.length > 1 || nouns.some((item) => item.plural),
});

/**
 * Composes a weather phrase for Catalan and Spanish. Adjectives follow the noun and
 * agree with it: "xàfecs forts de pluja", "pluja gelant forta".
 */
export function composeWeather(grammar, { intensity, proximity, descriptor, phenomena }) {
  const nouns = phenomena.map((code) => grammar.phenomena[code]);
  const names = joinList(nouns.map((item) => item.text), grammar.conjunction);
  const intensityWord = grammar.intensities[intensity];
  const head = grammar.heads[descriptor];

  let parts;
  if (head) {
    parts = [
      head.text,
      intensityWord && agree(intensityWord, head),
      names && `${head.link} ${names}`,
    ];
  } else {
    const agreement = agreementOf(nouns);
    const descriptorWord = grammar.descriptors[descriptor];
    const adjectives = [
      descriptorWord && agree(descriptorWord, agreement),
      intensityWord && agree(intensityWord, agreement),
    ];
    // A descriptor with text after it goes last: "neu forta aixecada pel vent".
    parts = [names, ...(descriptorWord?.suffix ? adjectives.reverse() : adjectives)];
  }

  return [...parts, proximity && grammar.vicinity].filter(Boolean).join(' ');
}
