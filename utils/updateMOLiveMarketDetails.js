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
const updateLiveMarketDetails = async(marketIds,k) => {
    let runner
    try{
        // let date = Date.now()
        // console.log(Date.now() -date, k,'datedatedatedate1111111111' );

        let fetchMarketData = await fetch(` http://13.42.165.216:8443/api/betfair/${marketIds}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        let fetchMarketDatajson = await fetchMarketData.json()
        updateMOMarket2(fetchMarketDatajson) // 200 markets no data aek sathe get krine aa func ma pass kryo

        // const openMarkets = fetchMarketDatajson.filter(market =>
        //     ["OPEN", "SUSPENDED", "BALL_RUNNING"].includes(market.status.trim())
        // );

        // await Promise.all(openMarkets.map((market, i) => updateMOMarket2(market, i)));
        // for(let i = 0;i<fetchMarketDatajson.length;i++){ 
        //     if(["OPEN","SUSPENDED","BALL_RUNNING"].includes(fetchMarketDatajson[i].status.trim())){
        //         // console.log(i,'iiiiiii111111111111111')
        //         updateMOMarket2(fetchMarketDatajson[i],i)
        //     }
        // }
        // console.log(Date.now() -date, k,'datedatedatedate22222222222222' );


        //         const BATCH_SIZE = 10;
        // const validStatuses = new Set(["OPEN", "SUSPENDED", "BALL_RUNNING"]);

        // const toUpdate = fetchMarketDatajson.filter(
        //     market => market.status && validStatuses.has(market.status.trim())
        // );

        // for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
        //     const batch = toUpdate.slice(i, i + BATCH_SIZE);
        //     await Promise.all(batch.map(updateMOMarket2));
        // }


        // const filteredMarkets = fetchMarketDatajson.filter(market => 
        //     validStatuses.has(market.status.trim())
        // );

        // Promise.all(filteredMarkets.map(updateMOMarket2));


        
    }catch(error){
        console.log(error,"marketIds",'Errorrr updateLiveMarketDetailss')
    }

}

module.exports = updateLiveMarketDetails

