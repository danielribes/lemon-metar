import { toNumber } from './values.js';

const PATTERN =
  /^R(?<runway>\d{2}[LCR]?)\/(?<modifier>[PM])?(?<value>\d{4}|\/\/\/\/)(?:V(?<maxModifier>[PM])?(?<max>\d{4}))?(?<tendency>[UDN])?$/;
const MODIFIERS = { P: 'above', M: 'below' };
const TENDENCIES = { U: 'up', D: 'down', N: 'none' };

const parseGroup = ({ 0: raw, groups }) => ({
  raw,
  runway: groups.runway,
  meters: toNumber(groups.value),
  modifier: MODIFIERS[groups.modifier] ?? null,
  tendency: TENDENCIES[groups.tendency] ?? null,
  variation: groups.max === undefined
    ? null
    : { meters: Number(groups.max), modifier: MODIFIERS[groups.maxModifier] ?? null },
});

const distanceText = ({ meters, modifier }, locale) =>
  modifier ? locale.rvr[modifier](meters) : `${meters} m`;

export const rvr = {
  id: 'rvr',
  repeatable: true,

  parse(stream) {
    const groups = [];
    for (let match = stream.take(PATTERN); match; match = stream.take(PATTERN)) {
      groups.push(parseGroup(match));
    }
    return groups.length > 0 ? groups : null;
  },

  describe({ runway, meters, modifier, tendency, variation }, locale) {
    if (meters === null) return locale.rvr.notAvailable(runway);

    const distance = distanceText({ meters, modifier }, locale);
    const range = variation
      ? locale.rvr.between(distance, distanceText(variation, locale))
      : distance;
    return locale.rvr.value(runway, range, tendency);
  },
};
