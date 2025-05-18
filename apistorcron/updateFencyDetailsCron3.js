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
    // cron.schedule('*/0.5 * * * * *', async() => {
        setInterval(async () => {
            try{
                    let cricketEventIds
                    cricketEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD'); 
                    cricketEventIds = JSON.parse(cricketEventIds)
                    // console.log(cricketEventIds.length,'cricketEvent Idsssssss')
                    function delay(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms));
                    }
                    if(cricketEventIds){
                        for(let i = 0;i<cricketEventIds.length;i++){
                            console.log(i,'iii1111111111111111')
                            updateFanctDetails(i,cricketEventIds[i])
                            console.log('Endddddddd')
                        }
                    }
                }catch(error){
                    console.log(error,'Errorrr updateFenctDetailsCrone3333')
                }
        }, 505);


    // })
}
