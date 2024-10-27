const Router = require('koa-router');
const axios = require('axios');
const moment = require('moment');

const router = new Router();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function findFixtureAndUpdatebonusQuantity(request, ctx) {
  try {
    const fixture = await ctx.orm.Fixture.findOne({
      where: {
        fixtureId: request.fixture_id,
      },
    });

    const updatedbonusQuantity = fixture.bonusQuantity + request.quantity;
    const url = `${process.env.API_URL}/fixtures/${fixture.fixtureId}`;

    // Datos a enviar en el cuerpo de la solicitud
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
    const validation = await ctx.orm.Validation.create(ctx.request.body);
    const { valid, request_id, quantity } = validation;
    await delay(1000);

    const response = await axios.get(
      `${process.env.API_URL}/requests/${request_id}`
    );
    const request = response.data;

    // Obtener el token desde la request
    const user_token = request.user_token;
    const cantidad = request.quantity;
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

    // Si es accepted, restar al wallet del usuario
    console.log(`Compra aceptada para request ${request_id}`);
    await axios.patch(`${process.env.API_URL}/requests/${request_id}`, {
      status: 'accepted',
    });

    // Actualizar el wallet del usuario
    console.log(`Compra token ${user_token}`);
    await axios.patch(`${process.env.API_URL}/users/${user_token}`, {
      amount: -(cantidad * 1000),
    });

    ctx.body = validation;
    ctx.status = 201;
  } catch (error) {
    console.log('Error en la validación:', error.message);
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

module.exports = router;
