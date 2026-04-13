import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PatioWithStatus } from '@/types/patio';

interface PatioMapProps {
  patios: PatioWithStatus[];
  onPatioClick?: (patioId: string) => void;
  highlightedIds?: string[];
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createMarkerIcon(patio: PatioWithStatus, isHighlighted: boolean): L.DivIcon {
  const score = (patio as any).sun_score_live ?? patio.sun_score ?? 0;
  const scoreText = score > 0 ? String(Math.round(score)) : '–';

  let bg: string, textColor: string, borderColor: string;
  if (score >= 70) {
    bg = '#C87533';
    textColor = '#fff';
    borderColor = '#fff';
  } else if (score >= 40) {
    bg = '#E8B86D';
    textColor = '#fff';
    borderColor = '#E8B86D';
  } else {
    bg = '#E5E7EB';
    textColor = '#6B7280';
    borderColor = '#D1D5DB';
  }

  const size = isHighlighted ? 38 : 30;
  const border = isHighlighted ? 3 : 2;
  const shadow = isHighlighted
    ? '0 0 0 4px rgba(200, 117, 51, 0.4), 0 4px 12px rgba(0,0,0,0.35)'
    : '0 2px 6px rgba(0,0,0,0.25)';

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:${border}px solid ${borderColor};
      border-radius:50%;
      cursor:pointer;
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:600;color:${textColor};
      font-family:system-ui,sans-serif;
      line-height:1;
      transition:transform 0.2s ease;
    ">${escapeHtml(scoreText)}</div>`,
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(m);

    const zoomControl = L.control.zoom({ position: 'topright' }).addTo(m);
    // Offset zoom control below weather pill
    const zoomContainer = zoomControl.getContainer();
    if (zoomContainer) {
      zoomContainer.style.marginTop = '8px';
    }

    // Add locate-me control
    const LocateControl = L.Control.extend({
      options: { position: 'topright' as L.ControlPosition },
      onAdd() {
        const btn = L.DomUtil.create('div', 'leaflet-bar');
        btn.innerHTML = `<a href="#" title="My location" role="button" aria-label="My location" style="
          display:flex;align-items:center;justify-content:center;
          width:34px;height:34px;background:white;cursor:pointer;
          font-size:18px;text-decoration:none;color:#333;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/><circle cx="12" cy="12" r="9"/></svg>
        </a>`;
        L.DomEvent.disableClickPropagation(btn);
        btn.querySelector('a')!.addEventListener('click', (e) => {
          e.preventDefault();
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
              m.setView(latlng, 15);
              const dot = L.circleMarker(latlng, {
                radius: 8, fillColor: '#3b82f6', fillOpacity: 0.9,
                color: 'white', weight: 3,
              }).addTo(m);
              setTimeout(() => dot.remove(), 10000);
            },
            () => {},
            { enableHighAccuracy: false, timeout: 10000 }
          );
        });
        return btn;
      },
    });
    new LocateControl().addTo(m);

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

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    patios.forEach((patio) => {
      const isHighlighted = highlightedIds.includes(patio.id);
      const icon = createMarkerIcon(patio, isHighlighted);

      const marker = L.marker([patio.lat, patio.lng], {
        icon,
        zIndexOffset: isHighlighted ? 1000 : 0,
      }).addTo(m);

      const popupContent = `
        <div style="padding: 8px; font-family: system-ui, sans-serif;">
          <strong style="font-size: 14px;">${escapeHtml(patio.name)}</strong>
          ${isHighlighted ? '<span style="display: inline-block; margin-left: 6px; background: #C87533; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">TOP PICK</span>' : ''}
          <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${escapeHtml(patio.neighborhood || patio.address || '')}</p>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false, offset: [0, -4] });

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