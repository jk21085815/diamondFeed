const cron = require('node-cron');
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
    cron.schedule('00 30 * * * *', async() => {
        console.log('Set MarketIds Cron Started.....')
        try{
            let marketIdsArr = [];
            let eventIds = await client.get('crone_getEventIds')
            eventIds = JSON.parse(eventIds)
            // console.log(eventIds,'eventIds')
            // Get Event Details By Sport Id 
            for(let i = 0;i<eventIds.length;i++){
                let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[i]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                fetchMarketData = await fetchMarketData.json()
                // console.log(fetchEventData.events.length,'event length')
                for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                    marketIdsArr.push(fetchMarketData.catalogues[k].marketId)
                }
                if(i % 100 == 0 && i !== eventIds.length - 1) client.set('crone_getMarketIds',JSON.stringify(marketIdsArr));
                if(i == eventIds.length - 1){
                    client.set('crone_getMarketIds',JSON.stringify(marketIdsArr));
                }

            }       
            console.log(marketIdsArr,'Set MarketIds Cron Ended.....')    
        }catch(error){
            console.log(error,'Errorrr setMarketIdsCrone')
        }
    })
}