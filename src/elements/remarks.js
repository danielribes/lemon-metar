export const remarks = {
  id: 'remarks',

  parse(stream) {
    return stream.take(/^RMK$/) && { text: stream.rest().join(' ') };
  },

  describe({ text }, locale) {
    return locale.remarks(text);
  },
};
