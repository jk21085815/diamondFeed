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
    cron.schedule('* * * * * *', async() => {
        try{
                let cricketEventIds
                cricketEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD'); 
                cricketEventIds = JSON.parse(cricketEventIds)
                console.log(cricketEventIds.length,'cricketEvent Idsssssss')
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                if(cricketEventIds){
                    for(let i = 0;i<cricketEventIds.length;i++){
                        let fetchMarketData
                        try{
                            fetchMarketData = await fetch(` https://odds.datafeed365.com/api/active-fancy/${cricketEventIds[i]}`,{
                                method: 'GET',
                                headers: {
                                    'Content-type': 'application/json',
                                }
                            })
                            await delay(1000);
                        }catch(error){
                            await delay(1000 * 10)
                            fetchMarketData = await fetch(` https://odds.datafeed365.com/api/active-fancy/${cricketEventIds[i]}`,{
                                method: 'GET',
                                headers: {
                                    'Content-type': 'application/json',
                                }
                            })
                        }
                        const contentType = fetchMarketData.headers.get('content-type');
                        if (!contentType || !contentType.includes("application/json")) {
                            throw new Error("Non-JSON response received");
                        }
                        fetchMarketData = await fetchMarketData.json();
                        fetchMarketData = fetchMarketData.data
                        updateFanctDetails(cricketEventIds[i],fetchMarketData)
                    }
                }
            }catch(error){
                console.log(error,'Errorrr updateFenctDetailsCrone3333')
            }
    })
}
