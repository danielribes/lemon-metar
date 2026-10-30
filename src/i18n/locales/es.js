import { adjective, composeWeather, joinList, noun } from '../romance.js';

const GRAMMAR = {
  conjunction: 'y',
  vicinity: 'en las proximidades',
  phenomena: {
    DZ: noun('llovizna', 'f'),
    RA: noun('lluvia', 'f'),
    SN: noun('nieve', 'f'),
    SG: noun('cinarra', 'f'),
    PL: noun('gránulos de hielo', 'm', true),
    GR: noun('granizo'),
    GS: noun('granizo pequeño o nieve granulada'),
    UP: noun('precipitación desconocida', 'f'),
    BR: noun('neblina', 'f'),
    FG: noun('niebla', 'f'),
    FU: noun('humo'),
    VA: noun('ceniza volcánica', 'f'),
    DU: noun('polvo generalizado'),
    SA: noun('arena', 'f'),
    HZ: noun('calima', 'f'),
    PO: noun('remolinos de polvo o arena', 'm', true),
    SQ: noun('turbonadas', 'f', true),
    FC: noun('nube en embudo', 'f'),
    SS: noun('tempestad de arena', 'f'),
    DS: noun('tempestad de polvo', 'f'),
  },
  intensities: {
    light: adjective('ligero ligera ligeros ligeras'),
    moderate: adjective('moderado moderada moderados moderadas'),
    heavy: adjective('fuerte fuerte fuertes fuertes'),
  },
  descriptors: {
    MI: adjective('bajo baja bajos bajas'),
    PR: adjective('parcial parcial parciales parciales'),
    DR: adjective('arrastrado arrastrada arrastrados arrastradas', ' a baja altura'),
    BL: adjective('levantado levantada levantados levantadas', ' por el viento'),
    FZ: adjective('engelante engelante engelantes engelantes'),
  },
  heads: {
    BC: { ...noun('bancos', 'm', true), link: 'de' },
    SH: { ...noun('chubascos', 'm', true), link: 'de' },
    TS: { ...noun('tormenta', 'f'), link: 'con' },
  },
};

const DIRECTIONS = {
  N: 'hacia el norte',
  NE: 'hacia el nordeste',
  E: 'hacia el este',
  SE: 'hacia el sudeste',
  S: 'hacia el sur',
  SW: 'hacia el sudoeste',
  W: 'hacia el oeste',
  NW: 'hacia el noroeste',
};

const TENDENCIES = { up: 'en aumento', down: 'en disminución', none: 'sin cambios' };

/** Article plus time: "la 01:30", "las 22:30". */
const hourOf = (clock) => (clock.startsWith('01:') ? `la ${clock}` : `las ${clock}`);

export const es = {
  reportType: {
    METAR: 'Informe meteorológico ordinario (METAR).',
    SPECI: 'Informe meteorológico especial (SPECI).',
    corrected: 'Informe corregido.',
  },
  station({ icao, special, corrected }) {
    const words = ['Observación', special && 'especial', corrected && 'corregida'];
    return `${words.filter(Boolean).join(' ')} en ${icao}.`;
  },
  time: ({ day, clock }) => `Día ${day} a ${hourOf(clock)} UTC.`,
  nil: 'Informe no disponible.',
  auto: 'Observación generada automáticamente.',
  wind: {
    calm: 'Viento en calma.',
    notAvailable: 'Viento no disponible.',
    speed: (speed, gust) => (gust === null ? `${speed} kt` : `${speed} kt con rachas de ${gust} kt`),
    variable: (speed) => `Viento variable de ${speed}.`,
    directed: (direction, speed) => `Viento de ${direction}° a ${speed}.`,
    directionNotAvailable: (speed) => `Viento de ${speed}, dirección no disponible.`,
    speedNotAvailable: (direction) => `Viento de ${direction}°, velocidad no disponible.`,
  },
  windVariation: (from, to) => `Dirección del viento variable entre ${from}° y ${to}°.`,
  cavok: 'Visibilidad de 10 km o más y ninguna nube por debajo de 5000 ft (1500 m).',
  visibility: {
    tenKmOrMore: '10 km o más',
    notAvailable: 'Visibilidad no disponible.',
    value: (distance, noDirectionalVariation) =>
      `Visibilidad de ${distance}${noDirectionalVariation ? ', sin variación direccional disponible' : ''}.`,
  },
  minimumVisibility: (meters, direction) =>
    `Visibilidad mínima de ${meters} m${direction ? ` ${DIRECTIONS[direction]}` : ''}.`,
  rvr: {
    above: (meters) => `más de ${meters} m`,
    below: (meters) => `menos de ${meters} m`,
    between: (low, high) => `entre ${low} y ${high}`,
    notAvailable: (runway) => `RVR en la pista ${runway} no disponible.`,
    value: (runway, range, tendency) =>
      `RVR en la pista ${runway}: ${range}${tendency ? `, ${TENDENCIES[tendency]}` : ''}.`,
  },
  weather: {
    notObserved: 'Tiempo presente no observado.',
    phrase: (parts) => composeWeather(GRAMMAR, parts),
  },
  recentWeather: (phrase) => `Tiempo reciente: ${phrase}.`,
  sky: {
    amounts: {
      FEW: 'pocas nubes (1-2 octas)',
      SCT: 'nubes dispersas (3-4 octas)',
      BKN: 'nubes fragmentadas (5-7 octas)',
      OVC: 'cielo cubierto (8 octas)',
    },
    types: {
      CB: 'cumulonimbus',
      TCU: 'cúmulos congestus',
      unknown: 'nube convectiva no identificada',
    },
    unknownAmount: 'nubes en cantidad desconocida',
    unknownHeight: 'a altura desconocida',
    height: (feet) => `a ${feet} ft`,
    convectiveOnly: (type) => `${type}, cantidad y altura desconocidas`,
    verticalVisibility: (feet) => `Visibilidad vertical de ${feet} ft.`,
    verticalVisibilityUnknown: 'La visibilidad vertical no se puede determinar.',
    nsc: 'Ninguna nube significativa.',
    ncd: 'No se detectan nubes.',
    sensorFault: 'Sensor de nubes fuera de servicio.',
  },
  temperature: {
    air: (value) => (value === null ? 'Temperatura no disponible' : `Temperatura de ${value} °C`),
    dewPoint: (value) => (value === null ? 'punto de rocío no disponible' : `punto de rocío a ${value} °C`),
  },
  pressure: {
    qnh: (value) => `QNH ${value} hPa.`,
    notAvailable: 'QNH no disponible.',
  },
  windShear: {
    allRunways: 'Cizalladura del viento en todas las pistas.',
    runways: (runways) => `Cizalladura del viento en la pista ${joinList(runways, 'y')}.`,
  },
  trend: {
    NOSIG: 'Sin cambios significativos previstos en las próximas 2 horas.',
    BECMG: 'Previsión, cambio progresivo',
    TEMPO: 'Previsión, temporalmente',
    from: (clock) => `desde ${hourOf(clock)} UTC`,
    until: (clock) => `hasta ${hourOf(clock)} UTC`,
    at: (clock) => `a ${hourOf(clock)} UTC`,
    noSignificantWeather: 'Fin de los fenómenos significativos.',
  },
  remarks: (text) => `Observaciones: ${text}`,
};
