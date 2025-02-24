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
    cron.schedule('00 51 * * * *', async() => {
        console.log('Set MarketIds Cron Test Started.....')
        let starttime = new Date();
        try{
            let marketIdsArr = [];
            let eventlistArr = [];
            let eventIds = await client.get('crone_getEventIds')
            eventIds = JSON.parse(eventIds)
            eventIds = eventIds.slice(0,500)
            console.log(eventIds.length,'eventIds')
            // Get Event Details By Sport Id 
            for(let i = 0;i<eventIds.length;i++){
                // console.log(i,new Date(),'ii')
                let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[i]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                fetchMarketData = await fetchMarketData.json()
                eventlistArr.push(fetchMarketData)
                // console.log(fetchEventData.events.length,'event length')
                // for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                //     marketIdsArr.push(fetchMarketData.catalogues[k].marketId)
                // }
                // if(i % 100 == 0 && i !== eventIds.length - 1) client.set('crone_getMarketIds',JSON.stringify(marketIdsArr));
                // if(i == eventIds.length - 1){
                //     client.set('crone_getMarketIds',JSON.stringify(marketIdsArr));
                // }
                client.set('crone_getEvent_list',JSON.stringify(eventlistArr));
            }       
            console.log(starttime,new Date(),((new Date()).getTime() - starttime.getTime())/1000)
            console.log(marketIdsArr,'Set MarketIds Cron Test Ended.....')    
        }catch(error){
            console.log(error,'Errorrr setMarketIDsCrone Test')
        }
    })
}