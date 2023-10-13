// Importa le librerie e i moduli necessari
require('dotenv').config();

const { AQICN_API_KEY, OPENCAGE_API_KEY } = require('./src/config');

const { cleanCityName, isCityInYourList } = require('./src/utils/cityUtils');

// Utilizza le variabili e le funzioni importate
console.log('Chiave AQICN_API_KEY:', AQICN_API_KEY);
console.log('Chiave OPENCAGE_API_KEY:', OPENCAGE_API_KEY);
console.log('Chiave AIRNOW_API_KEY:', process.env.AIRNOW_API_KEY);

// Inizializza Express e altre librerie
const express = require('express');
const cors = require('cors');

const airQualityController = require('./src/controllers/airQualityController');

const historicalAirQualityService = require('./src/services/historicalAirQualityService');

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');


const geocodeController = require('./src/controllers/geocodeController');

const NodeCache = require("node-cache");
const cache = new NodeCache();

const { MongoClient } = require('mongodb');

// Connetti a MongoDB
const uri = "mongodb://root:example@mongodb:27017/AirQuality?authSource=admin";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let airNowCitiesCollection; // Questa conterrà la collezione

async function connectToMongo() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB");
    const db = client.db("AirQuality");
    airNowCitiesCollection = db.collection("AirNowCities");
    console.log("Connected to MongoDB and collection is initialized");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

// Chiamata alla funzione di connessione
connectToMongo()
  .then(() => {
    // Avvia il server Express qui
    app.listen(PORT, () => {
      console.log(`Server successfully running on port ${PORT}`);
    }).on('error', err => {
      console.error(`Error starting server: ${err}`);
    });
  })
  .catch(error => {
    console.error("Error:", error);
  });


console.log('Setting up middleware');

app.use(cors());
app.use(express.json());


const pollutantMapping = {
  'OZONE': 'o3',
  'PM2.5': 'pm25',
  'PM10': 'pm10',
  'CO': 'co',
  'NO2': 'no2',
  'SO2': 'so2'
};

const unitMapping = {
  'PPB': 'ppb',  // Converti in minuscolo
  'UG/M3': 'µg/m³'  // Converti in un formato uniforme
};

// Funzione per convertire le unità di misura da AirNow a OpenAQ
const mapAirNowUnitToOpenAq = (airnowUnit) => {
  return unitMapping[airnowUnit] || airnowUnit.toLowerCase();
};

// Funzione per convertire i nomi degli inquinanti da AirNow a OpenAQ
const mapAirNowPollutantToOpenAq = (airnowPollutant) => {
  return pollutantMapping[airnowPollutant] || airnowPollutant.toLowerCase();
};

app.get('/api/locations', airQualityController.getLocations);
app.post('/api/userLocation', airQualityController.postUserLocation);
app.get('/api/userLocation', airQualityController.getUserLocation);
//app.get('/api/aggregatedAirQuality', airQualityController.getAggregatedAirQuality);
app.get('/api/availableCities', airQualityController.getAvailableCities);
app.get('/api/fetchYearlyAggregatedData', airQualityController.getAllAggregatedAirQuality);
app.get('/api/geocode', async (req, res) => {
  const { latitude, longitude } = req.query;
  const apiKey = process.env.OPENCAGE_API_KEY; // Assicurati che la tua chiave API sia nel file .env

  try {
    const locality = await geocodeController.getLocalityName(latitude, longitude, apiKey);
    res.json({ locality });
  } catch (error) {
    console.error('Errore nella richiesta geocodifica:', error);
    res.status(500).send('Errore nella richiesta geocodifica');
  }
});
// funzione per ripulire input con stateCode 
function parseLocation(location) {
  if (location) {
    const match = location.match(/^(.+)\s\((.+)\)$/);
    if (match) {
      const city = match[1].trim();
      const stateCode = match[2].trim();
      return { city, stateCode };
    }
    return { city: location.trim(), stateCode: null };
  }
}


const axios = require('axios');

const fetchAndTransformOpenAqData = async (city) => {
  const openAqUrl = `https://api.openaq.org/v1/latest?city=${city}&limit=100`;
  const response = await axios.get(openAqUrl);
  const data = response.data.results;

  const transformedData = [];

  for (const location of data) {
    if (Array.isArray(location.measurements)) {
      for (const measurement of location.measurements) {
        const transformedEntry = {
          Country: location.country,
          Location: location.location,
          Latitude: location.coordinates.latitude,
          Longitude: location.coordinates.longitude,
          Pollutant: measurement.parameter,
          Value: measurement.value,
          "Date_last_measured": measurement.lastUpdated,
          "Unit": measurement.unit,
          Source: measurement.sourceName,
          Origin: "OpenAQ.org"
        };
        transformedData.push(transformedEntry);
      }
    } else {
      console.error("location.measurements is not an array:", location.measurements);
    }
  }
  return transformedData;
};

function addOrReplaceMeasurement(array, newEntry) {
  const existingIndex = array.findIndex(entry =>
    entry.Location === newEntry.Location && entry.Pollutant === newEntry.Pollutant
  );

  if (existingIndex > -1) {
    const existingEntry = array[existingIndex];
    if (new Date(newEntry["Date_last_measured"]) > new Date(existingEntry["Date_last_measured"])) {
      array[existingIndex] = newEntry; // Sostituisci con il nuovo dato più recente
    }
  } else {
    array.push(newEntry); // Aggiungi come nuovo elemento
  }
}

