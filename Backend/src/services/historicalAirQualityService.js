const { MongoClient } = require('mongodb');

const url = "mongodb://root:example@mongodb:27017/mydatabase?authSource=admin";
const dbName = 'AirQuality';

// get all the available cities
exports.fetchAvailableCities = async () => {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('HistoricalData');

    const cities = await collection.aggregate([
      {
        $group: {
          _id: { city: "$city", country: "$country" },
        },
      },
      {
        $project: {
          _id: 0,
          city: "$_id.city",
          country: "$_id.country",
        },
      },
    ]).toArray();

    //console.log("Debug - Available Cities:", cities);

    return cities;
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await client.close();
  }
};

exports.updateCityName = async (oldName, newName) => {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('HistoricalData');

    // Aggiorna tutti i documenti che hanno il vecchio nome della città
    const result = await collection.updateMany(
      { city: oldName }, 
      { $set: { city: newName } }
    );

    console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`);
    return result;
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await client.close();
  }
};

// fetchAggregatedData without specie for easy exportations
exports.fetchAllAggregatedData = async (city, country, startDate, endDate, specie, minCount) => {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('HistoricalData');

    const initialMatch = {
      city: city,
      date: { $gte: startDate, $lte: endDate }
    };

    if (country) {
      initialMatch.country = country;
    }

    const pipeline = [
      {
        $match: initialMatch
      }
    ];

    if (specie) {
      pipeline.push({
        $match: { specie: specie }
      });
    }

    pipeline.push(
      {
        $group: {
          _id: {
            type: { $cond: [ { $in: [ "$specie", ["temperature", "humidity", "pressure", "wind-speed", "wind-gust", "dew", "precipitation"] ] }, "Meteorological", "Pollutant" ] },
            city: "$city",
            country: "$country",
            specie: "$specie",
            year: { $substr: ["$date", 0, 4] },
          },
          avgMin: { $avg: "$min" },
          avgMax: { $avg: "$max" },
          count: { $sum: 1 },
          unit: {
            $first: { 
              $switch: {
                branches: [
                  { case: { $eq: ["$specie", "temperature"] }, then: "Celsius" },
                  { case: { $eq: ["$specie", "humidity"] }, then: "%" },
                  { case: { $eq: ["$specie", "pressure"] }, then: "mbar" },
                  { case: { $eq: ["$specie", "wind-speed"] }, then: "m/s" },
                  { case: { $eq: ["$specie", "wind-gust"] }, then: "m/s" },
                  { case: { $eq: ["$specie", "dew"] }, then: "Celsius" },
                  { case: { $eq: ["$specie", "precipitation"] }, then: "mm" },
                ],
                default: "AQI" // Per i dati sui pollutant
              }
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1 }
      }
    );

    if (minCount) {
      pipeline.push({
        $match: { count: { $gte: parseInt(minCount) } }
      });
    }

    const data = await collection.aggregate(pipeline).toArray();
    console.log("Debug - Aggregated Data:", data);

    return data;

  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await client.close();
  }
};

exports.fetchDataByDateRange = async (city, country, startDate, endDate, specie, minCount) => {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('HistoricalData');

    let query = {
      city: city,
      date: { $gte: startDate, $lte: endDate },
    };

    if (specie) {
      query.specie = specie;
    }

    if (country) {
      query.country = country;
    }

    let data = await collection.find(query).project({_id: 0}).toArray();

    // Filtriamo i dati in base al parametro minCount, se fornito
    if (minCount) {
      data = data.filter(doc => doc.count >= minCount);
    }

    const enhancedData = data.map(doc => {
      const type = ["temperature", "humidity", "pressure", "wind-speed", "wind-gust", "dew", "precipitation"].includes(doc.specie) ? "Meteorological" : "Pollutant";
      
      let unit;
      switch (doc.specie) {
        case 'temperature':
          unit = 'Celsius';
          break;
        case 'humidity':
          unit = '%';
          break;
        case 'pressure':
          unit = 'mbar';
          break;
        case 'wind-speed':
          unit = 'm/s';
          break;
        case 'wind-gust':
          unit = 'm/s';
          break;
        case 'dew':
          unit = 'Celsius';
          break;
        case 'precipitation':
          unit = 'mm';
          break;
        default:
          unit = 'AQI';
      }

      return { ...doc, type, unit, origin: "aqicn.org" };
    });

    console.log("Debug - Enhanced Data:", enhancedData);

    return enhancedData;
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await client.close();
  }
};