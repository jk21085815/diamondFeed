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
    cron.schedule('00 04 * * * *', async() => {
        console.log('Set Final Cron Started.....')
        try{
            let finalResult = []
            let eventIdArray = []
            let eventlist = await client.get('crone_getEvent_list')
            eventlist = JSON.parse(eventlist)
            console.log(eventlist.length,'market id length')
            for(let k = 0;k<500;k++){
                console.log(k,new Date(),'kkk')
                for(let l = 0;l<10;l++){
                    let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/43356857`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    let fetchMarketDatajson = await fetchMarketData.json()
                    if(fetchMarketDatajson['43356857']){
                        // eventlist[k].catalogues[l].runners = fetchMarketDatajson[eventlist[k].catalogues[l].marketId].runners
                    }
                }
            }

            console.log(eventlist,eventlist[0],'Set Final Cron Ended.....')    
        }catch(error){
            console.log(error,'Errorrr setFinalSportDataCrone')
        }
    })
}