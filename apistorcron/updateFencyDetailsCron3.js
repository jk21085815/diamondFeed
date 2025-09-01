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
                
                let cricketEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD'); 
                cricketEventIds = JSON.parse(cricketEventIds)
                let kabaddiEventIds = await client.get('crone_KabaddiLiveEventIds_diamond_UPD'); 
                 if(kabaddiEventIds){
                    kabaddiEventIds = JSON.parse(kabaddiEventIds)
                }else{
                    kabaddiEventIds = []
                }
                cricketEventIds = cricketEventIds.concat(kabaddiEventIds)
                if(cricketEventIds){
                    await Promise.all(
                        cricketEventIds.map(id => updateFanctDetails(id))
                    );
                }
            }catch(error){
                console.log(error,'Errorrr updateFenctDetailsCrone3333')
            }
    }, 505);
}
