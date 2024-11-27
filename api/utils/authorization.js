const { jwtVerify, createRemoteJWKSet } = require('jose');
const dotenv = require('dotenv');

dotenv.config();

const JWKS = createRemoteJWKSet(new URL('https://dev-ldmj4nnfbyehlbs5.us.auth0.com/.well-known/jwks.json'));

async function verifyToken(ctx, next) {
  console.log("Verificando token", ctx.request);
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

    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'],
      issuer: 'https://dev-ldmj4nnfbyehlbs5.us.auth0.com/',
      audience: ['https://dev-ldmj4nnfbyehlbs5.us.auth0.com/api/v2',"https://dev-ldmj4nnfbyehlbs5.us.auth0.com/userinfo"],
    });

    console.log("Token decodificado:", payload);

    ctx.state.user = payload;
    await next();
  } catch (err) {
    console.error("Error verificando el token:", err);
    ctx.throw(401, 'Invalid or expired token');
  }
}

function isAdmin(ctx, next) {
  const token = ctx.request.header.authorization.split(' ')[1];
  jwtVerify(token, JWKS, {
    algorithms: ['RS256'],
    issuer: 'https://dev-ldmj4nnfbyehlbs5.us.auth0.com/',
    audience: ['https://dev-ldmj4nnfbyehlbs5.us.auth0.com/api/v2',"https://dev-ldmj4nnfbyehlbs5.us.auth0.com/userinfo"],
  }).then(({ payload }) => {
    const roles = payload.roles || [];
    console.log("Roles del usuario:", roles);
    if (!roles.includes('admin')) {
      ctx.throw(403, 'You are not an admin');
    }
    next();
  }).catch(err => {
    console.error("Error verificando el token:", err);
    ctx.throw(401, 'Invalid or expired token');
  });
}

module.exports = {
  verifyToken,
  isAdmin,
};