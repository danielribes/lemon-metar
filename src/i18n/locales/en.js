import { joinList } from '../romance.js';

const PHENOMENA = {
  DZ: 'drizzle',
  RA: 'rain',
  SN: 'snow',
  SG: 'snow grains',
  PL: 'ice pellets',
  GR: 'hail',
  GS: 'small hail or snow pellets',
  UP: 'unknown precipitation',
  BR: 'mist',
  FG: 'fog',
  FU: 'smoke',
  VA: 'volcanic ash',
  DU: 'widespread dust',
  SA: 'sand',
  HZ: 'haze',
  PO: 'dust or sand whirls',
  SQ: 'squalls',
  FC: 'funnel cloud',
  SS: 'sandstorm',
  DS: 'duststorm',
};

const prefixed = (word) => (names) => [word, names].filter(Boolean).join(' ');
const headed = (head, link) => (names) => (names ? `${head} ${link} ${names}` : head);

const DESCRIPTORS = {
  MI: prefixed('shallow'),
  BC: headed('patches', 'of'),
  PR: prefixed('partial'),
  DR: prefixed('low drifting'),
  BL: prefixed('blowing'),
  SH: headed('showers', 'of'),
  TS: headed('thunderstorm', 'with'),
  FZ: prefixed('freezing'),
};

const DIRECTIONS = {
  N: 'north',
  NE: 'northeast',
  E: 'east',
  SE: 'southeast',
  S: 'south',
  SW: 'southwest',
  W: 'west',
  NW: 'northwest',
};

const TENDENCIES = { up: 'rising', down: 'falling', none: 'no change' };

export const en = {
  reportType: {
    METAR: 'Routine meteorological report (METAR).',
    SPECI: 'Special meteorological report (SPECI).',
    corrected: 'Corrected report.',
  },
  station({ icao, special, corrected }) {
    const words = [corrected && 'corrected', special && 'special'].filter(Boolean).join(' ');
    const noun = words ? `${words} observation` : 'observation';
    return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} at ${icao}.`;
  },
  time: ({ day, clock }) => `Day ${day} at ${clock} UTC.`,
  nil: 'Report missing.',
  auto: 'Automatically generated observation.',
  wind: {
    calm: 'Calm wind.',
    notAvailable: 'Wind not available.',
    speed: (speed, gust, unit) =>
      (gust === null ? `${speed} ${unit}` : `${speed} ${unit}, gusting to ${gust} ${unit}`),
    variable: (speed) => `Variable wind at ${speed}.`,
    directed: (direction, speed) => `Wind from ${direction}° at ${speed}.`,
    directionNotAvailable: (speed) => `Wind at ${speed}, direction not available.`,
    speedNotAvailable: (direction) => `Wind from ${direction}°, speed not available.`,
  },
  windVariation: (from, to) => `Wind direction varying between ${from}° and ${to}°.`,
  cavok: 'Visibility 10 km or more and no cloud below 5000 ft (1500 m).',
  visibility: {
    tenKmOrMore: '10 km or more',
    notAvailable: 'Visibility not available.',
    value: (distance, noDirectionalVariation) =>
      `Visibility ${distance}${noDirectionalVariation ? ', no directional variation available' : ''}.`,
  },
  minimumVisibility: (meters, direction) =>
    `Minimum visibility ${meters} m${direction ? ` to the ${DIRECTIONS[direction]}` : ''}.`,
  rvr: {
    above: (meters) => `above ${meters} m`,
    below: (meters) => `below ${meters} m`,
    between: (low, high) => `between ${low} and ${high}`,
    notAvailable: (runway) => `RVR on runway ${runway} not available.`,
    value: (runway, range, tendency) =>
      `RVR on runway ${runway}: ${range}${tendency ? `, ${TENDENCIES[tendency]}` : ''}.`,
  },
  weather: {
    notObserved: 'Present weather not observed.',
    recentNotObserved: 'Recent weather not observed.',
    phrase({ intensity, proximity, descriptor, phenomena }) {
      const names = joinList(phenomena.map((code) => PHENOMENA[code]), 'and');
      const core = descriptor ? DESCRIPTORS[descriptor](names) : names;
      return [intensity, core, proximity && 'in the vicinity'].filter(Boolean).join(' ');
    },
  },
  recentWeather: (phrase) => `Recent weather: ${phrase}.`,
  sky: {
    amounts: {
      FEW: 'few clouds (1-2 oktas)',
      SCT: 'scattered clouds (3-4 oktas)',
      BKN: 'broken clouds (5-7 oktas)',
      OVC: 'overcast (8 oktas)',
    },
    types: {
      CB: 'cumulonimbus',
      TCU: 'towering cumulus',
      unknown: 'unidentified convective cloud',
    },
    unknownAmount: 'clouds of unknown amount',
    unknownHeight: 'at unknown height',
    height: (feet) => `at ${feet} ft`,
    convectiveOnly: (type) => `${type}, amount and height unknown`,
    verticalVisibility: (feet) => `Vertical visibility ${feet} ft.`,
    verticalVisibilityUnknown: 'Vertical visibility cannot be determined.',
    nsc: 'No significant cloud.',
    ncd: 'No clouds detected.',
    sensorFault: 'Cloud sensor out of order.',
  },
  temperature: {
    air: (value) => (value === null ? 'Temperature not available' : `Temperature ${value} °C`),
    dewPoint: (value) => (value === null ? 'dew point not available' : `dew point ${value} °C`),
  },
  pressure: {
    qnh: (value) => `QNH ${value} hPa.`,
    notAvailable: 'QNH not available.',
  },
  windShear: {
    allRunways: 'Wind shear on all runways.',
    runways: (runways) => `Wind shear on runway ${joinList(runways, 'and')}.`,
  },
  trend: {
    NOSIG: 'No significant change expected in the next 2 hours.',
    BECMG: 'Forecast, becoming',
    TEMPO: 'Forecast, temporarily',
    from: (clock) => `from ${clock} UTC`,
    until: (clock) => `until ${clock} UTC`,
    at: (clock) => `at ${clock} UTC`,
    noSignificantWeather: 'End of significant weather.',
  },
  remarks: (text) => `Remarks: ${text}`,
};
