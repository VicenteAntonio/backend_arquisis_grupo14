const mqtt = require('mqtt');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const HOST = 'broker.iic2173.org';
const PORT = 9000;
const USER = 'students';
const PASSWORD = 'iic2173-2024-2-students';
const TOPIC = 'fixtures/info';

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

function parseFixtureData(fixtureData) {
  try {
    const fixturesArray = JSON.parse(fixtureData);
    return fixturesArray;
  } catch (error) {
    console.error('Error parsing fixture data: ', error);
  }
}

async function sendFixtureToAPI(fixture) {
  try {
    const response = await axios.post(
      `${process.env.API_URL}/fixtures`,
      fixture
    );
    console.log('fixture send to API: ', response);
  } catch (error) {
    console.error('Error sending fixture to API: ', error.response.data);
  }
}

client.on('message', (topic, message) => {
  console.log(`Received message on ${topic}`);
  try {
    const fixtureData = JSON.parse(message.toString());
    const fixtureList = parseFixtureData(fixtureData);
    sendFixtureToAPI(fixtureList);
  } catch (error) {
    console.error('Error parsing message or sending fixture to API: ', error);
  }
});

client.on('error', (error) => {
  console.error('Error connecting to MQTT broker: ', error);
});

module.exports = client;
