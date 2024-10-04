'use strict';

const Router = require('koa-router');
const router = new Router();

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

// Obtener un usuario por su token
router.get('/:user_token', async (ctx) => {
  try {
    const user = await ctx.orm.User.findOne({ where: { user_token: ctx.params.user_token } });
    const requests = await axios.get(`${process.env.API_URL}/requests`, {
      params: { deposit_token: depositToken } // Pasando el token como parámetro de consulta
    });
    const fixtureIds = requests.map(request => request.fixture_id);
    const fixtures = await ctx.orm.Fixture.findAll({
      where: { id: fixtureIds }
    });

    let totalAmountToAdd = 0; 

      for (const request of requests) {
        const fixture = fixtures.find(f => f.id === request.fixtureId);
        const wonBet = fixture && (
          (fixture.HomeTeamWinner && request.betOnWinner === 'home') ||
          (fixture.awayTeamWinner && request.betOnWinner === 'away') ||
          (fixture.goalsHome === fixture.goalsAway && request.betOnWinner === 'draw')
        );

        // Si ganó la apuesta, añade dinero a la wallet
        if (wonBet && !request.reviewed) {
          // Determinar el monto a añadir según el tipo de apuesta
          let amountToAdd = 0;

          // Calcular el monto a añadir: quantity * 1000 * odds
          if (request.betOnWinner === 'home') {
            amountToAdd = request.quantity * 1000 * fixture.oddsHome; // Ganancia si apostó al equipo local
          } else if (request.betOnWinner === 'away') {
            amountToAdd = request.quantity * 1000 * fixture.oddsAway; // Ganancia si apostó al equipo visitante
          } else if (request.betOnWinner === 'draw') {
            amountToAdd = request.quantity * 1000 * fixture.oddsDraw; // Ganancia si apostó al empate
          }
          if (wonBet) {
            totalAmountToAdd += amountToAdd;
          }}
          await axios.patch(`${process.env.API_URL}/requests/${request.id}`, {
            reviewed: true // Asumiendo que tienes un atributo `reviewed` en tu request
          });
        }


      if (totalAmountToAdd > 0) {
        const userToken = ctx.params.user_token; // Suponiendo que tienes el user_token en el contexto del estado
        await axios.patch(`${process.env.API_URL}/users/${userToken}`, {
          amount: totalAmountToAdd, // Monto a añadir
        });
      }

    if (!user) {
      ctx.body = { error: 'User not found' };
      ctx.status = 404; // Not Found
      return;
    }
    ctx.body = user;
    ctx.status = 200; // OK
  } catch (error) {
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