app.get('/api/airQualityLocations', async (req, res) => {
  const rawLocation = req.query.city;
  const { city, stateCode } = parseLocation(rawLocation);
  console.log(city, stateCode);
  const apiKey = process.env.OPENCAGE_API_KEY;
  // Utilizza la funzione cleanCityName da cityUtils per rimuovere il country tra parentesi
  const cleanedCityName = cleanCityName(city);

  const groupedData = {};

  try {
    let openAqData = [];

    // Prova prima a ottenere dati da OpenAQ
    try {
      openAqData = await fetchAndTransformOpenAqData(cleanedCityName);
    } catch (openAqError) {
      console.error(`Error fetching data from OpenAQ: ${openAqError}`);
      // Non fare nulla, proveremo con AirNow
    }

    if (openAqData.length > 0) {
      // Usa dati da OpenAQ se disponibili
      for (const entry of openAqData) {
        const location = entry.Location;
        if (!groupedData[location]) {
          groupedData[location] = { measurements: [] };
        }
        groupedData[location].measurements.push(entry);
      }
    } else if (await isCityInYourList(cleanedCityName, stateCode)) {
      // Usa dati da AirNow solo se la città è negli Stati Uniti e non ci sono dati da OpenAQ
      if (!airNowCitiesCollection) {
        console.error('MongoDB collection is not initialized.');
        return res.status(500).send('Internal Server Error');
      }

      // Aggiorna la query per incorporare lo stateCode, se presente
      const query = { city: cleanedCityName };
      if (stateCode) {
        query.state = stateCode;
      }
      const cityData = await airNowCitiesCollection.findOne(query);

      if (!cityData || !cityData.bbox) {
        console.error(`BBOX not found in the database for the city: ${city}`);
        return res.status(500).send('Internal Server Error');
      }

      const stateName = cityData.state;

      const bboxArray = JSON.parse(cityData.bbox);
      const [minLng, minLat, maxLng, maxLat] = bboxArray;
      const parameters = ['OZONE', 'PM25', 'PM10', 'CO', 'NO2', 'SO2'];
      let airQualityData = [];

      const cacheKey = `${city}_${parameters.join('_')}`;
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        console.log('Data found in cache.');
        airQualityData = cachedData;
      } else {
        for (const param of parameters) {
          const airNowUrl = `https://www.airnowapi.org/aq/data/?startDate=2023-09-22T08&endDate=2023-09-22T09&parameters=${param}&BBOX=${minLng},${minLat},${maxLng},${maxLat}&dataType=C&format=application/json&API_KEY=${process.env.AIRNOW_API_KEY}`;
          console.log("Url composto " + airNowUrl);
          const response = await axios.get(airNowUrl);
          const data = response.data;

          const promises = data.map(async entry => {
            const locationName = await geocodeController.getLocalityName(entry.Latitude, entry.Longitude, process.env.OPENCAGE_API_KEY);
            return {
              State: stateName,
              Location: locationName,
              Latitude: entry.Latitude,
              Longitude: entry.Longitude,
              Pollutant: mapAirNowPollutantToOpenAq(entry.Parameter),
              Value: entry.Value,
              "Date_last_measured": entry.UTC,
              "Unit": mapAirNowUnitToOpenAq(entry.Unit),
              Origin: "AirNow.gov"
            };
          });

          const results = await Promise.all(promises);
          airQualityData = airQualityData.concat(results);
        }

        // Aggiorna la cache con i nuovi dati
        cache.set(cacheKey, airQualityData, 3600);
      }

      for (const entry of airQualityData) {
        const location = entry.Location;
        if (!groupedData[location]) {
          groupedData[location] = { measurements: [] };
        }
        addOrReplaceMeasurement(groupedData[location].measurements, entry);
      }
    } else {
      console.log('City is not in your list!');
      return res.status(404).send('City is not in your list');
    }

    const groupedDataArray = Object.keys(groupedData).map(location => {
      return { location, measurements: groupedData[location].measurements };
    });

    res.status(200).json(groupedDataArray);

  } catch (error) {
    console.error(`General error in fetching air quality data: ${error}`);
    res.status(500).send('Error in fetching air quality data');
  }
});


// controllo se una città è su airnow
app.get('/api/isCityInAirNow', async (req, res) => {
  try {
    const rawLocation = req.query.city; // Prende il nome della città dalla query string
    const { city, stateCode } = parseLocation(rawLocation); // Estrae city e stateCode
    const cleanedCityName = cleanCityName(city); // Pulisce il nome della città

    // Utilizza la funzione isCityInYourList da cityUtils per controllare se la città e lo stateCode (se presente) sono nella lista
    const cityInList = await isCityInYourList(cleanedCityName, stateCode);

    // Restituisce il risultato come JSON
    res.status(200).json({ city: cleanedCityName, isInList: cityInList });

  } catch (error) {
    console.error("Errore nel controllare se la città è nella lista:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }

});



app.post('/api/updateCityName', async (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) {
    return res.status(400).send("Old name and new name are required.");
  }

  try {
    const result = await historicalAirQualityService.updateCityName(oldName, newName);
    res.status(200).send(result);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/api/data', airQualityController.getDataByDateRange);

// Servire file statici dalla cartella 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

