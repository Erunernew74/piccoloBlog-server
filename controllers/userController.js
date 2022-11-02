const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

//* Importiamo le configurazioni per il recupero password e conferma della registrazione
const { sendResetPassword, sendSignIn } = require("../email/emailConfig");
const { default: mongoose } = require("mongoose");

exports.register = async (req, res) => {
  try {
    const { nome, cognome, username, email, password, passwordVerify } =
      req.body;

    if (
      !nome ||
      !cognome ||
      !username ||
      !email ||
      !password ||
      !passwordVerify
    ) {
      return res.status(400).json({ msg: "Inserire tutti i dati" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password troppo corta" });
    }

    if (password !== passwordVerify) {
      return res.statu(400).json({ msg: "le due password non coincidono" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Account già esistente" });
    }

    //* Hashing della password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User({
      nome,
      cognome,
      username,
      email,
      passwordHash,
    });

    await newUser.save();


    //* Codice per recuperare la password smarrita
    const emailToken = jwt.sign({ email }, process.env.JWT_SECRET);
    //* Codice per recuperare la password smarrita
    await sendSignIn(email, emailToken);

    return res.status(200).json({msg: "Registrazione avvenuta con successo"})

  } catch (error) {}
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Inserire tutti i valori",
      });
    }

    const existingUser = await User.findOne({ email }).lean();

    if (!existingUser) {
      return res.status(400).json({
        msg: "Username già presente nel database",
      });
    }

    //* Compariamo la password con la password hashata dell'utente
    const passwordCorrect = await bcrypt.compare(
      password,
      existingUser.passwordHash
    );
    if (!passwordCorrect) {
      return res.status(400).json({
        msg: "Password o email non corrette",
      });
    }

    //* Per prendere i dati dalla tabella user per inserirli nel profile
    //* E creare il token per il login
    const user = existingUser;
    delete user.passwordHash;
    res.cookie("user", JSON.stringify(user), { expiresIn: "15min" });
    const token = jwt.sign({
        user: existingUser._id,
        email: existingUser.email,
      },process.env.JWT_SECRET
    );

    //* send the token in HTTP-only cookie
    res.cookie('email', existingUser.email);

    //* Login ok
    res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        credentials: true,
        samesite: true,
        optionsSuccessStatus: 200,
      })
      .json({ msg: "Login ok" });
  } catch (error) {
    console.log(error);
  }
};

//* FETCH PER IL LOGOUT - Questa fetch la metteremo nel componente Navbar.jsx
exports.logout = async (req, res) => {
  res.clearCookie("token").clearCookie("user").status(200).json({
    msg: "Logout avvenuto con successo!",
  });
};

//* Fetch per verificare e validare il token per la registrazione e il login - Per le autorizzazioni
//* ROTTA: router.post('/jwt-verify', jwtVerify)
exports.jwtVerify = async (req, res) => {
  try {
    let token = req.cookies["token"];
    if (!token || token == undefined) {
      return res.status(401).json({ errorMessage: "Unauthorized" });
    }

    //* Validazione del token
    jwt.verify(req.cookies["token"], process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        return res.status(400).json({ msg: "Unauthorized" });
      }

      const { user } = payload;
      token = jwt.sign(payload, process.env.JWT_SECRET);
      res.cookie("user", JSON.stringify(user), { expiresIn: "15min" });
      res
        .cookie("token", token, {
          httpOnly: true,
          credentials: true,
          samesite: true,
          optionsSuccessStatus: 200,
        })
        .json({ msg: "Authorized" });
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      msg: "Unauthorized",
    });
  }
};

//* Codice per il recupero della password se ce la dimentichiamo
//* Verifichiamo se la mail è presente nel db
//* ROTTA: router.post('/reset-password', resetPassword)
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const isValidEmail = await User.findOne({ email });
    if (!isValidEmail) return res.status(200).json({});
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "15min",
    });

    await sendResetPassword(email, token);
    res.status(200).json({});
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: error });
  }
};

//* Verifichaimo se il token mandatogli è corretto
//* ROTTA: router.get('/reset-password/:token', verifyToken)
exports.verifyToken = async (req, res) => {
  const { token } = req.params;
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (!data.email) return res.status(400).json({ msg: "page not found" });

    res.status(200).json({});
  } catch (error) {
    console.log(error);
    res.status(400).json({ msg: "page not found" });
  }
};

//* Recupero della password per cui viene spedita la nuova password al db
//* ROTTA: router.post('/reset-password/:token', sendPassword)
exports.sendPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const password = await bcrypt.hash(newPassword, 10);
  const data = jwt.verify(token, process.env.JWT_SECRET);
  const nameUpdated = await User.findOneAndUpdate(
    { email: data.email },
    { passwordHash: password },
    { new: true }
  );

  console.log(nameUpdated);

  res.status(200).json({ msg: "Password has been changed!" });
};

//* Codice per la conferma dell'account dopo la registrazione
//* ROTTA: router.get('/confirm-account/:token', confirmAccount)
exports.confirmAccount = async (req, res) => {
  //* Dobbiamo prendere il token come parametro
  const { token } = req.params;
  try {
    //* e verificare che sia quello corretto
    const data = jwt.verify(token, process.env.JWT_SECRET);

    await User.findOneAndUpdate(
      { email: data.email },
      { isValidUser: true },
      { new: true }
    );

    res.status(200).json({ msg: "Account has been activated!" });
  } catch (error) {
    res.status(400).json({ msg: "invalid token" });
  }
};

exports.updateProfile = async(req, res) => {
  try {
    const { token } = req.params
    const { username } = req.body;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({msg: 'Profilo non trovato'})
    const profileUpdated = await User.findOneAndUpdate({token}, {username}, {new: true})
    res.cookie('user');
    res.status(200).json({msg: 'Profilo aggiornato correttamente'})
  } catch (error) {
    res.status(400).json({msg: `Problemi nell'aggiornare il profilo`})
  }
}
