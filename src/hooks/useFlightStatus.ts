// frontend/src/hooks/useFlightStatus.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface FlightStatus {
  status: string;
  message: string;
  color: string;
  estimatedDeparture: string;
  estimatedArrival: string;
  delay?: number;
  gate?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export interface FlightStatusUpdate {
  type: 'connected' | 'flight_status' | 'flight_update';
  flightId?: string;
  status?: FlightStatus;
  update?: Partial<FlightStatus>;
  timestamp: string;
  user?: string;
  updatedBy?: string;
}

export function useFlightStatus(flightId?: string, bookingId?: string) {
  const [status, setStatus] = useState<FlightStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || (!flightId && !bookingId)) return;

    const params = new URLSearchParams();
    if (flightId) params.set('flightId', flightId);
    if (bookingId) params.set('bookingId', bookingId);

    const eventSource = new EventSource(`/api/flights/status?${params.toString()}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('[2025-07-07 08:05:28] SSE Connected for user: Ashwath-saxena');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: FlightStatusUpdate = JSON.parse(event.data);
        setLastUpdate(data.timestamp);

        switch (data.type) {
          case 'connected':
            console.log('[2025-07-07 08:05:28] SSE Connection established:', data);
            break;
          
          case 'flight_status':
            if (data.status) {
              setStatus(data.status);
              console.log('[2025-07-07 08:05:28] Flight status received:', data);
            }
            break;
          
          case 'flight_update':
            if (data.update) {
              setStatus(prev => {
                if (prev) {
                  return { ...prev, ...data.update };
                }
                // If no previous status, create a new one with defaults
                return {
                  status: 'Unknown',
                  message: 'Status updated',
                  color: 'gray',
                  estimatedDeparture: '',
                  estimatedArrival: '',
                  ...data.update
                };
              });
              console.log('[2025-07-07 08:05:28] Flight update received:', data);
            }
            break;
        }
      } catch (error) {
        console.error('[2025-07-07 08:05:28] Error parsing SSE data:', error);
        setError('Error parsing real-time data');
      }
    };

    eventSource.onerror = (event) => {
      console.error('[2025-07-07 08:05:28] SSE Error:', event);
      setIsConnected(false);
      setError('Connection to real-time updates lost');
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [user, flightId, bookingId]);

  const updateFlightStatus = async (update: Partial<FlightStatus>) => {
    if (!flightId) return;

    try {
      const response = await fetch(`/api/flights/${flightId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });

      if (!response.ok) {
        throw new Error('Failed to update flight status');
      }

      const result = await response.json();
      console.log('[2025-07-07 08:05:28] Flight status updated by Ashwath-saxena:', result);
    } catch (error) {
      console.error('[2025-07-07 08:05:28] Error updating flight status:', error);
      setError('Failed to update flight status');
    }
  };

  return {
    status,
    isConnected,
    lastUpdate,
    error,
    updateFlightStatus
  };
}