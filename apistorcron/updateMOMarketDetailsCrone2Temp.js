const redis = require('redis');
const { log } = require('../utils/logger');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
});

const updateSetinterval = async() => {
    setInterval(async()=>{
        let marketIds = "1.244277489"
         let fetchMarketData = await fetch(` http://13.42.165.216:8443/api/betfair/${marketIds}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        let fetchMarketDatajson = await fetchMarketData.json()
        let bookdata = fetchMarketDatajson[0]
        let marketdata = await client.get(`${bookdata.marketId}_diamond`)
        if(marketdata){
                marketdata = JSON.parse(marketdata)
                marketdata.status = bookdata.status
                const runnerMap = new Map(
                    marketdata.runners.map(r => [r?.runnerId, r])
                );
                for (const runnerUpdate of bookdata.runners) {
                    const runner = runnerMap.get(runnerUpdate.selectionId);
                    if (runner) {
                        runner.layPrices = runnerUpdate.ex?.availableToLay || [];
                        runner.backPrices = runnerUpdate.ex?.availableToBack || [];
                        runner.status = runnerUpdate.status;
                    }
                }
                // Create a write stream
                log(`Logs 1 [${timestamp}] ${JSON.stringify(marketdata.runners[0].backPrices)}\n`);
                // console.log(marketdata.runners[0].backPrices,'backpriceeeeee1111111111')

            
        }
        
    },505)
}

module.exports = updateSetinterval
