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

async function getAllPurchasesResults(user_token) {
  try {
    // obtener todas las compras de un usuario por el user_token
    const currentDate = new Date();

    // const user = await User.findOne({
    //   where: { user_token },
    //   include: [
    //     {
    //       model: Request,
    //       where: {
    //         //   status: {
    //         //     [Op.or] : [],
    //         //   }, // status de la request es completa
    //         datetime: {
    //           [Op.lt]: currentDate, // fecha menor que la actual
    //         },
    //       },
    //     },
    //   ],
    // });
    // if (!user) {
    //   throw new Error('User not found');
    // }
    // return user.requests; // retorno las requests
    const response = await axios.get(`${API_URL}/requests`, {
      params: {
        user_token: token,
      }
    }
    );
    return response.data;
  } catch (error) {
    console.log(`Error getting purchases results: ${error.message}`);
    throw error;
  }
}

// Luego, se obtienen los partidos de los equipos que estaban involucrados en todas sus compras (importante que aparezcan por liga)

async function getMatchesByTeams(purchases) {
  try {
    const teams = purchases.map((purchase) => purchase.fixture.homeTeam);
    // important to get the teams by league
    const leagues = purchases.map((purchase) => purchase.leagueName);

    const matches = await Fixture.findAll({
      where: {
        [Op.or]: [
          {
            homeTeam: {
              [Op.in]: teams,
            },
          },
          {
            awayTeam: {
              [Op.in]: teams,
            },
          },
        ],
        league: {
          [Op.in]: leagues,
        },
      },
    });

    return matches;
  } catch (error) {
    console.log(`Error getting matches by teams: ${error.message}`);
    throw error;
  }
}

// después, se calcula cuantas veces ha acertado en todas las apuestas a los resultados cuando uno de los equipos de
// los proximos partidos ha estado involucrado, tomando en cuenta cuantas veces apostó en el mismo partido.

async function calculateAsserts(user_token, matches) {
  try {
    const currentDate = new Date(); // fecha actual

    const user = await User.findOne({
      // obtener usuario por user_token
      where: { user_token }, // user_token
      include: [
        {
          model: Request, // modelo de request
          where: {
            //   status: {
            //     [Op.or] : [],
            //   }, // status de la request es completa
            datetime: {
              [Op.lt]: currentDate, // fecha menor que la actual
            },
          },
        },
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }
    // reviso los acertados, Winner es correcto

    const asserts = matches.map((match) => {
      const matchPurchases = user.requests.filter(
        (purchase) => purchase.fixture_id === match.id
      );

      const matchAsserts = matchPurchases.filter(
        (purchase) => purchase.result === match.result
      );

      return {
        match, // partido
        asserts: matchAsserts.length, // cantidad de aciertos
      };
    });

    return asserts; // retorno los aciertos
  } catch (error) {
    console.log(`Error calculating asserts: ${error.message}`);
    throw error;
  }
}

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

// Luego, se calculan los beneficios de los partidos para cada liga tomando en cuenta la cantidad de aciertos antes calculada,
// la cantidad de partidos de los equipos con los que acerto y la probabilidad.
async function calculatePonderation(asserts, round, odds) {
  try {
    // asserts*league_round/(sum of odds)

    const ponderation = asserts.map((assert) => {
      const matchOdds = odds.find((odd) => odd.fixture.id === assert.match.id);
      const matchPurchases = assert.matchPurchases;
      const matchTeams = [
        assert.match.homeTeamName, // ver si recibe id, name o logo
        assert.match.awayTeamName, // ver si recibe id, name o logo
      ];

      const matchOddsSum = matchOdds.odds.reduce((acc, odd) => acc + odd, 0);

      const matchPurchasesSum = matchPurchases.reduce(
        (acc, purchase) => acc + purchase.quantity,
        0
      );

      const matchPurchasesTeams = matchPurchases.reduce((acc, purchase) => {
        if (matchTeams.includes(purchase.fixture.homeTeam)) {
          acc.push(purchase.fixture.homeTeam);
        }
        if (matchTeams.includes(purchase.fixture.awayTeam)) {
          acc.push(purchase.fixture.awayTeam);
        }
        return acc;
      }, []);

      const matchPurchasesTeamsSum = matchPurchasesTeams.length;

      const pond =
        (assert.asserts * round) /
        (matchOddsSum + matchPurchasesTeamsSum + matchPurchasesSum);

      return {
        fixture: assert.match,
        pond,
      };
    });

    return ponderation;
  } catch (error) {
    console.log(`Error calculating ponderation: ${error.message}`);
    throw error;
  }
}

// Finalmente, se ordenan los partidos por beneficios y se devuelven los primeros 3

async function processor(job) {
  try {
    const user_token = job.data.user_token; // user_token
    const purchases = await getAllPurchasesResults(user_token); // obtener todas las compras de un usuario

    const matches = await getMatchesByTeams(purchases); // obtener los partidos de los equipos que estaban involucrados en todas sus compras

    const asserts = await calculateAsserts(user_token, matches); // calcular cuantas veces ha acertado en todas las apuestas a los resultados

    const odds = await axios.get(
      `${process.env.ODDS_SERVICE_URL}/odds?league=${league}`
    ); // obtener las probabilidades de los partidos

    const round = 1; // round de la liga

    const recommendations = await calculatePonderation(asserts, round, odds); // calcular los beneficios de los partidos para cada liga

    
    const sortedRecommendations = recommendations
      .sort((a, b) => b.pond - a.pond)
      .slice(0, 3);

    await Promise.all(
      recommendations.map(async (recommendation) => {
        await saveRecommendation(user_token, recommendation.fixture.id);
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
