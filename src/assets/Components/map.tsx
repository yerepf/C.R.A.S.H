import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // Estado para simular datos del impacto
  const [impactData] = useState({
    crater: {
      diameter: '2.5 km',
      depth: '450 m'
    },
    seismic: {
      magnitude: '7.8',
      type: 'Impacto'
    },
    meteorite: {
      velocity: '18.5 km/s',
      mass: '2.5 × 10⁹ kg',
      angle: '45°',
      composition: 'Condrita ordinaria'
    },
    location: {
      coordinates: '40.0°N, 74.5°W',
      terrain: 'Agua (Océano Atlántico)',
      nearestCity: 'Nueva York (85 km)',
      depth: '1,200 m'
    }
  });

  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken =
      'pk.eyJ1IjoieWVyZXBmIiwiYSI6ImNtZzVhcmFxczAyczMybHB4NzluOGd0bDIifQ.D7eY77KyGHtkQZ96gliXvA';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-74.5, 40],
      zoom: 9
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Panel Izquierdo */}
      <div style={{
        width: '380px',
        backgroundColor: '#1a1a2e',
        color: '#ffffff',
        overflowY: 'auto',
        padding: '20px',
        boxShadow: '2px 0 10px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#ff6b6b'
        }}>
          Simulador de Impacto
        </h1>

        {/* Información del Cráter */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#4ecdc4',
            borderBottom: '2px solid #4ecdc4',
            paddingBottom: '8px'
          }}>
            🌑 Características del Cráter
          </h2>
          <div style={{ paddingLeft: '8px' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Diámetro:</strong> {impactData.crater.diameter}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Profundidad:</strong> {impactData.crater.depth}
            </p>
          </div>
        </div>

        {/* Actividad Sísmica */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#f7b731',
            borderBottom: '2px solid #f7b731',
            paddingBottom: '8px'
          }}>
            📊 Actividad Sísmica
          </h2>
          <div style={{ paddingLeft: '8px' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Magnitud:</strong> {impactData.seismic.magnitude} (Richter)
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Tipo:</strong> {impactData.seismic.type}
            </p>
          </div>
        </div>

        {/* Datos del Meteorito */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#a29bfe',
            borderBottom: '2px solid #a29bfe',
            paddingBottom: '8px'
          }}>
            ☄️ Información del Meteorito
          </h2>
          <div style={{ paddingLeft: '8px' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Velocidad:</strong> {impactData.meteorite.velocity}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Masa:</strong> {impactData.meteorite.mass}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Ángulo de impacto:</strong> {impactData.meteorite.angle}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Composición:</strong> {impactData.meteorite.composition}
            </p>
          </div>
        </div>

        {/* Ubicación del Impacto */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#00b894',
            borderBottom: '2px solid #00b894',
            paddingBottom: '8px'
          }}>
            📍 Ubicación del Impacto
          </h2>
          <div style={{ paddingLeft: '8px' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Coordenadas:</strong> {impactData.location.coordinates}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Terreno:</strong> {impactData.location.terrain}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Profundidad del agua:</strong> {impactData.location.depth}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Ciudad más cercana:</strong> {impactData.location.nearestCity}
            </p>
          </div>
        </div>

        {/* Técnicas de Mitigación */}
        <div style={{ 
          marginBottom: '24px',
          backgroundColor: '#16213e',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid #ff6b6b'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#ff6b6b'
          }}>
            🛡️ Técnicas de Mitigación
          </h2>
          <div style={{ 
            padding: '12px',
            backgroundColor: '#0f172a',
            borderRadius: '4px',
            fontStyle: 'italic',
            color: '#94a3b8'
          }}>
            <p style={{ marginBottom: '8px', fontSize: '14px' }}>
              Análisis generado por IA...
            </p>
            <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
              Las recomendaciones específicas de mitigación se generarán basándose en:
              tipo de terreno, magnitud del impacto, proximidad a poblaciones y 
              características del meteorito.
            </p>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div
        ref={mapContainerRef}
        style={{ flex: 1, height: '100%' }}
      />
    </div>
  );
};

export default MapboxExample;