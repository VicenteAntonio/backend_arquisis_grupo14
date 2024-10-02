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
    all_data_request.request_id = uuidv4();
    if (all_data_request.group_id == "14"){
      const userIP = await getUserIP();
      const location = await getLocationFromIP(userIP);
      console.log("la location es")
      console.log(location)
      all_data_request.location = location;
      all_data_request.datetime =  moment.utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      all_data_request.seller = 0;
    }
    
    let request = await ctx.orm.Request.create(all_data_request);
    // si es que es un post desde el broker de otro grupo no se envía al broker para validar
    if (all_data_request.group_id == "14"){
          await axios.post(process.env.REQUEST_URL, all_data_request);
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
        fixtureId: request.fixtureId,
      },
    });

    const updatedbonusQuantity = fixture.bonusQuantity - request.bonusQuantity;

    await fixture.update({ bonusQuantity: updatedbonusQuantity });
    console.log('Fixture updated:', fixture.id);
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