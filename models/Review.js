const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
    created: {
        type:Date,
        default: Date.now
    },
    author: {
        type:mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    },
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required : 'You must Supply a store'
    },
    text: {
        type:String,
        required: 'Your Review must have something'
    },
    rating: {
        type:Number,
        min: 1,
        max:5
    }

});

function autopopultate(next) {
    this.populate('author');
    next();
}

reviewSchema.pre('find', autopopultate);
reviewSchema.pre('findOne', autopopultate);

module.exports = mongoose.model('Review', reviewSchema);