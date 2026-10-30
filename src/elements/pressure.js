import { toNumber } from './values.js';

const PATTERN = /^Q(?<value>\d{4}|\/\/\/\/)$/;

export const pressure = {
  id: 'pressure',

  parse(stream) {
    const match = stream.take(PATTERN);
    return match && { qnh: toNumber(match.groups.value), unit: 'hPa' };
  },

  describe({ qnh }, locale) {
    return qnh === null ? locale.pressure.notAvailable : locale.pressure.qnh(qnh);
  },
};
