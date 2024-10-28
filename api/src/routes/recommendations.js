const Router = require('koa-router');
const axios = require('axios');

const router = new Router();

router.post('recommendations.create', '/', async (ctx) => {
  try {
    console.log(ctx.request.body);
    const recommendation = await ctx.orm.Recommendation.create(ctx.request.body);
    ctx.body = recommendation;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.get('recommendations.list', '/', async (ctx) => {
  try {
    const { username } = ctx.query;
    if (!username) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid username' };
      return;
    }
    const recommendations = await ctx.orm.Recommendation.findAll({
      where: { username },
      limit: 3,
      order: [['createdAt', 'DESC']],
    });

    const fixturesRecommendations = await Promise.all(
      recommendations.map(async (recommendation) => {
        const fixture = await ctx.orm.Fixture.findByPk(recommendation.fixtureId);
        return { recommendation, fixture };
      }),
    );

    ctx.body = fixturesRecommendations;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

router.get('/heartbeat', async (ctx) => {
  try {
    const response = await axios.get(`${process.env.JOBS_MASTER_URL}/heartbeat`);
    console.log(response.data);
    ctx.body = response.data;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

module.exports = router;