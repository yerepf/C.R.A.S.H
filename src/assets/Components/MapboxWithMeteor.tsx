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
}

const MapboxWithMeteor: React.FC<MapboxWithMeteorProps> = ({ impactData }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const threeContainerRef = useRef<HTMLDivElement | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [craterVisible, setCraterVisible] = useState(false);

  // Datos calculados del impacto
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

  // Inicializar Mapbox
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoieWVyZXBmIiwiYSI6ImNtZzVhcmFxczAyczMybHB4NzluOGd0bDIifQ.D7eY77KyGHtkQZ96gliXvA';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [impactData.lon, impactData.lat],
      zoom: 11,
      pitch: 65,
      bearing: -20
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [impactData]);

  // Mostrar cráter después de la animación
  useEffect(() => {
    if (animationComplete && mapRef.current) {
      // Marcador rojo en el punto de impacto
      new mapboxgl.Marker({ color: '#ff0000', scale: 1.5 })
        .setLngLat([impactData.lon, impactData.lat])
        .addTo(mapRef.current);

      // Círculo del cráter
      const craterRadiusKm = parseFloat(impactCalculations.crater.diameter) / 2000;
      
      mapRef.current.addSource('crater', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [impactData.lon, impactData.lat]
          },
          properties: {}
        }
      });

      mapRef.current.addLayer({
        id: 'crater-circle',
        type: 'circle',
        source: 'crater',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, craterRadiusKm * 100000]
            ],
            base: 2
          },
          'circle-color': '#ff0000',
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ff0000'
        }
      });

      setCraterVisible(true);
    }
  }, [animationComplete, impactData, impactCalculations.crater.diameter]);

  // Animación del meteorito con Three.js
  useEffect(() => {
    if (!threeContainerRef.current || animationComplete) return;

    const container = threeContainerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      10000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff4400, 2, 100);
    scene.add(pointLight);

    // Crear meteorito con detalles
    const meteorGroup = new THREE.Group();

    // Núcleo del meteorito
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

    // Capa exterior irregular
    const outerGeometry = new THREE.IcosahedronGeometry(1.3, 1);
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1a0f,
      roughness: 1,
      metalness: 0
    });
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    meteorGroup.add(outer);

    // Bola de fuego envolvente
    const fireGeometry = new THREE.SphereGeometry(1.6, 24, 24);
    const fireMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.6
    });
    const fireBall = new THREE.Mesh(fireGeometry, fireMaterial);
    meteorGroup.add(fireBall);

    // Aura brillante exterior
    const glowGeometry = new THREE.SphereGeometry(2.0, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    meteorGroup.add(glow);

    // Sistema de partículas para la estela
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

    // Estela de humo
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
      opacity: 0.4,
      blending: THREE.NormalBlending
    });
    const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
    meteorGroup.add(smoke);

    scene.add(meteorGroup);

    // Posición inicial del meteorito (alto y a la distancia)
    meteorGroup.position.set(35, 100, -60);
    
    // Posicionar la cámara para seguir la acción
    camera.position.set(50, 70, 50);
    camera.lookAt(meteorGroup.position);

    // Variables de animación
    const startY = 100;
    const endY = 0;
    const duration = 3500;
    const startTime = Date.now();

    let explosionCreated = false;

    // Función para crear explosión
    const createExplosion = (scene: THREE.Scene, position: THREE.Vector3) => {
      const explosionGroup = new THREE.Group();
      
      // Flash inicial blanco brillante
      const flashGeometry = new THREE.SphereGeometry(3, 16, 16);
      const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      });
      const flash = new THREE.Mesh(flashGeometry, flashMaterial);
      explosionGroup.add(flash);
      
      // Ondas de explosión
      for (let i = 0; i < 4; i++) {
        const waveGeometry = new THREE.SphereGeometry(2 + i * 1.5, 24, 24);
        const waveMaterial = new THREE.MeshBasicMaterial({
          color: i === 0 ? 0xffff00 : i === 1 ? 0xffaa00 : i === 2 ? 0xff4400 : 0xff0000,
          transparent: true,
          opacity: 0.9 - i * 0.15,
          side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        explosionGroup.add(wave);
      }
      
      // Partículas de explosión
      const debrisGeometry = new THREE.BufferGeometry();
      const debrisCount = 1000;
      const debrisPositions = new Float32Array(debrisCount * 3);
      const debrisVelocities: THREE.Vector3[] = [];
      
      for (let i = 0; i < debrisCount; i++) {
        const i3 = i * 3;
        debrisPositions[i3] = 0;
        debrisPositions[i3 + 1] = 0;
        debrisPositions[i3 + 2] = 0;
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.5,
          (Math.random() - 0.5) * 2
        );
        debrisVelocities.push(velocity);
      }
      
      debrisGeometry.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
      
      const debrisMaterial = new THREE.PointsMaterial({
        color: 0xff6600,
        size: 0.2,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending
      });
      const debris = new THREE.Points(debrisGeometry, debrisMaterial);
      explosionGroup.add(debris);
      
      explosionGroup.position.copy(position);
      scene.add(explosionGroup);
      
      // Luz de la explosión
      const explosionLight = new THREE.PointLight(0xff4400, 5, 200);
      explosionLight.position.copy(position);
      scene.add(explosionLight);
      
      // Animar explosión
      let scale = 1;
      let frame = 0;
      const explosionAnimate = () => {
        frame++;
        scale += 0.4;
        
        explosionGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.scale.set(scale, scale, scale);
            const material = child.material;
            if (material && typeof material === 'object' && 'opacity' in material) {
              (material as THREE.MeshBasicMaterial).opacity -= 0.015;
            }
          }
        });
        
        // Animar partículas de escombros
        const debrisPos = debrisGeometry.attributes.position.array;
        debrisVelocities.forEach((vel, i) => {
          const i3 = i * 3;
          debrisPos[i3] += vel.x;
          debrisPos[i3 + 1] += vel.y;
          debrisPos[i3 + 2] += vel.z;
          vel.y -= 0.02; // Gravedad
        });
        debrisGeometry.attributes.position.needsUpdate = true;
        
        // Fade de la luz
        explosionLight.intensity -= 0.08;
        
        // Verificar si debe continuar la animación
        const firstChild = explosionGroup.children[0];
        let shouldContinue = false;
        if (firstChild instanceof THREE.Mesh) {
          const mat = firstChild.material;
          if (mat && typeof mat === 'object' && 'opacity' in mat) {
            shouldContinue = frame < 120 && (mat as THREE.MeshBasicMaterial).opacity > 0;
          }
        }
        
        if (shouldContinue) {
          requestAnimationFrame(explosionAnimate);
        } else {
          scene.remove(explosionGroup);
          scene.remove(explosionLight);
        }
      };
      explosionAnimate();
    };

    // Animación principal
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Curva de aceleración realista (gravedad)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      // Actualizar posición del meteorito (trayectoria diagonal)
      meteorGroup.position.y = startY - (startY - endY) * easeProgress;
      meteorGroup.position.x = 35 - 35 * progress;
      meteorGroup.position.z = -60 + 60 * progress;
      
      // Rotación del meteorito
      meteorGroup.rotation.x += 0.08;
      meteorGroup.rotation.y += 0.05;
      meteorGroup.rotation.z += 0.03;
      
      // Escalar el fuego según la velocidad (efecto atmosférico)
      const velocity = progress * 2 + 0.5;
      const fireScale = 1 + velocity;
      fireBall.scale.set(fireScale, fireScale * 1.8, fireScale);
      glow.scale.set(fireScale * 1.2, fireScale * 2, fireScale * 1.2);
      
      // Intensificar el brillo con la velocidad
      fireMaterial.opacity = 0.6 + progress * 0.3;
      glowMaterial.opacity = 0.3 + progress * 0.4;
      
      // Actualizar luz puntual
      pointLight.position.copy(meteorGroup.position);
      pointLight.intensity = 2 + progress * 3;
      
      // Actualizar partículas de fuego
      const particlePositions = particlesGeometry.attributes.position.array;
      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] += velocities[i3];
        particlePositions[i3 + 1] += velocities[i3 + 1];
        particlePositions[i3 + 2] += velocities[i3 + 2];
        
        // Reiniciar partículas que caen muy bajo
        if (particlePositions[i3 + 1] < -8) {
          particlePositions[i3] = (Math.random() - 0.5) * 2;
          particlePositions[i3 + 1] = 3;
          particlePositions[i3 + 2] = (Math.random() - 0.5) * 2;
        }
      }
      particlesGeometry.attributes.position.needsUpdate = true;
      
      // Actualizar humo
      const smokePositions = smokeGeometry.attributes.position.array;
      for (let i = 0; i < smokeCount; i++) {
        const i3 = i * 3;
        smokePositions[i3 + 1] -= 0.15;
        
        if (smokePositions[i3 + 1] < -10) {
          smokePositions[i3] = (Math.random() - 0.5) * 2;
          smokePositions[i3 + 1] = 5;
          smokePositions[i3 + 2] = (Math.random() - 0.5) * 2;
        }
      }
      smokeGeometry.attributes.position.needsUpdate = true;
      
      // Cámara dinámica que sigue al meteorito
      const cameraOffset = 40 - progress * 20;
      camera.position.x = meteorGroup.position.x + cameraOffset;
      camera.position.y = meteorGroup.position.y + 30 - progress * 10;
      camera.position.z = meteorGroup.position.z + cameraOffset;
      camera.lookAt(meteorGroup.position);
      
      renderer.render(scene, camera);
      
      // Impacto
      if (progress >= 1 && !explosionCreated) {
        explosionCreated = true;
        createExplosion(scene, meteorGroup.position);
        scene.remove(meteorGroup);
        
        // Shake de cámara
        let shakeFrames = 30;
        const shakeCamera = () => {
          if (shakeFrames > 0) {
            camera.position.x += (Math.random() - 0.5) * 2;
            camera.position.y += (Math.random() - 0.5) * 2;
            camera.position.z += (Math.random() - 0.5) * 2;
            renderer.render(scene, camera);
            shakeFrames--;
            requestAnimationFrame(shakeCamera);
          } else {
            // Asegurarse de que el mapa sea visible antes de limpiar
            setTimeout(() => {
              setAnimationComplete(true);
              if (container && renderer.domElement.parentNode === container) {
                try {
                  container.removeChild(renderer.domElement);
                } catch (e) {
                  console.warn('Error removing renderer:', e);
                }
              }
              // Forzar resize del mapa para asegurar que se muestre
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

    // Manejo de redimensionamiento
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Limpiar
    return () => {
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      smokeGeometry.dispose();
      smokeMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      outerGeometry.dispose();
      outerMaterial.dispose();
      fireGeometry.dispose();
      fireMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
    };
  }, [animationComplete]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Panel lateral con información */}
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
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#ff6b6b'
        }}>
          🌠 Simulador de Impacto
        </h1>

        {/* Información del Meteorito */}
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
            <p style={{ marginBottom: '8px' }}>
              <strong>Composición:</strong> Condrita ordinaria
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Ángulo de entrada:</strong> 45°
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
              <strong>Latitud:</strong> {impactData.lat.toFixed(4)}°
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Longitud:</strong> {impactData.lon.toFixed(4)}°
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Coordenadas:</strong> {Math.abs(impactData.lat).toFixed(2)}° {impactData.lat >= 0 ? 'N' : 'S'}, {Math.abs(impactData.lon).toFixed(2)}° {impactData.lon >= 0 ? 'E' : 'W'}
            </p>
          </div>
        </div>

        {/* Características del Cráter */}
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
            <p style={{ marginBottom: '8px' }}>
              <strong>Radio visible:</strong> {(parseFloat(impactCalculations.crater.diameter) / 2000).toFixed(2)} km
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
              <strong>Magnitud:</strong> {impactCalculations.seismic.magnitude} (Richter)
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Tipo:</strong> {impactCalculations.seismic.type}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Energía liberada:</strong> {impactCalculations.energy.megatons} megatones
            </p>
          </div>
        </div>

        {/* Estado de la animación */}
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
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              El meteorito está atravesando la atmósfera...
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
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
              El meteorito ha impactado en las coordenadas especificadas
            </p>
            {craterVisible && (
              <p style={{ fontSize: '13px', color: '#4ecdc4' }}>
                ✓ Cráter de impacto visible en el mapa
              </p>
            )}
          </div>
        )}

        {/* Técnicas de Mitigación */}
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
            color: '#ff6b6b'
          }}>
            🛡️ Recomendaciones de Seguridad
          </h2>
          <div style={{ 
            padding: '12px',
            backgroundColor: '#0f172a',
            borderRadius: '4px',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#94a3b8'
          }}>
            <p style={{ marginBottom: '8px' }}>
              • Evacuar área de {(parseFloat(impactCalculations.crater.diameter) / 100).toFixed(0)} km de radio
            </p>
            <p style={{ marginBottom: '8px' }}>
              • Protegerse de ondas sísmicas
            </p>
            <p style={{ marginBottom: '8px' }}>
              • Prepararse para posibles tsunamis si es impacto oceánico
            </p>
            <p>
              • Monitorear sistemas de alerta temprana
            </p>
          </div>
        </div>
      </div>

      {/* Mapa de Mapbox */}
      <div
        ref={mapContainerRef}
        style={{ 
          position: 'absolute',
          left: '380px',
          top: 0,
          width: 'calc(100% - 380px)',
          height: '100%'
        }}
      />

      {/* Canvas de Three.js para el meteorito */}
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
    </div>
  );
};

export default MapboxWithMeteor;