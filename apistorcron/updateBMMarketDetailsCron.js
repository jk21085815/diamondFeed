const cron = require('node-cron');
const updateBMMarketDetails = require('../utils/updateBMLiveMarketDetails')
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
    cron.schedule('*/0.5 * * * * *', async() => {
        try{
            let cricketEventIdsLive
            cricketEventIdsLive = await client.get('crone_CricketliveEventIds_diamond_UPD'); 
            cricketEventIdsLive = JSON.parse(cricketEventIdsLive)
            otherEventIdsLive = await client.get('crone_OtherSportLiveEventIds_diamond_UPD'); 
            otherEventIdsLive = JSON.parse(otherEventIdsLive)
            let eventIds = cricketEventIdsLive.concat(otherEventIdsLive)
            // console.log(eventIds.length,'eventIds Idsssssss')
            function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            async function fetchBMBook(eventId) {
                let fetchMarketData = await fetch(`https://odds.datafeed365.com/api/active-bm/${eventId}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketDatajson = await fetchMarketData.json()
                return fetchMarketDatajson.data
            }
            if(eventIds){
                for(let i = 0;i<eventIds.length;i++){
                    let fetchMarketData
                    try{
                        fetchMarketData = await fetchBMBook(eventIds[i])
                        await delay(1000);
                    }catch(error){
                        await delay(1000 * 10)
                        fetchMarketData = await fetchBMBook(eventIds[i])
                    }
                    if(fetchMarketData){
                        await client.set(`bookmakerlist_${eventIds[i]}`,JSON.stringify(fetchMarketData))
                        updateBMMarketDetails(fetchMarketData)
                    }
                }
            }
        }catch(error){
            console.log(error,'Errorrr updateFenctDetailsCrone')
        }
    })
}
