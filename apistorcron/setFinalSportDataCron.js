const cron = require('node-cron');
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setFinalSportData.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


module.exports = () => {
    cron.schedule('00 45 * * * *', async() => {
        console.log('Set Final Cron Started.....')
        try{
            let finalResult = []
            let eventIdArray = []
            let marketIds = await client.get('crone_getMarketIds')
            console.log(marketIds.length,'market id length')
            marketIds = JSON.parse(marketIds)
            for(let k = 0;k<marketIds.length;k++){
                let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/markets/${marketIds[k]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketData2 = await fetch(` http://18.171.69.133:6008/sports/books/${marketIds[k]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketDatajson2 = await fetchMarketData2.json()
                let fetchMarketDatajson = await fetchMarketData.json()
                if(fetchMarketDatajson[0]){
                    if(fetchMarketDatajson2[marketIds[k]]){
                        fetchMarketDatajson[0].catalogue.runners = fetchMarketDatajson2[marketIds[k]].runners
                    }
                    fetchMarketDatajson[0].catalogues = [fetchMarketDatajson[0].catalogue]
                    if(eventIdArray.includes(fetchMarketDatajson[0].event.id)){
                        finalResult = finalResult.map((item)=>{
                            return eventIdArray.includes(item.event.id) ? { ...item, catalogues: [...item.catalogues,fetchMarketDatajson[0].catalogue] } : item
                        })
                    }else{
                        finalResult.push(fetchMarketDatajson[0])
                        eventIdArray.push(fetchMarketDatajson[0].event.id)
                    }
                }
                if(k % 100 == 0 && k !== marketIds.length - 1) client.set('crone_getAllSportData',JSON.stringify(finalResult));
                if(k == marketIds.length - 1){
                    client.set('crone_getAllSportData',JSON.stringify(finalResult));
                }
            }
            console.log('Set Final Cron Ended.....')    
        }catch(error){
            console.log(error,'Errorrr setFinalSportDataCron')
        }
    })
}