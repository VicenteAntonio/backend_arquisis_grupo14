const { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require('transbank-sdk');
let tx;

// Usar una variable global para evitar crear una nueva instancia de la transacción en cada uso en desarrollo
if (process.env.NODE_ENV === "production") {
  tx = new WebpayPlus.Transaction(
    new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration)
  );
} else {
  if (!global.__tx__) {
    global.__tx__ = new WebpayPlus.Transaction(
      new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration)
    );
  }
  tx = global.__tx__;
}

module.exports = tx;