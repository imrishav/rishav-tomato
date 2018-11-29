const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');

const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
      const isPhoto = file.mimetype.startsWith('image/');
      if(isPhoto) {
        next(null, true);
      } else {
        next({ message: 'That filetype isn\'t allowed!' }, false);
      }
    }
  };

exports.homePage =(req,res)  =>{
    res.render('index');
}

exports.addStore = (req,res) =>{
    res.render('editStore', {
        title: 'Add Store'
    })
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // check if there is no new file to resize
    if (!req.file) {
      next(); // skip to the next middleware
      return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // now we resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // once we have written the photo to our filesystem, keep going!
    next();
  };
  

exports.createStore = async (req,res)=>{
    req.body.author = req.user._id 
    const store = await (new Store(req.body)).save();
    // await store.save();
    req.flash('success', `Succesfully Created ${store.name}. Leave Review About the Store`);
    res.redirect(`/store/${store.slug}`);
    // console.log('Wroroked');
        
}

exports.getStores = async (req,res) =>{
    const page = req.params.page || 1;
    const limit = 6;
    const skip = (page * limit) - limit;
    const storesPromise = Store
                        .find()
                        .skip(skip)
                        .limit(limit)
                        .sort({created: 'desc'});
    // console.log(stores);

    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit)

    
    res.render('stores', {title : 'Stores', stores, page,pages,count});
}

const confirmOwner = (store,user) => {
    if(!store.author.equals(user._id)) {
        throw Error('You must own  store');
    }
}

exports.editStore = async (req,res) =>{
    const store = await Store.findOne({ _id: req.params.id});

    confirmOwner(store,req.user)
    // res.json(store);
    res.render('editStore', {title: `Edit ${store.name}`, store})
}

exports.updateStore = async (req,res) =>{
    req.body.location.type = 'Point';
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true,
        runValidators: true
    }).exec();
    req.flash('success', `Succesfully Updated <strong>${store.name}</strong>. 
    <a href="/stores/${store.slug}">View Edited Store </a>`);
    res.redirect(`/stores/${store.id}/edit`);
}

exports.getStoreBySlug = async(req,res,next)=> {
    const store = await Store.findOne({ slug: req.params.slug}).populate('author reviews');
    if(!store) return next();
    res.render('store', {
        store,
        title:store.name
    });
}

// exports.getStoresByTag = async (req,res)=> {
//     // res.send("works");
//     const stores = await Store.getTagsList()
//     res.json(stores);
// }

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || {$exists: true}
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery});
    const [tags, stores] = await Promise.all([tagsPromise,storesPromise]);
    //  res.json(result);


    
    res.render('tags', {
        tags,
        title: 'Tags',tag,stores
    });
};
 

exports.searchStores = async (req,res) =>{
    // res.json(req.query);
    const stores = await Store.find({
        $text : {
            $search: req.query.q
        }
    })
    .limit(5);
    res.json(stores);
} 


exports.getTopStores = async(req,res)=> {
    const stores = await Store.getTopStores();
    // res.json(stores)
    res.render('topStores', {stores, title: 'Top Stores'})
}



exports.mapStores = async (req,res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    // res.json(coordinates);
    const quer = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance : 10000 //10km
            }
        }
    }

    const stores = await Store.find(quer).select('slug name description location photo').limit(10);
    res.json(stores);
}

exports.mapPage =(req,res) =>{
    res.render('map', {title: "Map"});
}

exports.heartStore = async (req,res) =>{
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User.findByIdAndUpdate(req.user._id,
           { [operator]: { hearts: req.params.id}},
           {new: true}
        )
    // console.log(heats);
    res.json(user);
}

exports.getHearts = async (req,res) => {
    const stores = await Store.find({
        _id: {$in: req.user.hearts}

    })
    res.render('stores', {title: 'Favourite Stores',stores});
}

