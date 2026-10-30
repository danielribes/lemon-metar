const RUNWAY = /^R(\d{2}[LCR]?)$/;

export const windShear = {
  id: 'windShear',

  parse(stream) {
    const runways = [];
    let allRunways = false;

    while (stream.peek() === 'WS') {
      if (stream.peek(1) === 'ALL' && stream.peek(2) === 'RWY') {
        allRunways = true;
        stream.advance(3);
        continue;
      }

      const runway = RUNWAY.exec(stream.peek(1) ?? '');
      if (runway === null) break;
      runways.push(runway[1]);
      stream.advance(2);
    }

    return allRunways || runways.length > 0 ? { allRunways, runways } : null;
  },

  describe({ allRunways, runways }, locale) {
    return allRunways ? locale.windShear.allRunways : locale.windShear.runways(runways);
  },
};
