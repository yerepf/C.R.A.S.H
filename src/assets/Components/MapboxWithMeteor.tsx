import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ImpactData {
  lat: number;
  lon: number;
  position: any;
  asteroid: any;
}

interface MapboxWithMeteorProps {
  impactData: ImpactData;
  onBack?: () => void;
}

const MapboxWithMeteor: React.FC<MapboxWithMeteorProps> = ({ impactData, onBack }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const threeContainerRef = useRef<HTMLDivElement | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [craterVisible, setCraterVisible] = useState(false);
  const [mitigationText, setMitigationText] = useState<string>('');
  const [isLoadingMitigation, setIsLoadingMitigation] = useState(true);

  const impactCalculations = {
    crater: {
      diameter: ((impactData.asteroid?.diametro_promedio_m || 340) * 7.3).toFixed(1),
      depth: ((impactData.asteroid?.diametro_promedio_m || 340) * 1.3).toFixed(0)
    },
    seismic: {
      magnitude: (6.5 + Math.log10(impactData.asteroid?.diametro_promedio_m || 340)).toFixed(1),
      type: 'Impacto'
    },
    energy: {
      megatons: ((impactData.asteroid?.velocidad_km_s || 18.5) ** 2 * 0.5).toFixed(1)
    }
  };

const fetchMitigationRecommendations = async () => {
  console.log('🚀 Simulando llamada a AI...');
  setIsLoadingMitigation(true);
  setMitigationText('');
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const recomendaciones = [
    `Para un impacto de magnitud ${impactCalculations.seismic.magnitude} Richter, se recomienda: 
    1. Evacuación inmediata en radio de 50 km
    2. Refugios subterráneos para población vulnerable
    3. Sistema de alerta temprana sísmica
    4. Plan de contingencia para infraestructura crítica`,
    
    `Medidas técnicas para impacto de ${impactCalculations.energy.megatons} megatones:
    • Estructuras antisísmicas en zona de 30 km
    • Reservas de emergencia para 72 horas
    • Protocolos de comunicación satelital
    • Hospitales de campaña en áreas seguras`,
    
    `Protección civil ante cráter de ${impactCalculations.crater.diameter}m:
    - Zona de exclusión de 5 km del epicentro
    - Monitoreo de calidad del aire continuo
    - Equipos de rescate especializados
    - Albergues temporales resistentes`,
    
    `Mitigación para asteroide ${impactData.asteroid?.nombre || 'Desconocido'}:
    🔴 Evacuación prioritaria en radio 20 km
    🟡 Refugios en sótanos reforzados
    🟢 Kit de emergencia por familia
    🔵 Rutas de escape designadas`,
    
    `Recomendaciones técnicas específicas:
    • Aislamiento de redes eléctricas
    • Protección de fuentes de agua
    • Comunicaciones de backup
    • Equipos de primeros auxilios`,
    
    `Plan de respuesta inmediata:
    1. Activación de protocolo de emergencia
    2. Evacuación escalonada por zonas
    3. Puntos de reunión seguros
    4. Coordinación con defensa civil`,
    
    `Medidas estructurales requeridas:
    - Edificios con norma sísmica superior
    - Bunkers para protección inmediata
    - Sistemas de alerta redundantes
    - Infraestructura crítica blindada`,
    
    `Protección poblacional esencial:
    • Capacitación en procedimientos de evacuación
    • Simulacros regulares de impacto
    • Mapeo de zonas de riesgo
    • Alianzas internacionales de apoyo`,
    
    `Estrategia de mitigación técnica:
    🎯 Monitoreo satelital continuo
    🎯 Red de sensores sísmicos
    🎯 Comunicaciones por satélite
    🎯 Equipos de respuesta rápida`,
    
    `Recomendaciones finales de seguridad:
    - Mantener distancia mínima de 10 km
    - Usar protección respiratoria
    - Seguir instrucciones oficiales
    - Tener plan familiar de emergencia`
  ];
  
  // Seleccionar una recomendación aleatoria
  const randomIndex = Math.floor(Math.random() * recomendaciones.length);
  const generatedText = recomendaciones[randomIndex];
  
  console.log('✅ Recomendación generada (simulada)');
  setMitigationText(generatedText);
  setIsLoadingMitigation(false);
};

  useEffect(() => {
    fetchMitigationRecommendations();
  }, []);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoieWVyZXBmIiwiYSI6ImNtZzVhcmFxczAyczMybHB4NzluOGd0bDIifQ.D7eY77KyGHtkQZ96gliXvA';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [impactData.lon, impactData.lat],
      zoom: 15,
      pitch: 60,
      bearing: -20
    });

    mapRef.current.on('load', () => {
      const layers = mapRef.current!.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer: any) => layer.type === 'symbol' && layer.layout['text-field']
      )?.id;

      mapRef.current!.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [impactData]);

  useEffect(() => {
    if (animationComplete && mapRef.current) {
      const map = mapRef.current;
      const craterRadiusMeters = parseFloat(impactCalculations.crater.diameter) / 2;
      
      const createCircle = (center: [number, number], radiusInMeters: number, points: number = 64) => {
        const coords = [];
        const distanceX = radiusInMeters / (111320 * Math.cos(center[1] * Math.PI / 180));
        const distanceY = radiusInMeters / 110574;

        for (let i = 0; i < points; i++) {
          const theta = (i / points) * (2 * Math.PI);
          const x = distanceX * Math.cos(theta);
          const y = distanceY * Math.sin(theta);
          coords.push([center[0] + x, center[1] + y]);
        }
        coords.push(coords[0]);
        return coords;
      };

      if (map.isStyleLoaded()) {
        addCraterLayers();
      } else {
        map.once('styledata', addCraterLayers);
      }

      function addCraterLayers() {
        if (!map.getSource('crater-source')) {
          map.addSource('crater-source', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [createCircle([impactData.lon, impactData.lat], craterRadiusMeters)]
              },
              properties: {}
            }
          });

          map.addLayer({
            id: 'crater-fill',
            type: 'fill',
            source: 'crater-source',
            paint: {
              'fill-color': '#1a0a00',
              'fill-opacity': 0.8
            }
          });

          map.addLayer({
            id: 'crater-border-inner',
            type: 'line',
            source: 'crater-source',
            paint: {
              'line-color': '#3d1f00',
              'line-width': 4,
              'line-blur': 2
            }
          });

          map.addLayer({
            id: 'crater-border-outer',
            type: 'line',
            source: 'crater-source',
            paint: {
              'line-color': '#8B4513',
              'line-width': 8,
              'line-blur': 4
            }
          });

          const devastationRadius = craterRadiusMeters * 3;
          map.addSource('devastation-source', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [createCircle([impactData.lon, impactData.lat], devastationRadius)]
              },
              properties: {}
            }
          });

          map.addLayer({
            id: 'devastation-zone',
            type: 'fill',
            source: 'devastation-source',
            paint: {
              'fill-color': '#ff4400',
              'fill-opacity': 0.15
            }
          });

          map.addLayer({
            id: 'devastation-border',
            type: 'line',
            source: 'devastation-source',
            paint: {
              'line-color': '#ff0000',
              'line-width': 2,
              'line-dasharray': [2, 2],
              'line-opacity': 0.5
            }
          });

          new mapboxgl.Marker({ 
            color: '#ff0000',
            scale: 1.2
          })
            .setLngLat([impactData.lon, impactData.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <h3 style="margin:0;color:#ff0000;">Punto de Impacto</h3>
                  <p style="margin:5px 0;"><strong>Cráter:</strong> ${impactCalculations.crater.diameter}m</p>
                  <p style="margin:5px 0;"><strong>Devastación:</strong> ${(devastationRadius * 2 / 1000).toFixed(2)}km</p>
                `)
            )
            .addTo(map);
        }
      }

      setCraterVisible(true);
    }
  }, [animationComplete, impactData, impactCalculations.crater.diameter]);

  useEffect(() => {
    if (!threeContainerRef.current || animationComplete) return;

    const container = threeContainerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff4400, 2, 100);
    scene.add(pointLight);

    const meteorGroup = new THREE.Group();
    const coreGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.95,
      metalness: 0.05,
      emissive: 0x331100,
      emissiveIntensity: 0.2
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    meteorGroup.add(core);

    const outerGeometry = new THREE.IcosahedronGeometry(1.3, 1);
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a0f,
      roughness: 1,
      metalness: 0
    });
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    meteorGroup.add(outer);

    const fireGeometry = new THREE.SphereGeometry(1.6, 24, 24);
    const fireMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.6
    });
    const fireBall = new THREE.Mesh(fireGeometry, fireMaterial);
    meteorGroup.add(fireBall);

    const glowGeometry = new THREE.SphereGeometry(2.0, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    meteorGroup.add(glow);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 800;
    const positions = new Float32Array(particlesCount * 3);
    const velocities = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 4;
      positions[i3 + 1] = Math.random() * 3;
      positions[i3 + 2] = (Math.random() - 0.5) * 4;
      
      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = -Math.random() * 0.5 - 0.2;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
      
      const colorChoice = Math.random();
      if (colorChoice < 0.3) {
        colors[i3] = 1.0; colors[i3 + 1] = 0.8; colors[i3 + 2] = 0.0;
      } else if (colorChoice < 0.7) {
        colors[i3] = 1.0; colors[i3 + 1] = 0.3; colors[i3 + 2] = 0.0;
      } else {
        colors[i3] = 1.0; colors[i3 + 1] = 0.0; colors[i3 + 2] = 0.0;
      }
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.15,
      transparent: true,
      opacity: 0.9,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    meteorGroup.add(particles);

    const smokeGeometry = new THREE.BufferGeometry();
    const smokeCount = 300;
    const smokePositions = new Float32Array(smokeCount * 3);
    
    for (let i = 0; i < smokeCount; i++) {
      const i3 = i * 3;
      smokePositions[i3] = (Math.random() - 0.5) * 3;
      smokePositions[i3 + 1] = Math.random() * 5;
      smokePositions[i3 + 2] = (Math.random() - 0.5) * 3;
    }
    
    smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    
    const smokeMaterial = new THREE.PointsMaterial({
      color: 0x555555,
      size: 0.3,
      transparent: true,
      opacity: 0.4
    });
    const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
    meteorGroup.add(smoke);

    scene.add(meteorGroup);
    meteorGroup.position.set(35, 100, -60);
    camera.position.set(50, 70, 50);
    camera.lookAt(meteorGroup.position);

    const startY = 100;
    const endY = 0;
    const duration = 3500;
    const startTime = Date.now();
    let explosionCreated = false;

    const createExplosion = (scene: THREE.Scene, position: THREE.Vector3) => {
      const explosionGroup = new THREE.Group();
      const flashGeometry = new THREE.SphereGeometry(5, 16, 16);
      const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      });
      const flash = new THREE.Mesh(flashGeometry, flashMaterial);
      explosionGroup.add(flash);
      
      for (let i = 0; i < 6; i++) {
        const fireballGeometry = new THREE.SphereGeometry(3 + i * 2, 32, 32);
        const fireballMaterial = new THREE.MeshBasicMaterial({
          color: i === 0 ? 0xffff00 : i === 1 ? 0xffdd00 : i === 2 ? 0xffaa00 : i === 3 ? 0xff6600 : i === 4 ? 0xff3300 : 0xff0000,
          transparent: true,
          opacity: 0.9 - i * 0.1,
          side: THREE.DoubleSide
        });
        const fireball = new THREE.Mesh(fireballGeometry, fireballMaterial);
        explosionGroup.add(fireball);
      }
      
      explosionGroup.position.copy(position);
      scene.add(explosionGroup);
      
      const explosionLight = new THREE.PointLight(0xff4400, 10, 300);
      explosionLight.position.copy(position);
      scene.add(explosionLight);
      
      let scale = 1;
      let frame = 0;
      const explosionAnimate = () => {
        frame++;
        scale += 0.5;
        
        explosionGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.scale.set(scale, scale, scale);
            const material = child.material as THREE.MeshBasicMaterial;
            if (material.opacity) material.opacity -= 0.012;
          }
        });
        
        explosionLight.intensity -= 0.12;
        
        if (frame < 150 && explosionLight.intensity > 0) {
          requestAnimationFrame(explosionAnimate);
        } else {
          scene.remove(explosionGroup);
          scene.remove(explosionLight);
        }
      };
      explosionAnimate();
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      meteorGroup.position.y = startY - (startY - endY) * easeProgress;
      meteorGroup.position.x = 35 - 35 * progress;
      meteorGroup.position.z = -60 + 60 * progress;
      
      meteorGroup.rotation.x += 0.08;
      meteorGroup.rotation.y += 0.05;
      
      const velocity = progress * 2 + 0.5;
      const fireScale = 1 + velocity;
      fireBall.scale.set(fireScale, fireScale * 1.8, fireScale);
      glow.scale.set(fireScale * 1.2, fireScale * 2, fireScale * 1.2);
      
      pointLight.position.copy(meteorGroup.position);
      pointLight.intensity = 2 + progress * 3;
      
      const particlePositions = particlesGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] += velocities[i3];
        particlePositions[i3 + 1] += velocities[i3 + 1];
        particlePositions[i3 + 2] += velocities[i3 + 2];
        
        if (particlePositions[i3 + 1] < -8) {
          particlePositions[i3] = (Math.random() - 0.5) * 2;
          particlePositions[i3 + 1] = 3;
          particlePositions[i3 + 2] = (Math.random() - 0.5) * 2;
        }
      }
      particlesGeometry.attributes.position.needsUpdate = true;
      
      const cameraOffset = 40 - progress * 20;
      camera.position.x = meteorGroup.position.x + cameraOffset;
      camera.position.y = meteorGroup.position.y + 30 - progress * 10;
      camera.position.z = meteorGroup.position.z + cameraOffset;
      camera.lookAt(meteorGroup.position);
      
      renderer.render(scene, camera);
      
      if (progress >= 1 && !explosionCreated) {
        explosionCreated = true;
        createExplosion(scene, meteorGroup.position);
        scene.remove(meteorGroup);
        
        let shakeFrames = 30;
        const shakeCamera = () => {
          if (shakeFrames > 0) {
            camera.position.x += (Math.random() - 0.5) * 2;
            camera.position.y += (Math.random() - 0.5) * 2;
            renderer.render(scene, camera);
            shakeFrames--;
            requestAnimationFrame(shakeCamera);
          } else {
            setTimeout(() => {
              setAnimationComplete(true);
              if (container && renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement);
              }
              if (mapRef.current) {
                mapRef.current.resize();
              }
            }, 1500);
          }
        };
        shakeCamera();
        return;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [animationComplete]);

  return (
    


        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

        <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '380px',
        height: '100%',
        backgroundColor: '#1a1a2e',
        color: '#ffffff',
        overflowY: 'auto',
        padding: '20px',
        boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
        zIndex: 1000
      }}>{/* Botón de volver a la página principal */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => window.location.href = 'https://crashnasa.earth'}
            style={{
              backgroundColor: '#3a0ca3',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              width: '100%',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#4361ee';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3a0ca3';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ← Volver a CrashNASA.Earth
          </button>
        </div>

        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#ff6b6b'
        }}>
          🌠 Simulador de Impacto
        </h1>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#4ecdc4',
            borderBottom: '2px solid #4ecdc4',
            paddingBottom: '8px'
          }}>
            ☄️ Información del Meteorito
          </h2>
          <div style={{ paddingLeft: '8px' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Nombre:</strong> {impactData.asteroid?.nombre || 'Desconocido'}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Diámetro:</strong> {impactData.asteroid?.diametro_promedio_m || 340} m
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Velocidad:</strong> {impactData.asteroid?.velocidad_km_s || 18.5} km/s
            </p>
          </div>
        </div>

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
              <strong>Latitud:</strong> {impactData.lat.toFixed(4)}°
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Longitud:</strong> {impactData.lon.toFixed(4)}°
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#a29bfe',
            borderBottom: '2px solid #a29bfe',
            paddingBottom: '8px'
          }}>
            🌑 Características del Cráter
          </h2>
          <div style={{ paddingLeft: '8px' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Diámetro:</strong> {impactCalculations.crater.diameter} m
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Profundidad:</strong> {impactCalculations.crater.depth} m
            </p>
          </div>
        </div>

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
              <strong>Magnitud:</strong> {impactCalculations.seismic.magnitude} (Richter)
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Energía:</strong> {impactCalculations.energy.megatons} megatones
            </p>
          </div>
        </div>

        {!animationComplete && (
          <div style={{ 
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#16213e',
            borderRadius: '8px',
            border: '2px solid #f7b731',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#f7b731',
              marginBottom: '8px'
            }}>
              🚀 METEORITO EN CURSO
            </p>
          </div>
        )}

        {animationComplete && (
          <div style={{ 
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#16213e',
            borderRadius: '8px',
            border: '2px solid #ff6b6b',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#ff6b6b',
              marginBottom: '8px'
            }}>
              💥 IMPACTO REGISTRADO
            </p>
            {craterVisible && (
              <p style={{ fontSize: '13px', color: '#4ecdc4' }}>
                ✓ Cráter visible en el mapa
              </p>
            )}
          </div>
        )}

        <div style={{ 
          marginTop: '24px',
          backgroundColor: '#16213e',
          padding: '16px',
          borderRadius: '8px',
          border: '2px solid #ff6b6b'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: '#ff6b6b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🛡️ Recomendaciones de Seguridad
            {isLoadingMitigation && (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>(IA)</span>
            )}
          </h2>
          <div style={{ 
            padding: '12px',
            backgroundColor: '#0f172a',
            borderRadius: '4px',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#94a3b8'
          }}>
            {isLoadingMitigation ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  border: '3px solid #1e3a8a',
                  borderTop: '3px solid #3b82f6',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
                <p style={{ marginTop: '12px', fontSize: '12px' }}>
                  Analizando impacto con IA...
                </p>
              </div>
            ) : (
              <p style={{ whiteSpace: 'pre-wrap' }}>{mitigationText}</p>
            )}
          </div>
          {!isLoadingMitigation && (
            <button
              onClick={fetchMitigationRecommendations}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '10px',
                backgroundColor: '#1e3a8a',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'background 0.3s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1e3a8a')}
            >
              🔄 Regenerar Recomendaciones
            </button>
          )}
        </div>
      </div>

      <div
        ref={mapContainerRef}
        style={{ 
          position: 'absolute',
          left: '380px',
          top: 0,
          width: 'calc(100% - 380px)',
          height: '100%',
          visibility: 'visible'
        }}
      />

      {!animationComplete && (
        <div
          ref={threeContainerRef}
          style={{
            position: 'absolute',
            left: '380px',
            top: 0,
            width: 'calc(100% - 380px)',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 999
          }}
        />
      )}

      {onBack && (
        <div
          style={{
            position: 'fixed',
            top: '30px',
            left: '420px',
            zIndex: 1001,
          }}
        >
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#1e3a8a',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'background 0.3s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1e3a8a')}
          >
            ← Volver al mapa 3D
          </button>
        </div>
      )}
    </div>
  );
};

export default MapboxWithMeteor;