const cron = require('node-cron');
const setFanctDetails = require('../utils/setNewLiveFancyDetails')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
const { promisify } = require('util');
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


module.exports = () => {
    cron.schedule('*/5 * * * * *', async() => {
    // const updateFancy = async() => {    
        try{
            console.log('fancy');
            
            // setInterval(async() => { 
                    let cricketEventIds
                    // await client.set("isNewLiveEventAdded",JSON.stringify(true))
                    let isNewLiveEventAdded = await client.get('isNewLiveEventAdded')
                    isNewLiveEventAdded = JSON.parse(isNewLiveEventAdded)
                    if(isNewLiveEventAdded){
                        cricketEventIds = await client.get('newEventIds_Cricket'); 
                        cricketEventIds = JSON.parse(cricketEventIds)
                        // console.log(cricketEventIds);
                        if(cricketEventIds){
                            for(let i = 0;i<cricketEventIds.length;i++){
                                let marketIdsArr = [];
                                let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${cricketEventIds[i]}`,{
                                    method: 'GET',
                                    headers: {
                                        'Content-type': 'application/json',
                                    }
                                })
                                fetchMarketData = await fetchMarketData.json()
                                for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                    if(fetchMarketData.catalogues[k].bettingType == "LINE" && ['SUSPENDED','OPEN','INACTIVE'].includes(fetchMarketData.catalogues[k].status)){
                                        marketIdsArr.push(fetchMarketData.catalogues[k].marketId)
                                    }
                                }
                                if(marketIdsArr.length != 0){
                                    // console.log(marketIdsArr, isNewLiveEventAdded,'marketIdsArrmarketIdsArrmarketIdsArrmarketIdsArr');
                                    setFanctDetails(marketIdsArr,cricketEventIds[i],i,cricketEventIds.length,isNewLiveEventAdded)
                                }
                            }
                        }
                    }
                // }, 5000);
            }catch(error){
                console.log(error,'Errorrr newEventFancySetCron')
            }
    // }
    })
}
// module.exports = updateFancy