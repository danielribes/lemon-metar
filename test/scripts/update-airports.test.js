import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv, parseStations, renderModule, selectAirports } from '../../scripts/update-airports.js';

const row = (fields) => ({ type: 'small_airport', ident: '', icao_code: '', gps_code: '', name: 'Name', ...fields });

test('parseCsv reads plain and quoted fields', () => {
  const rows = parseCsv('"ident",name\n"LELL","Sabadell, ""Vallès"""\r\nLEBL,Barcelona\n');
  assert.deepEqual(rows, [
    { ident: 'LELL', name: 'Sabadell, "Vallès"' },
    { ident: 'LEBL', name: 'Barcelona' },
  ]);
});

test('parseCsv keeps new lines inside quotes, and reads a last row with no new line', () => {
  assert.deepEqual(parseCsv('a,b\n"x\ny",2'), [{ a: 'x\ny', b: '2' }]);
});

test('parseStations reads each code once and skips other links', () => {
  const listing = '<a href="LELL.TXT">x</a> <a href="LELL.TXT">x</a> <a href="LEBL.TXT">y</a> <a href="../">up</a> <a href="1234.TXT">z</a>';
  assert.deepEqual(parseStations(listing), ['LELL', 'LEBL']);
});

test('AIR-01: keeps only the stations that publish reports', () => {
  const rows = [row({ ident: 'LELL', name: 'A' }), row({ ident: 'LEBL', name: 'B' })];
  assert.deepEqual(selectAirports(rows, ['LELL', 'XXXX']), { LELL: 'A' });
});

test('AIR-02: matches on ident, then icao_code, then gps_code', () => {
  const rows = [
    row({ gps_code: 'AAAA', name: 'by gps' }),
    row({ icao_code: 'BBBB', name: 'by icao' }),
    row({ ident: 'AAAA', name: 'by ident' }),
    row({ gps_code: 'BBBB', name: 'weaker gps' }),
    row({ gps_code: 'CCCC', name: 'only gps' }),
  ];
  assert.deepEqual(selectAirports(rows, ['AAAA', 'BBBB', 'CCCC']), {
    AAAA: 'by ident',
    BBBB: 'by icao',
    CCCC: 'only gps',
  });
});

test('AIR-03: ignores closed airports and empty names', () => {
  const rows = [row({ ident: 'AAAA', type: 'closed' }), row({ ident: 'BBBB', name: '' })];
  assert.deepEqual(selectAirports(rows, ['AAAA', 'BBBB']), {});
});

test('AIR-04: output is sorted by code', () => {
  const rows = [row({ ident: 'BBBB' }), row({ ident: 'AAAA' })];
  assert.deepEqual(Object.keys(selectAirports(rows, ['BBBB', 'AAAA'])), ['AAAA', 'BBBB']);
});

test('AIR-04: the module has one line per airport and safe quoting', async () => {
  const source = renderModule({ AGGA: `Gwaunaru'u "Airport"` });
  assert.match(source, /^ {2}"AGGA": "Gwaunaru'u \\"Airport\\"",$/m);
  const { airports } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
  assert.deepEqual(airports, { AGGA: `Gwaunaru'u "Airport"` });
});

test('AIR-05: the script checks the amount of airports before writing', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../../scripts/update-airports.js', import.meta.url), 'utf8');
  assert.ok(source.indexOf('MIN_EXPECTED_AIRPORTS) {') < source.indexOf('await writeFile'));
});
