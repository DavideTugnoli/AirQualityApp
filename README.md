# Open Data Management And The Cloud - University Exam Project

This project is a part of the university exam for the course "Open Data Management and the Cloud". Below are the details and instructions on how to set up and run the project.

## Project Overview

This project is a single-page web application where users can input a city name in an input box to retrieve various air quality data. The app includes features like date pickers for historical data, dropdown menus for current city data, and a data export functionality that supports CSV, JSON, and XML formats. There is also a map that displays the AQI (Air Quality Index) of various pollutants and automatically centers on the selected city.

## Prerequisites

Ensure you have the following installed on your system:

- Docker
- NodeJS
- React

> Note: Although the prerequisites are listed, they will be automatically installed when you build the project using docker-compose.

## Installation

1. Clone the repository to your local system.
2. Navigate to the `Backend` folder and run the following command to build and run the backend:

   ```sh
   docker-compose up --build
   ```

   For subsequent runs, you can use the command below:
   ```
   docker-compose up
   ```

 3. 3. To launch the frontend, navigate to the `Frontend` folder and then enter the `air-quality-app` subfolder. Once you're in the `air-quality-app` subfolder, run:

    ```
    npm start
     ```

Note: The compiled frontend is accessible as soon as the backend is started using `docker-compose up` at `localhost:3000`.

## Data Import and Index Creation

Once you have completed the Installation steps, the next thing to do is to populate the MongoDB database with the required datasets and create the necessary indexes for more efficient queries.

### Importing Datasets into MongoDB

**Note**: The `final_datasets` folder needed for historical data import is not included in this repository due to its large size. You can download it from [this Google Drive link](https://drive.google.com/file/d/1Tmlni4qlvdEVtOBTczACIGYc4UhVfhY9/view?usp=sharing) and place it in the project's main directory.

1. **Historical Data**: Open your MongoDB console and execute the following command to import historical air quality data:

    ```sh
    mongoimport --type csv -d AirQuality -c HistoricalData --headerline --file /final_datasets/updated_cities.csv -u root -p example --authenticationDatabase admin
    ```

2. **Current Air Quality Data**: To import data about current air quality in various cities, use the command below:

    ```sh
    mongoimport --type csv -d AirQuality -c AirNowCities --headerline --file /final_datasets/airnow_cities_bbox.csv -u root -p example --authenticationDatabase admin
    ```

### Creating Indexes

After importing the data, you need to create indexes to facilitate faster queries. Connect to the MongoDB shell (`mongosh`) and switch to the application's database using:

```sh
use AirQuality
```
Then create the index using the following command:

```sh
db.HistoricalData.createIndex({ "city": 1, "date": 1 })
```

This command will create an ascending index on the city and date fields of the `HistoricalData` collection.

## Usage

### Web Application
Once the setup is complete, visit `localhost:3000` to access the web application. The main features include:
- A text input box to enter the city name.
- Date picker fields to select a range for historical data.
- Dropdown menus to choose specific city locations for current data.
- A map displaying AQI of various pollutants, automatically centered on the chosen city.
- Data export options, where you can specify the data type (historical/current) and format (CSV, JSON, XML) for the export.

### APIs
This project offers the following APIs:

1. **Available Cities**
- **Endpoint:** `http://localhost:3000/api/availableCities`
- **Description:** Fetches the list of available cities in the MongoDB database with historical data.
- **Response Example:**
  ```json
  [
      {"city": "Strasbourg", "country": "FR"},
      {"city": "Swansea", "country": "GB"},
      {"city": "Taiyuan", "country": "CN"}
  ]
  ```

2. **All Year Aggregated Air Quality**
- **Endpoint:** `http://localhost:3000/api/fetchYearlyAggregatedData?city=Roma&startDate=2015-01-01&endDate=2023-08-31&country=IT&specie=temperature&minCount=100`
- **Description:** Fetches all average values of every historical data type for the specified city in the given date range. The parameters `country`, `specie`, and `minCount` are optional. 
  - `country`: Optional. If specified, filters the data by country.
  - `specie`: Optional. If not specified, data for all species will be displayed without any filter.
  - `minCount`: Optional. If specified, only data entries that have a count greater than or equal to this value will be included.
- **Response Example:**
  ```json
  [
      {
          "_id": {
              "type": "Meteorological",
              "city": "Roma",
              "country": "IT",
              "specie": "temperature",
              "year": "2019"
          },
          "avgMin": 10.845580110497238,
          "avgMax": 22.637016574585637,
          "count": 362,
          "unit": "Celsius"
      }
  ]

3. **All Historical Air Quality Data**
- **Endpoint:** `http://localhost:3000/api/data?city=Roma&country=IT&startDate=2023-01-01&endDate=2023-10-03&specie=temperature&minCount=100`
- **Description:** Fetches detailed air quality and meteorological data for the specified city within the given date range. The parameters `country`, `specie`, and `minCount` are optional.
  - `country`: Optional. If specified, filters the data by country.
  - `specie`: Optional. If not specified, data for all species will be displayed without any filter.
  - `minCount`: Optional. If specified, only data entries that have a count greater than or equal to this value will be included.
- **Response Example:**
  ```json
  [
      {
          "date": "2023-01-01",
          "country": "IT",
          "city": "Roma",
          "specie": "temperature",
          "count": 192,
          "min": 8,
          "max": 19.3,
          "median": 12.7,
          "variance": 81.22,
          "type": "Meteorological",
          "unit": "Celsius",
          "Origin": "aqicn.org"
      },
      {
          "date": "2023-01-02",
          "country": "IT",
          "city": "Roma",
          "specie": "temperature",
          "count": 192,
          "min": 6.1,
          "max": 16.8,
          "median": 11.8,
          "variance": 70.51,
          "type": "Meteorological",
          "unit": "Celsius",
          "Origin": "aqicn.org"
      }
  ]


4. **Get Live Air Quality Datas**
- **Endpoint:** `http://localhost:3000/api/airQualityLocations?city=Roma`
- **Description:** Retrieves the most recent air quality data for locations within the specified city.
- **Response Example:**
  ```json
  [
    {
        "location": "IT0884A",
        "measurements": [
            {
                "Country": "IT",
                "Location": "IT0884A",
                "Latitude": 42.157778,
                "Longitude": 11.908611,
                "Pollutant": "no2",
                "Value": 14,
                "Date_last_measured": "2023-10-13T16:00:00+00:00",
                "Unit": "µg/m³",
                "Source": "EEA Italy",
                "Origin": "OpenAQ.org"
            },
            {
                "Country": "IT",
                "Location": "IT0884A",
                "Pollutant": "o3",
                "Value": 131,
                "Date_last_measured": "2023-09-30T05:00:00+00:00",
                "Unit": "µg/m³",
                "Source": "EEA Italy",
                "Origin": "OpenAQ.org"
            },
            {
                "Country": "IT",
                "Location": "IT0884A",
                "Pollutant": "no2",
                "Value": 6,
                "Date_last_measured": "2023-09-30T05:00:00+00:00",
                "Unit": "µg/m³",
                "Source": "EEA Italy",
                "Origin": "OpenAQ.org"
            }
        ]
    }
  ]
  ```

## Contributing
As this is an exam project, contributions are not open. However, you are welcome to fork the repository and explore on your own.

## License
This project is licensed under the GNU General Public License v3.0 - see the [LICENSE.md](LICENSE.md) file for details.

## Contact
For any queries, please reach out to the repository owner.
