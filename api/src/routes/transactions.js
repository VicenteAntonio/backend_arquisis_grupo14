const Router = require('koa-router');
const tx = require('../../utils/trx');
const axios = require('axios'); 

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

async function sendValidationToBroker(request_id, group_id, seller, valid) {
  try {
    const validationData = {
      request_id,
      group_id,
      seller,
      valid
    };
    console.log('Sending validation to broker:', process.env.VALIDATION_URL, validationData);

    await axios.post(process.env.VALIDATION_URL, validationData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Validation sent to broker successfully');
  } catch (error) {
    console.error('Error sending validation to broker:', error.message);
  }
}

// Actualizar la transacción según los resultados
router.post('/commit', async (ctx) => {
  const  group_id = '14'
  const seller =0
  const { ws_token, request_id} = ctx.request.body;
  console.log('Received in commit:', { ws_token, request_id, group_id, seller });

  if (!ws_token || !request_id || !group_id || seller === undefined) {
    ctx.status = 400;
    ctx.body = { message: 'Missing required fields: ws_token, request_id, group_id, or seller' };
    return;
  }

  try {
    const confirmedTx = await tx.commit(ws_token);
    console.log('Confirmed transaction:', confirmedTx);

    let valid = false;

    if (confirmedTx.response_code === 0) {
      // Transacción aceptada
      await ctx.orm.Transaction.update(
        { status: 'completed' },
        { where: { transaction_token: ws_token } }
      );
      valid = true;
      ctx.body = { message: 'Transaction accepted', request_id, amount: confirmedTx.amount };
    } else {
      // Transacción rechazada
      await ctx.orm.Transaction.update(
        { status: 'rejected' },
        { where: { transaction_token: ws_token } }
      );
      ctx.body = { message: 'Transaction rejected', request_id, amount: confirmedTx.amount };
    }

    // Enviar la validación al broker
    console.log('Sending validation to broker with valid:', valid);
    await sendValidationToBroker(request_id, group_id, seller, valid);

    ctx.status = 200;
  } catch (error) {
    console.error('Error processing commit:', error);
    ctx.status = 500;
    ctx.body = { message: 'Error processing the transaction', error: error.message };
  }
});

//module.exports = { trxRouter };
module.exports = router;