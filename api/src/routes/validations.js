const Router = require('koa-router');
const axios = require('axios');
const moment = require('moment');

const router = new Router();

async function findFixture(request) {
  try {
    const response = await axios.get(`${process.env.API_URL}/fixtures/find`, {
      params: {
        fixtureId: request.departureAirport,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error finding fixture:', error);
  }
}

async function findFixtureAndUpdateQuantity(request) {
  try {
    const fixture = await findFixture(request);

    let updatedQuantity = fixture.bonusQuantity;

    if (request.seller === 11) {
      updatedQuantity -= request.quantity;
    }

    await axios.patch(`${process.env.API_URL}/fixtures/${fixture.fixtureId}`, { bonusQuantity: updatedQuantity });
    console.log('fixture updated:', fixture.fixtureId);
  } catch (error) {
    console.error('Error updating fixture:', error);
  }
}

router.post('validations.create', '/', async (ctx) => {
    try {
      console.log("la validación lista paa crear en la api es:")
      console.log(ctx.request.body);
      const validation = await ctx.orm.Validation.create(ctx.request.body);
      const { valid } = validation;
      const { request_id } = validation;
  
      const response = await axios.get(`${process.env.API_URL}/requests/${request_id}`);
      const request = response.data;
  
      if (!valid) {
        console.log(`Compra rechazada para request ${request_id}`);
        await axios.patch(`${process.env.API_URL}/requests/${request_id}`, { status: 'rejected' });
        await findUserAndUpdateRequests(request);
        ctx.body = validation;
        ctx.status = 201;
        return;
      }
  
      console.log(`Compra aceptada para request ${request_id}`);
      await axios.patch(`${process.env.API_URL}/requests/${request_id}`, { status: 'accepted' });
      ctx.body = validation;
      ctx.status = 201;
    } catch (error) {
      ctx.body = { error: error.message };
      ctx.status = 400;
    }
  });

  module.exports = router;