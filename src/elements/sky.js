import { capitalize, toNumber } from './values.js';

const CLOUD = /^(?<amount>FEW|SCT|BKN|OVC|\/\/\/)(?<height>\d{3}|\/\/\/)(?<cloudType>CB|TCU|\/\/\/)?$/;
const CONVECTIVE_ONLY = /^\/\/\/(?<cloudType>CB|TCU)$/;
const VERTICAL_VISIBILITY = /^VV(?<height>\d{3}|\/\/\/)$/;
const MAX_LAYERS = 4;
const FEET_PER_HEIGHT_UNIT = 100;

const toFeet = (height) => {
  const value = toNumber(height);
  return value === null ? null : value * FEET_PER_HEIGHT_UNIT;
};

const toCloudType = (cloudType) => {
  if (cloudType === undefined) return null;
  return cloudType === '///' ? 'unknown' : cloudType;
};

const parseLayer = ({ 0: raw, groups }) => ({
  raw,
  amount: groups.amount === undefined || groups.amount === '///' ? null : groups.amount,
  heightFt: toFeet(groups.height),
  cloudType: toCloudType(groups.cloudType),
});

const skyOf = (kind, fields = {}) => ({ kind, layers: [], verticalVisibilityFt: null, ...fields });

const isBlank = ({ amount, heightFt, cloudType }) =>
  amount === null && heightFt === null && (cloudType === null || cloudType === 'unknown');

function parseLayers(stream, context) {
  const layers = [];

  while (!stream.done) {
    const match = stream.take(CONVECTIVE_ONLY) ?? stream.take(CLOUD);
    if (match === null) break;
    layers.push(parseLayer(match));
  }

  if (layers.length === 0) return null;
  if (layers.every(isBlank)) return skyOf('sensorFault');
  if (layers.length > MAX_LAYERS) {
    context.warn('sky.too-many-layers', layers.map((layer) => layer.raw).join(' '));
  }
  return skyOf('layers', { layers });
}

function describeLayer({ amount, heightFt, cloudType }, locale) {
  const { sky } = locale;
  if (amount === null && heightFt === null) return sky.convectiveOnly(sky.types[cloudType]);

  const amountText = amount === null ? sky.unknownAmount : sky.amounts[amount];
  const heightText = heightFt === null ? sky.unknownHeight : sky.height(heightFt);
  const typeText = cloudType === null ? '' : ` (${sky.types[cloudType]})`;
  return `${amountText} ${heightText}${typeText}`;
}

export const sky = {
  id: 'sky',

  parse(stream, context) {
    if (stream.take(/^NSC$/)) return skyOf('nsc');
    if (stream.take(/^NCD$/)) return skyOf('ncd');

    const vertical = stream.take(VERTICAL_VISIBILITY);
    if (vertical) {
      return skyOf('verticalVisibility', { verticalVisibilityFt: toFeet(vertical.groups.height) });
    }

    return parseLayers(stream, context);
  },

  describe({ kind, layers, verticalVisibilityFt }, locale) {
    if (kind === 'layers') {
      const text = layers.map((layer) => describeLayer(layer, locale)).join('; ');
      return `${capitalize(text)}.`;
    }
    if (kind === 'verticalVisibility') {
      return verticalVisibilityFt === null
        ? locale.sky.verticalVisibilityUnknown
        : locale.sky.verticalVisibility(verticalVisibilityFt);
    }
    return locale.sky[kind];
  },
};
