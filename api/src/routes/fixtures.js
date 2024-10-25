const Router = require('koa-router');
const moment = require('moment-timezone');
const { Op } = require('sequelize');
const axios = require('axios'); 

const router = new Router();

// Muestra la información de llegada de la API y crea las fixtures de llegada
router.post('/fixtures.create', "/", async (ctx) => {
  try {
    await Promise.all(ctx.request.body.fixtures.map(async (receivedfixture) => {

      const fixtureToAdd = {
        homeTeamId: receivedfixture.teams.home.id,
        homeTeamName: receivedfixture.teams.home.name,
        HomeTeamLogo: receivedfixture.teams.home.logo,
        HomeTeamWinner: receivedfixture.teams.home.winner,
        awayTeamId: receivedfixture.teams.away.id,
        awayTeamName: receivedfixture.teams.away.name,
        awayTeamLogo: receivedfixture.teams.away.logo,
        awayTeamWinner: receivedfixture.teams.away.winner,
        goalsHome: receivedfixture.goals.home,
        goalsAway: receivedfixture.goals.away,
        leagueId: receivedfixture.league.id,
        leagueName: receivedfixture.league.name,
        leagueCountry: receivedfixture.league.country,
        leagueLogo: receivedfixture.league.logo,
        legaueFlag: receivedfixture.league.flag,
        leagueSeason: receivedfixture.league.season,
        leagueRound: receivedfixture.league.round,
        fixtureId: receivedfixture.fixture.id,
        fixtureReferee: receivedfixture.fixture.referee,
        fixtureDate: receivedfixture.fixture.date,
        fixtureTimezone: receivedfixture.fixture.timezone,
        fixtureTimestamp: receivedfixture.fixture.timestamp,
        fixtureStatus: receivedfixture.fixture.status,
        oddsId: receivedfixture.odds[0].id,
        oddsName: receivedfixture.odds[0].name,
        oddsHome: parseFloat(receivedfixture.odds[0].values[0].odd),
        oddsDraw: parseFloat(receivedfixture.odds[0].values[1].odd),
        oddsAway: parseFloat(receivedfixture.odds[0].values[2].odd),
        result: `${receivedfixture.goals.home} - ${receivedfixture.goals.away}`
      };

      await ctx.orm.Fixture.create(fixtureToAdd);
    }));
  
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

// Endpoint para mostrar los partidos, maximo 25 partidos por página.
// Permite filtrar los partidos según el equipo home, away y fecha del partido. 
// Ejemplo: {url}/fixtures?home=Leicester&away=Bournemouth&date=2024-10-5
// Ejemplo: {url}/fixtures?page=2&count=25

router.get('fixtures.list', '/', async (ctx) => {
  try {
    const page = parseInt(ctx.query.page) || 1;
    const count = parseInt(ctx.query.count) || 25;
    const offset = (page - 1) * count;

    const { home } = ctx.query;
    const { away } = ctx.query;
    const { date } = ctx.query;

    const filterOptions = {};
    if (home) filterOptions.homeTeamName = home;
    if (away) filterOptions.awayTeamName = away;
    // El filtro por date ignora las fechas ya pasadas
    if (date) {
      const currentDate = moment().tz('America/Santiago').toDate();
      const filterDate = moment.utc(date).toDate();
      if (moment(filterDate).isSameOrAfter(currentDate, 'day')) {
        filterOptions.fixtureDate = {
          [Op.gte]: filterDate,
        };
      } else {
        ctx.body = { error: 'Invalid date' };
        ctx.status = 400;
        return;
      }
    }

    const fixtures = await ctx.orm.Fixture.findAndCountAll({
      where: filterOptions,
      limit: count,
      offset,
    });

    const totalCount = await ctx.orm.Fixture.count({ where: filterOptions });

    let lastUpdate;
    if (fixtures.count > 0) {
      lastUpdate = moment(fixtures.rows[0].createdAt).tz('America/Santiago');
    } else {
      lastUpdate = new Date();
    }

    ctx.body = {
      lastUpdate,
      page,
      count,
      totalCount,
      fixtures: fixtures.rows,
    };
    ctx.status = 200;

  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});
router.get('fixtures.findbyids', '/byids', async (ctx) => {
  try {
    // Obtener los IDs de la cadena de consulta
    const fixtureIds = ctx.query.ids.split(',').map(Number); // Convierte a números para evitar problemas con tipos
    console.log("en la ruta byids los fixtures ids son")
    console.log(fixtureIds)
    // Comprobar si se recibieron IDs válidos
    if (!fixtureIds.length) {
      ctx.status = 400; // Bad Request
      ctx.body = { error: 'No fixture IDs provided' };
      return;
    }

    console.log("Los fixture IDs son:", fixtureIds);

    // Buscar los fixtures en la base de datos
    const fixtures = await ctx.orm.Fixture.findAll({
      where: { fixtureId: fixtureIds }
    });

    // Comprobar si se encontraron fixtures
    if (fixtures.length === 0) {
      ctx.status = 404; // Not Found
      ctx.body = { error: 'No fixtures found for the provided IDs' };
      return;
    }

    // Responder con los fixtures encontrados
    ctx.body = fixtures;
    ctx.status = 200; // OK
  } catch (error) {
    // Manejo de errores
    console.error('Error al obtener los fixtures:', error); // Log para depuración
    ctx.status = 500; // Internal Server Error
    ctx.body = { error: 'Error al obtener los fixtures' };
  }
});

// Endpoint para encontrar partidos según la id de llegada a la base de datos
// Ejemplo: {url}/fixtures/1

router.get('fixtures.find', '/:id', async (ctx) => {
  try {
    const fixture = await ctx.orm.Fixture.findOne({
      where: { fixtureId: ctx.params.id }  // Cambia 'fixtureId' si tu atributo tiene otro nombre
    });
    if (fixture) {
      ctx.body = fixture;
      ctx.status = 200;
    } else {
      ctx.body = { error: 'Fixture not found' };
      ctx.status = 404;
    }
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

// Endpoint para encontrar un partido según su fixtureId
// Ejemplo: {url}/fixtures/fixture/1

router.get('fixtures.find', '/fixture/:fixtureId', async (ctx) => {
  try {
    const fixture = await ctx.orm.Fixture.findOne({
      where: { fixtureId: ctx.params.fixtureId },
    });
    if (fixture) {
      ctx.body = fixture;
      ctx.status = 200;
    } else {
      ctx.body = { error: 'Fixture not found' };
      ctx.status = 404;
    }
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

router.patch('fixtures.update', '/:fixture_id', async (ctx) => {
  try {
    const fixture = await ctx.orm.Fixture.findOne({
      where: { fixtureId: ctx.params.fixture_id },
    });
    if (!fixture) {
      ctx.body = { error: 'Request not found' };
      ctx.status = 404;
      return;
    }
    await fixture.update(ctx.request.body);
    ctx.body = fixture;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.put('fixtures.updateHistory', '/history', async (ctx) => {
  try {
    if (!ctx.request.body || !ctx.request.body.fixtures) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid request body' };
      return;
    }
    await Promise.all(ctx.request.body.fixtures.map(async (receivedfixture) => {
      let fixturesToUpdate = {};
      console.log("se está revisando una history")
      console.log("los goles son:")
      console.log("home" + receivedfixture.goals.home)
      console.log("away" + receivedfixture.goals.away)
      if ( receivedfixture.goals.home > receivedfixture.goals.away){
         fixturesToUpdate = {
          fixtureId: receivedfixture.fixture.id,
          fixtureReferee: receivedfixture.fixture.referee,
          fixtureTimezone: receivedfixture.fixture.timezone,
          fixtureStatus: receivedfixture.fixture.status,
          goalsHome: receivedfixture.goals.home,
          goalsAway: receivedfixture.goals.away,
          homeTeamWinner: true,
          awayTeamWinner: false
        };
      }
      else if (receivedfixture.goals.home < receivedfixture.goals.away){
        fixturesToUpdate = {
          fixtureId: receivedfixture.fixture.id,
          fixtureReferee: receivedfixture.fixture.referee,
          fixtureTimezone: receivedfixture.fixture.timezone,
          fixtureStatus: receivedfixture.fixture.status,
          goalsHome: receivedfixture.goals.home,
          goalsAway: receivedfixture.goals.away,
          homeTeamWinner: false,
          awayTeamWinner: true
        };
      }
      else if (receivedfixture.goals.home == receivedfixture.goals.away){
         fixturesToUpdate = {
          fixtureId: receivedfixture.fixture.id,
          fixtureReferee: receivedfixture.fixture.referee,
          fixtureTimezone: receivedfixture.fixture.timezone,
          fixtureStatus: receivedfixture.fixture.status,
          goalsHome: receivedfixture.goals.home,
          goalsAway: receivedfixture.goals.away,
          homeTeamWinner: false,
          awayTeamWinner: false 
        };
      }

      try {
        const response = await axios.get(`${process.env.API_URL}/fixtures/${fixturesToUpdate.fixtureId}`);
        const fixture = response.data;
    
        console.log(`Fixture encontrada`);
        console.log(fixture);
    
        if (fixture) {
          console.log("El partido está presente");
          try {
            const response = await axios.patch(`${process.env.API_URL}/fixtures/${receivedfixture.fixture.id}`, fixturesToUpdate);
            
            if (response.status === 200) {
              console.log(`Partido actualizado exitosamente`);
            } else {
              console.log(`Error al actualizar el partido`);
            }
          } catch (error) {
            console.error(`Error al hacer PATCH al fixture`);
            ctx.body = { error: error.message };
            ctx.status = 400; // Bad Request
          }
        } else {
          console.log("El partido no está presente");
        }
      } catch (error) {
        console.error(`Error fetching fixture`, error.message);
      }
    }));

    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.delete('/fixtures.deleteAll', '/', async (ctx) => {
  try {
    const deletedFixtures = await ctx.orm.Fixture.destroy({
      where: {},
      truncate: true, // Esto elimina todas las filas y reinicia los IDs
    });

    ctx.body = { message: `${deletedFixtures} fixtures eliminados` };
    ctx.status = 200; // OK
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500; // Internal Server Error
  }
});

module.exports = router;