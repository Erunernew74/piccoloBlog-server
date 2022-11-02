const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path')
require('dotenv').config()

const app = express();

app.use(express.json());
app.use(cors({
    origin: [`http://localhost:3000`],
    credentials: true,
    samesite: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ["set-cookie"],
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "DELETE", "PATCH", "OPTIONS"]
}))
app.use(cookieParser())

const port = process.env.PORT || 5030

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, (err) => {
    if(err) return console.log(err)
    console.log(`Connected to mongodb`)
})

//* MIDDLEWARES
//* Rotta per la registrazione, login e logout ed eventualmente per il recupero della password
const userRouter = require('./routes/userRouter')
app.use('/auth', userRouter)

//* Rotta per i post
const postRouter = require('./routes/PostRouter')
app.use('/post', postRouter)
app.use('/images', express.static(path.join(__dirname, 'uploads/images')));


app.listen(port, console.log(`Server running on port ${port}`))
