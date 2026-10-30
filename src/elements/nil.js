export const nil = {
  id: 'nil',
  terminal: true,

  parse(stream) {
    return stream.take(/^NIL$/) && {};
  },

  describe(_data, locale) {
    return locale.nil;
  },
};
