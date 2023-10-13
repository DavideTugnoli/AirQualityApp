// Logica per recuperare i dati da OpenAQ e altre operazioni
const axios = require('axios');

// Effettuo una chiamata API a OpenAQ per ottenere la lista delle località
exports.fetchLocations = async () => {
  try {
    const response = await axios.get('https://api.openaq.org/v1/cities');
    return response.data;
  } catch (error) {
    console.error(error);
  }
};
