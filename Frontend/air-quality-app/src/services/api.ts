import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const fetchAirQuality = async (params: any) => {
  const { data } = await api.get('/fetchYearlyAggregatedData', { params });
  return data;
};

// get data from openaq api
export interface Measurement {
  parameter: string;
  value: number;
  lastUpdated: string;
  unit: string;
  sourceName: string;
  averagingPeriod: {
    value: number;
    unit: string;
  };
}

export interface Result {
  location: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  measurements: Measurement[];
}

export const fetchOpenAQLocations = async (city: string, limit: number = 100, country?: string): Promise<Result[]> => {
  try {
    let apiUrl = `https://api.openaq.org/v1/latest?city=${city}&limit=${limit}`;
   // console.log("Country selected", country);
    if (country) {
      apiUrl += `&country=${country}`;
    }

    const response = await axios.get(apiUrl);
    return response.data.results;
  } catch (error) {
    throw error;
  }
};

// fetch local data insted of openaq http://localhost:3000/api/air-quality?location=Roma
export const fetchLocalAirQuality = async (location: string) => {
  const { data } = await api.get(`/airQualityLocations?city=${location}`);
  return data;
};

// get all datas for easy exportations
export const fetchAllAggregatedAirQuality = async (params: any) => {
  const { data } = await api.get('/fetchYearlyAggregatedData', { params });
  return data;
};

// get all historical data
export const fetchAllHistoricalDataSelectedLocation = async (params: any) => {
  const { data } = await api.get('/data', { params });
  return data;
};
