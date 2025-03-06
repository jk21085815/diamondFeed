const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const Publishclient = redis.createClient({url:process.env.redisurl});
client.connect()
Publishclient.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const updateLiveMarketDetails = async(marketIds) => {
    let marketdetail
    let runner
    try{
        let fetchMarketData = await fetch(` http://13.42.165.216:8443/api/betfair/${marketIds}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        let fetchMarketDatajson = await fetchMarketData.json()
        for(let i = 0;i<fetchMarketDatajson.length;i++){
            if(["OPEN","SUSPENDED","BALL_RUNNING"].includes(fetchMarketDatajson[i].status.trim())){
                let marketdata = await client.get(`${fetchMarketDatajson[i].marketId}_diamond`)
                if(fetchMarketDatajson[i].marketId == "1.240213065"){
                    // console.log(marketdata,'marketdataaaaaaaaaaa')
                }
                if(marketdata){
                    try{
                        marketdata = JSON.parse(marketdata)
                        marketdata.status = fetchMarketDatajson[i].status
                        for(let j = 0;j<fetchMarketDatajson[i].runners.length;j++){
                            runner = marketdata.runners.find(item => (item && item.runnerId && item.runnerId == fetchMarketDatajson[i].runners[j].selectionId))
                            if(runner){
                                runner.layPrices = fetchMarketDatajson[i].runners[j].ex.availableToLay
                                runner.backPrices = fetchMarketDatajson[i].runners[j].ex.availableToBack
                                runner.status = fetchMarketDatajson[i].runners[j].status
                            }
                        }
                        await client.set(`${fetchMarketDatajson[i].marketId}_diamond`,JSON.stringify(marketdata),'EX',24 * 60 * 60)
                        await client.set(`/topic/diamond_match_odds_update/${fetchMarketDatajson[i].marketId}`,JSON.stringify(marketdata));
                        Publishclient.publish(`/topic/diamond_match_odds_update/${fetchMarketDatajson[i].marketId}`,JSON.stringify(marketdata));
                    }catch(error){
                        console.log(error,'Errorrrrrrrrrrrr')
                    }
                   
                }
            }
        }
    }catch(error){
        console.log("error","marketIds",'Errorrr updateLiveMarketDetailss')
    }

}

module.exports = updateLiveMarketDetails

