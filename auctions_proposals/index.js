const mqtt = require('mqtt');
const dotenv = require('dotenv');
const axios = require('axios');
const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaLogger = require('koa-logger');
const Router = require('koa-router');
const boddyParser = require('koa-bodyparser');
const moment = require('moment');

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
const TOPIC = 'fixtures/auctions';

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

function parseData(auctionData) {
  try {
    const auctionString = JSON.parse(auctionData);
    const auction = {
        auctionId: auctionString.auction_id,
        proposalId: auctionString.proposal_id,
        fixtureId: auctionString.fixture_id,
        leagueName: auctionString.league_name,
        round: auctionString.round,
        result: auctionString.result,
        quantity: auctionString.quantity,
        groupId: auctionString.group_id,
        type: auctionString.type,
    };
    return auction;
  } catch (error) {
    console.error('Error parsing auction data', error);
    return null;
  }
}

async function sendAuctionToApi(auction) {
  try {
    const response = await axios.post(`${process.env.API_URL}/auctions`, auction);
    console.log('Auction send to API:', response.data);
  } catch (error) {
    console.error('Error sending auction to API', error);
  }
}

async function sendProposalToApi(proposal) {
  try {
    const response = await axios.post(`${process.env.API_URL}/proposals`, proposal);
    console.log('Proposal send to API:', response.data);
  } catch (error) {
    console.error('Error sending proposal to API', error);
  }
}

async function handleProposalStatus(proposal) {
  try {
    const response = await axios.post(`${process.env.API_URL}/proposals/handleResponse`, proposal);
    console.log('Proposal status updated:', response.data);
  } catch (error) {
    console.error('Error updating proposal status:', error);
  }
}

client.on('message', (topic, message) => {
  try {
    const auction = parseData(message.toString());
    if (auction.type === 'offer') {
      sendAuctionToApi(auction);
    } else if (auction.type === 'proposal') {
      sendProposalToApi(auction);
    } else if (auction.type === 'acceptance' || auction.type === 'rejection') {
      handleProposalStatus(auction);
    }
  } catch (error) {
    console.error('Error processing data:', error);
  }
});

async function sendAuctionOrProposalToBroker(data) {
  try {
    const parsedData = {
        auctionId: auctionString.auction_id,
        proposalId: auctionString.proposal_id,
        fixtureId: auctionString.fixture_id,
        leagueName: auctionString.league_name,
        round: auctionString.round,
        result: auctionString.result,
        quantity: auctionString.quantity,
        groupId: auctionString.group_id,
        type: auctionString.type,
      };
    const dataString = JSON.stringify(parsedData);
    client.publish(TOPIC, dataString);
    console.log('Auction or proposal send to broker:', dataString);
  } catch (error) {
    throw new Error(`Error sending auction or proposal to broker: ${error.message}`);
  }
}

router.post('/', async (ctx) => {
  try {
    const data = ctx.request.body;
    await sendAuctionOrProposalToBroker(data);
    ctx.body = data;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error };
    ctx.status = 400;
  }
});

app.listen(process.env.AUCTION_PROPOSAL_PORT, (err) => {
  console.log('Listening on port', process.env.AUCTION_PROPOSAL_PORT);
});

module.exports = client;