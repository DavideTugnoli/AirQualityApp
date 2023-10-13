// locationData.ts
export interface LocationData {
    location: string;
    measurements: Measurement[];
  }
  
  export interface Measurement {
    Pollutant: string;
    Value: number;
    Date_last_measured: string;
    Unit: string;
  }
  