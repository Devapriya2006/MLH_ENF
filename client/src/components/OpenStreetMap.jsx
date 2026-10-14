import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Crosshair, RefreshCw } from 'lucide-react';

// 5 City Zone Polygons around default center
const CITY_ZONES_POLYGONS = [
  {
    name: 'North Zone',
    count: 42,
    color: '#F59E0B',
    fillColor: '#FEF3C7',
    coords: [
      [32.352, 44.348],
      [32.362, 44.354],
      [32.359, 44.368],
      [32.350, 44.363],
      [32.348, 44.354],
    ],
    center: [32.355, 44.358],
  },
  {
    name: 'Central Zone',
    count: 67,
    color: '#EF4444',
    fillColor: '#FEE2E2',
    coords: [
      [32.348, 44.354],
      [32.350, 44.363],
      [32.341, 44.365],
      [32.338, 44.356],
      [32.342, 44.350],
    ],
    center: [32.344, 44.358],
  },
  {
    name: 'West Zone',
    count: 38,
    color: '#10B981',
    fillColor: '#DCFCE7',
    coords: [
      [32.342, 44.350],
      [32.348, 44.354],
      [32.352, 44.348],
      [32.346, 44.336],
      [32.336, 44.339],
    ],
    center: [32.344, 44.344],
  },
  {
    name: 'East Zone',
    count: 54,
    color: '#0284C7',
    fillColor: '#E0F2FE',
    coords: [
      [32.359, 44.368],
      [32.354, 44.378],
      [32.342, 44.381],
      [32.337, 44.372],
      [32.341, 44.365],
      [32.350, 44.363],
    ],
    center: [32.348, 44.372],
  },
  {
    name: 'South Zone',
    count: 47,
    color: '#A855F7',
    fillColor: '#F3E8FF',
    coords: [
      [32.338, 44.356],
      [32.341, 44.365],
      [32.337, 44.372],
      [32.327, 44.368],
      [32.328, 44.351],
      [32.335, 44.349],
    ],
    center: [32.334, 44.359],
  },
];

