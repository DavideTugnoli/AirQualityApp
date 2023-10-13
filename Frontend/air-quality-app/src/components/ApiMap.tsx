import React, { useEffect, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import "../styles/ApiMap.css"

interface ApiMapProps {
  city: string;
  mapSpecie: string;
}

const ApiMap: React.FC<ApiMapProps> = ({ city, mapSpecie }) => {
  const map = useMap();
  const [key, setKey] = useState<number>(1);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // console.log("Città selezionata:", city);
    
    // Pulisci il timer esistente prima di crearne uno nuovo
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Imposta un nuovo timer
    setDebounceTimer(setTimeout(() => {
      const fetchCoordinates = async () => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1`);
          const data = await response.json();
          if (data[0]) {
            const { lat, lon } = data[0];
          //  console.log('Coordinate recuperate:', lat, lon); // Aggiunto log per debug
            map.setView([parseFloat(lat), parseFloat(lon)], map.getZoom());
          }
        } catch (error) {
          console.error('Errore nel recupero delle coordinate:', error);
        }
      };

      fetchCoordinates();
    }, 1000)); // Ritardo di 1 secondo
  }, [city, map]);

  useEffect(() => {
    setKey(prevKey => prevKey + 1); // Aggiorna la chiave quando cambia la specie
  }, [mapSpecie]);

  const API_KEY = process.env.REACT_APP_AQICN_API_KEY;

  const tileUrl = `https://tiles.aqicn.org/tiles/${mapSpecie}/{z}/{x}/{y}.png?token=${API_KEY}`;
  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <TileLayer key={key} url={tileUrl} />
    </>
  );
};

export default ApiMap;
