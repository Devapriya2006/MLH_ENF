import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getPreciseLocation } from '../src/location.js';

const fix = (accuracy = 12) => ({ coords: { latitude: 22.57, longitude: 88.36, accuracy } });

function fakeGeolocation(success, failure) {
  return { getCurrentPosition: (ok, bad, options) => {
    assert.deepEqual(options, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    if (success) ok(success);
    else bad(failure);
  } };
}

test('precise location accepts a valid fix within the configured threshold', async () => {
  const result = await getPreciseLocation(fakeGeolocation(fix(20)), 20);
  assert.equal(result.accuracy, 20);
  assert.equal(result.latitude, 22.57);
});

test('location rejects denied permission, unavailable service and poor accuracy', async () => {
  await assert.rejects(getPreciseLocation(fakeGeolocation(null, { code: 1 })), /permission was denied/i);
  await assert.rejects(getPreciseLocation(fakeGeolocation(null, { code: 2 })), /unavailable/i);
  await assert.rejects(getPreciseLocation(fakeGeolocation(fix(50))), /accuracy is 50 m/i);
});

test('location requires device geolocation and valid coordinates', async () => {
  await assert.rejects(getPreciseLocation(null), /does not support device location/i);
  await assert.rejects(getPreciseLocation(fakeGeolocation({ coords: { latitude: 95, longitude: 0, accuracy: 5 } })), /invalid coordinates/i);
});

test('calling the location acquisition again supports retry after an initial denial', async () => {
  let attempt = 0;
  const geolocation = { getCurrentPosition: (ok, bad) => {
    attempt += 1;
    if (attempt === 1) bad({ code: 1 });
    else ok(fix(8));
  } };
  await assert.rejects(getPreciseLocation(geolocation), /permission was denied/i);
  assert.equal((await getPreciseLocation(geolocation)).accuracy, 8);
});

test('citizen reporting only accepts camera captures and has required category and description fields', async () => {
  const report = await readFile(new URL('../src/pages/Report.jsx', import.meta.url), 'utf8');
  const camera = await readFile(new URL('../src/components/LiveCameraModal.jsx', import.meta.url), 'utf8');
  const location = await readFile(new URL('../src/location.js', import.meta.url), 'utf8');
  assert.doesNotMatch(report, /type=["']file["']/i);
  assert.doesNotMatch(camera, /type=["']file["']/i);
  assert.match(report, /id="problem-category" required/);
  assert.match(report, /id="problem-description" required minLength=\{10\}/);
  assert.match(location, /enableHighAccuracy: true/);
});
