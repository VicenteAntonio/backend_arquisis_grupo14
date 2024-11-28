const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Leer el archivo JSON
const configPath = path.join(__dirname, 'extra.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const DOMAIN = 'dev-ldmj4nnfbyehlbs5.us.auth0.com';
const MANAGEMENT_API_TOKEN = config.access_token;// const ROLE_ID = 'rol_4IyIdO9vYEqnjfmV'; // El ID del rol que quieres asignar

const roles = {
    "Admin": "rol_4IyIdO9vYEqnjfmV"
};
// const USER_EMAIL = 'admin@uc.cl';

let token = {
    access_token: config.access_token,
    expires_in: 86400,
    token_type: "Bearer",
    obtained_at: Date.now()
};

function isTokenExpired() {
    const currentTime = Date.now();
    const tokenExpiryTime = token.obtained_at + (token.expires_in * 1000);
    return currentTime > tokenExpiryTime;
}

async function getNewToken() {
    try {
        const response = await axios.post(`https://${DOMAIN}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: 'lUarIPDg1RzL9GGchjSQkk8VVlFJNTe3',
            client_secret: 'Ei4Up4g7ntA2feIjqUB-72CfSdOboC5kozFjJD-t_5ZNeH3EiS1AS22ggOU9uvPP',
            audience: `https://${DOMAIN}/api/v2/`
        });
        token.access_token = response.data.access_token;
        token.expires_in = response.data.expires_in;
        token.obtained_at = Date.now();
    } catch (error) {
        console.error('Error obtaining new token:', error);
    }
}

async function makeAuthenticatedRequest() {
    if (isTokenExpired()) {
        await getNewToken();
    }
}

makeAuthenticatedRequest();

const assignRole = async (user_token, role) => {
    console.log("user_token es",user_token);
    console.log("role es",role);
  try {
    const roleId = roles[role];
    console.log("roleId",roleId);
    const response = await axios.post(
      `https://${DOMAIN}/api/v2/users/${user_token}/roles`,
      {
        roles: [roleId],
      },
      {
        headers: {
          Authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Rol asignado correctamente:', response.data);
  } catch (error) {
    console.error('Error asignando el rol:', error.response);
  }
};

const assignAdminRoleToUser = async (user_token, role) => {
    if (role === 'Admin') {
        await assignRole(user_token, role);
    }
}
module.exports = {
    assignAdminRoleToUser,
};