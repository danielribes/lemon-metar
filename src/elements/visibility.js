import { toNumber } from './values.js';

const PATTERN = /^(?<value>\d{4}|\/\/\/\/)(?<ndv>NDV)?$/;
const TEN_KM_OR_MORE = '9999';

export const visibility = {
  id: 'visibility',

  parse(stream) {
    const match = stream.take(PATTERN);
    if (match === null) return null;

    const orMore = match.groups.value === TEN_KM_OR_MORE;
    return {
      meters: orMore ? 10_000 : toNumber(match.groups.value),
      orMore,
      noDirectionalVariation: match.groups.ndv !== undefined,
    };
  },

  describe({ meters, orMore, noDirectionalVariation }, locale) {
    if (meters === null) return locale.visibility.notAvailable;

    const distance = orMore ? locale.visibility.tenKmOrMore : `${meters} m`;
    return locale.visibility.value(distance, noDirectionalVariation);
  },
};
