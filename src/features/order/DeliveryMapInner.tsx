'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CourierLocation {
  lat: number;
  lng: number;
  heading: number;
}

interface Props {
  destination: [number, number];
  courierLocation: CourierLocation | null;
}

const courierIcon = L.divIcon({
  className: '',
  html: `<div id="courier-icon" style="font-size:28px;line-height:1;transition:transform 0.3s ease;">🛵</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function smoothMoveMarker(
  marker: L.Marker,
  from: { lat: number; lng: number } | null,
  to: { lat: number; lng: number },
  heading: number
) {
  if (!from) {
    marker.setLatLng([to.lat, to.lng]);
    return;
  }
  const FRAMES = 60;
  const dLat = (to.lat - from.lat) / FRAMES;
  const dLng = (to.lng - from.lng) / FRAMES;
  let frame = 0;

  const tick = () => {
    if (frame >= FRAMES) return;
    marker.setLatLng([from.lat + dLat * frame, from.lng + dLng * frame]);
    const el = document.getElementById('courier-icon');
    if (el) el.style.transform = `rotate(${heading}deg)`;
    frame++;
    requestAnimationFrame(tick);
  };
  tick();
}

export function DeliveryMapInner({ destination, courierLocation }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const map = L.map('delivery-map').setView(destination, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    const destIcon = L.divIcon({
      className: '',
      html: `<div style="font-size:26px;line-height:1;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
    L.marker(destination, { icon: destIcon })
      .addTo(map)
      .bindPopup('Çatdırılma ünvanı');

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [destination]);

  useEffect(() => {
    if (!courierLocation || !mapRef.current) return;
    const { lat, lng, heading } = courierLocation;

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon: courierIcon }).addTo(mapRef.current);
    }

    smoothMoveMarker(markerRef.current, prevPosRef.current, { lat, lng }, heading);
    prevPosRef.current = { lat, lng };
    mapRef.current.panTo([lat, lng], { animate: true, duration: 1 });
  }, [courierLocation]);

  return <div id="delivery-map" style={{ height: 400, borderRadius: 16 }} />;
}
