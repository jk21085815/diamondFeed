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
        try{
                    let cricketEventIds
                    cricketEventIds = await client.get('crone_CricketliveEventIds_UPD'); 
                    cricketEventIds = JSON.parse(cricketEventIds)
                    console.log(cricketEventIds.length,'cricketEvent Idsssssss')
                    function delay(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms));
                    }
                    if(cricketEventIds){
                        for(let i = 0;i<cricketEventIds.length;i++){
                            let marketIdsArr = [];
                            let fetchMarketData
                            try{
                                fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${cricketEventIds[i]}`,{
                                    method: 'GET',
                                    headers: {
                                        'Content-type': 'application/json',
                                    }
                                })
                                await delay(1000);
                            }catch(error){
                                await delay(1000 * 10)
                                fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${cricketEventIds[i]}`,{
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
                            if(fetchMarketData && fetchMarketData.catalogues){
                                for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                    if(fetchMarketData.catalogues[k].bettingType == "LINE"){
                                        marketIdsArr.push(fetchMarketData.catalogues[k].marketId)
                                    }
                                }
                                await client.set(`cricketFanctMarketIds_${cricketEventIds[i]}`,JSON.stringify(marketIdsArr))
                            }else{
                                console.log(cricketEventIds[i],fetchMarketData,'fetchMarketDataaaaaaaaaaaaaa333')
                            }
                        }
                    }
            }catch(error){
                console.log(error,'Errorrr updateFenctDetailsCrone3333')
            }
    })
}
