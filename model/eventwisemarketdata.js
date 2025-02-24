const mongoose = require('mongoose');

const eventwisemarketSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date,
    eventId:{
        type:String
    }
});

const eventwisemarket = mongoose.model('eventwisemarket', eventwisemarketSchema);

module.exports = eventwisemarket;