const Koa = require('koa');
const koaLogger = require('koa-logger');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const { Queue } = require('bullmq');
const dotenv = require('dotenv');
const axios = require('axios');

const app = new Koa();
const router = new Router();

app
  .use(koaLogger())
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods());

dotenv.config();

const recommendationQueue = new Queue('recommendationQueue', {
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

// Endpoints del jobMaster

router.get('/job/:id', async (ctx) => {
  // Logica obtener job by id
  try {
    const jobId = ctx.params.id;
    const job = await recommendationQueue.getJob(jobId);

    if (!job) {
      ctx.status = 404;
      ctx.body = { error: 'Job not found' };
      return;
    }
    const state = await job.getState();
    const result = await job.returnvalue;
    ctx.body = { id: job.id, state, result };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.post('/job', async (ctx) => {
  // Logica crear job desde parametros del backend
  try {
    const { fixture, user_token } = ctx.request.body;
    console.log(fixture);
    console.log(user_token);
    if (!fixture || !user_token) {
      ctx.status = 400;
      ctx.body = { error: 'Missing parameters' };
      return;
    }
    const job = await recommendationQueue.add('recommendation', { fixture, user_token });
    ctx.body = { jobId: job.id };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.get('/heartbeat', async (ctx) => {
  // Logica de heartbeat
  ctx.body = { status: true };
  ctx.status = 200;
});

app.listen(process.env.JOBS_MASTER_PORT, (err) => {
  console.log(
    `Jobs Master Service is running on port ${process.env.JOBS_MASTER_PORT}`
  );
});

module.exports = app;
