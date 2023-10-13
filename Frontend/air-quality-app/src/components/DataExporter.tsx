import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { fetchOpenAQLocations, fetchAllAggregatedAirQuality, Result, fetchLocalAirQuality, fetchAllHistoricalDataSelectedLocation } from '../services/api';
import * as builder from 'xmlbuilder';
import { LocationData, Measurement } from './locationData';


interface DataExporterProps {
    data: any;
    visualization: JSX.Element;
    city: string;
    startDate: string;
    endDate: string;
}


const DataExporter: React.FC<DataExporterProps> = ({ data, visualization, city, startDate, endDate }) => {
    const [exportType, setExportType] = useState("");
    const [exportFormat, setExportFormat] = useState("csv");
    const [aqicnLink, setAqicnLink] = useState("");
    const [airNowLink, setAirNowLink] = useState("");

    useEffect(() => {
        if (!city) {
            // Se city è vuoto, esci dall'effetto
            return;
        }
        // Funzione per effettuare una richiesta API e ottenere l'URL AQICN
        const fetchAQICNUrl = async (cityName: string) => {
            // Estrai solo il nome della città se contiene il paese tra parentesi
            const pureCityName = cityName.includes('(') ? cityName.split(' (')[0] : cityName;

            try {
                const response = await fetch(`https://api.waqi.info/feed/${pureCityName}/?token=74875919849a2406ea02e83c534e791210a7a337`);
                const data = await response.json();
                if (data.status === "ok") {
                    setAqicnLink(data.data.city.url);
                }
            } catch (error) {
                console.error('Errore nel recuperare l’URL AQICN:', error);
            }
        };


        // Funzione per effettuare una richiesta API per verificare se la città è nel tuo database
        const checkCityInDb = async (cityName: string) => {
            try {
                const response = await fetch(`http://localhost:3000/api/isCityInAirNow?city=${cityName}`);
                const data = await response.json();
                if (data.isInList) {
                    // setAirNowLink(`https://www.airnow.gov/state/?name=${cityName}`);
                    setAirNowLink(`https://www.airnow.gov/?reportingArea`);
                }
            } catch (error) {
                console.error('Errore nel verificare la città nel DB:', error);
            }
        };

        fetchAQICNUrl(city);
        checkCityInDb(city);
    }, [city]); // dipendenza per il trigger dell'effetto

    const exportData = (exportType: string) => {
        if (exportType === 'selected-avg-year-historical') {
            exportCurrentSelectedYearAvgHistoricalData(data);
        } else if (exportType === 'all-avg-year-historical') {
            exportAllAvgYearHistoricalData();
        } else if (exportType === 'all-historical') {
            exportAllHistoricalDataOfSelectedLocation();
        } else if (exportType === 'current') {
            exportCurrentData();
        }
    };

    const exportAllHistoricalDataOfSelectedLocation = async () => {
        try {
            const cityParts = city.includes('(') ? city.split(' (') : [city, ''];
            const cityName = cityParts[0];
            const country = cityParts[1]?.replace(')', '') || '';

            const fetchedData = await fetchAllHistoricalDataSelectedLocation({ city: cityName, country, startDate, endDate });

            if (fetchedData) {
                // Codifica i dati in CSV, JSON o XML a seconda di exportFormat
                if (exportFormat === "csv") {
                    const csv = Papa.unparse(fetchedData);
                    const blob = new Blob([csv], { type: 'text/csv' });
                    saveAs(blob, 'all_historical_data.csv');
                } else if (exportFormat === "json") {
                    const json = JSON.stringify(fetchedData, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    saveAs(blob, 'all_historical_data.json');
                } else if (exportFormat === "xml") {
                    const xml = builder.create('root');
                    fetchedData.forEach((item: any) => {
                        const entry = xml.ele('entry');
                        Object.keys(item).forEach((key) => {
                            entry.ele(key, {}, item[key]);
                        });
                    });
                    const xmlString = xml.end({ pretty: true });
                    const blob = new Blob([xmlString], { type: 'application/xml' });
                    saveAs(blob, 'all_historical_data.xml');
                }
            } else {
                console.error('Nessun dato recuperato per l\'esportazione.');
            }


        } catch (error) {
            console.error('Si è verificato un errore durante il recupero dei dati:', error);
        }
    }

    const exportCurrentSelectedYearAvgHistoricalData = (data: any) => {
        const { meteorologicalData, pollutantData } = data;

        // Creiamo una lista di oggetti con i dati meteorologici, includendo il nome del dato e il tipo (metereologico)
        const meteorologicalDataWithInfo = meteorologicalData.map((item: any) => {
            console.log(item);  // Log dell'oggetto item per diagnosticare il problema
            return {
                type: 'Meteorological',
                ...item,
            };
        });

        // Creiamo una lista di oggetti con i dati degli inquinanti, includendo il nome del dato e il tipo (inquinante)
        const pollutantDataWithInfo = pollutantData.map((item: any) => ({
            type: 'Pollutant',
            ...item,
        }));

        // Uniamo i due set di dati in un unico array
        const mergedData = [...meteorologicalDataWithInfo, ...pollutantDataWithInfo];

        // const aqicnLink = generateAQICNLink(city);

        if (exportFormat === "csv") {
            const csv = Papa.unparse(mergedData);
            //const additionalLinks = `AQICN Link: ${aqicnLink}${airNowLink ? `\nAirNow Link: ${airNowLink}` : ''}\n`;
            const additionalLinks = `AQICN Link: ${aqicnLink}\n`;
            const csvWithLinks = `Additional Links: ${additionalLinks}\n${csv}`;
            const blob = new Blob([csvWithLinks], { type: 'text/csv' });
            saveAs(blob, 'year_aggregated_avg_selected_historical_data.csv');
        } else if (exportFormat === "json") {
            const json = JSON.stringify({ aqicnLink, data: mergedData }, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            saveAs(blob, 'year_aggregated_avg_selected_historical_data.json');
        } else if (exportFormat === "xml") {
            const xml = builder.create('root');
            xml.ele('AQICNLink', {}, aqicnLink);
            mergedData.forEach((item: any) => {
                const entry = xml.ele('entry');
                Object.keys(item).forEach((key) => {
                    entry.ele(key, {}, item[key]);
                });
            });
            const xmlString = xml.end({ pretty: true });
            const blob = new Blob([xmlString], { type: 'application/xml' });
            saveAs(blob, 'year_aggregated_avg_selected_historical_data.xml');
        }
    };

    const exportAllAvgYearHistoricalData = async () => {
        try {
            const cityParts = city.includes('(') ? city.split(' (') : [city, ''];
            const cityName = cityParts[0];
            const country = cityParts[1]?.replace(')', '') || '';

            const data = await fetchAllAggregatedAirQuality({ city: cityName, country, startDate, endDate });

            // Creiamo due liste separate per i dati meteorologici e gli inquinanti
            const meteorologicalData = data.filter((item: any) => item._id.type === 'Meteorological').map((item: any) => ({
                type: 'Meteorological',
                city: item._id.city,
                country: item._id.country,
                parameter: item._id.specie,
                year: item._id.year,
                // avgMedian: item.avgMedian.toFixed(2),
                avgMin: item.avgMin.toFixed(2),
                avgMax: item.avgMax.toFixed(2),
                unit: item.unit,
            }));

            const pollutantData = data.filter((item: any) => item._id.type === 'Pollutant').map((item: any) => ({
                type: 'Pollutant',
                city: item._id.city,
                country: item._id.country,
                parameter: item._id.specie,
                year: item._id.year,
                // avgMedian: item.avgMedian.toFixed(2),
                avgMin: item.avgMin.toFixed(2),
                avgMax: item.avgMax.toFixed(2),
                unit: item.unit,
            }));

            // Uniamo i due set di dati in un unico array
            const mergedData = [...meteorologicalData, ...pollutantData];

            if (exportFormat === "csv") {
                // Convertiamo l'array di oggetti in una stringa CSV
                const csv = Papa.unparse(mergedData);

                const additionalLinks = `AQICN Link: ${aqicnLink}${airNowLink ? `\nAirNow Link: ${airNowLink}` : ''}\n`;
                const csvWithLinks = `Additional Links: ${additionalLinks}\n${csv}`;
                // Creiamo un blob con la stringa CSV e avviamo il download del file CSV
                const blob = new Blob([csvWithLinks], { type: 'text/csv' });
                saveAs(blob, 'all_year_aggregated_avg_historical_data.csv');
            } else if (exportFormat === "json") {
                const json = JSON.stringify({ aqicnLink, data: mergedData }, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                saveAs(blob, 'all_year_aggregated_avg_historical_data.json');
            } else if (exportFormat === "xml") {
                const xml = builder.create('root');
                xml.ele('AQICNLink', {}, aqicnLink);
                mergedData.forEach((item: any) => {
                    const entry = xml.ele('entry');
                    Object.keys(item).forEach((key) => {
                        entry.ele(key, {}, item[key]);
                    });
                });
                const xmlString = xml.end({ pretty: true });
                const blob = new Blob([xmlString], { type: 'application/xml' });
                saveAs(blob, 'all_year_aggregated_avg_historical_data.xml');
            }
        } catch (error) {
            console.error('Si è verificato un errore durante il recupero dei dati:', error);
        }
    };

    const exportCurrentData = async () => {
        try {
            if (!city) {
                console.error('Città non specificata.');
                return;
            }

            // Funzione per effettuare una richiesta API e ottenere l'URL AQICN
            const fetchAQICNUrl = async (cityName: string) => {
                // Estrai solo il nome della città se contiene il paese tra parentesi
                const pureCityName = cityName.includes('(') ? cityName.split(' (')[0] : cityName;

                try {
                    const response = await fetch(`https://api.waqi.info/feed/${pureCityName}/?token=74875919849a2406ea02e83c534e791210a7a337`);
                    const data = await response.json();
                    if (data.status === "ok") {
                        return data.data.city.url;
                    }
                } catch (error) {
                    console.error('Errore nel recuperare l’URL AQICN:', error);
                }

                return ''; // Restituisce una stringa vuota se non riesce a ottenere l'URL
            };

            // Funzione per effettuare una richiesta API per verificare se la città è nel tuo database
            const checkCityInDb = async (cityName: string) => {
                try {
                    const response = await fetch(`http://localhost:3000/api/isCityInAirNow?city=${cityName}`);
                    const data = await response.json();
                    if (data.isInList) {
                        //return `https://www.airnow.gov/state/?name=${cityName}`;
                        return `https://www.airnow.gov/?reportingArea`;
                    }
                } catch (error) {
                    console.error('Errore nel verificare la città nel DB:', error);
                }

                return ''; // Restituisce una stringa vuota se la città non è nel database
            };

            // Recupera l'URL AQICN per la città corrente
            const aqicnUrl = await fetchAQICNUrl(city);

            // Verifica se la città è nel database AirNow
            const airNowLink = await checkCityInDb(city);

            // Recuperiamo i dati attuali dalla nuova API (la funzione fetchLocalAirQuality dovrebbe essere definita da te)
            const currentData: LocationData[] = await fetchLocalAirQuality(city);
            console.log('Current Data:', currentData);

            if (!currentData || currentData.length === 0) {
                console.error('Nessun dato ricevuto dalla API');
                return;
            }

            const dataToExport = currentData.flatMap((locationData: LocationData) => {
                return locationData.measurements.map((measurement: Measurement) => ({
                    Location: locationData.location,
                    ...measurement,
                }));
            });

            console.log('Data to Export:', dataToExport);

            if (exportFormat === "csv") {
                const csv = Papa.unparse(dataToExport);
                //let additionalLinks = `AQICN Link: ${aqicnUrl}\n`;
                let additionalLinks = ``;
                if (airNowLink) {
                    additionalLinks += `AirNow Link: ${airNowLink}\n`;
                }
                additionalLinks += `OpenAQ Link: https://explore.openaq.org/\n`;

                const csvWithLinks = `Additional Links: ${additionalLinks}\n${csv}`;

                const blob = new Blob([csvWithLinks], { type: 'text/csv' });
                saveAs(blob, 'most_recent_data.csv');
            } else if (exportFormat === "json") {
                const json = JSON.stringify({ openAqLink: "https://explore.openaq.org/", data: dataToExport }, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                saveAs(blob, 'most_recent_data.json');
            } else if (exportFormat === "xml") {
                const xml = builder.create('root');
                //xml.ele('AQICNLink', {}, aqicnUrl);
                xml.ele('OpenAQLink', {}, "https://explore.openaq.org/");
                dataToExport.forEach((item) => {
                    const entry = xml.ele('entry');
                    Object.keys(item).forEach((key) => {
                        entry.ele(key, {}, (item as any)[key]);
                    });
                });

                const xmlString = xml.end({ pretty: true });
                const blob = new Blob([xmlString], { type: 'application/xml' });
                saveAs(blob, 'most_recent_data.xml');
            }
        } catch (error) {
            console.error('Errore durante il recupero dei dati:', error);
        }
    };

    return (
        <div>
            <div>
                {visualization}
            </div>
            <div>
                <label>
                    Export type:
                    <select onChange={e => { setExportType(e.target.value); exportData(e.target.value); }} value={exportType}>
                        <option value="" disabled>Choose an option</option>
                        <option value="selected-avg-year-historical">Currently Year Aggregated Avg Selected Historical Data</option>
                        <option value="all-avg-year-historical">All Year Aggregated Avg Historical Data</option>
                        <option value="all-historical">All Historical Data Of Selected Location & Date Range</option>
                        <option value="current">Most Recent Data</option>
                    </select>
                </label>
            </div>
            <div>
                <label>
                    Export format:
                    <select onChange={e => setExportFormat(e.target.value)} value={exportFormat}>
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="xml">XML</option>
                    </select>
                </label>
            </div>
        </div>
    );
};

export default DataExporter;
