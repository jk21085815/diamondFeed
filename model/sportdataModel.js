const mongoose = require('mongoose');

const SportdataSchema = mongoose.Schema({
    data :{
        type:String
    },
    date:Date
});

const sportdatamodel = mongoose.model('sportdatamodel', SportdataSchema);

module.exports = sportdatamodel;