"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937];

export function PlaceMap({ latitude, longitude, onChange }: { latitude: string; longitude: string; onChange: (latitude: string, longitude: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const lat = Number(latitude);
  const lng = Number(longitude);

  useEffect(() => {
    if (!container.current || map.current) return;
    const center: [number, number] = Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : DEFAULT_CENTER;
    const instance = new maplibregl.Map({
      container: container.current,
      center,
      zoom: Number.isFinite(lat) && Number.isFinite(lng) ? 16 : 4,
      style: `https://tiles.openfreemap.org/styles/bright`,
      attributionControl: { compact: true },
    });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    instance.on("click", (event) => onChange(event.lngLat.lat.toFixed(6), event.lngLat.lng.toFixed(6)));
    map.current = instance;
    return () => { instance.remove(); map.current = null; };
  }, [lat, lng, onChange]);

  useEffect(() => {
    if (!map.current || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom(), 15), essential: true });
    marker.current?.remove();
    marker.current = new maplibregl.Marker({ color: "#2e6b4f" }).setLngLat([lng, lat]).addTo(map.current);
  }, [lat, lng]);

  return <div className="place-map" ref={container} aria-label="Choose a campus place on the map" />;
}
