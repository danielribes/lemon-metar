const PATTERN = /^(?<from>\d{3})V(?<to>\d{3})$/;

export const windVariation = {
  id: 'windVariation',

  parse(stream) {
    const match = stream.take(PATTERN);
    return match && { from: Number(match.groups.from), to: Number(match.groups.to) };
  },

  describe({ from, to }, locale) {
    return locale.windVariation(from, to);
  },
};
