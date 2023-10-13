import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';
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

const PollutantDataChart: React.FC<AirQualityChartProps> = ({ data }) => {
    const aqiCategories = [
        { label: 'Good', start: 0, end: 50, color: '#009966' },
        { label: 'Moderate', start: 51, end: 100, color: '#ffde33' },
        { label: 'Insalubrious for sensitive groups', start: 101, end: 150, color: '#ff9933' },
        { label: 'Insalubrious', start: 151, end: 200, color: '#cc0033' },
        { label: 'Very unhealthy', start: 201, end: 300, color: '#660099' },
        { label: 'Dangerous', start: 301, end: 500, color: '#7e0023' },
    ];

    return (
        <div className="bar-chart-container">
            <BarChart
                width={600}
                height={400}
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis type="number" domain={[0, 500]} allowDataOverflow={true} />
                <Tooltip />
                <Legend />
                {aqiCategories.map((category, index) => (
                    <ReferenceArea
                        key={index}
                        y1={category.start}
                        y2={category.end}
                        strokeOpacity={0.3}
                        fill={category.color}
                        fillOpacity={0.2}
                        label={category.label}
                    />
                ))}
                <Bar dataKey="avgMedian" fill="#8884d8" name="Median" />
                <Bar dataKey="avgMin" fill="#82ca9d" name="Minimum" />
                <Bar dataKey="avgMax" fill="#ffc658" name="Maximum" />
            </BarChart>
        </div>
    );
};  

export default PollutantDataChart;
