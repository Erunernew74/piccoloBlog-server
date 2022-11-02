const dotenv = require('dotenv');
dotenv.config();
const router = require('express').Router();

const { register, login, logout, jwtVerify, resetPassword, verifyToken, sendPassword, confirmAccount, updateProfile } = require('../controllers/userController')

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/jwt-verify', jwtVerify)
router.post('/updateProfile/:token', updateProfile)

//* Codice per il recupero della password se ce la dimentichiamo
//* Verifichiamo se la mail è presente nel db
//* rotta presente in FormEmail.jsx
router.post('/reset-password', resetPassword)

//* Verifichaimo se il token mandatogli è corretto
router.get('/reset-password/:token', verifyToken)

//* Recupero della password per cui viene spedita la nuova password al db
router.post('/reset-password/:token', sendPassword)

//* Conferma dell'account dopo la registrazione
router.get('/confirm-account/:token', confirmAccount)

module.exports = router;