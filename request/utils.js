// write this as a function that recieves error
// and can be exported to be used in multiple files

const axios = require('axios');

module.exports = {
  handleError,
};

function handleError(error) {
  if (axios.isAxiosError(error)) {
    // Manejo específico de AxiosError
    console.error('Error sending request to API:', error.message);
    console.error('Error code:', error.code);

    if (error.response) {
      // La solicitud se realizó y el servidor respondió con un código de estado fuera del rango de 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.error('No response received:', error.request);
    } else {
      // Algo pasó al configurar la solicitud
      console.error('Request setup error:', error.message);
    }
  } else {
    // Manejo de errores que no son de Axios
    console.error('Unexpected error:', error);
  }
}
