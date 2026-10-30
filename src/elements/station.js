export const station = {
  id: 'station',

  parse(stream) {
    const match = stream.take(/^[A-Z][A-Z0-9]{3}$/);
    return match && { icao: match[0] };
  },

  describe({ icao, name, translated }, locale, report) {
    const { type, corrected } = report.reportType;
    const place = name ? `${name} (${icao})` : icao;
    return locale.station({ place, translated, special: type === 'SPECI', corrected });
  },
};
