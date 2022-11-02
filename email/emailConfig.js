const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASSWORD_EMAIL
    }
});

/* Configurazione per il recupero password */
const sendResetPassword = async (recipient, token) => {
    await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to: recipient,
        subject: 'Reset password',
        text: `Reset your password: http://localhost:3000/reset-password/${token}`,
    })
}

/* Configurazione per la conferma registrazione */

const sendSignIn = async (recipient, token) => {
    await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to: recipient,
        subject: 'Confirm account',
        text: `Click here for confirm your account: http://localhost:3000/confirm-account/${token}`,
    })
}

module.exports = { sendResetPassword, sendSignIn }