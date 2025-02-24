const cron = require('node-cron');
const updateMarketDetails = require('../utils/updateLiveMarketDetails')
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
        let count = await client.get('marketidCounts')
        count = JSON.parse(count)
        for(let k = 0;k<count;k++){
            let marketIds = await client.get(`marketidkcount${k}`)
            marketIds = JSON.parse(marketIds)
            updateMarketDetails(marketIds,k,count)
        }
    },505)
}

module.exports = updateSetinterval