export default function OpenStreetMap({
  center = [32.3452, 44.3572],
  zoom = 13,
  issues = [],
  markers = [],
  selectedIssueId = null,
  onSelectIssue = null,
  showZones = false,
  satellite = false,
  autoLocate = true,
  userLocation = null,
  pickerPos = null,
  onMapClick = null,
  onLocate = null,
  interactive = true,
  showLocateButton = true,
  className = 'h-full w-full',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const zonesLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  const [currentLoc, setCurrentLoc] = useState(userLocation);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  // Handle acquiring device current geolocation
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation not supported by browser');
      return;
    }

    setLocating(true);
    setLocateError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setCurrentLoc(coords);
        setLocating(false);

        if (mapRef.current) {
          mapRef.current.flyTo(coords, Math.max(mapRef.current.getZoom(), 15), {
            duration: 1.2,
          });
        }

        if (onLocate) {
          onLocate(coords);
        }
      },
      (err) => {
        // Fallback to low-accuracy if high accuracy fails
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = [pos.coords.latitude, pos.coords.longitude];
            setCurrentLoc(coords);
            setLocating(false);
            if (mapRef.current) {
              mapRef.current.flyTo(coords, Math.max(mapRef.current.getZoom(), 14), { duration: 1.2 });
            }
            if (onLocate) onLocate(coords);
          },
          (err2) => {
            setLocating(false);
            setLocateError(err2.message || 'Unable to retrieve location');
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onLocate]);

  // Auto locate user upon initial mount if autoLocate is enabled
  useEffect(() => {
    if (autoLocate && !userLocation) {
      handleLocateMe();
    }
  }, [autoLocate, userLocation, handleLocateMe]);

  // Synchronize when external userLocation changes
  useEffect(() => {
    if (userLocation && Number.isFinite(userLocation[0]) && Number.isFinite(userLocation[1])) {
      setCurrentLoc(userLocation);
    }
  }, [userLocation]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = currentLoc || center;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
    });

    // Attribution
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>')
      .addTo(map);

    // Zoom controls if interactive
    if (interactive) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    // Tile Layer
    const tileUrl = satellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    zonesLayerRef.current = L.layerGroup().addTo(map);

    // Click handler for map (e.g. Pinpoint location in Report)
    map.on('click', (e) => {
      if (onMapClick) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    });

    mapRef.current = map;

    // Invalidate size once container is rendered to prevent gray tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center when center prop changes
  useEffect(() => {
    if (!mapRef.current || !center) return;
    if (!selectedIssueId && !pickerPos) {
      mapRef.current.setView(center, zoom, { animate: true });
    }
  }, [center?.[0], center?.[1], zoom]);

  // Update Tile Layer if Satellite toggled
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);

    const tileUrl = satellite
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const newLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapRef.current);
    tileLayerRef.current = newLayer;
  }, [satellite]);

  // Render "Current Location" Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (currentLoc && Number.isFinite(currentLoc[0]) && Number.isFinite(currentLoc[1])) {
      const userLocIcon = L.divIcon({
        className: 'user-current-loc-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="
              position: absolute;
              width: 38px;
              height: 38px;
              border-radius: 9999px;
              background: rgba(0, 102, 255, 0.25);
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              background-color: #0066FF;
              border: 3px solid #FFFFFF;
              box-shadow: 0 2px 8px rgba(0, 102, 255, 0.6);
            "></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const userMarker = L.marker(currentLoc, {
        icon: userLocIcon,
        zIndexOffset: 1000,
      }).addTo(mapRef.current);

      userMarker.bindTooltip('Your Current Location', {
        permanent: false,
        direction: 'top',
        offset: [0, -12],
        className: 'user-loc-tooltip',
      });

      userMarkerRef.current = userMarker;
    }
  }, [currentLoc]);

  // Render Interactive Picker Pin (for Report page)
  useEffect(() => {
    if (!mapRef.current) return;

    if (pickerMarkerRef.current) {
      mapRef.current.removeLayer(pickerMarkerRef.current);
      pickerMarkerRef.current = null;
    }

    if (pickerPos && Number.isFinite(pickerPos[0]) && Number.isFinite(pickerPos[1])) {
      const pickerIcon = L.divIcon({
        className: 'picker-pin-marker',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -100%);
            cursor: grab;
          ">
            <div style="
              background: #EF4444;
              color: white;
              padding: 6px 10px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 800;
              box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
              border: 2px solid white;
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
            ">
              <span>📍 Reported Spot</span>
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const pMarker = L.marker(pickerPos, {
        icon: pickerIcon,
        draggable: true,
        zIndexOffset: 1500,
      }).addTo(mapRef.current);

      pMarker.on('dragend', (e) => {
        const newCoords = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        if (onMapClick) onMapClick(newCoords);
      });

      pickerMarkerRef.current = pMarker;
      mapRef.current.panTo(pickerPos, { animate: true });
    }
  }, [pickerPos, onMapClick]);

  // Render City Zone Polygons (matches screenshot 1 & 2)
  useEffect(() => {
    if (!mapRef.current || !zonesLayerRef.current) return;
    zonesLayerRef.current.clearLayers();

    if (!showZones) return;

    CITY_ZONES_POLYGONS.forEach((z) => {
      L.polygon(z.coords, {
        color: z.color,
        weight: 2,
        dashArray: '4, 4',
        fillColor: z.fillColor,
        fillOpacity: 0.35,
      }).addTo(zonesLayerRef.current);

      const badgeIcon = L.divIcon({
        className: 'zone-badge-marker',
        html: `
          <div style="
            background: rgba(255, 255, 255, 0.95);
            border: 1.5px solid ${z.color};
            border-radius: 9999px;
            padding: 3px 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            font-family: inherit;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
          ">
            <span style="font-size: 10px; font-weight: 800; color: #0F172A;">${z.name}</span>
            <span style="
              background: ${z.color};
              color: white;
              font-size: 10px;
              font-weight: 800;
              border-radius: 9999px;
              padding: 1px 6px;
            ">${z.count}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      L.marker(z.center, { icon: badgeIcon }).addTo(zonesLayerRef.current);
    });
  }, [showZones]);

  // Render Issue Markers & Generic Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // 1. Process issues from MongoDB
    issues.forEach((issue) => {
      const lat = issue.lat || issue.location?.coordinates?.[1];
      const lng = issue.lng || issue.location?.coordinates?.[0];

      if (!lat || !lng || !Number.isFinite(+lat) || !Number.isFinite(+lng)) return;

      const isSelected = selectedIssueId && (issue.id === selectedIssueId || issue._id === selectedIssueId);

      const p = issue.priority || 0;
      let color = '#EAB308';
      let icon = '!';
      let ring = 'rgba(234, 179, 8, 0.2)';

      if (p >= 70 || issue.priorityTier === 'Critical') {
        color = '#EF4444';
        icon = '!';
        ring = 'rgba(239, 68, 68, 0.35)';
      } else if (p >= 50 || issue.priorityTier === 'High') {
        color = '#F97316';
        icon = '!';
        ring = 'rgba(249, 115, 22, 0.35)';
      } else if (p < 30 || issue.priorityTier === 'Low') {
        color = '#10B981';
        icon = '✓';
        ring = 'rgba(16, 185, 129, 0.35)';
      }

      const size = isSelected ? 34 : 28;

      const markerHtml = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; transform: translate(-50%, -50%);">
          ${
            isSelected
              ? `
            <div style="
              position: absolute;
              width: ${size + 18}px;
              height: ${size + 18}px;
              border-radius: 9999px;
              background: ${ring};
              animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          `
              : ''
          }
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 9999px;
            background-color: ${color};
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: ${isSelected ? '14px' : '12px'};
            font-weight: 900;
            transition: transform 0.2s ease;
          ">
            ${icon}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'civiclens-issue-pin',
        html: markerHtml,
        iconSize: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        if (onSelectIssue) onSelectIssue(issue);
      });

      marker.addTo(markersLayerRef.current);
    });

    // 2. Process generic markers (Home, ExploreView, ComplaintDetail)
    markers.forEach((m) => {
      const lat = m.lat;
      const lng = m.lng;
      if (!lat || !lng || !Number.isFinite(+lat) || !Number.isFinite(+lng)) return;

      const mColor = m.color || '#0066FF';
      const mIcon = m.icon || '📍';

      const customIcon = L.divIcon({
        className: 'civiclens-generic-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; transform: translate(-50%, -50%);">
            <div style="
              width: 30px;
              height: 30px;
              border-radius: 9999px;
              background-color: ${mColor};
              border: 2.5px solid #FFFFFF;
              box-shadow: 0 4px 12px rgba(0,0,0,0.22);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
            ">
              ${mIcon}
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      if (m.popupHTML) {
        marker.bindPopup(m.popupHTML);
      }

      if (m.title && !m.popupHTML) {
        marker.bindTooltip(m.title, { direction: 'top', offset: [0, -15] });
      }

      if (m.onClick) {
        marker.on('click', m.onClick);
      }

      marker.addTo(markersLayerRef.current);
    });
  }, [issues, markers, selectedIssueId, onSelectIssue]);

  // Recenter map on selected issue
  useEffect(() => {
    if (!mapRef.current || !selectedIssueId) return;
    const selected = issues.find((i) => i.id === selectedIssueId || i._id === selectedIssueId);
    if (selected) {
      const lat = selected.lat || selected.location?.coordinates?.[1];
      const lng = selected.lng || selected.location?.coordinates?.[0];
      if (lat && lng) {
        mapRef.current.setView([lat, lng], 15, { animate: true });
      }
    }
  }, [selectedIssueId, issues]);

  return (
    <div className={`relative ${className}`}>
      {/* Map Canvas */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Floating In-Map "Locate Me" Button */}
      {showLocateButton && (
        <div className="absolute bottom-5 left-4 z-[400] flex items-center gap-2">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            title="Locate my current position"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:bg-white active:scale-95 transition"
          >
            {locating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0066FF]" />
            ) : (
              <Crosshair className="h-3.5 w-3.5 text-[#0066FF]" />
            )}
            <span>{locating ? 'Locating…' : 'My Location'}</span>
          </button>

          {locateError && (
            <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-lg border border-rose-200">
              {locateError}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
