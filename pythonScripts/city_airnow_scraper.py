from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import csv
import logging
import threading
import time

# Logging configuration
logging.basicConfig(level=logging.INFO, filename='scraper.log', filemode='w', format='%(asctime)s - %(message)s')

# Traffic light to limit the number of threads to 5
semaphore = threading.Semaphore(5)

# Lock per l'accesso al file CSV
csv_lock = threading.Lock()

def scrape_state(state):
    with semaphore:
        logging.info(f'Starting thread for {state}')
        
        driver = webdriver.Chrome()
        driver.get(f'https://www.airnow.gov/state/?name={state.lower()}')
        time.sleep(5)

        cities_elements = driver.find_elements(By.XPATH, '//table[@id="current-aqi-table"]//tr/td[1]/a')

        for city_element in cities_elements:
            ActionChains(driver).move_to_element(city_element).click().perform()
            time.sleep(5)

            try:
                actual_city_element = driver.find_element(By.XPATH, '//h1[@class="location-label standard-location-label splash-main-message"]/span[@class="notranslate"]')
                actual_city_state = actual_city_element.text.split(", ")

                with csv_lock:
                    with open('states_and_actual_cities.csv', 'a', newline='') as csvfile:
                        csvwriter = csv.writer(csvfile)
                        csvwriter.writerow([state, actual_city_state[0], actual_city_state[1]])

            except Exception as e:
                logging.warning(f'Failed to get city for {state}: {e}')

            driver.back()
            time.sleep(5)

        driver.quit()
        logging.info(f'Finished thread for {state}')

# Prepare the CSV file
with open('states_and_actual_cities.csv', 'w', newline='') as csvfile:
    csvwriter = csv.writer(csvfile)
    csvwriter.writerow(['State', 'City', 'State Code'])

# List of states
states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "District Of Columbia", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Mexico", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
    "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin",
    "Wyoming"
]

threads = []

for state in states:
    t = threading.Thread(target=scrape_state, args=(state,))
    t.start()
    threads.append(t)

# Wait for all threads to end
for t in threads:
    t.join()

logging.info('Scraping completed.')