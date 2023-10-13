import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Text } from 'recharts';
import '../styles/AirQualityChart.css';

interface AirQualityData {
    year: string;
    avgMedian: number;
    avgMin: number; 
    avgMax: number; 
}

interface AirQualityChartProps {
    data: AirQualityData[];
}


const MeteorologicalDataChart: React.FC<AirQualityChartProps> = ({ data }) => {
  // Verifica se ci sono dati
  const hasData = data.length > 0;

  return (
    <div className="bar-chart-container">
      <div style={{ position: 'relative' }}>
        <BarChart
          width={600}
          height={400}
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="avgMedian" fill="#8884d8" name="Median" />
          <Bar dataKey="avgMin" fill="#82ca9d" name="Minimum" />
          <Bar dataKey="avgMax" fill="#ffc658" name="Maximum" />
        </BarChart>
        {!hasData && (
          <svg
            width={600}
            height={400}
            style={{ position: 'absolute', top: -19, left: 17 }}
          >
            <Text
              x={300} // Posizione x al centro del container
              y={200} // Posizione y al centro del container
              textAnchor="middle" // Allinea il testo al centro
              fontSize={20} // Dimensione del testo
              fill="#888" // Colore del testo
            >
              No Data
            </Text>
          </svg>
        )}
      </div>
    </div>
  );
};



export default MeteorologicalDataChart;
