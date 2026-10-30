import { toClock } from './values.js';

const PATTERN = /^(?<day>\d{2})(?<hour>\d{2})(?<minute>\d{2})Z$/;

export const observationTime = {
  id: 'time',

  parse(stream, context) {
    const match = stream.take(PATTERN);
    if (match === null) return null;

    const [day, hour, minute] = [match.groups.day, match.groups.hour, match.groups.minute].map(Number);
    if (day < 1 || day > 31 || hour > 23 || minute > 59) {
      context.warn('time.out-of-range', match[0]);
    }

    return { day, hour, minute };
  },

  describe({ day, hour, minute }, locale) {
    return locale.time({ day, clock: toClock(hour, minute) });
  },
};
