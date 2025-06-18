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
    setInterval(async () => {
        try{
                let cricketEventIds
                cricketEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD'); 
                cricketEventIds = JSON.parse(cricketEventIds)
                // console.log(cricketEventIds.length,'cricketEvent Idsssssss')
                if(cricketEventIds){
                    // for(let i = 0;i<cricketEventIds.length;i++){
                    //     updateFanctDetails(cricketEventIds[i])
                    // }
                    await Promise.all(
                        cricketEventIds.map(id => updateFanctDetails(id))
                    );
                }
            }catch(error){
                console.log(error,'Errorrr updateFenctDetailsCrone3333')
            }
    }, 505);
}
