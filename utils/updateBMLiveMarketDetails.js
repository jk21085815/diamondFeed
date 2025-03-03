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
const updateLiveMarketDetails = async(bookmakerdata) => {
    try{
        for(let a = 0; a<bookmakerdata.length; a++){
            let marketdata = await client.get(`${bookmakerdata[a].bookmaker_id}_diamond`)
            if(marketdata){
                marketdata.status = bookmakerdata[a].data.status
                let bookmakerrunner = JSON.parse(bookmakerdata[a].data.runners)
                let runnerIds = Object.keys(bookmakerrunner)
                for(let c = 0;c<runnerIds.length;c++){
                    let runner = bookmakerrunner[runnerIds[c]]
                    let thisrunner = marketdata.runners.find(item => item.runnerId == runner.selection_id)
                    thisrunner.layPrices[0].price = runner.lay_price
                    thisrunner.layPrices[0].size = runner.lay_volume
                    thisrunner.lay_volume[0].price = runner.back_price
                    thisrunner.lay_volume[0].size = runner.back_volume
                }
                await client.set(`${marketdata.marketId}_diamond`, JSON.stringify(marketdata), 'EX', 24 * 60 * 60);
                await client.set(`/topic/diamond_bm_update/${marketdata.marketId}`,JSON.stringify(marketdata));
                Publishclient.publish(`/topic/diamond_bm_update/${marketdata.marketId}`,JSON.stringify(marketdata));
            }

        }
    }catch(error){

        console.log("error",error,'Errorrr updateLiveMarketDetailss')
    }

}

module.exports = updateLiveMarketDetails

