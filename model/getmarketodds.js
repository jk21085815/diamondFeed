const mongoose = require('mongoose');

const marketoddsSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date
});

const marketodds = mongoose.model('marketodds', marketoddsSchema);

module.exports = marketodds;