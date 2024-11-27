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