/* eslint-disable prefer-destructuring */
const dotenv = require('dotenv');
const { jwtDecode } = require('jwt-decode');
const winston = require('winston');

dotenv.config();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

async function isAdmin(ctx, next) {
  console.log("-----isAdmin-----",ctx);
  await next();
  let token = null;
  if (ctx.request.header.authorization) {
    token = ctx.request.header.authorization.split(' ')[1];
  }
  console.log('Token:', token);
  if (!token || token === 'null') {
    ctx.throw(401, 'Token not found');
  }
  const decodedToken = jwtDecode(token);
  const roles = decodedToken['user/roles'] || [];
  ctx.assert(roles.includes('admin'), 403, 'You are not a admin');
}

async function verifyToken(ctx, next) {
  try {
    const token = ctx.request.header.authorization.split(' ')[1];
    if (!token) {
      ctx.throw(401, 'Token not found');
    }
    const decoded = jwtDecode(token);

    // probando con más tiempo de duración del token-- decoded.exp: tiempo de expiracion del token
    logger.info("-----token.....", { exp: decoded.exp });
    const currentTime = new Date().getTime() / 1000;
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    ctx.throw(401, 'Invalid or expired token');
  }
}

module.exports = { isAdmin, verifyToken };