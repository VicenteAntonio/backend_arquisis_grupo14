'use strict';

const Router = require('koa-router');
const router = new Router();
const axios = require('axios');


// Obtener el listado de todos los usuarios
router.get('/', async (ctx) => {
  try {
    const users = await ctx.orm.User.findAll();
    ctx.body = users;
    ctx.status = 200; // OK
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500; // Internal Server Error
  }
});

router.get('/:user_token', async (ctx) => {
  try {
    const { user_token } = ctx.params;

    // Buscar al usuario por su token
    const user = await ctx.orm.User.findOne({ where: { user_token } });
    if (!user) {
      ctx.body = { error: 'User not found' };
      ctx.status = 404; // Not Found
      return;
    }

    // Obtener las solicitudes relacionadas con el usuario
    const requestsResponse = await axios.get(`${process.env.API_URL}/requests`, {
      params: { deposit_token: user_token } // Cambié depositToken por user_token
    });
    const requests = requestsResponse.data; // Asegúrate de que sea un array

    // Extraer los IDs de los fixtures de las solicitudes
    const fixtureIds = requests.map(request => request.fixture_id).filter(id => id); // Filtra los IDs válidos
    if (fixtureIds.length === 0) {
      ctx.body = { message: 'No fixtures found for the user.' };
      ctx.status = 200; // OK, pero sin resultados
      return;
    }

    // Obtener los fixtures relacionados con las apuestas
    const fixturesResponse = await axios.get(`${process.env.API_URL}/fixtures/byids`, {
      params: { ids: fixtureIds.join(',') } // Envía los IDs como un string separado por comas
    });
    const fixtures = fixturesResponse.data; // Los fixtures obtenidos de la respuesta

    let totalAmountToAdd = 0; 

    for (const request of requests) {
      const fixture = fixtures.find(f => f.id === request.fixture_id); // Asegúrate de usar el campo correcto
      const wonBet = fixture && (
        (fixture.homeTeamWinner && request.betOnWinner === 'home') ||
        (fixture.awayTeamWinner && request.betOnWinner === 'away') ||
        (fixture.goalsHome === fixture.goalsAway && request.betOnWinner === 'draw')
      );

      // Si ganó la apuesta, añade dinero a la wallet
      if (wonBet && !request.reviewed) {
        let amountToAdd = 0;

        // Calcular el monto a añadir: quantity * 1000 * odds
        if (request.betOnWinner === 'home') {
          amountToAdd = request.quantity * 1000 * fixture.oddsHome; // Ganancia si apostó al equipo local
        } else if (request.betOnWinner === 'away') {
          amountToAdd = request.quantity * 1000 * fixture.oddsAway; // Ganancia si apostó al equipo visitante
        } else if (request.betOnWinner === 'draw') {
          amountToAdd = request.quantity * 1000 * fixture.oddsDraw; // Ganancia si apostó al empate
        }

        totalAmountToAdd += amountToAdd; // Sumar al total
        await axios.patch(`${process.env.API_URL}/requests/${request.id}`, {
          reviewed: true // Actualizar el estado de la solicitud
        });
      }
    }

    // Actualizar el saldo del usuario si corresponde
    if (totalAmountToAdd > 0) {
      await axios.patch(`${process.env.API_URL}/users/${user_token}`, {
        amount: totalAmountToAdd, // Monto a añadir
      });
    }

    ctx.body = user; // Retorna el usuario encontrado
    ctx.status = 200; // OK
  } catch (error) {
    console.error(error); // Log para la depuración
    ctx.body = { error: error.message };
    ctx.status = 500; // Internal Server Error
  }
});


// Crear un nuevo usuario
router.post('/', async (ctx) => {
  try {
    const newUser = await ctx.orm.User.create(ctx.request.body);
    ctx.body = newUser;
    ctx.status = 201; // Created
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400; // Bad Request
  }
});

// Verificar y actualizar el wallet de un usuario
router.patch('/:user_token', async (ctx) => {
    try {
      const user = await ctx.orm.User.findOne({ where: { user_token: ctx.params.user_token } });
      if (!user) {
        ctx.body = { error: 'User not found' };
        ctx.status = 404; // Not Found
        return;
      }
  
      const amount = parseInt(ctx.request.body.amount); // Obtener el valor enviado en el body
      if (isNaN(amount)) {
        ctx.body = { error: 'Invalid amount' };
        ctx.status = 400; // Bad Request
        return;
      }
  
      // Si la cantidad es positiva, sumarla a `wallet`
      if (amount > 0) {
        user.wallet += amount;
      } else if (amount < 0) {
        // Si la cantidad es negativa, verificar si puede restarse de `wallet`
        if (Math.abs(amount) > user.wallet) {
          ctx.body = { error: 'Insufficient funds in wallet' };
          ctx.status = 400; // Bad Request
          return;
        }
        user.wallet += amount; // Resta el valor negativo
      }
  
      // Guardar los cambios en la base de datos
      await user.save();
  
      ctx.body = user;
      ctx.status = 200; // OK
    } catch (error) {
      ctx.body = { error: error.message };
      ctx.status = 500; // Internal Server Error
    }
  });
  

// Borrar un usuario
router.delete('/:user_token', async (ctx) => {
  try {
    const user = await ctx.orm.User.findOne({ where: { user_token: ctx.params.user_token } });
    if (!user) {
      ctx.body = { error: 'User not found' };
      ctx.status = 404; // Not Found
      return;
    }

    await user.destroy();
    ctx.body = { message: 'User deleted successfully' };
    ctx.status = 200; // OK
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500; // Internal Server Error
  }
});

module.exports = router;
