# Project Title: City Data Harmonization

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Scripts](#scripts)
    1. [city_naming_uniformizer.py](#city_naming_uniformizer)
    2. [city_airnow_scraper.py](#city_airnow_scraper)
    3. [bbox_coords_finder.py](#bbox_coords_finder)
4. [Usage](#usage)
5. [Contributing](#contributing)
6. [License](#license)

## Overview

This project includes Python scripts designed to harmonize city data names across various data sources. The goal is to align city names to their local language names and to collect additional information such as city bounding boxes and AQI data.

## Requirements

- Python 3.x
- pandas
- requests
- Selenium
- tkinter

To install all the requirements, run:

```
pip install pandas requests selenium tkinter
```

## Scripts

### city_naming_uniformizer.py

#### Purpose

This script is used to uniform the city names in the datasets. It fetches the original city names from OpenAQ and matches them to the translated names from AQICN. 

#### How it Works

1. Fetches unique city names from OpenAQ using their API for each country in the input CSV.
2. Compares city names from the input CSV with the unique city names from OpenAQ.
3. Uses a 'white list' and 'black list' to ensure that certain translations are accepted or rejected.
4. Replaces the city names in the input CSV with the matched names.
5. Provides a GUI to select the input and output CSV files.

#### Code Flow

- Import necessary modules.
- Define functions for:
    - Fetching unique city names from OpenAQ (`fetch_openaq_cities`)
    - Updating the input CSV (`update_csv`)
- Main GUI Code for selecting the input and output CSVs.

```python
# Truncated code example (full code in the repository)
def fetch_openaq_cities(country_code):
    ...
def update_csv(input_path, output_path):
    ...
# GUI Code
...
```

#### Additional Information

This script uses `difflib.get_close_matches` to find the closest matches for city names. It also has a 'blacklist' and 'whitelist' to manually handle specific cases that should not be automatically matched.

### city_airnow_scraper.py

#### Purpose

This script uses Selenium to scrape city data from `airnow.gov`. 

#### How it Works

1. Creates separate threads to scrape each U.S. state's page for city information.
2. Extracts the city names and state codes.
3. Writes the scraped data to a CSV file.

#### Code Flow

- Import necessary modules.
- Set up logging and threading.
- Define function to scrape city data from a state's page (`scrape_state`).

```python
# Truncated code example (full code in the repository)
def scrape_state(state):
    ...
```

### bbox_coords_finder.py

#### Purpose

This script is used to find the bounding box coordinates for each city.

#### How it Works

(TBD: You didn't provide the full code, so I'll leave this blank for now.)

#### Code Flow

- Import necessary modules.
- Load the city data CSV.
- Compute bounding box coordinates for each city.

```python
# Truncated code example (full code in the repository)
import pandas as pd
import requests
...
```

## Usage

1. Clone the repository.
2. Install the requirements.
3. Run the scripts as needed.

```bash
python city_naming_uniformizer.py
python city_airnow_scraper.py
python bbox_coords_finder.py
```

## Contributing

Pull requests are welcome.

## License

TBD
