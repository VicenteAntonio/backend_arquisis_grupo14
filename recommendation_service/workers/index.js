const { Worker, Job } = require('bullmq');
const axios = require('axios');
const dotenv = require('dotenv');
const { Sequelize, QueryTypes, Op } = require('sequelize');
const redis = require('redis');

const client = redis.createClient({
  host: 'redis', // O la dirección de tu contenedor de Redis
  port: 6379,
  password: process.env.REDIS_PASSWORD, // Asegúrate de que esta contraseña coincida
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

dotenv.config();

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

console.log('Starting worker...');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_user_token,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    // port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  }
);

// Calculo de las recomendaciones
// Primero, se obtiene el resultado de todas las compras de un usuario

async function saveRecommendation(user_token, fixtureId) {
  try {
    const response = await axios.post(
      `${process.env.API_URL}/recommendations`,
      { user_token, fixtureId },
    );
    console.log(`Recommendation saved: ${response.data.id}`);
  } catch (error) {
    console.error(`Error saving recommendation: ${error.message}`);
    throw error;
  }
}

async function getAllPurchasesResults(user_token) {
  try {
    // obtener todas las compras de un usuario por el user_token
    const currentDate = new Date();

    const query = 
    `SELECT * FROM requests
    WHERE user_token = (SELECT user_token FROM users WHERE user_token = :user_token)
    AND status = 'accepted'`;

    if (!user) {
      throw new Error('User not found');
    }

    const requests = await sequelize.query(query, {
      replacements: { user_token },
      type: QueryTypes.SELECT
    })

    return requests; // retorno las requests
  } catch (error) {
    console.log(`Error getting purchases results: ${error.message}`);
    throw error;
  }
}

async function getMatchesByTeams(purchases) {
  try {
    const fixtureIds = purchases.map((purchase) => purchase.fixture_id);

    const query = 
    `SELECT homeTeamName, awayTeamName FROM fixtures
    WHERE fixtureId IN (:fixtureIds)
    AND datetime > NOW()
    AND SORT BY league_name`;

    const teams = await sequelize.query(query, {
      replacements: { fixtureIds },
      type: QueryTypes.SELECT
    })

    const query2 = 
    `SELECT * FROM fixtures
    WHERE homeTeamName IN (:teams) AND awayTeamName IN (:teams)
    SORT BY league_name`;

    const matches = await sequelize.query(query, {
      replacements: { teams },
      type: QueryTypes.SELECT
    })

    return matches;
  } catch (error) {
    console.log(`Error getting matches by teams: ${error.message}`);
    throw error;
  }
}

async function calculateAsserts(user_token, purchases) {
  try {
    const matchesIds = purchases.map((match) => match.fixture_id);

    const query = 
    `SELECT * FROM fixtures
    WHERE fixtureId IN (:matchesIds)`;

    const matches = await sequelize.query(
      query,
      {
        replacements: { matchesIds },
        type: QueryTypes.SELECT
      }
    )

    var resultsAsserts = 0;

    // identificar cuantas veces ha acertado
    for (const match of matches) {
      goalsHome = match.goalsHome;
      goalsAway = match.goalsAway;
      if (goalsHome > goalsAway) {
        winner = match.homeTeamName;
      }
      if (goalsHome < goalsAway) {
        winner = match.awayTeamName;
      }
      else {
        winner = 'Empate';
      }

      const queryFixture =
      `SELECT * FROM requests
      WHERE fixture_id = :fixtureId`;

      const request = await sequelize.query(queryFixture, {
        replacements: { fixtureId },
        type: QueryTypes.SELECT
      });

      if (request.result == winner) {
        resultsAsserts++;
      }
    }
    return matchesAsserts; // retorno la cantidad de aciertos
  } catch (error) {
    console.log(`Error calculating asserts: ${error.message}`);
    throw error;
  }
}

async function calculatePonderation(asserts, round, oddsHome, oddsAway) {
  try {
    const round = str.round(/\d+/); // Busca uno o más dígitos en el string
    const roundNumber = match ? parseInt(round[0], 10) : null;
    const pond = (asserts * roundNumber) / (oddsHome + oddsAway); // calcular ponderación
    return pond;
  } catch (error) {
    console.log(`Error calculating ponderation: ${error.message}`);
    throw error;
  }
}

// Finalmente, se ordenan los partidos por beneficios y se devuelven los primeros 3

async function processor(job) {
  try {
    const user_token = job.data.user_token; // user_token
    const purchases = await getAllPurchasesResults(user_token); // REQUESTS

    const matches = await getMatchesByTeams(purchases); // obtener los partidos de los equipos que estaban involucrados en todas sus compras

    let recommendations = [];

    for (const match of matches) {
      const matchAssert = await calculateAsserts(user_token, purchases); 
      const ponderation = await calculatePonderation(matchAssert, match.round, match.oddsHome, match.oddsAway); 
      recommendations.push({ match, ponderation });
    }

    // Ordena las recomendaciones según la ponderación, donde cada elemento es un objeto con el partido y la ponderación
    const sortedRecommendations = recommendations
      .sort((a, b) => b.ponderation - a.ponderation)
      .slice(0, 3);

    return sortedRecommendations;

    await Promise.all(
      sortedRecommendations.map(async (sortedRecommendations) => {
        await saveRecommendation(user_token, sortedRecommendation.fixture.id);
      })
    );
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

// definición del worker, worker escucha la cola recomendationQueue
// y ejecuta el procesador de trabajos
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