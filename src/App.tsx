import { useState } from 'react';
import CesiumGlobe from './assets/Components/CesiumGlobe';
import MapboxExample from './assets/Components/map';

function App() {
  const [visible, setVisible] = useState({ cesium: true, mapbox: false });

  /* Esta función se la vamos a pasar al hijo */
  const switchToMapbox = () => {
    setVisible({ cesium: false, mapbox: true });
  };

  return (
    <>
      {visible.cesium && (
        <CesiumGlobe onConfirm={switchToMapbox} /> // <-- función como prop
      )}
      {visible.mapbox && <MapboxExample />}
    </>
  );
}

export default App;