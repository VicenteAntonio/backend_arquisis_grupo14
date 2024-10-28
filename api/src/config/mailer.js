const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: 'magdalenapino9@gmail.com',
        pass: 'kqqe rtkw nhrz nvsp'
    },
});

transporter.verify().then(() => {
    console.log('Ready to send emails');
});

module.exports = transporter;