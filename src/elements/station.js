export const station = {
  id: 'station',

  parse(stream) {
    const match = stream.take(/^[A-Z][A-Z0-9]{3}$/);
    return match && { icao: match[0] };
  },

  describe({ icao }, locale, report) {
    const { type, corrected } = report.reportType;
    return locale.station({ icao, special: type === 'SPECI', corrected });
  },
};
