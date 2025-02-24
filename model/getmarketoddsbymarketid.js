const mongoose = require('mongoose');

const marketoddsbyidSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date,
    eventId:{
        type:String
    }
});

const marketoddsbymarketid = mongoose.model('marketoddsbymarketid', marketoddsbyidSchema);

module.exports = marketoddsbymarketid;