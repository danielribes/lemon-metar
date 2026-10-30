export const auto = {
  id: 'auto',

  parse(stream) {
    return stream.take(/^AUTO$/) && {};
  },

  describe(_data, locale) {
    return locale.auto;
  },
};
