const cron = require('node-cron');
const updateFanctDetails = require('../utils/udpateLiveFancyDetails')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
const { promisify } = require('util');
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


module.exports = () => {
    cron.schedule('*/10 * * * *', async() => {
        try{
                let cricketEventIds = await client.get('crone_getEventIds_Cricket_UPD'); 
                if(!cricketEventIds){
                    cricketEventIds = await client.get('crone_getEventIds_Cricket'); 
                }
                let cricketEventIds2 = await client.get('crone_CricketliveEventIds_UPD'); 
                cricketEventIds = JSON.parse(cricketEventIds)
                cricketEventIds2 = JSON.parse(cricketEventIds2)
                let cricketEventIds3 = cricketEventIds.filter(item => !cricketEventIds2.includes(item))
                for(let i = 0;i<cricketEventIds3.length;i++){
                    let marketIds = await client.get(`cricketFanctMarketIds_${cricketEventIds3[i]}`)
                    marketIds = JSON.parse(marketIds)
                    if(marketIds){
                        updateFanctDetails(marketIds,cricketEventIds3[i])
                    }
                }
        }catch(error){
            console.log(error,'Errorrr updateAdvFanctcrone')
        }
    })
}
