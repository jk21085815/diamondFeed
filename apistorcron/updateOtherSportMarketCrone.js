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
    cron.schedule('*/3 * * * *', async() => {
    // const updateCricketMarket = async() => {    
        try{
            // setInterval(async() => { 
                    let otherSportEventIds
                    if(!await client.get('crone_OtherSportLiveEventIds_UPD')){
                        otherSportEventIds = await client.get('crone_OtherSportLiveEventIds'); 
                    }else{
                        otherSportEventIds = await client.get('crone_OtherSportLiveEventIds_UPD'); 
                    }
                    otherSportEventIds = JSON.parse(otherSportEventIds)
                    console.log(otherSportEventIds,otherSportEventIds.length,'otherSportEventIdsotherSportEventIds Idsssssss')
                    function delay(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms));
                    }
                    if(otherSportEventIds){
                        let CricketClosedMarketIds = []
                        let CricketInactiveMarketIds = []
                        for(let i = 0;i<otherSportEventIds.length;i++){
                            let marketIdsArr = [];
                            let strtime = Date.now()
                            // console.log(i,otherSportEventIds[i],"iiiiiiii")
                            let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${otherSportEventIds[i]}`,{
                                method: 'GET',
                                headers: {
                                    'Content-type': 'application/json',
                                }
                            })
                            const contentType = fetchMarketData.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                // If the response is JSON, parse it
                                fetchMarketData = await fetchMarketData.json();
                                // console.log("Data:", fetchMarketData);
                            } else {
                                fetchMarketData = await fetchMarketData.text();
                                console.log("Non-JSON response received");

                            }
                            await delay(1000 * 30);
                            if(fetchMarketData && fetchMarketData.catalogues){
                                let mobmmarkets = fetchMarketData.catalogues.filter(item => item.bettingType !== "LINE")
                                for(let j = 0;j<mobmmarkets.length;j++){
                                    if(mobmmarkets[j].status == "CLOSED"){
                                        CricketClosedMarketIds.push(mobmmarkets[j].marketId)
                                    }else if(mobmmarkets[j].status == "INACTIVE"){
                                        CricketInactiveMarketIds.push(mobmmarkets[j].marketId)
                                    }
                                }
                                let closeinActiveMarketIds = CricketClosedMarketIds.concat(CricketInactiveMarketIds)
                                // let closeinActiveMarketIds = CricketClosedMarketIds
                                let eventData = await client.get(`${otherSportEventIds[i]}_diamondEventData`)
                                eventData = JSON.parse(eventData)
                                let openmatchoddsMarket = eventData.markets.matchOdds.filter(item => !closeinActiveMarketIds.includes(item.marketId))
                                let openbookMakerMarket = eventData.markets.bookmakers.filter(item => !closeinActiveMarketIds.includes(item.marketId))
                                eventData.markets.matchOdds = openmatchoddsMarket;
                                eventData.markets.bookmakers = openbookMakerMarket;
                                await client.set(`${otherSportEventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                // if(!isLiveStatus){
                                //     await client.set(`${otherSportEventIds[i]}_shark`,JSON.stringify(eventData.markets.fancyMarkets))
                                // }
                            }else{
                                console.log(otherSportEventIds[i],fetchMarketData,'fetchMarketDataaaaaaaaaaaaaa')
                            }
                        }
                    }
                // }, 1000 * 60 * 3);
            }catch(error){
                console.log(error,'Errorrr updateOtherSportMarketCrone')
            }
    // }
    })
}
// module.exports = updateCricketMarket