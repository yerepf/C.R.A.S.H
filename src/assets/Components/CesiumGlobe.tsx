import {
  Viewer,
  Cartesian3,
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
} from "cesium";
import React, { useEffect, useRef, useState } from "react";

const CesiumGlobe: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [selectedAsteroid, setSelectedAsteroid] = useState<any>(null);
  const [isSelectingImpact, setIsSelectingImpact] = useState(false);
  const [impactPoint, setImpactPoint] = useState<any>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const impactPinRef = useRef<any>(null);
  const [asteroidToCrash, setAsteroidToCrash] = useState<any>(null);

  
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

      const EARTH_RADIUS = 6371000;

      const createAsteroid = (
        name: string,
        color: Color,
        radius: number,
        orbitDistance: number,
        velocityKms: number,
        inclinationFactor: number
      ) => {
        const asteroidPosition = new SampledPositionProperty();
        const polylinePoints: Cartesian3[] = [];
        const R = EARTH_RADIUS + orbitDistance;

        const velocityMs = velocityKms * 1000;
        const circumference = 2 * Math.PI * R;
        const periodSeconds = circumference / velocityMs;
        const orbitSpeedFactor = durationSeconds / periodSeconds;
        const effectiveOrbitSpeed = Math.max(orbitSpeedFactor, 0.1);
        const inclinationAngle = CesiumMath.toRadians(inclinationFactor * 90);

        for (let i = 0; i <= durationSeconds * effectiveOrbitSpeed; i += 1) {
          const time = JulianDate.addSeconds(start, i / effectiveOrbitSpeed, new JulianDate());
          const angle = CesiumMath.toRadians(i * (360 / (durationSeconds * effectiveOrbitSpeed)));

          const x_prime = R * Math.cos(angle);
          const y_prime = R * Math.sin(angle);
          const x = x_prime;
          const y = y_prime * Math.cos(inclinationAngle);
          const z = y_prime * Math.sin(inclinationAngle);

          const cartesianPosition = new Cartesian3(x, y, z);
          polylinePoints.push(cartesianPosition);
          asteroidPosition.addSample(time, cartesianPosition);
        }

        viewer.entities.add({
          name: `${name} - Static Orbit`,
          polyline: {
            positions: polylinePoints,
            width: 4,
            material: color.withAlpha(0.2),
            clampToGround: false,
          },
        });

        return viewer.entities.add({
          name,
          position: asteroidPosition,
          model: {
            uri: "/meteorite.glb",
            scale: radius,
          },
          path: {
            resolution: 120,
            width: 2,
            material: color.withAlpha(0.4),
            trailTime: 60,
          },
        });
      };

      createAsteroid("Rocinante (Low)", Color.WHITE, 50000, 1500000, 7.0, 0.3);
      createAsteroid("Pallas (Mid)", Color.WHITE, 80000, 5000000, 5.5, 0.6);
      createAsteroid("Vesta (High)", Color.WHITE, 100000, 10000000, 4.0, 0.9);

      viewer.flyTo(viewer.entities, { duration: 4.0 });
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

      viewerRef.current = viewer;
    }

    return () => {
      document.head.removeChild(link);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, []);

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
            image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIxMiIgZmlsbD0iI2RjMjYyNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+",
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
  setAsteroidToCrash(selectedAsteroid); // ← rescate
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

  alert("¡Impacto confirmado! Iniciando animación...");
  onConfirm(); // 👈 Aquí notificas al padre
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
          top: 20px;
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

      {isSelectingImpact && (
        <div className="instruction-banner">
          🎯 Haz clic en el globo para seleccionar el punto de impacto
        </div>
      )}

      {!isSelectingImpact && selectedAsteroid && (
        <button className="crash-button" onClick={handleCrashClick}>
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