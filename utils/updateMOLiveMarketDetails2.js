const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const updateMoDetail3 = require('./updateMOLiveMarketDetails3')
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const updateLiveMarketDetails2 = async(bookdata,i) => {
    let runner
    try{
        console.log(i,'iiiiii222222222222')
        if(["OPEN","SUSPENDED","BALL_RUNNING"].includes(bookdata.status.trim())){
            let marketdata = await client.get(`${bookdata.marketId}_diamond`)
            if(marketdata){
                updateMoDetail3(marketdata,i)
            }
        }
        
    }catch(error){
        console.log(error,"marketIds",'Errorrr updateLiveMarketDetails2')
    }

}

module.exports = updateLiveMarketDetails2

