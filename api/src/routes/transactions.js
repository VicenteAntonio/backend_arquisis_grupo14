const Router = require('koa-router');
const tx = require('../../utils/trx');; // Manteniendo la importación de tx

//const trxRouter = new Router();
const router = new Router();

// Crear una nueva transacción
router.post('/create', async (ctx) => {
  try {
    const { request_id, quantity } = ctx.request.body;

    // Buscar la solicitud
    const request = await ctx.orm.Request.findOne({
      where: {
        request_id: request_id,
      }
    });

    if (!request) {
      ctx.body = { message: "Request no encontrada" };
      ctx.status = 404;
      return;
    }

    const amount = quantity * 1000;

    const newTrx = await ctx.orm.Transaction.create({
      data: {
        request_id,
        amount,
        status: "pending"
      }
    });
    console.log("New Transaction:", newTrx);
    const transactionId = newTrx.id.toString(); 

    console.log("Creating transaction with:", {
      id: transactionId,
      commerceCode: "test-iic2173",
      amount,
      redirectUrl: process.env.REDIRECT_URL || "http://localhost:5175/completed-purchase"
    });
    if (!newTrx || !transactionId || typeof transactionId !== 'string') {
      ctx.body = { error: "ID de transacción inválido" };
      ctx.status = 500;
      return;
    }
    const commerceCode = "test-iic2173";
    const redirectUrl = process.env.REDIRECT_URL || "http://localhost:5175/completed-purchase";

    // Validar el tipo de comercio y la URL de redirección
    if (typeof commerceCode !== 'string' || typeof redirectUrl !== 'string') {
      ctx.body = { error: "Commerce Code o Redirect URL inválidos" };
      ctx.status = 500;
      return;
    }

    const trx = await tx.create(transactionId, "test-iic2173", amount, process.env.REDIRECT_URL || "http://localhost:5175/completed-purchase");

    await ctx.orm.Transaction.update(
      { token: trx.token }, // Aquí van los datos que quieres actualizar
      {
        where: { id: newTrx.id }, // Aquí especificas la condición
      }
    );

    ctx.body = trx;
    ctx.status = 201;
  } catch (e) {
    console.log(e);
    ctx.status = 500;
    ctx.body = { error: "Error al crear la transacción" };
  }
});

// Actualizar la transacción según los resultados
router.post('/commit', async (ctx) => {
  const { ws_token } = ctx.request.body;
  console.log("el token recibido en commit es", ws_token)

  if (!ws_token) {
    ctx.status = 200;
    ctx.body = { message: "Transacción anulada por el usuario" };
    return;
  }

  const confirmedTx = await tx.commit(ws_token);
  
  console.log("el confirmedTx es", confirmedTx)

  if (confirmedTx.response_code !== 0) { // Transacción rechazada
    const trx = await ctx.orm.Transaction.update(
      { status: "rejected" }, 
      { where: { transaction_token: ws_token } }
    );

    ctx.status = 200;
    ctx.body = {
      message: "Transacción rechazada",
      request_id: trx.request_id,
      amount: trx.amount,
    };
    return;
  }

  // Transacción aceptada
  const trx = await ctx.orm.Transaction.update(
    { status: "completed" }, 
    { where: { transaction_token: ws_token } }
  );

  ctx.status = 200;
  ctx.body = {
    message: "Transacción aceptada",
    request_id: trx.request_id,
    amount: trx.amount,
  };
});


//module.exports = { trxRouter };
module.exports = router;