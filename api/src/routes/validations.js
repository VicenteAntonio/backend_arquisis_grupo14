const Router = require('koa-router');
const axios = require('axios');
const moment = require('moment');
const dotenv = require('dotenv');

const router = new Router();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function findFixture(request) {
  try {
    const response = await axios.get(`${process.env.API_URL}/fixtures/${request.fixture_id}`);
    console.log('Respuesta de fixture:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error finding fixture:', error);
  }
}

async function createFixtureRecommendation(request) {
  try {
    console.log('Creating fixture recommendations');
    const fixture = await findFixture(request);
    const user_token = request.user_token;
    await axios.post(`${process.env.JOBS_MASTER_URL}/job`, { fixture, user_token });
  } catch (error) {
    console.error('Error sending fixture info to JobsMaster:', error);
  }
}

async function findFixtureAndUpdatebonusQuantity(request, ctx) {
  try {
    console.log('Buscando fixture con fixtureId para actualizar:', request.fixture_id);
    const fixture = await ctx.orm.Fixture.findOne({
      where: {
        fixtureId: request.fixture_id,
      },
    });

    if (!fixture) {
      console.log('Fixture no encontrado para fixtureId:', request.fixture_id);
      return;
    }

    const updatedbonusQuantity = fixture.bonusQuantity + request.quantity;
    console.log('Nuevo valor de bonusQuantity:', updatedbonusQuantity);

    const url = `${process.env.API_URL}/fixtures/${fixture.fixtureId}`;
    console.log('URL para actualizar fixture:', url);

    const data = {
      bonusQuantity: updatedbonusQuantity,
    };

    const response = await axios.patch(url, data);
    console.log('Fixture actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating fixture:', error);
  }
}

router.post('validations.create', '/', async (ctx) => {
  try {
    console.log('Iniciando validación de la request:', ctx.request.body);

    const validation = await ctx.orm.Validation.create(ctx.request.body);
    const { valid, request_id, quantity } = validation;
    console.log('Validación creada:', validation);
    
    await delay(1000);

    console.log('Consultando detalles de la request con ID:', request_id);
    const response = await axios.get(
      `${process.env.API_URL}/requests/${request_id}`
    );
    console.log('Respuesta de la API para la request:', response.data);

    const request = response.data;
    const user_token = request.user_token;
    const cantidad = request.quantity;
    console.log('Valor de user_token recibido:', user_token);
    console.log('Valor de user_token recibido:', user_token);

    if (request.status === 'rejected') {
      console.log(
        `Request ya fue rechazada por insuficiencia de fondos: ${request_id}`
      );
      ctx.body = validation;
      ctx.status = 201;
      return;
    }

    if (!valid) {
      console.log(`Compra rechazada para request ${request_id}`);
      await axios.patch(`${process.env.API_URL}/requests/${request_id}`, {
        status: 'rejected',
      });
      await findFixtureAndUpdatebonusQuantity(request, ctx);
      ctx.body = validation;
      ctx.status = 201;
      return;
    }

    if (valid) {
      createFixtureRecommendation(request, ctx)
    }

    console.log(`Compra aceptada para request ${request_id}`);
    await axios.patch(`${process.env.API_URL}/requests/${request_id}`, {
      status: 'accepted',
    });

    if (request.wallet) {  
      console.log(`Actualizando el wallet del usuario con token ${user_token}`);
      await axios.patch(`${process.env.API_URL}/users/${user_token}`, {
        amount: -(cantidad * 1000),
      });}

    ctx.body = validation;
    ctx.status = 201;
  } catch (error) {
    console.log('Error en la validación:', error.message);
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});


module.exports = router;

module.exports = router;
