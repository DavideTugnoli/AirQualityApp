import React, { useEffect, useState } from 'react';
import '../styles/OpenAQTable.css';
import { LocationData } from './locationData';

interface Measurement {
  Pollutant: string;
  Value: number;
  Date_last_measured: string;
  Unit_of_measurement: string;
}

interface OpenAQTableProps {
  location: string;
  parameter?: string;
  limit?: number;
  locationsData: LocationData[];
}

const OpenAQTable: React.FC<OpenAQTableProps> = ({ location, locationsData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const selectedLocationData = locationsData.find(res => res.location === location);

  useEffect(() => { 
   // console.log("OpenAQTable - locationsData: ", locationsData); // Aggiunto log per verificare i dati
   if (locationsData.length > 0) {
    setIsLoading(false);
  }
  }, [locationsData]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!selectedLocationData || !selectedLocationData.measurements || selectedLocationData.measurements.length === 0) {
    return <div>No stations available.</div>;
  }

  // console.log("OpenAQTable - location: ", location); // Aggiunto log per verificare la location

  if (!selectedLocationData || !selectedLocationData.measurements || selectedLocationData.measurements.length === 0) {
    console.log("OpenAQTable - Nessun dato disponibile per la location selezionata."); // Aggiunto log per avvisare della mancanza di dati
    return <div>Nessun dato disponibile per la location selezionata.</div>;
  }

  // console.log("OpenAQTable - selectedLocationData.measurements: ", selectedLocationData.measurements);

  // Funzione per formattare le date
  const formatDateString = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <table className='openaq-table'>
      <thead>
        <tr>
          <th>Pollutant</th>
          <th>Value</th>
          <th>Date of last measurement</th>
          <th>Unit of measurement</th>
        </tr>
      </thead>
      <tbody>
        {selectedLocationData.measurements.map((measurement, index) => (
          <tr key={index}>
            <td>{measurement.Pollutant}</td>
            <td>{measurement.Value}</td>
            <td>{formatDateString(measurement.Date_last_measured)}</td>
            <td>{measurement.Unit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default OpenAQTable;
