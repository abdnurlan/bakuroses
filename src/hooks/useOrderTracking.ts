'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED: '✅ Sifarişiniz təsdiqləndi',
  PREPARING: '👨‍🍳 Sifarişiniz hazırlanır',
  ON_THE_WAY: '🛵 Kuryer yolda!',
  DELIVERED: '📦 Çatdırıldı! Zövq alın',
  CANCELLED: '❌ Sifariş ləğv edildi',
};

export interface CourierLocation {
  lat: number;
  lng: number;
  heading: number;
}

export function useOrderTracking(orderId: string) {
  const [status, setStatus] = useState<string | null>(null);
  const [courierLocation, setCourierLocation] = useState<CourierLocation | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3002';

    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.emit('track-order', orderId);

    socket.on('status-change', ({ status: newStatus }: { status: string }) => {
      setStatus(newStatus);
      const msg = STATUS_MESSAGES[newStatus];
      if (msg) toast.success(msg);
    });

    socket.on('courier-location', (loc: CourierLocation) => {
      setCourierLocation(loc);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  return { status, courierLocation };
}
