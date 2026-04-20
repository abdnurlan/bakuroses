'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapInnerProps } from './MapPicker';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function PinHandler({ onPin }: { onPin: (lat: number, lng: number) => void }) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    click(e) {
      setPin(e.latlng);
      onPin(e.latlng.lat, e.latlng.lng);
    },
  });

  return pin ? <Marker position={[pin.lat, pin.lng]} /> : null;
}

export function MapPickerInner({ zones, onPin }: MapInnerProps) {
  return (
    <MapContainer
      center={[40.4093, 49.8671]}
      zoom={12}
      style={{ height: 350, borderRadius: 16 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
      />
      {zones.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.centerLat, zone.centerLng]}
          radius={zone.radiusKm * 1000}
          color={zone.color ?? '#cf6f94'}
          fillOpacity={0.1}
        />
      ))}
      <PinHandler onPin={onPin} />
    </MapContainer>
  );
}
