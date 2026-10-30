import { adjective, composeWeather, joinList, noun } from '../romance.js';

const GRAMMAR = {
  conjunction: 'i',
  vicinity: 'a les proximitats',
  phenomena: {
    DZ: noun('plugim'),
    RA: noun('pluja', 'f'),
    SN: noun('neu', 'f'),
    SG: noun('neu granulada', 'f'),
    PL: noun('grànuls de gel', 'm', true),
    GR: noun('calamarsa', 'f'),
    GS: noun('calamarsa petita o neu granulada', 'f'),
    UP: noun('precipitació desconeguda', 'f'),
    BR: noun('boirina', 'f'),
    FG: noun('boira', 'f'),
    FU: noun('fum'),
    VA: noun('cendra volcànica', 'f'),
    DU: noun('pols generalitzada', 'f'),
    SA: noun('sorra', 'f'),
    HZ: noun('calitja', 'f'),
    PO: noun('remolins de pols o sorra', 'm', true),
    SQ: noun('torbonades', 'f', true),
    FC: noun('núvol en embut'),
    SS: noun('tempesta de sorra', 'f'),
    DS: noun('tempesta de pols', 'f'),
  },
  intensities: {
    light: adjective('lleuger lleugera lleugers lleugeres'),
    moderate: adjective('moderat moderada moderats moderades'),
    heavy: adjective('fort forta forts fortes'),
  },
  descriptors: {
    MI: adjective('baix baixa baixos baixes'),
    PR: adjective('parcial parcial parcials parcials'),
    DR: adjective('arrossegat arrossegada arrossegats arrossegades', ' a poca alçada'),
    BL: adjective('aixecat aixecada aixecats aixecades', ' pel vent'),
    FZ: adjective('gelant gelant gelants gelants'),
  },
  heads: {
    BC: { ...noun('bancs', 'm', true), link: 'de' },
    SH: { ...noun('xàfecs', 'm', true), link: 'de' },
    TS: { ...noun('tempesta', 'f'), link: 'amb' },
  },
};

const DIRECTIONS = {
  N: 'cap al nord',
  NE: 'cap al nord-est',
  E: "cap a l'est",
  SE: 'cap al sud-est',
  S: 'cap al sud',
  SW: 'cap al sud-oest',
  W: "cap a l'oest",
  NW: 'cap al nord-oest',
};

const TENDENCIES = { up: 'en augment', down: 'en disminució', none: 'sense canvis' };

/** Article plus time: "la 01:30", "les 22:30". */
const hourOf = (clock) => (clock.startsWith('01:') ? `la ${clock}` : `les ${clock}`);

export const ca = {
  reportType: {
    METAR: 'Informe meteorològic ordinari (METAR).',
    SPECI: 'Informe meteorològic especial (SPECI).',
    corrected: 'Informe corregit.',
  },
  station({ icao, special, corrected }) {
    const words = ['Observació', special && 'especial', corrected && 'corregida'];
    return `${words.filter(Boolean).join(' ')} a ${icao}.`;
  },
  time: ({ day, clock }) => `Dia ${day} a ${hourOf(clock)} UTC.`,
  nil: 'Informe no disponible.',
  auto: 'Observació generada automàticament.',
  wind: {
    calm: 'Vent en calma.',
    notAvailable: 'Vent no disponible.',
    speed: (speed, gust, unit) =>
      (gust === null ? `${speed} ${unit}` : `${speed} ${unit} amb ratxes de ${gust} ${unit}`),
    variable: (speed) => `Vent variable de ${speed}.`,
    directed: (direction, speed) => `Vent de ${direction}° a ${speed}.`,
    directionNotAvailable: (speed) => `Vent de ${speed}, direcció no disponible.`,
    speedNotAvailable: (direction) => `Vent de ${direction}°, velocitat no disponible.`,
  },
  windVariation: (from, to) => `Direcció del vent variable entre ${from}° i ${to}°.`,
  cavok: 'Visibilitat de 10 km o més i cap núvol per sota de 5000 ft (1500 m).',
  visibility: {
    tenKmOrMore: '10 km o més',
    notAvailable: 'Visibilitat no disponible.',
    value: (distance, noDirectionalVariation) =>
      `Visibilitat de ${distance}${noDirectionalVariation ? ', sense variació direccional disponible' : ''}.`,
  },
  minimumVisibility: (meters, direction) =>
    `Visibilitat mínima de ${meters} m${direction ? ` ${DIRECTIONS[direction]}` : ''}.`,
  rvr: {
    above: (meters) => `més de ${meters} m`,
    below: (meters) => `menys de ${meters} m`,
    between: (low, high) => `entre ${low} i ${high}`,
    notAvailable: (runway) => `RVR a la pista ${runway} no disponible.`,
    value: (runway, range, tendency) =>
      `RVR a la pista ${runway}: ${range}${tendency ? `, ${TENDENCIES[tendency]}` : ''}.`,
  },
  weather: {
    notObserved: 'Temps present no observat.',
    recentNotObserved: 'Temps recent no observat.',
    phrase: (parts) => composeWeather(GRAMMAR, parts),
  },
  recentWeather: (phrase) => `Temps recent: ${phrase}.`,
  sky: {
    amounts: {
      FEW: 'pocs núvols (1-2 octes)',
      SCT: 'núvols dispersos (3-4 octes)',
      BKN: 'núvols fragmentats (5-7 octes)',
      OVC: 'cel cobert (8 octes)',
    },
    types: {
      CB: 'cumulonimbus',
      TCU: 'cúmulus congestus',
      unknown: 'núvol convectiu no identificat',
    },
    unknownAmount: 'núvols en quantitat desconeguda',
    unknownHeight: 'a alçada desconeguda',
    height: (feet) => `a ${feet} ft`,
    convectiveOnly: (type) => `${type}, quantitat i alçada desconegudes`,
    verticalVisibility: (feet) => `Visibilitat vertical de ${feet} ft.`,
    verticalVisibilityUnknown: 'La visibilitat vertical no es pot determinar.',
    nsc: 'Cap núvol significatiu.',
    ncd: 'No es detecten núvols.',
    sensorFault: 'Sensor de núvols fora de servei.',
  },
  temperature: {
    air: (value) => (value === null ? 'Temperatura no disponible' : `Temperatura de ${value} °C`),
    dewPoint: (value) => (value === null ? 'punt de rosada no disponible' : `punt de rosada a ${value} °C`),
  },
  pressure: {
    qnh: (value) => `QNH ${value} hPa.`,
    notAvailable: 'QNH no disponible.',
  },
  windShear: {
    allRunways: 'Cisallament del vent a totes les pistes.',
    runways: (runways) => `Cisallament del vent a la pista ${joinList(runways, 'i')}.`,
  },
  trend: {
    NOSIG: 'Cap canvi significatiu previst en les pròximes 2 hores.',
    BECMG: 'Previsió, canvi progressiu',
    TEMPO: 'Previsió, temporalment',
    from: (clock) => `des de ${hourOf(clock)} UTC`,
    until: (clock) => `fins a ${hourOf(clock)} UTC`,
    at: (clock) => `a ${hourOf(clock)} UTC`,
    noSignificantWeather: 'Fi dels fenòmens significatius.',
  },
  remarks: (text) => `Observacions: ${text}`,
};
