const PATTERN = /^(?<air>M?\d{2}|\/\/)\/(?<dewPoint>M?\d{2}|\/\/)$/;

function toCelsius(value) {
  if (value === '//') return null;

  const degrees = Number(value.replace('M', ''));
  return value.startsWith('M') && degrees !== 0 ? -degrees : degrees;
}

export const temperature = {
  id: 'temperature',

  parse(stream, context) {
    const match = stream.take(PATTERN);
    if (match === null) return null;

    const air = toCelsius(match.groups.air);
    const dewPoint = toCelsius(match.groups.dewPoint);
    if (air !== null && dewPoint !== null && dewPoint > air) {
      context.warn('temperature.dew-point-above-air', match[0]);
    }

    return { air, dewPoint, unit: 'C' };
  },

  describe({ air, dewPoint }, locale) {
    return `${locale.temperature.air(air)}, ${locale.temperature.dewPoint(dewPoint)}.`;
  },
};
