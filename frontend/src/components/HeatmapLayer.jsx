import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (data && data.length > 0) {
      const points = data.map(item => [item.lat, item.lon, item.intensity]);
      const heatLayer = L.heatLayer(points, { radius: 25 }).addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };
    }
  }, [data, map]);

  return null;
};

export default HeatmapLayer;
