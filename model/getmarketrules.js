const mongoose = require('mongoose');

const marketrulesSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date,
    marketId:{
        type:String
    }
});

const marketrules = mongoose.model('marketrules', marketrulesSchema);

module.exports = marketrules;