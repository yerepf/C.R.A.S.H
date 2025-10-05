import React, { useEffect, useRef, useState } from 'react';
import {
  Viewer,
  Cartesian3,
  Cartesian2,
  Color,
  JulianDate,
  SampledPositionProperty,
  ClockRange,
  Math as CesiumMath,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  HorizontalOrigin,
  HeadingPitchRange,
  DistanceDisplayCondition,
  NearFarScalar,
  Cartographic
} from "cesium";

interface ImpactData {
  lat: number;
  lon: number;
  position: Cartesian3;
  asteroid: any;
}

const CesiumGlobe: React.FC<{ 
  onConfirm: (impactData: ImpactData) => void 
}> = ({ onConfirm }) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [selectedAsteroid, setSelectedAsteroid] = useState<any>(null);
  const [isSelectingImpact, setIsSelectingImpact] = useState(false);
  const [impactPoint, setImpactPoint] = useState<any>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const impactPinRef = useRef<any>(null);
  const [asteroidToCrash, setAsteroidToCrash] = useState<any>(null);
  const [asteroidsData, setAsteroidsData] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getTodayDate = (): string => {
    return formatDate(new Date());
  };

  const changeDate = (days: number): void => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(formatDate(newDate));
  };

  const goToDate = (dateString: string): void => {
    setCurrentDate(dateString);
  };

  const fetchAsteroids = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://crash-api-ptq6.onrender.com/previewAsteroid/${date}`);
      const data = await response.json();

      if (data.asteroides && Array.isArray(data.asteroides)) {
        console.log('🪐 Asteroides recibidos:', data.asteroides);
        setAsteroidsData(data.asteroides);
      } else {
        console.warn('⚠️ No se encontró un array de asteroides en la respuesta:', data);
        setAsteroidsData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching asteroids data:', error);
      setAsteroidsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentDate) {
      fetchAsteroids(currentDate);
    }
  }, [currentDate]);

  useEffect(() => {
    setCurrentDate(getTodayDate());
  }, []);

  useEffect(() => {
    const cesiumWidgetsCssUrl =
      "https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/Widgets/widgets.css";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cesiumWidgetsCssUrl;
    document.head.appendChild(link);

    if (cesiumContainer.current) {
      const viewer = new Viewer(cesiumContainer.current, {
        animation: false,
        timeline: false,
        infoBox: true,
        skyAtmosphere: false,
        skyBox: false,
        creditContainer: document.createElement("div")
      });

      viewer.scene.logarithmicDepthBuffer = true;
      viewer.scene.mode = SceneMode.SCENE3D;
      viewer.scene.globe.depthTestAgainstTerrain = false;

      const durationSeconds = 360;
      const start = JulianDate.now();
      const stop = JulianDate.addSeconds(start, durationSeconds, new JulianDate());

      viewer.clock.startTime = start.clone();
      viewer.clock.stopTime = stop.clone();
      viewer.clock.currentTime = start.clone();
      viewer.clock.clockRange = ClockRange.LOOP_STOP;
      viewer.clock.shouldAnimate = true;

      viewerRef.current = viewer;

      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(-90.0, 45.0, 50000000.0),
        orientation: {
          heading: 0.0,
          pitch: CesiumMath.toRadians(-60.0),
          roll: 0.0,
        },
      });

      viewer.selectedEntityChanged.addEventListener((entity) => {
        if (entity && entity.name && !entity.name.includes("Static Orbit")) {
          setSelectedAsteroid(entity);
        } else {
          setSelectedAsteroid(null);
        }
      });
    }

    return () => {
      document.head.removeChild(link);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!viewerRef.current || loading) return;

    const viewer = viewerRef.current;
    viewer.entities.removeAll();

    const EARTH_RADIUS = 6371000;

    const createAsteroid = (
      asteroid: any,
      color: Color,
      scaleFactor: number = 1.0
    ) => {
      const asteroidPosition = new SampledPositionProperty();
      const polylinePoints: Cartesian3[] = [];
      
      const alturaReal = asteroid.altura_tierra_m || 0;
      const alturaKm = alturaReal / 1000;
      const alturaEscalada = Math.log10(alturaKm + 100) * 200000;
      const R = EARTH_RADIUS + alturaEscalada;

      console.log(`🪐 Creando asteroide: ${asteroid.nombre}`);
      console.log(`   Altura real: ${alturaKm.toFixed(2)} km`);
      console.log(`   Altura escalada: ${(alturaEscalada / 1000).toFixed(2)} km`);
      console.log(`   Radio orbital: ${(R / 1000).toFixed(2)} km`);

      const velocityMs = asteroid.velocidad_km_s * 1000;
      const circumference = 2 * Math.PI * R;
      const durationSeconds = 360;
      const periodSeconds = circumference / velocityMs;
      const orbitSpeedFactor = durationSeconds / periodSeconds;
      const effectiveOrbitSpeed = Math.max(orbitSpeedFactor, 0.1);
      
      let inclinationAngle = asteroid.inclinacion;
      if (!inclinationAngle || inclinationAngle === 0) {
        inclinationAngle = CesiumMath.toRadians((Math.random() * 120) - 60);
      } else {
        const minInclination = CesiumMath.toRadians(10);
        if (Math.abs(inclinationAngle) < minInclination) {
          inclinationAngle = inclinationAngle > 0 ? minInclination : -minInclination;
        }
      }

      const startAngle = Math.random() * 2 * Math.PI;
      const start = JulianDate.now();

      for (let i = 0; i <= durationSeconds * effectiveOrbitSpeed; i += 1) {
        const time = JulianDate.addSeconds(start, i / effectiveOrbitSpeed, new JulianDate());
        const angle = startAngle + CesiumMath.toRadians(i * (360 / (durationSeconds * effectiveOrbitSpeed)));

        const x_prime = R * Math.cos(angle);
        const y_prime = R * Math.sin(angle);
        const x = x_prime;
        const y = y_prime * Math.cos(inclinationAngle);
        const z = y_prime * Math.sin(inclinationAngle);

        const cartesianPosition = new Cartesian3(x, y, z);
        polylinePoints.push(cartesianPosition);
        asteroidPosition.addSample(time, cartesianPosition);
      }

      const diameter = asteroid.diametro_promedio_m;
      const baseScale = Math.max(diameter / 100, 50);
      const scale = baseScale * scaleFactor;

      console.log(`   Diámetro: ${diameter.toFixed(2)} m, Escala: ${scale.toFixed(2)}`);
      console.log(`   Ángulo inicial: ${CesiumMath.toDegrees(startAngle).toFixed(2)}°`);

      viewer.entities.add({
        name: `${asteroid.nombre} - Static Orbit`,
        polyline: {
          positions: polylinePoints,
          width: 2,
          material: color.withAlpha(0.2),
          clampToGround: false,
        },
      });

      return viewer.entities.add({
        name: asteroid.nombre,
        description: `
          <strong>${asteroid.nombre}</strong><br/>
          ID: ${asteroid.id}<br/>
          Diámetro: ${diameter.toFixed(2)} m<br/>
          Velocidad: ${asteroid.velocidad_km_s.toFixed(2)} km/s<br/>
          Altura: ${(asteroid.altura_tierra_m / 1000).toFixed(2)} km<br/>
          Inclinación: ${inclinationAngle.toFixed(4)} rad (${CesiumMath.toDegrees(inclinationAngle).toFixed(2)}°)<br/>
          Posición inicial: ${CesiumMath.toDegrees(startAngle).toFixed(2)}°
        `,
        position: asteroidPosition,
        model: {
          uri: "/meteorite.glb",
          scale: scale,
          minimumPixelSize: 32,
          maximumScale: 20000,
        },
        path: {
          resolution: 120,
          width: 1,
          material: color.withAlpha(0.4),
          trailTime: 60,
        },
        label: {
          text: asteroid.nombre,
          font: "bold 14pt 'Segoe UI', sans-serif",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 3,
          pixelOffset: new Cartesian2(0, -50),
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
          showBackground: true,
          backgroundColor: new Color(0.0, 0.0, 0.0, 0.8),
          backgroundPadding: new Cartesian2(10, 6),
          scale: 1.0,
          distanceDisplayCondition: new DistanceDisplayCondition(0, 50000000),
          scaleByDistance: new NearFarScalar(1000000, 1.0, 10000000, 0.5),
          translucencyByDistance: new NearFarScalar(1000000, 1.0, 10000000, 0.3),
        },
        properties: {
          asteroidData: asteroid
        }
      });
    };

    asteroidsData.forEach((asteroid, index) => {
      const colors = [
        Color.YELLOW,
        Color.ORANGE,
        Color.RED,
        Color.GREEN,
        Color.BLUE,
        Color.VIOLET,
        Color.CYAN,
        Color.MAGENTA,
        Color.GOLD,
        Color.CORAL
      ];
      const color = colors[index % colors.length];
      createAsteroid(asteroid, color, 0.5);
    });

    if (asteroidsData.length > 0) {
      viewer.flyTo(viewer.entities, { 
        duration: 2.0,
        offset: new HeadingPitchRange(0, CesiumMath.toRadians(-70), 10000000)
      });
    }

  }, [asteroidsData, loading]);

  useEffect(() => {
    if (!viewerRef.current || !isSelectingImpact) return;

    const viewer = viewerRef.current;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((click: any) => {
      const pickedPosition = viewer.scene.pickPosition(click.position);
      
      if (pickedPosition) {
        if (impactPinRef.current) {
          viewer.entities.remove(impactPinRef.current);
        }

        impactPinRef.current = viewer.entities.add({
          position: pickedPosition,
          billboard: {
            image: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
            width: 48,
            height: 48,
            verticalOrigin: VerticalOrigin.CENTER,
            horizontalOrigin: HorizontalOrigin.CENTER,
          },
        });

        setImpactPoint(pickedPosition);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [isSelectingImpact]);

  const handleCrashClick = () => {
    setAsteroidToCrash(selectedAsteroid);
    setIsSelectingImpact(true);
  };

  const handleCancel = () => {
    setIsSelectingImpact(false);
    setImpactPoint(null);
    if (impactPinRef.current && viewerRef.current) {
      viewerRef.current.entities.remove(impactPinRef.current);
      impactPinRef.current = null;
    }
  };

  const handleConfirm = () => {
    if (!impactPoint || !asteroidToCrash) return;

    const cartographic = Cartographic.fromCartesian(impactPoint);
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const latitude = CesiumMath.toDegrees(cartographic.latitude);

    console.log('📍 Coordenadas del impacto:', {
      lat: latitude,
      lon: longitude,
      height: cartographic.height
    });

    // Obtener los datos del asteroide desde las properties
    const asteroidData = asteroidToCrash.properties?.asteroidData?._value || {
      nombre: asteroidToCrash.name,
      diametro_promedio_m: 340,
      velocidad_km_s: 18.5
    };

    onConfirm({
      lat: latitude,
      lon: longitude,
      position: impactPoint,
      asteroid: asteroidData
    });
    
    handleCancel();
  };

  return (
    <>
      <style>{`
        .cesium-container {
          width: 100%;
          height: 100vh;
          position: relative;
        }
        
        .date-controls {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 16px 24px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .date-button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.2s;
        }

        .date-button:hover {
          background-color: #2563eb;
        }

        .date-button:disabled {
          background-color: #6b7280;
          cursor: not-allowed;
        }

        .date-display {
          margin: 0 12px;
          font-size: 14px;
        }

        .date-input {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
        }

        .loading-indicator {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          z-index: 9999;
        }

        .crash-button {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%) scale(1);
          background-color: #dc2626;
          color: white;
          padding: 16px 32px;
          font-size: 24px;
          font-weight: bold;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s, background-color 0.2s;
        }

        .crash-button:hover {
          background-color: #b91c1c;
          transform: translateX(-50%) scale(1.05);
        }

        .crash-button:disabled {
          background-color: #6b7280;
          cursor: not-allowed;
          transform: translateX(-50%) scale(1);
        }

        .impact-controls {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 9999;
        }

        .control-button {
          padding: 14px 28px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s, background-color 0.2s;
        }

        .control-button:hover {
          transform: scale(1.05);
        }

        .cancel-button {
          background-color: #6b7280;
          color: white;
        }

        .cancel-button:hover {
          background-color: #4b5563;
        }

        .confirm-button {
          background-color: #16a34a;
          color: white;
        }

        .confirm-button:hover {
          background-color: #15803d;
        }

        .confirm-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        .instruction-banner {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 16px 32px;
          border-radius: 10px;
          font-size: 18px;
          font-weight: 600;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
      `}</style>

      <div ref={cesiumContainer} className="cesium-container" />

      <div className="date-controls">
        <button 
          className="date-button" 
          onClick={() => changeDate(-1)}
          disabled={loading}
        >
          ← Ayer
        </button>
        
        <span className="date-display">
          {currentDate} {loading && "(Cargando...)"}
        </span>
        
        <button 
          className="date-button" 
          onClick={() => changeDate(1)}
          disabled={loading}
        >
          Mañana →
        </button>
        
        <input
          type="date"
          className="date-input"
          value={currentDate}
          onChange={(e) => goToDate(e.target.value)}
          disabled={loading}
        />
        
        <button 
          className="date-button" 
          onClick={() => goToDate(getTodayDate())}
          disabled={loading}
        >
          Hoy
        </button>
      </div>

      {loading && (
        <div className="loading-indicator">
          ⏳ Cargando asteroides para {currentDate}...
        </div>
      )}

      {isSelectingImpact && (
        <div className="instruction-banner">
          🎯 Haz clic en el globo para seleccionar el punto de impacto
        </div>
      )}

      {!isSelectingImpact && selectedAsteroid && (
        <button 
          className="crash-button" 
          onClick={handleCrashClick}
          disabled={loading}
        >
          🚀 CRASH
        </button>
      )}

      {isSelectingImpact && (
        <div className="impact-controls">
          <button className="control-button cancel-button" onClick={handleCancel}>
            ❌ Cancelar
          </button>
          <button
            className="control-button confirm-button"
            onClick={handleConfirm}
            disabled={!impactPoint}
          >
            ✅ Confirmar Impacto
          </button>
        </div>
      )}
    </>
  );
};

export default CesiumGlobe;