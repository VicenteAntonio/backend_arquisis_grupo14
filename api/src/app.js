const koa = require('koa');
const { Op } = require('sequelize');
const KoaLogger = require('koa-logger');
const { koaBody } = require('koa-body');
const router = require('./routes.js');
const cors = require('@koa/cors')
const orm = require('./models');

const app = new koa();

app.context.orm = orm;

app.use(cors());
// middlewares
app.use(KoaLogger());
app.use(koaBody());

// koa-router
app.use(router.routes());

module.exports = app;
