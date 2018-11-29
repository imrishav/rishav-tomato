const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');


const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please Enter a Store Name'
    },
    slug: String,
    description:{
        type:String,
        trim: true
    },
    tags:[String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
     type: {
        type: String,
        default: 'Point'
     },
     coordinates : [
         {
             type: Number,
             required: "You Must use Co-Ordinates"
         }
     ],
     address: {
         type: String,
         required: "You must Supply an Address"
     }
        
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply a author'
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

//Defining Indexes

storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({
    location : '2dsphere'
})

storeSchema.pre('save', function(next){
    if(!this.isModified('name')){
        next();
        return;
    }
    this.slug = slug(this.name);
    next();
})

storeSchema.statics.getTagsList = function () {
    return this.aggregate([
      { $unwind: '$tags'},
      { $group: {_id: '$tags', count: {$sum: 1}}},
      { $sort: { count:-1}}
    ]);
}

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        //Lookup for the stores
        {$lookup:{
             from: 'reviews', localField: '_id', foreignField:'store', as:'reviews'}
        },
        //filter more than 2
        {$match : {
            'reviews.1': {$exists: true}
        }},

        // Add the avergereviews
        {$project: {
            photo: '$$ROOT.photo',
            name:'$$ROOT.name',
            reviews: '$$ROOT.reviews',
            slug: '$$ROOT.slug',
            averageRating: {$avg: '$reviews.rating'}
        }},
        {$sort: {averageRating: -1}},
        {$limit: 10}
    
    
    
    ])
}

storeSchema.virtual('reviews', {
    ref: 'Review', //what model to linl
    localField: '_id', // which field on the store
    foreignField:'store' // which field on the review? 
});

function autoPopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);