const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');
const { tx } = require('../utils/trx');

const router = new Router();

router.post('requests.create', '/', async (ctx) => {
  try {
    if (ctx.request.body.groupId === '14') {
      ctx.request.body.requestId = uuidv4();
      ctx.request.body.datetime = moment().tz('America/Santiago').format();
    }
    let request = await ctx.orm.Request.create(ctx.request.body);
    const { groupId } = request;
    const { bonusbonusQuantity } = request;

    if (groupId === '14' && bonusQuantity > 0) {
      const amount = Number(bonusQuantity);

      await ctx.orm.Request.update(
        { depositToken: "" },
        { where: { requestId: request.requestId } },
      );
      request = await ctx.orm.Request.findOne({
        where: { requestId: request.requestId },
      });

      if (request) {
        await axios.post(process.env.REQUEST_URL, request);
      }
    }
    ctx.body = request;
    ctx.status = 201;
  } catch (error) {
    console.log(error.message);
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

async function findFixtureAndUpdatebonusQuantity(request, ctx) {
  try {
    const fixture = await ctx.orm.Fixture.findOne({
      where: {
        fixtureId: request.fixture_id,
      },
    });

    const updatedbonusQuantity = fixture.bonusbonusQuantity - request.bonusQuantity;

    await fixture.update({ bonusQuantity: updatedbonusQuantity });
    console.log('Fixture updated:', fixture.id);
  } catch (error) {
    console.error('Error updating fixture:', error);
  }
}

router.patch('requests.update', '/:requestId', async (ctx) => {
  try {
    const request = await ctx.orm.Request.findOne({
      where: { requestId: ctx.params.requestId },
    });
    if (!request) {
      ctx.body = { error: 'Request not found' };
      ctx.status = 404;
      return;
    }
    await request.update(ctx.request.body);
    ctx.body = request;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.get('requests.show', '/:requestId', async (ctx) => {
  try {
    const request = await ctx.orm.Request.findOne({
      where: { requestId: ctx.params.requestId },
    });
    if (request) {
      ctx.body = request;
      ctx.status = 200;
    } else {
      ctx.body = { error: 'Request not found' };
      ctx.status = 404;
    }
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.get('requests.list', '/', async (ctx) => {
  try {
    const { username } = ctx.query;
    if (username) {
      const requests = await ctx.orm.Request.findAll({
        where: { username },
      });
      ctx.body = requests;
      ctx.status = 200;
    } else {
      ctx.status = 400;
      ctx.body = { error: 'Invalid username' };
    }
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

module.exports = router;