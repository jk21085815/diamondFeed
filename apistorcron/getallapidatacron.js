const cron = require('node-cron');
// const AllsportModel = require('../model/allsportdataModel')
const getMarketIds = require('../utils/getmarketids')
const redis = require('redis');
const { connect } = require('../routes/viewRoutes');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(getallapidatacron.js): ${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});

module.exports = () => {
    cron.schedule('0 * * * *', async() => {
        console.log('get all sport data by List Event')
        let finalResult = [];
        try{
            const getmarketIdsArr = await getMarketIds()
            console.log(getmarketIdsArr,'getEvwentIdArr')
            for(let k = 0;k<getmarketIdsArr.length;k++){
                // console.log(k,'kk')
                let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/markets/${getmarketIdsArr[k]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketData2 = await fetch(` http://18.171.69.133:6008/sports/books/${getmarketIdsArr[k]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketDatajson2 = await fetchMarketData2.json()
                let fetchMarketDatajson = await fetchMarketData.json()
                console.log(fetchMarketDatajson,fetchMarketDatajson2,'marketdataaaaa')
                if(fetchMarketDatajson2[getmarketIdsArr[k]] && fetchMarketDatajson[0]){
                    fetchMarketDatajson[0].catalogue.runners = fetchMarketDatajson2[getmarketIdsArr[k]].runners
                    finalResult.push(fetchMarketDatajson[0])
                }
            }
            console.log(finalResult,'finalResult')
            await client.set('sharkAllData',JSON.stringify(finalResult))

        }catch(err){
            console.log(err)
        }
        
    })
}
