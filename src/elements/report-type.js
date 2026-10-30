export const DEFAULT_REPORT_TYPE = Object.freeze({ raw: null, type: 'METAR', corrected: false });

export const reportType = {
  id: 'reportType',

  parse(stream) {
    const type = stream.take(/^(METAR|SPECI)$/);
    const corrected = stream.take(/^COR$/) !== null;
    if (type === null && !corrected) return null;

    return { type: type?.[1] ?? DEFAULT_REPORT_TYPE.type, corrected };
  },

  describe({ type, corrected }, locale) {
    const text = locale.reportType[type];
    return corrected ? `${text} ${locale.reportType.corrected}` : text;
  },
};
