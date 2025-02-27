const cron = require('node-cron');
const setNewLiveEvent = require('../utils/newEventUpdate')
const setNewEventDetails = require('../utils/setNewThisEvent')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
const client2 = redis.createClient({url:process.env.redisurl2});
client2.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


// module.exports = () => {
    // cron.schedule('*/02 * * * *', async() => {
        const addcricketlivemarketcronFunc = async() => {
            let starttime = new Date();
            try{
                let chunkSize = 30
                let marketIdsArr = [];
                let liveEventInCricket = [];
                let newEventAdded = false
                let newEventIdsArray = []
                let showEvent = []
                let eventIds = await client.get('crone_getEventIds_Cricket_diamond');
                let CricketLiveEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD');
                let forcefullyLiveEvents = await client2.get('InPlayEventdata')
                forcefullyLiveEvents = JSON.parse(forcefullyLiveEvents)
                // console.log(forcefullyLiveEvents,'forcefulllllllllllllllttttttttt')
                if(CricketLiveEventIds){
                    CricketLiveEventIds = JSON.parse(CricketLiveEventIds)
                }else{
                    CricketLiveEventIds = []
                }
                eventIds = JSON.parse(eventIds)
                console.log(eventIds.length,'cricketEventIdssssssss')
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                async function fetchEventDataFunc(marketIds) {
                    let fetchMarketData = await fetch(` http://13.42.165.216:8443/api/betfair/${marketIds}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    fetchMarketData = await fetchMarketData.json()
                    return fetchMarketData
                }
                for(let i = 0;i<eventIds.length;i++){
                    try{
                        // console.log(new Date(),i,eventIds[i],'Add Cricket eventIds and Market iiiiiiiii')
                        let MOBMMarketArr = []
                        let isLiveStatus = false
                        let liveMatchCheckMarket
                        let eventData
                        let fetchMarketData2 = []
                        let OnlyMOBMmARKETOpenArr = []
                        let OnlyMOBMMarketIdsArr = []
                        let isTest = false
                        eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            if(eventData.competitionName == "Test Matches"){
                                isTest = true
                            }
                            MOBMMarketArr = await client.get(`${eventIds[i]}_MOBMMarketArr_diamond`)
                            MOBMMarketArr = JSON.parse(MOBMMarketArr)
                            OnlyMOBMMarketIdsArr = await client.get(`${eventIds[i]}_OnlyMOMarketIdsArr_diamond`)
                            OnlyMOBMMarketIdsArr = JSON.parse(OnlyMOBMMarketIdsArr)
                            if(OnlyMOBMMarketIdsArr.length !== 0){
                                let count = Math.ceil(OnlyMOBMMarketIdsArr.length/chunkSize)
                                for(let k = 0;k<count;k++){
                                    let marketchunks = OnlyMOBMMarketIdsArr.slice((k*chunkSize),(chunkSize * (1+k)))
                                    marketchunks = marketchunks.join(',')
                                    let fetchMarketDatachunk
                                    try{
                                        fetchMarketDatachunk = await fetchEventDataFunc(marketchunks)
                                    }catch(error){
                                        await delay(1000 * 30)
                                        fetchMarketDatachunk = await fetchEventDataFunc(marketchunks)
                                    }
                                    fetchMarketData2 = fetchMarketData2.concat(fetchMarketDatachunk)
                                }
                                let openMarkets = fetchMarketData2.filter(item => ["OPEN","SUSPENDED"].includes(item.status))
                                for(let i = 0;i<openMarkets.length;i++){
                                    OnlyMOBMmARKETOpenArr.push(openMarkets[i].marketId)
                                }
                                liveMatchCheckMarket = fetchMarketData2.find(item => item.status !== "CLOSED")
                            }
                            if(liveMatchCheckMarket){
                                if(liveMatchCheckMarket.inplay == true && liveMatchCheckMarket.status !== 'CLOSED'){
                                    if(!CricketLiveEventIds.includes(eventIds[i])){
                                        newEventAdded = true
                                        newEventIdsArray.push(eventIds[i])
                                    }
                                    liveEventInCricket.push(eventIds[i])
                                    isLiveStatus = true
                                    marketIdsArr = marketIdsArr.concat(MOBMMarketArr)
                                }else{
                                    if(liveMatchCheckMarket.status !== 'CLOSED'){
                                        if(isTest){
                                            if(new Date(eventData.openDate).getTime() + (1000 * 60 * 60 * 24 * 5) >= Date.now()){
                                                if(!CricketLiveEventIds.includes(eventIds[i])){
                                                    newEventAdded = true
                                                    newEventIdsArray.push(eventIds[i])
                                                }
                                                liveEventInCricket.push(eventIds[i])
                                            }
                                        }else{
                                            if(new Date(eventData.openDate).getTime() - (1000 * 60 * 60 * 2) <= Date.now()){
                                                if(!CricketLiveEventIds.includes(eventIds[i])){
                                                    newEventAdded = true
                                                    newEventIdsArray.push(eventIds[i])
                                                }
                                                liveEventInCricket.push(eventIds[i])
                                            }
                                        }
                                    }
                                }
                            }
                            let eventStatus = isLiveStatus?'IN_PLAY':'UPCOMING'
                            eventData.status = eventStatus
                            if(OnlyMOBMMarketIdsArr.length !== 0){
                                let pushstatus = false 
                                let thatMO = liveMatchCheckMarket
                                if(thatMO){
                                    if(['OPEN','SUSPENDED'].includes(thatMO.status)){
                                        pushstatus = true
                                    }
                                }
                                if(pushstatus){
                                    showEvent.push(eventIds[i])
                                }
                            }
                            await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                        }else{
                            showEvent.push(eventIds[i])
                            // setNewEventDetails([eventIds[i]])
                        }
                        for(let i = 0;i<OnlyMOBMmARKETOpenArr.length;i++){
                            if(!marketIdsArr.includes(OnlyMOBMmARKETOpenArr[i])){
                                marketIdsArr.push(OnlyMOBMmARKETOpenArr[i])
                            }
                        }
                    }catch(error){
                        showEvent.push(eventIds[i])
                        console.log("Error:",error)
                    }
                }       
                if(newEventAdded){
                    // await setNewLiveEvent(newEventIdsArray)
                }
                // console.log(liveEventInCricket,'liveEventInCricketliveEventInCricket')
                await client.set('crone_CricketliveEventIds_diamond_UPD',JSON.stringify(liveEventInCricket));
                await client.set('crone_getEventIds_Cricket_diamond_UPD',JSON.stringify(showEvent));
                await client.set('crone_CricketliveMarketIds_diamond_UPD',JSON.stringify(marketIdsArr));
                addcricketlivemarketcronFunc()
            }catch(error){
                addcricketlivemarketcronFunc()
                console.log(error,'ErrorrrAddCricketLiveMarketCroneBackup')
            }
        }
    // })
// }

module.exports = addcricketlivemarketcronFunc

