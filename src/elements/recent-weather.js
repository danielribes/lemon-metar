import { WEATHER_GROUP, splitPhenomena } from './weather-codes.js';

const PATTERN = new RegExp(`^RE(?!$)${WEATHER_GROUP}$`);
const MAX_GROUPS = 3;

export const recentWeather = {
  id: 'recentWeather',
  repeatable: true,

  parse(stream, context) {
    const groups = [];
    for (let match = stream.take(PATTERN); match; match = stream.take(PATTERN)) {
      groups.push({
        raw: match[0],
        descriptor: match.groups.descriptor ?? null,
        phenomena: splitPhenomena(match.groups.phenomena),
      });
    }

    if (groups.length > MAX_GROUPS) {
      context.warn('recentWeather.too-many-groups', groups.map((group) => group.raw).join(' '));
    }

    return groups.length > 0 ? groups : null;
  },

  describe({ descriptor, phenomena }, locale) {
    const phrase = locale.weather.phrase({ intensity: null, proximity: false, descriptor, phenomena });
    return locale.recentWeather(phrase);
  },
};
