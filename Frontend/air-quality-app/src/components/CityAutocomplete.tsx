import React, { useEffect, useState } from 'react';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

interface CityData {
  city: string;
  country: string;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({ value, onChange }) => {
  const [availableCities, setAvailableCities] = useState<CityData[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchAvailableCities = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/availableCities');
        const cities = await response.json();
        setAvailableCities(cities);
      } catch (error) {
        console.error('Failed to fetch available cities', error);
      }
    };

    fetchAvailableCities();
  }, []);

  useEffect(() => {
    if (value) {
      const matchedCities = availableCities.filter(cityData => 
        cityData.city.toLowerCase().includes(value.toLowerCase())
      ).map(cityData => `${cityData.city} (${cityData.country})`);
      
      if (matchedCities.length === 1 && matchedCities[0].toLowerCase() === value.toLowerCase()) {
        setFilteredCities([]);
      } else {
        setFilteredCities(matchedCities);
      }
    } else {
      setFilteredCities([]);
    }
  }, [value, availableCities]);  

  return (
    <div className="city-autocomplete">
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)}
      />
{filteredCities.length > 0 && (
  <ul className="autocomplete-suggestions">
    {filteredCities.map((suggestion, index) => (
      <li 
        key={index} 
        onClick={() => {
          onChange(suggestion);
          setFilteredCities([]);
        }}
      >
        {suggestion}
      </li>
    ))}
  </ul>
)}
    </div>
  );
};

export default CityAutocomplete;
