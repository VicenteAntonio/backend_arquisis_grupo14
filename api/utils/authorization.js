/* eslint-disable prefer-destructuring */
const dotenv = require('dotenv');
const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');
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
  console.log("-----isAdmin-----", ctx);
  await next();
  let token = null;
  if (ctx.request.header.authorization) {
    token = ctx.request.header.authorization.split(' ')[1];
  }
  console.log('Token:', token);
  if (!token || token === 'null') {
    ctx.throw(401, 'Token not found');
  }
  const decodedToken = jwt.decode(token);
  const roles = decodedToken['user/roles'] || [];
  ctx.assert(roles.includes('admin'), 403, 'You are not an admin');
}

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    roles: user.roles,
  };

  const options = {
    expiresIn: '7d', // Cambia esto según tus necesidades (por ejemplo, '7d' para 7 días)
  };

  const secret = process.env.JWT_SECRET;

  return jwt.sign(payload, secret, options);
}

async function verifyToken(ctx, next) {
  try {
    const token = ctx.request.header.authorization.split(' ')[1];
    if (!token) {
      ctx.throw(401, 'Token not found');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verifica si el token está cerca de expirar (por ejemplo, menos de 1 día)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - currentTime;
    const oneDayInSeconds = 24 * 60 * 60;

    if (timeLeft < oneDayInSeconds) {
      // Genera un nuevo token con más tiempo de duración
      const newToken = generateToken(decoded);
      ctx.set('Authorization', `Bearer ${newToken}`);
    }

    logger.info("-----token.....", { exp: decoded.exp });
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    ctx.throw(401, 'Invalid or expired token');
  }
}

module.exports = { isAdmin, verifyToken };