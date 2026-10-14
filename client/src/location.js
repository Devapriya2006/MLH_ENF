export function getPreciseLocation(geolocation = globalThis.navigator?.geolocation, maxAccuracy = 20) {
  return new Promise((resolve, reject) => {
    if (!geolocation?.getCurrentPosition) return reject(new Error('This browser does not support device location.'));
    geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude, accuracy } = coords;
        if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180)
          return reject(new Error('The device returned invalid coordinates.'));
        if (!Number.isFinite(accuracy) || accuracy <= 0 || accuracy > maxAccuracy)
          return reject(new Error(`Location accuracy is ${Math.round(accuracy || 0)} m. Move outdoors and retry until it is ${maxAccuracy} m or better.`));
        resolve({ latitude, longitude, accuracy, timestamp: Date.now() });
      },
      error => reject(new Error(error.code === 1
        ? 'Location permission was denied. Allow location in your browser settings, then retry.'
        : error.code === 2
          ? 'Device location is unavailable. Turn on location services and retry.'
          : 'Precise location timed out. Move to an open area and retry.')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}
