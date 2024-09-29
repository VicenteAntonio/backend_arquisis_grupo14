const Router = require('koa-router');
const axios = require('axios');
const moment = require('moment');

const router = new Router();

async function findUser(request) {
    try {
        // Busca el usuario que realizó la solicitud
        const response = await axios.get(`${process.env.API_URL}/users/${request.userId}`);
        return response.data;
    } catch (error) {
        console.error('Error finding fixture:', error);
    }
}

router.post('validations.create', '/', async (ctx) => {
    try {
      console.log(ctx.request.body);
      const validation = await ctx.orm.Validation.create(ctx.request.body);
      const { valid } = validation;
      const { requestId } = validation;
  
      const response = await axios.get(`${process.env.API_URL}/requests/${requestId}`);
      const request = response.data;
  
      if (!valid) {
        console.log(`Predicción rechazada para request ${requestId}`);
        await axios.patch(`${process.env.API_URL}/requests/${requestId}`, { status: 'rejected' });
        await findUserAndUpdateRequests(request);
        ctx.body = validation;
        ctx.status = 201;
        return;
      }
  
      console.log(`Predicción aceptada para request ${requestId}`);
      await axios.patch(`${process.env.API_URL}/requests/${requestId}`, { status: 'accepted' });
      ctx.body = validation;
      ctx.status = 201;
    } catch (error) {
      ctx.body = { error: error.message };
      ctx.status = 400;
    }
  });