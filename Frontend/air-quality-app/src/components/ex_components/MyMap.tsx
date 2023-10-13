import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css"

interface MyMapProps {
  city: string;
  mapSpecie: string;
}

interface Station {
  lat: number;
  lon: number;
  aqi: number;
}

const MyMap: React.FC<MyMapProps> = ({ city, mapSpecie }) => {
  const map = useMap();
  const [stationsData, setStationsData] = useState<Station[]>([]);
  const [stationDetails, setStationDetails] = useState<{[key: string]: any}>({});
  const API_KEY = "74875919849a2406ea02e83c534e791210a7a337";
  const boundsChanged = useRef(false);
  const callQueue = useRef<Set<string>>(new Set());

  const cityCoordinates: { [key: string]: [number, number] } = {
    'Rome': [41.9028, 12.4964],
    'Ashdod': [31.8167, 34.65],
    'Portogruaro': [45.775598, 12.8374571],
    'Trieste': [45.6496485, 13.7772781],
  };

  useEffect(() => {
    if (cityCoordinates.hasOwnProperty(city)) {
      map.setView(cityCoordinates[city], map.getZoom());
    }
  }, [city, map]);

  const fetchStationDetails = async (lat: number, lng: number, key: string) => {
    if (callQueue.current.has(key)) return;
    callQueue.current.add(key);

    const response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=${API_KEY}`);
    const data = await response.json();
    if (data.status === "ok") {
      setStationDetails(prevDetails => ({ ...prevDetails, [key]: data.data }));
    }

    callQueue.current.delete(key);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!boundsChanged.current) return;
      boundsChanged.current = false;

      const bounds = map.getBounds();
      const latlng = `${bounds.getSouthWest().lat},${bounds.getSouthWest().lng},${bounds.getNorthEast().lat},${bounds.getNorthEast().lng}`;
      const response = await fetch(`https://api.waqi.info/v2/map/bounds?latlng=${latlng}&token=${API_KEY}`);
      const data = await response.json();

      if (data.status === "ok") {
        setStationsData(data.data);
        data.data.forEach((station: Station) => {
          const key = `${station.lat},${station.lon}`;
          fetchStationDetails(station.lat, station.lon, key);
        });
      }
    };

    map.on("moveend", () => { boundsChanged.current = true; fetchData(); });
    map.on("zoomend", () => { boundsChanged.current = true; fetchData(); });

    fetchData();

    return () => {
      map.off("moveend", fetchData);
      map.off("zoomend", fetchData);
    };
  }, [map, API_KEY, city]);

  const getColorByAqi = (aqi: number) => {
    if (aqi >= 0 && aqi <= 50) return '#009966';
    if (aqi >= 51 && aqi <= 100) return '#ffde33';
    if (aqi >= 101 && aqi <= 150) return '#ff9933';
    if (aqi >= 151 && aqi <= 200) return '#cc0133';
    if (aqi >= 201 && aqi <= 300) return '#660099';
    return '#7e0023';
  };

  const getColorForCO = (coValue: number | string) => {
    // Implementa la logica per il colore in base al valore di CO
    // Ad esempio, puoi usare una scala di colori in base ai livelli di CO
    // Qui è solo un esempio di base, è possibile personalizzarlo.
    const numericValue = parseFloat(coValue as string);
    if (!isNaN(numericValue)) {
      if (numericValue <= 2) return 'green';
      if (numericValue <= 4) return 'yellow';
      if (numericValue <= 6) return 'orange';
      return 'red';
    }
    return 'gray'; // Valore non valido o mancante
  };

  const determineValueAndLabel = (stationDetails: {[key: string]: any}, isAQISelected: boolean, aqi: number) => {
    if (isAQISelected) return { value: aqi, label: 'AQI' };
  
    // Aggiungi un controllo qui per assicurarti che sia stationDetails che stationDetails.iaqi siano definiti
    if (stationDetails && stationDetails.iaqi && mapSpecie in stationDetails.iaqi) {
      return { value: stationDetails.iaqi[mapSpecie]?.v || 'N/A', label: mapSpecie.toUpperCase() };
    }
    return { value: 'N/A', label: 'N/A' };
  };
  

  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {stationsData.map((station: Station, index: number) => {
        const aqi = station.aqi;
        const currentStationDetails = stationDetails[`${station.lat},${station.lon}`] || {};
        const { value, label } = determineValueAndLabel(currentStationDetails, mapSpecie === 'aqi', aqi);
        
        //const color = mapSpecie === 'aqi' ? getColorByAqi(aqi) : getColorForCO(value); // Usa la funzione appropriata per il colore
        // color rules are always the same, so we can use a single function
        const color = getColorByAqi(value);

        const iconSvg = L.divIcon({
          className: 'custom-icon',
          html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 50px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span style="font-size: 12px;">${label}</span>
                    <span style="font-size: 16px;">${value}</span>
                 </div>`,
          iconSize: [50, 50],
        });

        return (
          <Marker
            key={index}
            position={[station.lat, station.lon]}
            icon={iconSvg}
            eventHandlers={{
              click: () => {
                console.log(`Dati della stazione: ${JSON.stringify(station)}`);
              },
            }}
          >
            <Popup>
              {`${label}: ${value}`}
              {Object.keys(currentStationDetails.iaqi || {}).map((key) => (
                <p key={key}>{`${key.toUpperCase()}: ${currentStationDetails.iaqi[key]?.v || 'N/A'}`}</p>
              ))}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default MyMap;
