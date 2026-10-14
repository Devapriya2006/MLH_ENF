import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import { MAP_CENTER } from '../constants';

export const MAP_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function MapLibreMap({
  center = MAP_CENTER, // [lat, lng]
  zoom = 13,
  markers = [], // [{ id, lat, lng, color, icon, title, subtitle, onClick }]
  interactive = true,
  onMapClick,
  pickerPos, // [lat, lng] for interactive pin placement
  className = 'h-full w-full',
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const pickerMarkerRef = useRef(null);

  // Normalize center: MapLibre expects [lng, lat]
  const centerLngLat = center && center.length === 2 && center.every(Number.isFinite)
    ? [center[1], center[0]]
    : null;

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainer.current || !centerLngLat) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: centerLngLat,
      zoom: zoom,
      interactive: interactive,
      attributionControl: false,
    });

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: false,
        showAccuracyCircle: true,
      });
      geolocate.on('geolocate', (e) => {
        if (onMapClick) {
          onMapClick([e.coords.latitude, e.coords.longitude]);
        }
      });
      map.addControl(geolocate, 'bottom-right');
    }

    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick([e.lngLat.lat, e.lngLat.lng]);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [centerLngLat?.[0], centerLngLat?.[1]]);

  // Handle center / zoom changes
  useEffect(() => {
    if (!mapRef.current || !centerLngLat) return;
    mapRef.current.easeTo({
      center: centerLngLat,
      zoom: zoom,
      duration: 600,
    });
  }, [centerLngLat?.[0], centerLngLat?.[1], zoom]);

  // Handle picker marker (for Report Issue)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }

    if (pickerPos && pickerPos.length === 2) {
      const el = document.createElement('div');
      el.className = 'picker-pin-wrapper';
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(0, 102, 255, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 9999px; background: #0066FF; border: 3px solid white; box-shadow: 0 4px 10px rgba(0, 102, 255, 0.5);"></div>
        </div>
      `;

      pickerMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([pickerPos[1], pickerPos[0]])
        .addTo(map);

      map.easeTo({ center: [pickerPos[1], pickerPos[0]], duration: 500 });
    }
  }, [pickerPos]);

  // Handle markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(item => {
      if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;

      const el = document.createElement('div');
      el.className = 'custom-map-pin';
      el.style.cursor = 'pointer';

      const color = item.color || '#0066FF';
      el.innerHTML = `
        <div style="
          width: 30px; 
          height: 30px; 
          border-radius: 9999px; 
          background-color: ${color}; 
          border: 2.5px solid #FFFFFF; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.25); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
          font-size: 13px;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          ${item.icon || '📍'}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([item.lng, item.lat])
        .addTo(map);

      if (item.popupHTML) {
        const popup = new maplibregl.Popup({ offset: 18, closeButton: false })
          .setHTML(item.popupHTML);
        marker.setPopup(popup);
      }

      el.addEventListener('click', () => {
        if (item.onClick) item.onClick(item);
      });

      markersRef.current.push(marker);
    });
  }, [markers]);

  return centerLngLat
    ? <div ref={mapContainer} className={`maplibregl-map ${className}`} />
    : <div className={`flex items-center justify-center bg-slate-50 text-sm text-slate-500 ${className}`}>Map location is unavailable.</div>;
}

