const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        min: 3,
        max: 160
    },
    subtitle: {
        type: String,
        required: true,
        min: 3,
        max: 160
    },
    content: {
        type: {},
        required: true,
        min: 20,
        max: 200000
    },
    ext: {
        type: String,
        required: true,
        maxlength: 4
    },
    user: {
        type: String,
        required: true
    }
}, { timestamps: true })

const Post = mongoose.model('post', postSchema)
module.exports = Post;