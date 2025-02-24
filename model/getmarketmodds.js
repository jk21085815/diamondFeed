const mongoose = require('mongoose');

const marketmoddsSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date
});

const marketmodds = mongoose.model('marketmodds', marketmoddsSchema);

module.exports = marketmodds;