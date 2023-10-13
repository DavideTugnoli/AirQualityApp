import React, { useEffect, useState, useRef } from 'react';
import { fetchAirQuality, fetchOpenAQLocations, Result, fetchLocalAirQuality } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import { MapContainer } from 'react-leaflet';
import CityAutocomplete from './components/CityAutocomplete';
import './App.css';
import ApiMap from './components/ApiMap';
import OpenAQTable from './components/OpenAQTable';
import MeteorologicalDataChart from './components/MeteorologicalDataChart';
import PollutantDataChart from './components/PollutantDataChart';
import DataExporter from './components/DataExporter';
import { useParams, useNavigate } from 'react-router-dom';
import { LocationData } from './components/locationData';
import aqiTableImage from './images/aqi_table.png';

const App: React.FC = () => {
  const [specie, setSpecie] = useState('humidity');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('2018-01-01');
  const [endDate, setEndDate] = useState('2023-08-31');
  const [useMyMap, setUseMyMap] = useState(true);
  //const [mapSpecie, setMapSpecie] = useState('aqi');
  const [mapSpecie, setMapSpecie] = useState('usepa-aqi');

  const isFirstLoad = useRef(true);  // Nuova variabile ref

  const unitMap: { [key: string]: string } = {
    temperature: '°C',
    humidity: '%',
    pressure: 'mbar',
    'wind-speed': 'm/s',
    'wind-gust': 'm/s',
    dew: '°C',
    precipitation: 'mm',
    // ...
  };
  

  const [showPopup, setShowPopup] = useState(false);

  const handleMouseEnter = () => {
    setShowPopup(true);
  };

  const handleMouseLeave = () => {
    setShowPopup(false);
  };


  // tengo traccia dei 2 menu a tendina
  const [meteorologicalSpecie, setMeteorologicalSpecie] = useState('temperature');
  const [pollutantSpecie, setPollutantSpecie] = useState('pm25');
  const [meteorologicalData, setMeteorologicalData] = useState([]);
  const [pollutantData, setPollutantData] = useState([]);

  // la modifica della cittò è iniziata dall'url
  const [isUrlChange, setIsUrlChange] = useState(false);

  // variabile di stato utile all'esportazione dati openAQ
  const [openAQData, setOpenAQData] = useState<Result[]>([]);

  useEffect(() => {
    const fetchData = async (specie: string, setDataFunction: Function) => {
      if (!city) {
        // Se city è vuoto, esci dall'effetto
        return;
      }

      if (specie && city) {
        let params;

        if (city.includes('(')) {
          // Dividi la stringa city in base a ' ('
          const cityParts = city.split(' (');

          // Estrai la parte relativa alla città (il primo elemento)
          const cityName = cityParts[0];

          // Estrai la parte relativa al paese (rimuovendo la parentesi chiusa ')' dalla seconda parte)
          const country = cityParts[1].replace(')', '');

          // Definisci i parametri con city e country separati
          params = {
            city: cityName,
            country,
            startDate,
            endDate,
            specie,
            minCount: 100, // per poter avere dei grafici sensati
          };
        } else {
          // Altrimenti city contiene solo il nome della città
          params = {
            city,
            startDate,
            endDate,
            specie,
            minCount: 100,
          };
        }

        const apiData = await fetchAirQuality(params);
        const formattedData = apiData.map((entry: any) => ({
          city: city.includes('(') ? city.split(' (')[0] : city, // Usa il nome della città senza il paese se presente
          country: city.includes('(') ? city.split(' (')[1].replace(')', '') : '', // Usa il paese solo se presente
          specie,
          year: entry._id.year,
         // avgMedian: parseFloat(entry.avgMedian.toFixed(2)),
          avgMin: parseFloat(entry.avgMin.toFixed(2)),
          avgMax: parseFloat(entry.avgMax.toFixed(2)),
          unit: entry.unit,
          count: entry.count,
        }));
        setDataFunction(formattedData);  // qui impostiamo i dati utilizzando la funzione passata come parametro
      }
    };

    fetchData(meteorologicalSpecie, setMeteorologicalData);  // chiamata per i dati meteorologici
    fetchData(pollutantSpecie, setPollutantData);  // chiamata per i dati degli inquinanti
  }, [meteorologicalSpecie, pollutantSpecie, city, startDate, endDate]);



  // gestire le locations openaq
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locations, setLocations] = useState<Result[]>([]);
  const [locationsData, setLocationsData] = useState<LocationData[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!city) {
        // Se city è vuoto, esci dall'effetto
        return;
      }
      try {
        setLocationsData([]); // Svuota lo stato se la risposta è vuota
        setOpenAQData([]); // Anche questo stato viene svuotato per sicurezza
        setSelectedLocation(null); // Annulla la selezione della location
        const response = await fetchLocalAirQuality(city); // Utilizza la nuova funzione
        setLocationsData(response); // Aggiorna lo stato con i dati delle locations
        setOpenAQData(response); // Utile per esportazione dati openAQ
        setSelectedLocation(response[0]?.location || null);
      } catch (error) {
       // console.error('Failed to fetch locations', error);
      }
    };

    fetchLocations();
  }, [city, isUrlChange]);


  // gestione url in base a inputbox (4 stella)
  const navigate = useNavigate();
  const { city: urlCity, country: urlCountry } = useParams();

  useEffect(() => {
    if (urlCity && !isUrlChange) {
      setCity(urlCity + (urlCountry ? ` (${urlCountry})` : ''));
    }
    setIsUrlChange(false);
  }, [urlCity, urlCountry]);

  useEffect(() => {
    if (city.includes('(')) {
      const [cityName, country] = city.split(' (');
      const finalCountry = country.replace(')', '');
      setIsUrlChange(true);
      navigate(`/${cityName}/${finalCountry}`);
    } else {
      setIsUrlChange(true);
      navigate(`/${city}`);
    }
  }, [city]);


  return (
    <div className="App">
      <header className="App-header">
        <h1>Air Quality at {city}</h1>
      </header>
      <main className="main">

        <label>
          Select the weather species for the graph:
          <select value={meteorologicalSpecie} onChange={e => setMeteorologicalSpecie(e.target.value)}>
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="pressure">Atmospheric pressure</option>
            <option value="wind-speed">Wind speed</option>
            <option value="wind-gust">Wind gust</option> {/* Raffica del vento */}
            <option value="dew">Dew Point</option> {/* Punto di rugiada*/}
            <option value="precipitation">Precipitation</option>
            {/* Aggiungi qui altre specie meteorologiche se necessario */}
          </select>
        </label>
        <label>
          Select the pollutant for the graph:
          <select value={pollutantSpecie} onChange={e => setPollutantSpecie(e.target.value)}>
            <option value="pm25">PM2.5 particles</option>
            <option value="pm10">PM10 particles</option>
            <option value="so2">Sulfur dioxide</option> {/* diossido di zolfo */}
            <option value="o3">Ozone</option> {/* ozono */}
            <option value="no2">Nitrogen dioxide</option> {/* diossido di azoto */}
            <option value="co">Carbon monoxide</option> {/* monossido di carbonio */}
            {/* Aggiungi qui altre specie di inquinanti se necessario */}
          </select>
        </label>

        <label>
          City:
          <CityAutocomplete value={city} onChange={setCity} />
        </label>
        <label>
          Start date:
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </label>
        <label>
          End date:
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </label>

        <div className="chart-container">
          <ErrorBoundary>
            <div className="single-chart-container">
            <div className="chart-title">{`Meteorological Data: ${meteorologicalSpecie.replace('-', ' ')} (AVG) [${unitMap[meteorologicalSpecie]}]`}</div>
              {meteorologicalSpecie !== 'aqi' && <MeteorologicalDataChart data={meteorologicalData} />}
            </div>

          </ErrorBoundary>
          <ErrorBoundary>
            <div className="single-chart-container">
              <div className="chart-title">{`AQI Pollutants (${pollutantSpecie.replace('-', ' ')}) (AVG)`}</div>
              {pollutantSpecie !== 'aqi' && <PollutantDataChart data={pollutantData} />}
            </div>

          </ErrorBoundary>
        </div>

        <label>
          <span
            className="info-icon"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
          >
            i
            {showPopup && (
              <div className="info-popup">
                <img src={aqiTableImage} alt="Informazioni" style={{ width: "800px", height: "auto" }} />
              </div>
            )}
          </span>
          Select the species for the map:

          <select value={mapSpecie} onChange={e => setMapSpecie(e.target.value)}>
            {/*<option value="usepa-aqi">AQI (EPA USA)</option>*/} {/*è uguale a PM2.5*/}
            <option value="usepa-pm25">PM2.5 (EPA USA)</option>
            <option value="usepa-pm10">PM10 (EPA USA)</option>
            <option value="usepa-o3">Ozone (EPA USA)</option>
            <option value="usepa-no2">Nitrogen dioxide (EPA USA)</option>
            <option value="usepa-so2">Sulfur dioxide (EPA USA)</option>
            <option value="usepa-co">Carbon monoxide (EPA USA)</option>
            {/*<option value="asean-pm10">PM10 (Asean)</option>*/} {/*scala colori Associazione delle Nazioni del Sud-est Asiatico*/}
          </select>
        </label>

        <MapContainer center={[41.9028, 12.4964]} zoom={13} className="map-container">
          <ApiMap city={city} mapSpecie={mapSpecie} />
        </MapContainer>

        {locationsData.length > 0 && (
          <label>
            Near Stations:
            <select value={selectedLocation || ''} onChange={e => setSelectedLocation(e.target.value)}>
              {locationsData.map((location, index) => (
                <option key={index} value={location.location}>
                  {location.location}
                </option>
              ))}
            </select>
          </label>
        )}

        <OpenAQTable
          location={selectedLocation || ''}
          locationsData={locationsData} // Passa i dati delle locations qui
        />



        <DataExporter
          data={{ meteorologicalData, pollutantData, openAQData }}
          visualization={<div><h1 className="export-title">Export data</h1></div>}
          city={city}
          startDate={startDate}
          endDate={endDate}
        />

      </main>
    </div>
  );
};

export default App;
