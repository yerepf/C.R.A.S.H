import React, { useState } from 'react';
import CesiumGlobe from './assets/Components/CesiumGlobe';
import MapboxWithMeteor from './assets/Components/MapboxWithMeteor';

// Interfaz para los datos del impacto (debe coincidir con CesiumGlobe)
interface ImpactData {
  lat: number;
  lon: number;
  position: any;
  asteroid: any;
}

const App: React.FC = () => {
  const [showCesium, setShowCesium] = useState(true);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);

  const handleImpactConfirm = (data: ImpactData) => {
    console.log('🎯 Impacto confirmado desde App:', data);
    setImpactData(data);
    setShowCesium(false);
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {showCesium ? (
        <CesiumGlobe onConfirm={handleImpactConfirm} />
      ) : (
        impactData && <MapboxWithMeteor impactData={impactData} />
      )}
    </div>
  );
};

export default App;