import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createMarkerIcon(color: string, isHighlighted: boolean, isSunny: boolean): L.DivIcon {
  const size = isHighlighted ? 40 : 32;
  const border = isHighlighted ? 4 : 3;
  const shadow = isHighlighted
    ? '0 0 0 3px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0,0,0,0.4)'
    : '0 2px 8px rgba(0,0,0,0.3)';

  const svgSize = isHighlighted ? 20 : 16;
  const sunSvg = isSunny
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>`
    : '';

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `<div style="
      width:${size}px;height:${size}px;
      background-color:${color};
      border:${border}px solid white;
      border-radius:50%;
      cursor:pointer;
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      transition:transform 0.2s ease;
    ">${sunSvg}</div>`,
  });
}

export function PatioMap({ patios, onPatioClick, highlightedIds = [] }: PatioMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const m = L.map(mapContainer.current, {
      center: [44.6488, -63.5752], // Halifax, NS
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(m);

    L.control.zoom({ position: 'topright' }).addTo(m);

    mapRef.current = m;

    return () => {
      m.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when patios change
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    patios.forEach(patio => {
      const color = statusColors[patio.currentStatus];
      const isHighlighted = highlightedIds.includes(patio.id);
      const isSunny = patio.currentStatus === 'sunny' || isHighlighted;

      const icon = createMarkerIcon(color, isHighlighted, isSunny);

      const marker = L.marker([patio.lat, patio.lng], {
        icon,
        zIndexOffset: isHighlighted ? 1000 : 0,
      }).addTo(m);

      const popupContent = `
        <div style="padding: 8px; font-family: system-ui, sans-serif;">
          <strong style="font-size: 14px;">${escapeHtml(patio.name)}</strong>
          ${isHighlighted ? '<span style="display: inline-block; margin-left: 6px; background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">TOP PICK</span>' : ''}
          <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${escapeHtml(patio.neighborhood || patio.address || '')}</p>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false, offset: [0, -4] });

      // Hover effects
      marker.on('mouseover', () => {
        const el = marker.getElement();
        if (el) {
          const inner = el.querySelector('div') as HTMLElement;
          if (inner) inner.style.transform = 'scale(1.2)';
        }
        marker.openPopup();
      });
      marker.on('mouseout', () => {
        const el = marker.getElement();
        if (el) {
          const inner = el.querySelector('div') as HTMLElement;
          if (inner) inner.style.transform = 'scale(1)';
        }
        marker.closePopup();
      });

      marker.on('click', () => {
        onPatioClick?.(patio.id);
      });

      markersRef.current.push(marker);
    });
  }, [patios, onPatioClick, highlightedIds]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
}
