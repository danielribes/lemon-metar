import { parseGroup } from '../core/pipeline.js';
import { cavok } from './cavok.js';
import { sky } from './sky.js';
import { toClock } from './values.js';
import { visibility } from './visibility.js';
import { weather } from './weather.js';
import { wind } from './wind.js';

const CHANGE = /^(BECMG|TEMPO)$/;
const TIME = /^(?<type>FM|TL|AT)(?<hour>\d{2})(?<minute>\d{2})$/;
const TIME_TYPES = { FM: 'from', TL: 'until', AT: 'at' };

function parseTimes(stream) {
  const times = [];
  for (let match = stream.take(TIME); match; match = stream.take(TIME)) {
    times.push({
      type: TIME_TYPES[match.groups.type],
      hour: Number(match.groups.hour),
      minute: Number(match.groups.minute),
    });
  }
  return times;
}

function parseChange(stream, context) {
  const start = stream.position;
  const change = stream.take(CHANGE);
  if (change === null) return null;

  const times = parseTimes(stream);
  const windGroup = parseGroup(wind, stream, context);
  const cavokGroup = parseGroup(cavok, stream, context);
  const visibilityGroup = cavokGroup ? null : parseGroup(visibility, stream, context);
  const weatherGroups = parseGroup(weather, stream, context) ?? [];
  const noSignificantWeather = weatherGroups.length === 0 && stream.take(/^NSW$/) !== null;
  const skyGroup = parseGroup(sky, stream, context);

  return {
    raw: stream.textFrom(start),
    kind: change[1],
    times,
    wind: windGroup,
    visibility: visibilityGroup,
    cavok: cavokGroup,
    weather: weatherGroups,
    noSignificantWeather,
    sky: skyGroup,
  };
}

function describeChange(change, locale) {
  const sentences = [
    change.wind && wind.describe(change.wind, locale),
    change.cavok && cavok.describe(change.cavok, locale),
    change.visibility && visibility.describe(change.visibility, locale),
    ...change.weather.map((group) => weather.describe(group, locale)),
    change.noSignificantWeather && locale.trend.noSignificantWeather,
    change.sky && sky.describe(change.sky, locale),
  ].filter(Boolean);

  const times = change.times.map(({ type, hour, minute }) => locale.trend[type](toClock(hour, minute)));
  const heading = [locale.trend[change.kind], ...times].join(' ');
  return sentences.length > 0 ? `${heading}: ${sentences.join(' ')}` : `${heading}.`;
}

export const trend = {
  id: 'trend',
  repeatable: true,

  parse(stream, context) {
    const noChange = stream.take(/^NOSIG$/);
    if (noChange) {
      return [{
        raw: noChange[0],
        kind: 'NOSIG',
        times: [],
        wind: null,
        visibility: null,
        cavok: null,
        weather: [],
        noSignificantWeather: false,
        sky: null,
      }];
    }

    const changes = [];
    for (let change = parseChange(stream, context); change; change = parseChange(stream, context)) {
      changes.push(change);
    }
    return changes.length > 0 ? changes : null;
  },

  describe(item, locale) {
    return item.kind === 'NOSIG' ? locale.trend.NOSIG : describeChange(item, locale);
  },
};
