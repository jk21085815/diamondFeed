const mongoose = require('mongoose');

const marketresultSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date
});

const marketresult = mongoose.model('marketresult', marketresultSchema);

module.exports = marketresult;