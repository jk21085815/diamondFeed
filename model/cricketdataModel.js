const mongoose = require('mongoose');

const cricketdataSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date
});

const cricketdatamodel = mongoose.model('cricketdatamodel', cricketdataSchema);

module.exports = cricketdatamodel;