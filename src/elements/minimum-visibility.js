const PATTERN = /^(?<value>\d{4})(?<direction>N|NE|E|SE|S|SW|W|NW)?$/;

export const minimumVisibility = {
  id: 'minimumVisibility',

  parse(stream, context) {
    if (!context.report.visibility) return null;

    const match = stream.take(PATTERN);
    return match && { meters: Number(match.groups.value), direction: match.groups.direction ?? null };
  },

  describe({ meters, direction }, locale) {
    return locale.minimumVisibility(meters, direction);
  },
};
