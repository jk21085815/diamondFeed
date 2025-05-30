const updateMOMarket2 = require('./updateMOLiveMarketDetails2')
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
    let runner
    try{
        // let date = Date.now()
        let fetchMarketData = await fetch(` http://13.42.165.216:8443/api/betfair/${marketIds}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        let fetchMarketDatajson = await fetchMarketData.json()
        // console.log(Date.now() -date, 'datedatedatedate' );
        
        for(let i = 0;i<fetchMarketDatajson.length;i++){ 
            if(["OPEN","SUSPENDED","BALL_RUNNING"].includes(fetchMarketDatajson[i].status.trim())){
                updateMOMarket2(fetchMarketDatajson[i])
            }
        }

        // const filteredMarkets = fetchMarketDatajson.filter(market => 
        //     validStatuses.has(market.status.trim())
        // );

        // Promise.all(filteredMarkets.map(updateMOMarket2));
        
    }catch(error){
        console.log(error,"marketIds",'Errorrr updateLiveMarketDetailss')
    }

}

module.exports = updateLiveMarketDetails

