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
  highlightedIds?: string[];
}

const statusColors = {
  sunny: '#f59e0b',
  mixed: '#8b5cf6',
  shaded: '#64748b',
  unknown: '#94a3b8',
};

// Escape HTML to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const STORAGE_KEY = 'mapbox_token';

// Mapbox public tokens typically start with 'pk.' and may include multiple dot-separated segments.
// Avoid overly strict validation (Mapbox token formats can change). We only enforce:
// - starts with "pk."
// - sane length bounds
const MIN_TOKEN_LENGTH = 50;
const MAX_TOKEN_LENGTH = 1000;

function isValidMapboxToken(token: string): boolean {
  const trimmed = token.trim();
  return trimmed.startsWith('pk.') && trimmed.length >= MIN_TOKEN_LENGTH && trimmed.length <= MAX_TOKEN_LENGTH;
}

export function PatioMap({ patios, onPatioClick, highlightedIds = [] }: PatioMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [token, setToken] = useState(() => {
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const storedToken = localStorage.getItem(STORAGE_KEY);
    // Validate stored token before using
    if (envToken && isValidMapboxToken(envToken)) return envToken;
    if (storedToken && isValidMapboxToken(storedToken)) return storedToken;
    return '';
  });
  const [inputToken, setInputToken] = useState('');
  const [mapReady, setMapReady] = useState(!!token);
  const [tokenError, setTokenError] = useState('');

  const handleSaveToken = () => {
    const trimmed = inputToken.trim();
    if (!trimmed) {
      setTokenError('Please enter a token');
      return;
    }
    if (!isValidMapboxToken(trimmed)) {
      setTokenError('Invalid Mapbox token format. Token should start with "pk." followed by alphanumeric characters.');
      return;
    }
    setTokenError('');
    localStorage.setItem(STORAGE_KEY, trimmed);
    setToken(trimmed);
    setMapReady(true);
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
      
      // Only clear token on clear "invalid token" authentication failures.
      // Some Mapbox/network/style errors mention "access token" even when the token is fine.
      map.current.on('error', (e) => {
        const errorMessage = String(e.error?.message || '');
        const status = (e.error as any)?.status;

        const looksLikeInvalidToken =
          status === 401 ||
          /invalid access token/i.test(errorMessage) ||
          /access token is not valid/i.test(errorMessage);

        if (looksLikeInvalidToken) {
          console.error('Mapbox token authentication failed:', e);
          localStorage.removeItem(STORAGE_KEY);
          setToken('');
          setMapReady(false);
        }
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      // Don't clear token on generic errors - could be network issues, etc.
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
      const isHighlighted = highlightedIds.includes(patio.id);
      
      const el = document.createElement('div');
      el.className = 'patio-marker';
      el.style.cssText = `
        width: ${isHighlighted ? '40px' : '32px'};
        height: ${isHighlighted ? '40px' : '32px'};
        background-color: ${color};
        border: ${isHighlighted ? '4px' : '3px'} solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: ${isHighlighted 
          ? '0 0 0 3px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0,0,0,0.4)' 
          : '0 2px 8px rgba(0,0,0,0.3)'};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
        z-index: ${isHighlighted ? '10' : '1'};
      `;
      
      if (patio.currentStatus === 'sunny' || isHighlighted) {
        // Use DOM API instead of innerHTML to prevent XSS
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', isHighlighted ? '20' : '16');
        svg.setAttribute('height', isHighlighted ? '20' : '16');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'white');
        svg.setAttribute('stroke', 'white');
        svg.setAttribute('stroke-width', '2');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '12');
        circle.setAttribute('cy', '12');
        circle.setAttribute('r', '4');
        svg.appendChild(circle);
        el.appendChild(svg);
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
            <strong style="font-size: 14px;">${escapeHtml(patio.name)}</strong>
            ${isHighlighted ? '<span style="display: inline-block; margin-left: 6px; background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">TOP PICK</span>' : ''}
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${escapeHtml(patio.neighborhood || patio.address || '')}</p>
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
  }, [patios, onPatioClick, mapReady, highlightedIds]);

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
              onChange={(e) => {
                setInputToken(e.target.value);
                setTokenError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
              maxLength={MAX_TOKEN_LENGTH}
            />
            {tokenError && (
              <p className="text-sm text-destructive">{tokenError}</p>
            )}
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
