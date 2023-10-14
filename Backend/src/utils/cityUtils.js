const { MongoClient } = require('mongodb');

// URL e nome del database sono ora specificati come costanti
const url = "mongodb://root:example@mongodb:27017/mydatabase?authSource=admin";
const dbName = 'AirQuality';

// converte parole in una frase con la lettera maiuscola iniziale
function toTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Rimuove la country tra parentesi dalla stringa della città, se presente
function cleanCityName(city) {
  const cleaned = city.replace(/\s*\(.*\)\s*/, '').trim();
  return toTitleCase(cleaned);
}

async function isCityInYourList(city, stateCode = null) {
  const cleanedCity = cleanCityName(city);
  const client = new MongoClient(url);

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection('AirNowCities'); 

    let query = { city: cleanedCity };

    // Aggiungi stateCode alla query se è fornito
    if (stateCode) {
      query.stateCode = stateCode;
    }

    const cityRecord = await collection.findOne(query);
    if (cityRecord !== null) {
      return { exists: true, stateCode: cityRecord.stateCode };
    }
    return { exists: false, stateCode: null };

  } catch (err) {
    console.error(err);
    return { exists: false, stateCode: null };
  } finally {
    await client.close();
  }
}


module.exports = {
  cleanCityName,
  isCityInYourList
};
