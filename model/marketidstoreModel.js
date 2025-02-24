const mongoose = require('mongoose');

const marketidstoreSchema = mongoose.Schema({
    marketIds:[String]
});

const marketidssotre = mongoose.model('marketidssotre', marketidstoreSchema);

module.exports = marketidssotre;