# Utilizza l'immagine ufficiale di Node
FROM node:latest

# Imposta la directory di lavoro
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Installa nodemon globalmente
RUN npm install -g nodemon

# Copia tutto il resto del codice sorgente
COPY . .

# Espone la porta su cui girerà l'app
EXPOSE 3000

# Comando per avviare l'applicazione
CMD ["nodemon", "server.js"]
