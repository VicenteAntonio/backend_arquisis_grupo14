/* eslint-disable prefer-destructuring */
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    roles: user.roles, // Asegúrate de incluir los roles en el payload
  };

  const options = {
    expiresIn: '7d', // Cambia esto según tus necesidades (por ejemplo, '7d' para 7 días)
  };

  const secret = process.env.JWT_SECRET;
  console.log("Generando token", { payload, secret, options });
  return jwt.sign(payload, secret, options);
}

async function verifyToken(ctx, next) {
  console.log("Verificando token", ctx.request.header.authorization);
  try {
    const authHeader = ctx.request.header.authorization;
    if (!authHeader) {
      console.log("Authorization header not found");
      ctx.throw(401, 'Authorization header not found');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log("Token not found");
      ctx.throw(401, 'Token not found');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decodificado:", decoded);

    // Verifica si el token está cerca de expirar (por ejemplo, menos de 1 día)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLeft = decoded.exp - currentTime;
    const oneDayInSeconds = 24 * 60 * 60;
    console.log("Tiempo para que expire el token:", timeLeft, " segundos");

    if (timeLeft < oneDayInSeconds) {
      // Genera un nuevo token con más tiempo de duración
      const newToken = generateToken(decoded);
      ctx.set('Authorization', `Bearer ${newToken}`);
    }

    ctx.state.user = decoded;
    await next();
  } catch (err) {
    console.error("Error verificando el token:", err);
    ctx.throw(401, 'Invalid or expired token');
  }
}

function isAdmin(ctx, next) {
  const token = ctx.request.header.authorization.split(' ')[1];
  const decodedToken = jwt.decode(token);
  const roles = decodedToken.roles || [];
  console.log("Roles del usuario:", roles);
  if (!roles.includes('admin')) {
    ctx.throw(403, 'You are not an admin');
  }
  return next();
}

module.exports = {
  generateToken,
  verifyToken,
  isAdmin,
};