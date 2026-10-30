export const cavok = {
  id: 'cavok',

  parse(stream) {
    return stream.take(/^CAVOK$/) && {};
  },

  describe(_data, locale) {
    return locale.cavok;
  },
};
