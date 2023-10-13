require('dotenv').config();

const checkEnvVar = (varName) => {
  if (!process.env[varName]) {
    console.error(`ERRORE: La variabile d'ambiente ${varName} non è definita.`);
    process.exit(1);
  }
};

checkEnvVar('AQICN_API_KEY');
checkEnvVar('OPENCAGE_API_KEY');
checkEnvVar('AIRNOW_API_KEY');

module.exports = {
  AQICN_API_KEY: process.env.AQICN_API_KEY,
  OPENCAGE_API_KEY: process.env.OPENCAGE_API_KEY,
  AIRNOW_API_KEY: process.env.AIRNOW_API_KEY,
};
