import { toNumber } from './values.js';

const PATTERN = /^(?<direction>\d{3}|VRB|\/\/\/)(?<speed>\d{2,3}|\/\/)(?:G(?<gust>\d{2,3}))?(?<unit>KT|MPS)$/;
const UNITS = {
  KT: { id: 'kt', label: 'kt', minimumGustExcess: 10 },
  MPS: { id: 'mps', label: 'm/s', minimumGustExcess: 5 },
};
const UNIT_LABELS = { kt: UNITS.KT.label, mps: UNITS.MPS.label };

export const wind = {
  id: 'wind',

  parse(stream, context) {
    const match = stream.take(PATTERN);
    if (match === null) return null;

    const variable = match.groups.direction === 'VRB';
    const direction = variable ? null : toNumber(match.groups.direction);
    const speed = toNumber(match.groups.speed);
    const gust = toNumber(match.groups.gust);
    const unit = UNITS[match.groups.unit];

    if (gust !== null && speed !== null && gust < speed + unit.minimumGustExcess) {
      context.warn('wind.gust-too-low', match[0]);
    }

    return {
      direction,
      variable,
      speed,
      gust,
      calm: direction === 0 && speed === 0,
      unit: unit.id,
    };
  },

  describe({ direction, variable, speed, gust, calm, unit }, locale) {
    if (calm) return locale.wind.calm;
    if (speed === null && direction === null) return locale.wind.notAvailable;
    if (speed === null) return locale.wind.speedNotAvailable(direction);

    const speedText = locale.wind.speed(speed, gust, UNIT_LABELS[unit]);
    if (variable) return locale.wind.variable(speedText);
    if (direction === null) return locale.wind.directionNotAvailable(speedText);
    return locale.wind.directed(direction, speedText);
  },
};
