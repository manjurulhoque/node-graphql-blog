const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Category'
    },
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Post', postSchema);