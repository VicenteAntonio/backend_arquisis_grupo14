'use strict';

const Router = require('koa-router');
const router = new Router();
const axios = require('axios');
const { verifyToken, isAdmin } = require('../../utils/authorization');

// Obtener el listado de todos los usuarios
router.get('/', async (ctx) => {
  console.log('se está intentando obtener los usuarios');
  try {
    const users = await ctx.orm.User.findAll();
    ctx.body = users;
    ctx.status = 200; // OK
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500; // Internal Server Error
  }
});

// Obtener un usuario y actualizar su saldo basado en las apuestas ganadas
router.get('/:user_token', verifyToken , async (ctx) => {
  console.log("AAAAAA user_token", ctx);
  try {
    const { user_token } = ctx.params // Obtener el token del header
    const token = ctx.request.header.authorization.split(' ')[1];
    // Buscar al usuario por su token
    let user;
    try {
      user = await ctx.orm.User.findOne({ where: { user_token } }); /// +LOG
      console.log("--user", user); /// +LOG
    } catch (error) {
      console.error('Error buscando al usuario:', error); // Log para la depuración
      ctx.body = { error: 'Error buscando al usuario' };
      ctx.status = 500; // Internal Server Error
      return;
    }

    if (!user) {
      ctx.body = { error: 'User not found' };
      ctx.status = 404; // Not Found
      return;
    }

    // Obtener las solicitudes relacionadas con el usuario
    let requestsResponse;
    try {
      requestsResponse = await axios.get(`${process.env.API_URL}/requests`, {
        headers:{
          Authorization: `Bearer ${token}`,
        },
        params: { user_token: user_token }, // Cambié depositToken por user_token
      }); // +LOG
      console.log("requestsResponse", requestsResponse); /// +LOG
    } catch (error) {
      console.error('Error obteniendo las solicitudes aaaaa:', error); // Log para la depuración
      ctx.body = { error: 'Error obteniendo las solicitudes' };
      ctx.status = 500; // Internal Server Error
      return;
    }

    const requests = requestsResponse.data; // Asegúrate de que sea un array

    // Verificar si hay solicitudes
    if (!requests || requests.length === 0) {
      ctx.body = user;
      ctx.status = 200; // OK, pero sin solicitudes
      return;
    }

    // Extraer los IDs de los fixtures de las solicitudes
    const fixtureIds = requests
      .map((request) => request.fixture_id)
      .filter((id) => id); // Filtra los IDs válidos
    if (fixtureIds.length === 0) {
      ctx.body = { message: 'No fixture IDs found in requests.' };
      ctx.status = 200; // OK, pero sin resultados
      return;
    }
    console.log('los fixtures ids son');
    console.log(fixtureIds);

    // Obtener los fixtures relacionados con las apuestas
    let fixturesResponse;
    try {
      fixturesResponse = await axios.get(
        `${process.env.API_URL}/fixtures/byids`,
        {
          params: { ids: fixtureIds.join(',') }, // Envía los IDs como un string separado por comas
        }
      ); // +LOG
      console.log("fixturesResponse", fixturesResponse); /// +LOG
    } catch (error) {
      console.error('Error obteniendo los fixtures:', error); // Log para la depuración
      ctx.body = { error: 'Error obteniendo los fixtures' };
      ctx.status = 500; // Internal Server Error
      return;
    }

    const fixtures = fixturesResponse.data; // Los fixtures obtenidos de la respuesta
    console.log('las fixtures a revisar son');
    console.log(fixtures);
    let totalAmountToAdd = 0;

    for (const request of requests) {
      console.log('se está revisando una request');
      const fixture = fixtures.find((f) => f.fixtureId === request.fixture_id); // Asegúrate de usar el campo correcto
      console.log('la fixture encontrada es');
      console.log(fixture);
      const wonBet =
        fixture &&
        ((fixture.homeTeamWinner && request.result === 'home') ||
          (fixture.awayTeamWinner && request.result === 'away') ||
          (fixture.goalsHome === fixture.goalsAway &&
            request.result === 'draw'));

      // Si ganó la apuesta, añade dinero a la wallet
      if (wonBet && !request.reviewed) {
        let amountToAdd = 0;

        // Calcular el monto a añadir: quantity * 1000 * odds
        if (request.result === 'home') {
          amountToAdd = request.quantity * 1000 * fixture.oddsHome; // Ganancia si apostó al equipo local
        } else if (request.result === 'away') {
          amountToAdd = request.quantity * 1000 * fixture.oddsAway; // Ganancia si apostó al equipo visitante
        } else if (request.result === 'draw') {
          amountToAdd = request.quantity * 1000 * fixture.oddsDraw; // Ganancia si apostó al empate
        }

        totalAmountToAdd += amountToAdd; // Sumar al total

        // Actualizar el estado de la solicitud
        try {
          await axios.patch(
            `${process.env.API_URL}/requests/${request.request_id}`,
            {
              reviewed: true, // Actualizar el estado de la solicitud
            }, // +LOG
            {
              headers:
              {
                Authorization: `Bearer ${token}`,
              }
            }
          );
          console.log('se actualizó la request');
        } catch (error) {
          console.error(
            `Error actualizando la solicitud ${request.id}:`,
            error
          );
          ctx.body = { error: 'Error actualizando la solicitud' };
          ctx.status = 500; // Internal Server Error
          return;
        }
      }
    }

    // Actualizar el saldo del usuario si corresponde
    if (totalAmountToAdd > 0) {
      try {
        await axios.patch(`${process.env.API_URL}/users/${user_token}`, {
          amount: totalAmountToAdd, // Monto a añadir
        }, {
          headers:
          {
            Authorization: `Bearer ${token}`,
          }
        }); // +LOG
        console.log('se actualizó el saldo del usuario'); /// +LOG
      } catch (error) {
        console.error(
          `Error actualizando el saldo del usuario ${user_token}:`,
          error
        );
        ctx.body = { error: 'Error actualizando el saldo del usuario' };
        ctx.status = 500; // Internal Server Error
        return;
      }
    }

    ctx.body = user; // Retorna el usuario encontrado
    ctx.status = 201; // OK
  } catch (error) {
    console.error('Error general:', error); // Log para la depuración
    ctx.body = { error: error.message };
    ctx.status = 500; // Internal Server Error
  }
});

// Crear un nuevo usuario
router.post('/', async (ctx) => {
  try {
    console.log("Creando un nuevo usuario");
    console.log("Body", ctx.request.body);
    const newUser = await ctx.orm.User.create(ctx.request.body);
    // console.log("Usuario creado correctamente", newUser);
    // const token = generateToken(newUser);
    console.log("Token generado correctamente");
    ctx.body = { user: newUser };
    ctx.status = 201; // Created
  } catch (error) {
    console.error('Error creando el usuario:', error);
    ctx.body = { error: error.message };
    ctx.status = 400; // Bad Request
  }
});

// Verificar y actualizar el wallet de un usuario
router.patch('/:user_token', verifyToken, isAdmin, async (ctx) => {
  try {
    const user = await ctx.orm.User.findOne({
      where: { user_token: ctx.params.user_token },
    });
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
    console.log('Error actualizando la wallet:', error);
    ctx.body = { error: error.message };
    ctx.status = 500; // Internal Server Error
  }
});

// Borrar un usuario
router.delete('/:user_token', verifyToken, async (ctx) => {
  try {
    const user = await ctx.orm.User.findOne({
      where: { user_token: ctx.params.user_token },
    });
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
