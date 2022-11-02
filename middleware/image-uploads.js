const multer = require('multer');
const { v4: uuidv4 } = require('uuid')

//* Inserimao le estensioni che potrà accettare
const allowedFilesType = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
}

//* Customizziamo i valori di multer
const imageUpload = multer({
    limits: 50000,
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/images')
        },
        filename: (req, file, cb) => {
            const ext = allowedFilesType[file.mimetype];
            tmpId = uuidv4();
            req.body.ext = ext;
            req.body.tmpId = tmpId;
            cb(null, `${tmpId}.${ext}`) 
        }
    }),

    fileFilter: (req, file, cb) => {
        const isValid = !!allowedFilesType[file.mimetype];

        const error = isValid ? null : new Error('Invalid mime type');

        cb(error, isValid)
    }
})

module.exports = imageUpload;