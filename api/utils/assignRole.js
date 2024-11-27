const axios = require('axios');

const DOMAIN = 'dev-ldmj4nnfbyehlbs5.us.auth0.com';
const MANAGEMENT_API_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Imw1WTBMS2FWS21UTnJ4THY4eE84WCJ9.eyJpc3MiOiJodHRwczovL2Rldi1sZG1qNG5uZmJ5ZWhsYnM1LnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJsVWFySVBEZzFSekw5R0djaGpTUWtrOFZWbEZKTlRlM0BjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9kZXYtbGRtajRubmZieWVobGJzNS51cy5hdXRoMC5jb20vYXBpL3YyLyIsImlhdCI6MTczMjc0MzEwNiwiZXhwIjoxNzMyODI5NTA2LCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMiLCJhenAiOiJsVWFySVBEZzFSekw5R0djaGpTUWtrOFZWbEZKTlRlMyJ9.iuPSJVHbGoO0z1MMbwGCmA-rZqcAKkeq4mz1XsPSdxyW4wfvnUafHs8k2Tv3HN4Byzk0ekH2V9bwQGwvcinKJn9dSjYopOqT_52Ah6hQCvwM6JtV0WaIMoGpuMiIlp3KTcIJcUt5OcCFxM-FGDFqo5kgbBJp2Ev_MGEiC8jbEEcuvFPRkCywFSripCR97G4Yd2IF1usDdY3_CdEChYMCdgEYbEtgYPB0hSS9zAk0Fq4cPn8zDvMm-CLsB1s3l9vLxq-Fl8XYz3XmvQEsa3Ujes7Nxk4Fs3yQOHK4wpHbXmrI_1ZekGW-c2-E-xo1Un_wWJcWWC_1KVVniqN6tc1VAw'; // El nuevo token de acceso que obtuviste
// const ROLE_ID = 'rol_4IyIdO9vYEqnjfmV'; // El ID del rol que quieres asignar

const roles = {
    "Admin": "rol_4IyIdO9vYEqnjfmV"
};
// const USER_EMAIL = 'admin@uc.cl';

const assignAdminRoleToUser = async (user_token, role) => {
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


module.exports = {
    assignAdminRoleToUser,
};