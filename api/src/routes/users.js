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
