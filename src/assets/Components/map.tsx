import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample: React.FC = () => {
  // 1. Tipa el ref como HTMLDivElement | null
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    // 2. Guarda para que no monte dos veces en modo Strict
    if (mapRef.current) return;

    // 3. Asegúrate de que el nodo existe
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken =
      'pk.eyJ1IjoieWVyZXBmIiwiYSI6ImNtZzVhcmFxczAyczMybHB4NzluOGd0bDIifQ.D7eY77KyGHtkQZ96gliXvA';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current, // ahora es HTMLElement
      center: [-74.5, 40],
      zoom: 9
    });

    // 4. Limpieza al desmontar
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // <-- importante: array vacío para que corra solo una vez

  return (
    <div
      ref={mapContainerRef}
      className="map-container"
      style={{ width: '100%', height: '100vh' }}
    />
  );
};

export default MapboxExample;