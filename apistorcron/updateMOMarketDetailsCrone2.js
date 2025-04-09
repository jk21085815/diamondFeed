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
    let count = await client.get('marketidCounts_MO')
    count = JSON.parse(count)
    console.log(count,'countttttttttttt');
    
    for(let k = 0;k<count;k++){
        let marketIds = await client.get(`marketidkcount_MO_${k}`)
        console.log(k,'kkkkkkkkkkkkkkkkkkkk');
        updateMOMarketDetails(marketIds)
    }
    // setInterval(async()=>{
    // },505)
}

module.exports = updateSetinterval
