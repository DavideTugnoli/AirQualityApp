// reverse geocoding per ottenere località da latitudine e longitudine
const axios = require('axios');

async function getLocalityName(latitude, longitude, apiKey) {
    const url = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${latitude}+${longitude}&language=it&pretty=1`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.results.length > 0) {
            const firstResult = data.results[0]; // Prendi il primo risultato
            const components = firstResult.components;
            
            // Scegli il campo che rappresenta meglio la località (county, hamlet, road)
            const locality = components.county || components.hamlet || components.road || 'Location not found';

            return locality;
        } else {
            return 'Location not found';
        }
    } catch (error) {
        console.error('Error in API request:', error);
        throw error;
    }
}

module.exports = {
    getLocalityName,
};