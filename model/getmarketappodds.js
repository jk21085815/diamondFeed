const mongoose = require('mongoose');

const marketappoddsSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date
});

const marketappodds = mongoose.model('marketappodds', marketappoddsSchema);

module.exports = marketappodds;