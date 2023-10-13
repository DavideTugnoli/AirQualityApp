import requests
import pandas as pd
from difflib import get_close_matches
import tkinter as tk
from tkinter import filedialog, ttk

# Function to get cities from OpenAQ for a specific country
def fetch_openaq_cities(country_code):
    response = requests.get(f"https://api.openaq.org/v2/cities?country={country_code}&limit=1000")
    cities_data = response.json()
    df = pd.DataFrame(cities_data["results"])
    return set(df['city']) if 'city' in df.columns else set()

# Blacklist of unaccepted translations
black_list = [
    ('Changzhou', 'Guangzhou'),
    ('Changchun', 'Chengdu'),
    ('Jaipur', 'Kanpur'),
    ('Nantes', 'Landes'),
    ('Guiyang', 'Guangzhou'),
    ('Concepción', 'Concón'),
    ('Rennes', 'Ardennes'),
    ('Lanzhou', 'Guangzhou'),
    ('Shenzhen', 'Shenyang'),
    ('Zhuzhou', 'Guangzhou'),
    ('Nagpur', 'Kanpur'),
    ('Anyang', 'Shenyang'),
    ('Fuzhou', 'Guangzhou'),
    ('Zagreb', 'Zagrebacka'),
    ('Xining', 'Beijing'),
    ('Marseille', 'Moselle'),
    ('Shiyan', 'Shenyang'),
    ('Caen', 'Charente'),
    ('Montpellier', 'Moselle'),
    ('Tours', 'Doubs'),
    ('New Delhi', 'Delhi'),
    ('Lille', 'Loire'),
    ('Suzhou', 'Guangzhou'),
    ('Zhengzhou', 'Guangzhou'),
    ('Hangzhou', 'Guangzhou'),
    ('Changsha', 'Shanghai'),
    ('Trieste', 'Trento'),
    ('Yangon', 'Rangoon'),
    ('Olomouc', 'Olomoucký'),
    ('Busan', 'Ulsan'),
    ('Yeosu','Seoul'),
    ('Craiova','Prahova'),
    ('Râmnicu Vâlcea','Vâlcea'),
    ('Timişoara','Timiş'),
    ('Baia Mare','Satu Mare'),
    ('Oradea', 'Vrancea'),
    ('Dresden', 'Hessen'),
    ('Freiburg', 'Brandenburg'),
    ('Bratislava', 'Bratislavský kraj'),
    ('Birmingham','Billingham'),
    ('Valencia', 'Palencia'),
    ('Chicago', 'Chico'),
    ('Charlotte', 'Charlottesville'),
    ('Oakland', 'Lakeland'),
    ('Los Angeles', 'Port Angeles'),
    ('Nashville', 'Asheville'),
    ('İzmit', 'İzmir'),
    ('Antakya', 'Antalya')
]

# White list of accepted translations
white_list = [
    ("Florence", "Firenze"),
    ("Naples", "Napoli"),
    ("Milan", "Milano"),
    ("Trieste", "Trieste")
    # Add other accepted translations here
]

# Function to update the CSV
def update_csv(input_path, output_path):
    try:
        df = pd.read_csv(input_path)
        print("CSV file read successfully.")
    except Exception as e:
        print(f"Error while reading CSV file: {e}")
        return

    unique_cities = df['city'].unique()
    to_update = {}
    updated_cities = set()

    # We open a log file to record changes
    with open("log.txt", "w") as log_file:
        for city in unique_cities:
            # White list management
            for old, new in white_list:
                if city == old:
                    to_update[city] = new
                    updated_cities.add(city)
                    log_file.write(f"{city} has been changed to {new} because of the whitelist.\n")

            # Check if the city has already been updated from the whitelist
            if city in updated_cities:
                continue

            # City Management from OpenAQ
            country_code = df.loc[df['city'] == city, 'country'].iloc[0]
            openaq_unique_cities = fetch_openaq_cities(country_code)

            if city not in openaq_unique_cities:
                closest_match = get_close_matches(city, openaq_unique_cities, n=1, cutoff=0.75)
                if closest_match and (city, closest_match[0]) not in black_list:
                    to_update[city] = closest_match[0]
                    log_file.write(f"{city} has been changed to {closest_match[0]} due to a match with OpenAQ.\n")

        # We perform the update in the DataFrame
        df['city'].replace(to_update, inplace=True)
        df.to_csv(output_path, index=False)
        print(f"File saved as {output_path}")

# GUI code
root = tk.Tk()
root.title("City name uniformizer")
def select_input_file():
    file_path = filedialog.askopenfilename(filetypes=[("CSV files", "*.csv")])
    input_file_path.set(file_path)

def select_output_directory():
    folder_path = filedialog.askdirectory()
    output_directory_path.set(f"{folder_path}/updated_cities.csv")

def process_csv():
    status = update_csv(input_file_path.get(), output_directory_path.get())
    status_label.config(text=status)

input_file_path = tk.StringVar()
output_directory_path = tk.StringVar()

frame = ttk.Frame(root, padding="10")
frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

frame.grid_columnconfigure(0, minsize=200)

input_file_button = ttk.Button(frame, text="Select input CSV file", command=select_input_file)
input_file_button.grid(row=0, column=0, sticky=tk.W+tk.E, pady=5)

output_directory_button = ttk.Button(frame, text="Select output directory", command=select_output_directory)
output_directory_button.grid(row=1, column=0, sticky=tk.W+tk.E, pady=5)

update_button = ttk.Button(frame, text="Update CSV", command=process_csv)
update_button.grid(row=2, column=0, sticky=tk.W+tk.E, pady=5)

status_label = ttk.Label(frame, text="")
status_label.grid(row=3, column=0, sticky=tk.W, pady=5)

root.mainloop()
