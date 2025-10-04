import { Viewer, Cartesian3, Color } from 'cesium';
import React, { useEffect, useRef } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './CesiumGlobe.css';

const CesiumGlobe: React.FC = () => {
  const cesiumContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: Viewer;

    if (cesiumContainer.current) {
      viewer = new Viewer(cesiumContainer.current, {
        // ...tus opciones de configuración...
      });

      // --- INICIO DE CÓDIGO NUEVO ---

      // Coordenadas de Santo Domingo (longitud, latitud)
      // Ojo: En Cesium es siempre [longitud, latitud]
      const santoDomingoLongitude = -69.89;
      const santoDomingoLatitude = 18.48;

      // Añadimos una nueva "entidad" al visor.
      // Una entidad es cualquier objeto que quieras dibujar en el globo.
      const santoDomingoPoint = viewer.entities.add({
        name: 'Santo Domingo',
        description: 'Capital de la República Dominicana',

        // Posición del marcador.
        // Lo convertimos de grados (lat/lon) a coordenadas cartesianas 3D que Cesium usa.
        position: Cartesian3.fromDegrees(santoDomingoLongitude, santoDomingoLatitude),

        // Cómo se verá el punto.
        point: {
          pixelSize: 10,
          color: Color.RED,
        },
      });

      // --- FIN DE CÓDIGO NUEVO ---
    }

    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return <div ref={cesiumContainer} className="cesium-container" />;
};

export default CesiumGlobe;