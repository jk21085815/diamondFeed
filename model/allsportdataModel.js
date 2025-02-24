const mongoose = require('mongoose');

const allsportdata = mongoose.Schema({
    data :{
        type:String
    },
    date:Date
});

const Allsport = mongoose.model('allsportdata', allsportdata);

module.exports = Allsport;