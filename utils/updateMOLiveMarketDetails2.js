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
const updateLiveMarketDetails2 = async(bookdata) => {
    let runner
    try{
        if(["OPEN","SUSPENDED","BALL_RUNNING"].includes(bookdata.status.trim())){
            let marketdata = await client.get(`${bookdata.marketId}_diamond`)
            if(marketdata){
                try{
                    marketdata = JSON.parse(marketdata)
                    marketdata.status = bookdata.status
                    for(let j = 0;j<bookdata.runners.length;j++){
                        runner = marketdata.runners.find(item => (item && item.runnerId && item.runnerId == bookdata.runners[j].selectionId))
                        if(runner){
                            runner.layPrices = bookdata.runners[j].ex.availableToLay
                            runner.backPrices = bookdata.runners[j].ex.availableToBack
                            runner.status = bookdata.runners[j].status
                        }
                    }
                    if(bookdata.marketId == "1.244199858"){
                        console.log(marketdata.runners[0].backPrices,marketdata.runners[0].status,'backPricesbackPricesbackPricesbackPricesbackPricesbackPricesbackPricesbackPrices')
                    }
                    client.set(`${bookdata.marketId}_diamond`,JSON.stringify(marketdata),'EX',24 * 60 * 60)
                    client.set(`/topic/diamond_match_odds_update/${bookdata.marketId}`,JSON.stringify(marketdata));
                    Publishclient.publish(`/topic/diamond_match_odds_update/${bookdata.marketId}`,JSON.stringify(marketdata));
                }catch(error){
                    console.log(error,'Errorrrrrrrrrrrr')
                }
                
            }
        }
        
    }catch(error){
        console.log(error,"marketIds",'Errorrr updateLiveMarketDetails2')
    }

}

module.exports = updateLiveMarketDetails2

