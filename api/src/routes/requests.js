const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');

const router = new Router();

async function getUserIP() {
  try {
      const response = await axios.get('https://api.ipify.org?format=json');
      const userIP = response.data.ip;
      return userIP;
  } catch (error) {
      console.error('Error al obtener la IP del usuario:', error);
      return null;
  }
}
async function getLocationFromIP(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`);
    const data = response.data;
    if (data.status === 'fail') {
      return 'Unknown'; // Devuelve "Unknown" si falla
    }
    return `${data.city}, ${data.country}`;
  } catch (error) {
    console.error('Error al obtener la ubicación:', error);
    return 'Unknown'; // En caso de error, devuelve 'Unknown'
  }
}

router.post('requests.create', '/', async (ctx) => {
  try {
    console.log("en post de create de la api")
    const all_data_request = ctx.request.body;
    //caso se manda desde broker
    if (all_data_request.request_id) {
      const existingRequest = await ctx.orm.Request.findOne({
        where: { request_id: all_data_request.request_id }})
        // caso se manda desde broker y es un post desde otra parte
        if (!existingRequest){
          const userIP = await getUserIP();
          const location = await getLocationFromIP(userIP);
          console.log("la location es")
          console.log(location)
          all_data_request.location = location;
          all_data_request.datetime =  moment.utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
          all_data_request.seller = 0
          let request = await ctx.orm.Request.create(all_data_request);
          await findFixtureAndUpdatebonusQuantity(request, ctx)
          
          //await axios.post(process.env.REQUEST_URL, request);
          ctx.body = request;
        }
        // caso se manda desde broker y es un post local otra parte
        else{
          ctx.body = existingRequest;
        }
    }
    // caso se llega desde local
    else {
      console.log("EN EL IF DE SI ES QUE NO SE MANDÓ ID")
      // Aquí puedes proceder a crear la nueva solicitud
      all_data_request.request_id = uuidv4();
      const userIP = await getUserIP();
      const location = await getLocationFromIP(userIP);
      console.log("la location es")
      console.log(location)
      all_data_request.location = location;
      all_data_request.datetime =  moment.utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      all_data_request.seller = 0
      let request = await ctx.orm.Request.create(all_data_request);
      await axios.post(process.env.REQUEST_URL, request);
      const fixture = await findFixtureAndUpdatebonusQuantity(request, ctx)
      ctx.body = request;
    }

    
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

    const updatedbonusQuantity = fixture.bonusQuantity - request.quantity;
    console.log("el valor a actualizar es ")
    console.log(updatedbonusQuantity)
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

router.patch('requests.update', '/:request_id', async (ctx) => {
  try {
    const request = await ctx.orm.Request.findOne({
      where: { request_id: ctx.params.request_id },
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

router.get('requests.show', '/:request_id', async (ctx) => {
  try {
    const request = await ctx.orm.Request.findOne({
      where: { request_id: ctx.params.request_id },
    });
    if (request) {
      console.log("se encontró la request")
      ctx.body = request;
      ctx.status = 200;
    } else {
      console.log(ctx.params.request_id);
      console.log("no encontró la request");
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