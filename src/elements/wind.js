import { toNumber } from './values.js';

const PATTERN = /^(?<direction>\d{3}|VRB|\/\/\/)(?<speed>\d{2,3}|\/\/)(?:G(?<gust>\d{2,3}))?KT$/;

export const wind = {
  id: 'wind',

  parse(stream, context) {
    const match = stream.take(PATTERN);
    if (match === null) return null;

    const variable = match.groups.direction === 'VRB';
    const direction = variable ? null : toNumber(match.groups.direction);
    const speed = toNumber(match.groups.speed);
    const gust = toNumber(match.groups.gust);

    if (gust !== null && speed !== null && gust < speed + 10) {
      context.warn('wind.gust-too-low', match[0]);
    }

    return {
      direction,
      variable,
      speed,
      gust,
      calm: direction === 0 && speed === 0,
      unit: 'kt',
    };
  },

  describe({ direction, variable, speed, gust, calm }, locale) {
    if (calm) return locale.wind.calm;
    if (speed === null && direction === null) return locale.wind.notAvailable;
    if (speed === null) return locale.wind.speedNotAvailable(direction);

    const speedText = locale.wind.speed(speed, gust);
    if (variable) return locale.wind.variable(speedText);
    if (direction === null) return locale.wind.directionNotAvailable(speedText);
    return locale.wind.directed(direction, speedText);
  },
};
