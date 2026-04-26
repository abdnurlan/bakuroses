'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapInnerProps } from './MapPicker';

const pinkPinIcon = L.divIcon({
  className: 'order-map-pin',
  iconSize: [34, 44],
  iconAnchor: [17, 42],
  popupAnchor: [0, -38],
  html: `
    <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 43C17 43 31 27.7 31 16.9C31 8.7 24.7 2 17 2C9.3 2 3 8.7 3 16.9C3 27.7 17 43 17 43Z" fill="#cf6f94" stroke="#fff8fb" stroke-width="3"/>
      <circle cx="17" cy="16.8" r="5.5" fill="#fff8fb"/>
    </svg>
  `,
});

function PinHandler({
  confirmMode,
  onPin,
  onStage,
}: {
  confirmMode: boolean;
  onPin: (lat: number, lng: number) => void;
  onStage: (lat: number, lng: number) => void;
}) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPin({ lat, lng });
      if (confirmMode) {
        onStage(lat, lng);
      } else {
        onPin(lat, lng);
      }
    },
  });

  return pin ? <Marker position={[pin.lat, pin.lng]} icon={pinkPinIcon} /> : null;
}

export function MapPickerInner({ className, onPin, confirmMode = false, onStage }: MapInnerProps) {
  return (
    <MapContainer
      className={className}
      center={[40.4093, 49.8671]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
      />
      <PinHandler
        confirmMode={confirmMode}
        onPin={onPin}
        onStage={onStage ?? (() => {})}
      />
    </MapContainer>
  );
}
