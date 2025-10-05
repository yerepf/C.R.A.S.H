import {
  Viewer,
  Cartesian3,
  Color,
  JulianDate,
  SampledPositionProperty,
  ClockRange,
  Math as CesiumMath,
  SceneMode,
} from "cesium";
import React, { useEffect, useRef, useState } from "react";

const CesiumGlobe: React.FC = () => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [selectedAsteroid, setSelectedAsteroid] = useState<any>(null);

  useEffect(() => {
    let viewer: Viewer;

    const cesiumWidgetsCssUrl =
      "https://cesium.com/downloads/cesiumjs/releases/1.117/Build/Cesium/Widgets/widgets.css";
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cesiumWidgetsCssUrl;
    document.head.appendChild(link);

    if (cesiumContainer.current) {
      viewer = new Viewer(cesiumContainer.current, {
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

      // Detectar selección
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
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

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
  transform: translateX(-50%) scale(1.05); /* ✅ mantener translateX */
}

      `}</style>

      <div ref={cesiumContainer} className="cesium-container" />

      {selectedAsteroid && (
        <button
          className="crash-button"
          onClick={() => window.alert(`💥 Impacto de ${selectedAsteroid.name} simulado!`)}
        >
          🚀 CRASH
        </button>
      )}
    </>
  );
};

export default CesiumGlobe;
