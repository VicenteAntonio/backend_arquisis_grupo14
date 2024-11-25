/* eslint-disable prefer-destructuring */
const dotenv = require('dotenv');
// const { jwtDecode } = require('jwt-decode');
const jwt = require('jsonwebtoken');

dotenv.config();

function isAdmin(ctx) { //next
  const token = ctx.request.header.authorization.split(' ')[1];
  const decodedToken = jwt.decode(token);
  const roles = decodedToken['user/roles'] || [];
  console.log('Roles del usuario:', roles);
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
  console.log("Generando token", { payload, secret, options });
  return jwt.sign(payload, secret, options);
}

async function verifyToken(ctx, next) {
  console.log("probando el verify token", ctx);
  // console.log(ctx)
  try {
    const token = ctx.request.header.authorization.split(' ')[1];
    if (!token) {
      ctx.throw(401, 'Token not found');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("-----token.....", decoded);
    // Verifica si el token está cerca de expirar (por ejemplo, menos de 1 día)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - currentTime;
    const oneDayInSeconds = 24 * 60 * 60;
    console.log("Tiempo para que expire el token:", timeLeft," segundos");

    if (timeLeft < oneDayInSeconds) {
      // Genera un nuevo token con más tiempo de duración
      const newToken = generateToken(decoded);
      ctx.set('Authorization', `Bearer ${newToken}`);
    }

    console.log("-----token------", { exp: decoded.exp });
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    ctx.throw(401, 'Invalid or expired token');
  }
}

module.exports = { isAdmin, generateToken, verifyToken };