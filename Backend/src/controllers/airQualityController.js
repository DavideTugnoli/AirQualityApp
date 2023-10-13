const { cleanCityName } = require('../utils/cityUtils');

// Gestirà le richieste e le risposte delle API.
const airQualityService = require('../services/airQualityService');

// Logica per ottenere una lista di località
exports.getLocations = async (req, res) => {
  try {
    const data = await airQualityService.fetchLocations();
    res.json(data);
  } catch (error) {
    res.status(500).send('Errore nel recupero dei dati');
  }
};

// Logica per salvare la località dell'utente
exports.postUserLocation = async (req, res) => {
  const userLocation = req.body.location;
  // Salvare la località dell'utente nel database o in un altro mezzo di archiviazione
  // Per ora, supponiamo che sia stato salvato correttamente
  res.status(201).send('Località salvata con successo');
};

// Logica per ottenere la località dell'utente
exports.getUserLocation = async (req, res) => {
  // Recuperare la località dell'utente dal database o da un altro mezzo di archiviazione
  // Per ora, supponiamo di recuperare "Roma"
  res.json({ location: 'Roma' });
};

const historicalAirQualityService = require('../services/historicalAirQualityService');

/*
// funzione da cui ottengo i dati per i grafici
exports.getAggregatedAirQuality = async (req, res) => {
  const { city, country, startDate, endDate, specie, minCount } = req.query;
  console.log("Request query:", req.query);
  const data = await historicalAirQualityService.fetchAggregatedData(city, country, startDate, endDate, specie, minCount);

  if (data && data.country) {
    console.log(data.country);
  } else {
    console.log("Country not found in data.");
  }

  res.json(data);
};*/

exports.getAvailableCities = async (req, res) => {
  try {
    const cities = await historicalAirQualityService.fetchAvailableCities();
    res.json(cities);
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore nel recupero dei dati');
  }
};

// route for fetch all datas for easy exportations
exports.getAllAggregatedAirQuality = async (req, res) => {
  const { city, country, startDate, endDate, specie, minCount } = req.query;
  // Utilizza la funzione cleanCityName da cityUtils per rimuovere il country tra parentesi
  const cleanedCityName = cleanCityName(city);
  console.log("Request query:", req.query);
  const data = await historicalAirQualityService.fetchAllAggregatedData(cleanedCityName, country, startDate, endDate, specie, minCount);

  res.json(data);
};


// Controller per ottenere i dati d'aria per una città entro un range di date
exports.getDataByDateRange = async (req, res) => {
  const { city, country, startDate, endDate, specie } = req.query;
  // Utilizza la funzione cleanCityName da cityUtils per rimuovere il country tra parentesi
  const cleanedCityName = cleanCityName(city);
  console.log("Request query:", req.query);

  try {
    const data = await historicalAirQualityService.fetchDataByDateRange(cleanedCityName, country, startDate, endDate, specie);

    // Verifica se i dati sono stati ottenuti con successo
    if (data && data.length > 0) {
      res.json(data);
    } else {
      res.status(404).send('Nessun dato trovato');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Errore nel recupero dei dati');
  }
};