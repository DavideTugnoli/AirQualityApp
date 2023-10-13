import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
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


const AirQualityChart: React.FC<AirQualityChartProps> = ({ data }) => {
  // print at console AirQualityData[] to see the structure
    return (
      <div className="bar-chart-container">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="avgMedian" fill="#8884d8" name="Media Mediana" />
          <Bar dataKey="avgMin" fill="#82ca9d" name="Media Minimo" />
          <Bar dataKey="avgMax" fill="#ffc658" name="Media Massimo" />
        </BarChart>
      </div>
    );
};  

export default AirQualityChart;
