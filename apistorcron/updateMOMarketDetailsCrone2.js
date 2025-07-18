const cron = require('node-cron');
const updateMOMarketDetails = require('../utils/updateMOLiveMarketDetails')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});

const updateSetinterval = async() => {
    setInterval(async()=>{
        let count = await client.get('marketidCounts_MO')
        count = JSON.parse(count)        
        for(let k = 0;k<count;k++){
            let marketIds = await client.get(`marketidkcount_MO_${k}`)
            updateMOMarketDetails(marketIds,k) // aa Func ma 200 betch ni markets comma seperated pass kri
        }
        
    },505)
}

module.exports = updateSetinterval
