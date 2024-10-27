const mqtt = require('mqtt');
const dotenv = require('dotenv');
const axios = require('axios');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaLogger = require('koa-logger');
const Router = require('koa-router');
const boddyParser = require('koa-bodyparser');
const moment = require('moment');
const {handleError} = require('./utils');

const app = new Koa();
const router = new Router();

app.use(koaLogger());
app.use(koaBody());
app.use(boddyParser());
app.use(router.routes());

dotenv.config();

const HOST = 'broker.iic2173.org';
const PORT = 9000;
const USER = 'students';
const PASSWORD = 'iic2173-2024-2-students';
const TOPIC = 'fixtures/requests';

const client = mqtt.connect(`mqtt://${HOST}:${PORT}`, {
  username: USER,
  password: PASSWORD,
});

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  client.subscribe(TOPIC, (err) => {
    if (err) {
      console.error('Error subscribing to topic', err);
    } else {
      console.log(`Subscribed to topic ${TOPIC}`);
    }
  });
});

function parseRequestData(requestData) {
  try {
    const requestString = JSON.parse(requestData);
    // Ajuste de formato de fecha
    const request = {
      request_id: requestString.request_id,
      group_id: requestString.group_id,
      fixture_id: requestString.fixture_id,
      league_name: requestString.league_name,
      round: requestString.round,
      date: requestString.date,
      result: requestString.result,
      depositToken: requestString.deposit_token,
      datetime: requestString.datetime,
      quantity: requestString.quantity,
      seller: requestString.seller,
    };
    // Formato datetime: 'YYYY-MM-ddThh:mm:ss UTC)
    return request;
  } catch (error) {
    throw new Error(`Error parsing request data: ${error.message}`);
  }
}

async function sendRequestToApi(request) {
  console.log("resquest es ",request);
  try {
    const response = await axios.post(
      `${process.env.API_URL}/requests`,
      request
    );
    console.log('Request send to API:', response.data);
  } catch (error) {
    handleError(error);
  }
}

async function findUserAndUpdateQuantity(request) {}

client.on('message', (topic, message) => {
  console.log(`Received message on ${topic}:`, message.toString());
  try {
    const request = parseRequestData(message.toString());
    sendRequestToApi(request);
    findUserAndUpdateQuantity(request);
    // Send request to API
    // Guardar en una base de datos las request, ver validacion y manejar
  } catch (error) {
    console.error('Error sending request to broker:', error.response.data);
  }
});

// Publicar nuestras requests
async function sendRequestToBroker(request) {
  try {
    const parsedRequest = {
      request_id: request.request_id,
      group_id: request.group_id,
      fixture_id: request.fixture_id,
      league_name: request.league_name,
      round: request.round,
      date: request.date,
      result: request.result,
      deposit_token: request.deposit_token,
      datetime: request.datetime,
      quantity: request.quantity,
      seller: 0,
      username: request.username,
    };

    // Cambiar formato de fecha
    const requestData = JSON.stringify(parsedRequest); // Date Handle
    client.publish(TOPIC, requestData);
    console.log('Request published to broker:', requestData);
  } catch (error) {
    throw new Error(`Error publishing request to broker: ${error.message}`);
  }
}

router.post('/', async (ctx) => {
  try {
    const request = ctx.request.body;
    await sendRequestToBroker(request);

    ctx.body = request;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error };
    ctx.status = 400;
  }
});

app.listen(process.env.REQUEST_PORT, (err) => {
  console.log('Listening on port', process.env.REQUEST_PORT);
});

module.exports = client;
