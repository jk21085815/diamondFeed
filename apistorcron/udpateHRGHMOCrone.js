const cron = require('node-cron');
const setNewEventDetails = require('../utils/setNewThisEvent')
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
    cron.schedule('* * * *', async() => {
    // const updateFancy = async() => {   
        try{
            // setInterval(async() => {
                let HREventIds;
                let GHEventIds;
                let HRGHClosedEventIds = [];
                HREventIds = await client.get('crone_getEventIds_HorseRacing')
                HREventIds = JSON.parse(HREventIds)
                GHEventIds = await client.get('crone_getEventIds_GreyHound')
                GHEventIds = JSON.parse(GHEventIds)
                let eventIds = GHEventIds.concat(HREventIds)
                console.log(eventIds.length,'eventIdseventIdseventIds hourse & grey')
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                for(let i = 0;i<eventIds.length;i++){
                    console.log(i,eventIds[i],'horse & grey')
                    let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[i]}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    const contentType = fetchMarketData.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        // If the response is JSON, parse it
                        fetchMarketData = await fetchMarketData.json();
                        // console.log("Data:", fetchMarketData);
                    } else {
                        fetchMarketData = await fetchMarketData.text();
                        console.log("Non-JSON response received");

                    }
                    await delay(1000 * 5);
                    // console.log(i,eventIds[i],Date.now() - starttime,'horse & grey')
                    if(fetchMarketData && fetchMarketData.catalogues){
                        let liveMatchCheckMarket = fetchMarketData.catalogues.filter(item => ["OPEN","SUSPENDED"].includes(item.status))
                        // console.log(liveMatchCheckMarket,eventIds[i],'liveMatchCheckMarket')
                        let eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        let eventstatus = false
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            if(eventData.markets){
                                eventstatus = true
                            }
                        }
                        if(eventData && eventstatus){
                            if(liveMatchCheckMarket.length > 0){
                                eventData.markets.matchOdds = liveMatchCheckMarket
                                await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                // let othersportLiveEventIDs = await client.get('crone_OtherSportLiveEventIds_UPD');
                                // othersportLiveEventIDs = JSON.parse(othersportLiveEventIDs)
                                // if(!othersportLiveEventIDs.find(item => item == eventIds[i])){
                                //     othersportLiveEventIDs = othersportLiveEventIDs.concat(eventIds[i])
                                //     await client.set('crone_OtherSportLiveEventIds_UPD',JSON.stringify(othersportLiveEventIDs));
                                // }
                            }else{
                                HRGHClosedEventIds.push(eventIds[i])
                                eventData.markets.matchOdds = liveMatchCheckMarket
                                await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                            }
                        }else{
                            setNewEventDetails([eventIds[i]])
                        }
                        
                    }
                }      
            // }, 1000 * 60);
        }catch(error){
            console.log(error,'Errorrr udpateHRGHMOCrone')
        }
    // }
    })
}
// module.exports = updateFancy