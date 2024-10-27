const mqtt = require('mqtt');
const dotenv = require('dotenv');
const axios = require('axios');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaLogger = require('koa-logger');
const Router = require('koa-router');
const boddyParser = require('koa-bodyparser');

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
const TOPIC = 'fixtures/validation';

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

function parseValidationData(validationData) {
  try {
    const validationString = JSON.parse(validationData);
    const validation = {
      request_id: validationString.request_id,
      group_id: validationString.group_id,
      seller: validationString.seller,
      valid: validationString.valid,
    };
    return validation;
  } catch (error) {
    throw new Error(`Error parsing validation data: ${error.message}`);
  }
}

async function sendValidationToApi(validation) {
  try {
    const response = await axios.post(
      `${process.env.API_URL}/validations`,
      validation
    );
    console.log('Validation sent to API:', response.data);
  } catch (error) {
    console.error('Error sending validation to API:', error.response.data);
  }
}

async function sendValidationToBroker(requestInfo) {
  try {
    const { request } = requestInfo;
    const { valid } = requestInfo;
    const validationJSON = {
      request_id: request.requestId,
      group_id: request.groupId,
      seller: request.seller,
      valid,
    };
    console.log('Sending validation to broker:', validationJSON);
    const requestData = JSON.stringify(validationJSON);
    client.publish(TOPIC, requestData);
    console.log('Request published to broker:', requestData);
  } catch (error) {
    throw new Error(`Error publishing request to broker: ${error.message}`);
  }
}

client.on('message', (topic, message) => {
  console.log(`Received message from topic ${topic}: ${message.toString()}`);
  try {
      const validation = parseValidationData(message.toString());
      console.log('Parsed validation data:', validation); // Añade esta línea
      sendValidationToApi(validation);
  } catch (error) {
      console.error('Error parsing validation data:', error.message);
  }
});

router.post('/', async (ctx) => {
  try {
    console.log('Received validation:', ctx.request.body);
    await sendValidationToBroker(ctx.request.body);
    ctx.body = ctx.request.body;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error };
    ctx.status = 400;
  }
});

app.listen(process.env.VALIDATION_PORT, (err) => {
  console.log('Listening on port', process.env.VALIDATION_PORT);
});

module.exports = client;
