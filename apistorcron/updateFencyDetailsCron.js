const cron = require('node-cron');
const updateFanctDetails = require('../utils/udpateLiveFancyDetails')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


module.exports = () => {
    cron.schedule('*/10 * * * *', async() => {
        try{

            let cricketEventIdsLive
            cricketEventIdsLive = await client.get('crone_CricketliveEventIds_diamond_UPD'); 
            cricketEventIdsLive = JSON.parse(cricketEventIdsLive)
            let cricketEventIdsAll = await client.get('crone_getEventIds_Cricket_diamond_UPD'); 
            cricketEventIdsAll = JSON.parse(cricketEventIdsAll)
            let cricketEventIds = cricketEventIdsAll.filter(item => !cricketEventIdsLive.includes(item))
            if(cricketEventIds){
                for(let i = 0;i<cricketEventIds.length;i++){
                    updateFanctDetails(cricketEventIds[i])
                }
            }
        }catch(error){
            console.log(error,'Errorrr updateFenctDetailsCrone')
        }
    })
}
