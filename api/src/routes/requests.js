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
    console.log("En post de create de la API");
    

    const all_data_request = ctx.request.body;
    
    // Obtener el user_token
    const user_token = all_data_request.user_token;

    console.log("Datos recibidos en el body:", all_data_request);

    // Agregar un log para ver qué valor está recibiendo como user_token
    console.log("Valor de user_token recibido:", `${user_token}`);
    let user;

    if (user_token !== undefined) {
      // Hacer la solicitud a la API de usuarios para obtener el wallet
      try {
          const userResponse = await axios.get(`${process.env.API_URL}/users/${user_token}`);
          user = userResponse.data;
          // Aquí puedes manejar los datos del usuario
      } catch (error) {
          console.error("Error al obtener el usuario:", error);
          // Maneja el error aquí, por ejemplo, devolviendo una respuesta de error
      }
    }

    // Verificar si el wallet es suficiente
    const totalAmountRequired = all_data_request.quantity * 1000;

    console.log("estoy aqui 1")
    // si lo hicimos nosotros
    if (user){
      console.log("se encontró al usuario")
      if (totalAmountRequired > user.wallet) {
        console.log("Fondos insuficientes, la solicitud será rechazada");
        
        // Rechazar la solicitud si no tiene suficientes fondos
        all_data_request.status = 'rejected';
  
        let request = await ctx.orm.Request.create(all_data_request);
        ctx.body = request;
        ctx.status = 200; // Bad Request
        return;
      }
    }

    console.log("estoy aqui 2")
  

    // Hacer la solicitud a la API de fixtures para obtener el bonusQuantity
    const fixtureResponse = await axios.get(`${process.env.API_URL}/fixtures/${all_data_request.fixture_id}`);
    const fixture = fixtureResponse.data;

    if (!fixture) {
      console.log("no se encuentra la fixture")
      ctx.body = { error: 'Fixture not found' };
      ctx.status = 404;
      return;
    }

    console.log("estoy aqui 3")

    // Verificar si el bonusQuantity es suficiente
    const bonusQuantity = fixture.bonusQuantity;
    console.log(`Bonus quantity for fixture ${all_data_request.fixture_id}: ${bonusQuantity}`);

    if (all_data_request.quantity > bonusQuantity) {
      console.log("Bonus quantity insuficiente, la solicitud será rechazada");

      // Rechazar la solicitud si no hay suficiente bonusQuantity
      all_data_request.status = 'rejected';

      let request = await ctx.orm.Request.create(all_data_request);
      ctx.body = request;
      ctx.status = 201; 
      return;
    }

    // Si tiene suficiente bonusQuantity, proceder con la creación de la solicitud
    console.log("Bonus quantity suficiente, creando solicitud...");
    all_data_request.request_id = uuidv4();
    const userIP = await getUserIP();
    const location = await getLocationFromIP(userIP);

    all_data_request.location = location;
    all_data_request.datetime = moment.utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    all_data_request.seller = 0;

    // Crear la request
    console.log("se creará la request pending en la base de datos")
    let request = await ctx.orm.Request.create(all_data_request);

    // Hacer el POST a otra URL si es necesario
    console.log("se verá si se va a enviar al broker")
    const wallet = all_data_request.wallet;
    if (user_token !== undefined && wallet == true){
      console.log("se enviará al broker")
      await axios.post(process.env.REQUEST_URL, request);
    }
    console.log(" no se enviará al broker")
   

    // Actualizar la cantidad del fixture si corresponde
    const updatedFixture = await findFixtureAndUpdatebonusQuantity(request, ctx);

    ctx.body = request;
    ctx.status = 201; // Created
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
    const previousDepositToken = request.deposit_token;

    // Actualizar la solicitud con los datos del cuerpo de la petición
    await request.update(ctx.request.body);

    // Verificar si el deposit_token ha cambiado
    if (previousDepositToken !== request.deposit_token) {
      // Si ha cambiado, enviar la actualización al broker
      await axios.post(process.env.REQUEST_URL, request);;
    }
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
    const { user_token } = ctx.query;
    if (user_token) {
      const requests = await ctx.orm.Request.findAll({
        where: { user_token },
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

router.get('requests.all', '/list_all', async (ctx) => {
  try {
      const requests = await ctx.orm.Request.findAll({
      });
      ctx.body = requests;
      ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
})

module.exports = router;