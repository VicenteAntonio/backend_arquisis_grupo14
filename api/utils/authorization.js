/* eslint-disable prefer-destructuring */
const dotenv = require('dotenv');
const { jwtDecode } = require('jwt-decode');
const { User } = require('../src/models');

dotenv.config();

async function isAdmin(ctx, next) {
  await next();
  let token = null;
  if (ctx.request.header.authorization) {
    token = ctx.request.header.authorization.split(' ')[1];
  }
  console.log('Token:', token);
  if (!token || token === 'null') {
    ctx.throw(401, 'Token not found');
  }
  // const decodedToken = jwtDecode(token);
  // const roles = decodedToken['user/roles'] || [];
  // ctx.assert(roles.includes('admin'), 403, 'You are not a admin');

  // Consultar la base de datos para verificar si el usuario es admin
  const user = await User.findOne({ where: { user_token: token } });
  if (!user) {
    ctx.throw(404, 'User not found');
  }
  if (!user.admin) {
    ctx.throw(403, 'You are not an admin');
  }
}

async function verifyToken(ctx, next) {
  try {
    const token = ctx.request.header.authorization.split(' ')[1];
    if (!token) {
      ctx.throw(401, 'Token not found');
    }
    const decoded = jwtDecode(token);
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    ctx.throw(401, 'Invalid or expired token');
  }
}

module.exports = { isAdmin, verifyToken };