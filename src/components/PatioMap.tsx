import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { PatioWithStatus } from '@/types/patio';

interface PatioMapProps {
  patios: PatioWithStatus[];
  onPatioClick?: (patioId: string) => void;
}

const statusColors = {
  sunny: '#f59e0b',
  mixed: '#8b5cf6',
  shaded: '#64748b',
  unknown: '#94a3b8',
};

const STORAGE_KEY = 'mapbox_token';

export function PatioMap({ patios, onPatioClick }: PatioMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [token, setToken] = useState(() => {
    return import.meta.env.VITE_MAPBOX_TOKEN || localStorage.getItem(STORAGE_KEY) || '';
  });
  const [inputToken, setInputToken] = useState('');
  const [mapReady, setMapReady] = useState(!!token);

  const handleSaveToken = () => {
    if (inputToken.trim()) {
      localStorage.setItem(STORAGE_KEY, inputToken.trim());
      setToken(inputToken.trim());
      setMapReady(true);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-63.5752, 44.6488], // Halifax, NS
        zoom: 13,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: false }),
        'top-right'
      );

      map.current.on('load', () => setMapReady(true));
    } catch (error) {
      console.error('Failed to initialize map:', error);
      localStorage.removeItem(STORAGE_KEY);
      setToken('');
      setMapReady(false);
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [token]);

  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each patio
    patios.forEach(patio => {
      const color = statusColors[patio.currentStatus];
      
      const el = document.createElement('div');
      el.className = 'patio-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
      `;
      
      if (patio.currentStatus === 'sunny') {
        el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>`;
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui, sans-serif;">
            <strong style="font-size: 14px;">${patio.name}</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${patio.neighborhood || patio.address || ''}</p>
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([patio.lng, patio.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onPatioClick?.(patio.id);
      });

      markersRef.current.push(marker);
    });
  }, [patios, onPatioClick, mapReady]);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-muted/50 rounded-lg p-8">
        <div className="max-w-md w-full space-y-4 text-center">
          <h3 className="font-display text-xl font-semibold">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox public token to view the map. Get one free at{' '}
            <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              mapbox.com
            </a>
          </p>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token" className="sr-only">Mapbox Token</Label>
            <Input
              id="mapbox-token"
              placeholder="pk.eyJ1Ijo..."
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
            />
            <Button onClick={handleSaveToken} className="w-full">
              Save Token
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
}
