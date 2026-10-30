import { capitalize } from './values.js';
import { WEATHER_GROUP, hasPrecipitation, splitPhenomena } from './weather-codes.js';

/** The lookahead rejects a qualifier with nothing to qualify. */
const PATTERN = new RegExp(`^(?!(?:[-+]|VC)?$)(?<qualifier>[-+]|VC)?${WEATHER_GROUP}$`);
const NOT_OBSERVED = /^\/\/$/;
const MAX_GROUPS = 3;
const INTENSITIES = { '-': 'light', '+': 'heavy', VC: null };
const RAISED_FROM_GROUND = ['DR', 'BL'];

const parseGroup = ({ 0: raw, groups }) => ({
  raw,
  intensity: groups.qualifier === undefined ? 'moderate' : INTENSITIES[groups.qualifier],
  proximity: groups.qualifier === 'VC',
  descriptor: groups.descriptor ?? null,
  phenomena: splitPhenomena(groups.phenomena),
  notObserved: false,
});

const notObservedGroup = (raw) => ({
  raw,
  intensity: null,
  proximity: false,
  descriptor: null,
  phenomena: [],
  notObserved: true,
});

export const weather = {
  id: 'weather',
  repeatable: true,

  parse(stream, context) {
    const groups = [];

    while (!stream.done) {
      const match = stream.take(PATTERN);
      const notObserved = match ? null : stream.take(NOT_OBSERVED);
      if (match === null && notObserved === null) break;
      groups.push(match ? parseGroup(match) : notObservedGroup(notObserved[0]));
    }

    if (groups.length > MAX_GROUPS) {
      context.warn('weather.too-many-groups', groups.map((group) => group.raw).join(' '));
    }

    return groups.length > 0 ? groups : null;
  },

  describe({ intensity, proximity, descriptor, phenomena, notObserved }, locale) {
    if (notObserved) return locale.weather.notObserved;

    const falling = hasPrecipitation(phenomena) && !RAISED_FROM_GROUND.includes(descriptor);
    const shownIntensity = intensity === 'moderate' && !falling ? null : intensity;
    const phrase = locale.weather.phrase({ intensity: shownIntensity, proximity, descriptor, phenomena });
    return `${capitalize(phrase)}.`;
  },
};
