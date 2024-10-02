const Router = require('koa-router');
const moment = require('moment-timezone');
const { Op } = require('sequelize');

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
        LeagueRound: receivedfixture.league.round,
        fixtureId: receivedfixture.fixture.id,
        fixtureReferee: receivedfixture.fixture.referee,
        fixtureDate: receivedfixture.fixture.date,
        fixtureTimezone: receivedfixture.fixture.timezone,
        fixtureTimestamp: receivedfixture.fixture.timestamp,
        fixtureStatus: receivedfixture.fixture.status,
        oddsId: receivedfixture.odds.id,
        oddsName: receivedfixture.odds.name,
        oddsValue: receivedfixture.odds.value,
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

module.exports = router;