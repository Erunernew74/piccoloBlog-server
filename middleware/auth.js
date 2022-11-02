const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
    try {
        let token = req.cookies["token"];
        if(!token){
            return res.status(401).json({errorMessage: "Unauthorized"})
        }
        //* Validazione del token
        const userData = jwt.verify(req.cookies["token"], process.env.JWT_SECRET, ((err, payload) => {
            if(err)
                return res.status(400).json({msg: "Unauthorized"})
        }))

        req.userData = userData
        next()
    } catch (error) {
        console.log(error)
        return res.status(400).json({ errorMessage: "Unauthorized" })
    }
}

module.exports = auth;