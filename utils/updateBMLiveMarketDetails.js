const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const clientme = redis.createClient({url:process.env.redisurlme});
const Publishclient = redis.createClient({url:process.env.redisurl});
client.connect()
clientme.connect()
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
            // bookmakers market nu loop feravi ne aek aek market ne redis mathi get krine tenu status and runners data update krine pachu redis ma save and publish krie chie
            if(Object.keys(bookmakerdata[a].data).length !== 0){
                let marketdata = await client.get(`${bookmakerdata[a].bookmaker_id}_diamond`) 
                if(marketdata){
                    try{
                        marketdata = JSON.parse(marketdata)
                        marketdata.status = bookmakerdata[a].data.status
                        let bookmakerrunner = JSON.parse(bookmakerdata[a].data.runners)
                        let runnerIds = Object.keys(bookmakerrunner)
                        for(let c = 0;c<runnerIds.length;c++){
                            let runner = bookmakerrunner[runnerIds[c]]
                            let thisrunner = marketdata.runners.find(item => item.runnerId == runner.selection_id)
                            thisrunner.layPrices[0].price = runner.lay_price
                            thisrunner.layPrices[0].size = runner.lay_volume
                            thisrunner.backPrices[0].price = runner.back_price
                            thisrunner.backPrices[0].size = runner.back_volume
                            thisrunner.status = runner.status
                        }
                        await client.set(`${marketdata.marketId}_diamond`, JSON.stringify(marketdata), 'EX', 24 * 60 * 60);
                        await clientme.set(`${marketdata.marketId}_diamond`, JSON.stringify(marketdata), 'EX', 24 * 60 * 60);
                        await client.set(`/topic/diamond_bm_update/${marketdata.marketId}`,JSON.stringify(marketdata));
                        Publishclient.publish(`/topic/diamond_bm_update/${marketdata.marketId}`,JSON.stringify(marketdata));
                    }catch(error){
                        console.log(error,':Errorrrrrrrrr')
                    }
                   
                }
            }

        }
    }catch(error){

        console.log("error",error,'Errorrr updateLiveMarketDetailss')
    }

}

module.exports = updateLiveMarketDetails

