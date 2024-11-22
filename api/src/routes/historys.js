const Router = require('koa-router');
const router = new Router();

router.post('/', async (ctx) => {
  try {
    await Promise.all(ctx.request.body.history.map(async (receivedHistory) => {
      
      const historyToAdd = {
        goalsHome: receivedHistory.goals.home,
        goalsAway: receivedHistory.goals.away,
        fixtureId: receivedHistory.fixture.id,
        fixtureReferee: receivedHistory.fixture.referee,
        fixtureDate: receivedHistory.fixture.date,
        fixtureTimezone: receivedHistory.fixture.timezone,
        fixtureTimestamp: receivedHistory.fixture.timestamp,
        fixtureStatus: receivedHistory.fixture.status
      };

      await ctx.orm.History.create(historyToAdd);
    }));

    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

module.exports = router;