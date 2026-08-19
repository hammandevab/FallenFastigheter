import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

const markorIkon = () => L.divIcon({ className: 'map-marker', iconSize: [18, 18], iconAnchor: [9, 9] });

/** Fastighetskarta – Leaflet + OpenStreetMap, markörer med popup + länk. */
export function MapView({ punkter, hojd = 'h-[420px]', zoomTill = true }) {
  const ref = useRef(null);
  const kartaRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!ref.current || kartaRef.current) return;
    const karta = L.map(ref.current, { scrollWheelZoom: false }).setView([58.32, 12.35], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare',
      maxZoom: 18,
    }).addTo(karta);
    kartaRef.current = karta;
    return () => { karta.remove(); kartaRef.current = null; };
  }, []);

  useEffect(() => {
    const karta = kartaRef.current;
    if (!karta) return;
    const grupp = L.layerGroup().addTo(karta);
    const giltiga = (punkter || []).filter((p) => p.lat && p.lng);
    giltiga.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: markorIkon(), title: p.namn }).addTo(grupp);
      const popup = document.createElement('div');
      popup.innerHTML = `<strong>${p.namn}</strong><br>${p.adress || ''}`;
      if (p.till) {
        const a = document.createElement('a');
        a.href = p.till; a.textContent = 'Visa fastigheten'; a.style.cssText = 'display:block;margin-top:6px;font-weight:600;color:var(--primary)';
        a.onclick = (e) => { e.preventDefault(); navigate(p.till); };
        popup.appendChild(a);
      }
      m.bindPopup(popup);
    });
    if (zoomTill && giltiga.length) {
      karta.fitBounds(L.latLngBounds(giltiga.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 14 });
    }
    return () => grupp.remove();
  }, [punkter, navigate, zoomTill]);

  return <div ref={ref} className={`${hojd} w-full rounded-xl border border-line`} role="region" aria-label="Karta över fastigheter" />;
}
