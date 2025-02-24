const mongoose = require('mongoose');

const marketidstoreSchema = mongoose.Schema({
    marketIds:[String]
});

const marketidssotrecron = mongoose.model('marketidssotrecron', marketidstoreSchema);

module.exports = marketidssotrecron;