# Grupo 14 Arquisis Webpay

## Consideraciones generales

- Se utilizó como base la ayudantía de transbank para la integración con webpay.
- Las tecnologías utilizadas en la integración son javascript y axios.

## Pasos de integración

1. En el backend se crea una sesión de transacciones mediante `new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY Environment.Integration,),);`
2. Al crear una request se crea consigo una transacción llamando a Webpay para obtener el token y url de este. Se obtiene mediante la consulta: `const trx = await tx.create(<identifier>, <session>, <price>, <redirect_URL>);`
3. En el frontend, se pide al usuario que confirme su compra para ser redirigido mediante el URL obtenido a Webpay.
4. Se procede con el pago en Webpay.
5. Una vez completada, rechazada o anulada la compra, se redirige al frontend, donde se llega a una página especializada que envía el resultado al backend.
6. El resultado de la solicitud contenido en el token es consultado a Webpay mediante `const confirmedTx = await tx.commit(ws_token);`. El resultado es manejado para actualizar la solicitud y enviar la validación al broker.
