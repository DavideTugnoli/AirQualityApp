import pandas as pd
import requests

# Upload CSV
df = pd.read_csv("./states_and_actual_cities.csv")

# Create an empty list to contain the new rows with bounding boxes
new_rows = []

# Creates an empty list for approximate cities.
approximated_cities = []

for index, row in df.iterrows():
    city = row['City']
    state = row['State']
    state_code = row['State Code']

    # Print a message to track progress
    print(f"Processing {city}, {state} ({state_code})...")

    # Use a geocoding service to get the coordinates (this is an example with OpenCage)
    response = requests.get(f"https://api.opencagedata.com/geocode/v1/json?q={city}+{state}&key=0e2a167bddd2456da72c7b61498712ba")
    data = response.json()

    # Extract the coordinates
    lat = data['results'][0]['geometry']['lat']
    lng = data['results'][0]['geometry']['lng']

    # Verifica se il campo 'bounds' è presente nella risposta
    if 'bounds' in data['results'][0]:
        northeast = data['results'][0]['bounds']['northeast']
        southwest = data['results'][0]['bounds']['southwest']
        bbox = [southwest['lng'], southwest['lat'], northeast['lng'], northeast['lat']]
    else:
        bbox = [lng - 0.5, lat - 0.5, lng + 0.5, lat + 0.5]
        approximated_cities.append(f"{city}, {state}")

    # Create a new row with bounding box
    new_row = row.copy()
    new_row['BBOX'] = str(bbox)

    # Add the new row to the list
    new_rows.append(new_row)

# Create a new DataFrame from new_rows
new_df = pd.DataFrame(new_rows)

# Save the new DataFrame to a new CSV file
new_df.to_csv("./airnow_states_and_cities_with_bbox.csv", index=False)

# Print a message when the script is completed
print("Processing complete. New CSV file created.")

# Create a log file for approximate cities.
if approximated_cities:
    with open("approximated_cities.log", "w") as f:
        for city in approximated_cities:
            f.write(f"{city}\n")
    print("Log file created for approximated cities.")
else:
    print("All cities have precise bounding boxes.")
