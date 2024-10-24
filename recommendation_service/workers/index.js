const { Worker, Job } = require('bullmq');
const axios = require('axios');
const dotenv = require('dotenv');
const { Sequelize, QueryTypes } = require('sequelize');

dotenv.config();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

console.log('Starting worker...');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      // port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
    },
  );

// Calculo de las recomendaciones
// Primero, se obtiene el resultado de todas las compras de un usuario

async function getAllPurchasesResults(username) {

  }

// Luego, se obtienen los partidos de los equipos que estaban involucrados en todas sus compras (importante que aparezcan por liga)

async function getMatchesByTeams(purchases) {
  }

// después, se calcula cuantas veces ha acertado en todas las apuestas a los resultados cuando uno de los equipos de 
// los proximos partidos ha estado involucrado, tomando en cuenta cuantas veces apostó en el mismo partido.

async function calculateAsserts(username, matches) {
  }

// Luego, se calculan los beneficios de los partidos para cada liga tomando en cuenta la cantidad de aciertos antes calculada,  la cantidad de partidos de los equipos con los que acerto y la probabilidad. 

async function calculatePonderation(asserts, round, odds){ 
}

// Finalmente, se ordenan los partidos por beneficios y se devuelven los primeros 3

async function processor(job) {
    try {
      const sortedRecommendations = recommendations
        .sort((a, b) => b.pond - a.pond)
        .slice(0, 3);
  
      await Promise.all(
        recommendations.map(async (recommendation) => {
          await saveRecommendation(username, recommendation.fixture.id);
        }),
      );
  
      return sortedRecommendations;
    } catch (error) {
      console.log(`Error processing job: ${error.message}`);
      throw error;
    }
  }

// Coordinación de conexión al broker de redis y ejecución de los trabajos

const connection = {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  };

const worker = new Worker('recommendationQueue', processor, {
    autorun: false,
    connection,
  });

console.log('Worker Listening to Jobs...');

worker.on('completed', (job, returnvalue) => {
    console.log(`Worker completed job ${job.id} with result ${returnvalue}`);
  });

worker.on('failed', (job, error) => {
    console.log(`Worker completed job ${job.id} with error ${error}`);
  });

worker.on('error', (err) => {
    console.error(err);
  });

worker.run();

async function shutdown() {
    console.log('Received SIGTERM signal. Gracefully shutting down...');

    await worker.close();

    process.exit(0);
  }

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);