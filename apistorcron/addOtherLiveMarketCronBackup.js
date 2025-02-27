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
    // cron.schedule('*/03 * * * *', async() => {
        const addotherlivemarketcronFunc = async() => {
            try{
                let OtherSportLiveMarketIds = [];
                let OtherSportLiveEventIds = [];
                let newEventIdsArray = []
                let showEvent = []
                let tennisLiveEventIds = []
                let newEventAdded = false
                let forcefullyLiveEvents = await client2.get('InPlayEventdata')
                forcefullyLiveEvents = JSON.parse(forcefullyLiveEvents)
                let eventIds2 = await client.get(`crone_getEventIds_Tennis_diamond`);
                let eventIds1 = await client.get(`crone_getEventIds_Soccer_diamond`);
                let eventIds3 = await client.get(`crone_getEventIds_GreyHound_diamond`);
                let eventIds4 = await client.get(`crone_getEventIds_HorseRacing_diamond`);
                eventIds1 = JSON.parse(eventIds1)
                eventIds2 = JSON.parse(eventIds2)
                eventIds3 = JSON.parse(eventIds3)
                eventIds4 = JSON.parse(eventIds4)
                let eventIds = eventIds1.concat(eventIds2,eventIds3,eventIds4)
                await client.set('crone_getEventIds_OtherSport_diamond',JSON.stringify(eventIds))
                let liveEventIds = await client.get('crone_OtherSportLiveEventIds_diamond_UPD');
                if(liveEventIds){
                    liveEventIds = JSON.parse(liveEventIds)
                }else{
                    liveEventIds = []
                }
                console.log(eventIds.length,'otherSportEventIdssssssss')
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                async function fetchMOBook(marketIds) {
                    let fetchMarketData = await fetch(` http://13.42.165.216:8443/api/betfair/${marketIds}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    return fetchMarketData
                }
                async function fetchBMBook(eventId) {
                    let fetchMarketData = await fetch(` https://odds.datafeed365.com/api/active-bm/${eventId}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    let fetchMarketDatajson = await fetchMarketData.json()
                    return fetchMarketDatajson.data
                }
                for(let i = 0;i<eventIds.length;i++){
                    try{
                        let MOBMMarketArr = []
                        // console.log(new Date(),i,eventIds[i],'Add Other eventIds and Market iiiiiiiii')
                        let liveMatchCheckMarket
                        let isLiveStatus = false
                        let eventData
                        let fetchMarketData2
                        let issportHRGH = false
                        let OnlyMOBMmARKETOpenArr = [];
                        let OnlyMOMarketIdsArr = []

                        let eventODDSBMMarketIds = await client.get(`${eventIds[i]}_MOBMMarketArr_diamond`)
                        eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            if(eventODDSBMMarketIds){
                                if(["7","4339"].includes(eventData.sportId)){
                                    issportHRGH = true
                                }
                                MOBMMarketArr = await client.get(`${eventIds[i]}_MOBMMarketArr_diamond`)
                                MOBMMarketArr = JSON.parse(MOBMMarketArr)
                                OnlyMOMarketIdsArr = await client.get(`${eventIds[i]}_OnlyMOMarketIdsArr_diamond`)
                                OnlyMOMarketIdsArr = JSON.parse(OnlyMOMarketIdsArr)
                                if(OnlyMOMarketIdsArr.length !== 0 && !issportHRGH){
                                    let MOMarketId = OnlyMOMarketIdsArr.join(",")
                                    try{
                                        fetchMarketData2 = await fetchMOBook(MOMarketId)
                                    }catch(error){
                                        await delay(1000 * 10)
                                        fetchMarketData2 = await fetchMOBook(MOMarketId)
                                    }
                                    
                                    const contentType = fetchMarketData2.headers.get("content-type");
                                    if (!contentType || !contentType.includes("application/json")) {
                                        throw new Error("Non-JSON response received");
                                    }
                                    fetchMarketData2 = await fetchMarketData2.json()
                                    let openMarkets = fetchMarketData2.filter(item => (item && ["OPEN","SUSPENDED"].includes(item.status)))
                                    for(let i = 0;i<openMarkets.length;i++){
                                        OnlyMOBMmARKETOpenArr.push(openMarkets[i].marketId)
                                    }
                                    liveMatchCheckMarket = fetchMarketData2.find(item => item.status !== "CLOSED")
                                }
                                if(!issportHRGH){
                                    if(liveMatchCheckMarket){
                                        if(liveMatchCheckMarket.inplay == true && liveMatchCheckMarket.status !== 'CLOSED'){
                                            if(!liveEventIds.includes(eventIds[i])){
                                                newEventAdded = true
                                                newEventIdsArray.push(eventIds[i])
                                            }
                                            if(eventData.sportId == "2"){
                                                tennisLiveEventIds.push(eventIds[i])
                                            }
                                            OtherSportLiveEventIds.push(eventIds[i])
                                            isLiveStatus = true
                                            OtherSportLiveMarketIds = OtherSportLiveMarketIds.concat(MOBMMarketArr)
                                        }
                                    }
                                    let eventStatus = isLiveStatus?'IN_PLAY':'UPCOMING'
                                    eventData.status = eventStatus
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
                                    await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                }else{
                                    // let liveMatchCheckMarket = []
                                    // let fetchMarketData4
                                    // let fetchMarketData3
                                    // if(MOBMMarketArr.length !== 0){
                                    //     eventODDSBMMarketIdsArr = MOBMMarketArr.join(",")
                                    //     try{
                                    //         fetchMarketData3 = await fetchMOBook(eventODDSBMMarketIdsArr)
                                    //     }catch(error){
                                    //         await delay(1000 * 10)
                                    //         fetchMarketData3 = await fetchMOBook(eventODDSBMMarketIdsArr)
                                    //     }
                                    //     const contentType = fetchMarketData3.headers.get("content-type");
                                    //     if (!contentType || !contentType.includes("application/json")) {
                                    //         console.log(fetchMarketData3,"fetchMarketData3fetchMarketData3")
                                    //         throw new Error("Non-JSON response received");
                                    //     }
                                    //     fetchMarketData3 = await fetchMarketData3.json()
                                    //     liveMatchCheckMarket = fetchMarketData3.filter(item => (item && ["OPEN","SUSPENDED"].includes(item.status)))
                                    //     let liveMatchCheckMarket2 = []
                                    //     for(let j = 0;j<liveMatchCheckMarket.length;j++){
                                    //         liveMatchCheckMarket2.push(liveMatchCheckMarket[j].catalogue)
                                    //     }
                                    //     liveMatchCheckMarket = liveMatchCheckMarket2
                                    // }
                                    // if(liveMatchCheckMarket.length > 0){
                                    //     try{
                                    //         fetchMarketData4 = await fetch(` http://18.171.69.133:6008/sports/books/${eventODDSBMMarketIdsArr}`,{
                                    //             method: 'GET',
                                    //             headers: {
                                    //                 'Content-type': 'application/json',
                                    //             }
                                    //         })
        
                                    //     }catch(error){
                                    //         await delay(1000 * 10)
                                    //         fetchMarketData4 = await fetch(` http://18.171.69.133:6008/sports/books/${eventODDSBMMarketIdsArr}`,{
                                    //             method: 'GET',
                                    //             headers: {
                                    //                 'Content-type': 'application/json',
                                    //             }
                                    //         })
                                    //     }
                                    //     const contentType2 = fetchMarketData4.headers.get("content-type");
                                    //     if (!contentType2 || !contentType2.includes("application/json")) {
                                    //         throw new Error("Non-JSON response received");
                                    //     }
                                    //     fetchMarketData4 = await fetchMarketData4.json()
                                    //     for(let j = 0;j<liveMatchCheckMarket.length;j++){
                                    //         let marketdata = await client.get(`${liveMatchCheckMarket[j].marketId}_diamond`)
                                    //         if(marketdata){
                                    //             marketdata = JSON.parse(marketdata)
                                    //             liveMatchCheckMarket[j].runners = marketdata.runners
                                    //         }else{
                                    //             let bookdata = fetchMarketData4[liveMatchCheckMarket[j].marketId]
                                    //             if(bookdata){
                                    //                 if(bookdata.sportingEvent == true && bookdata.status !== "CLOSED"){
                                    //                     liveMatchCheckMarket[j].status = "BALL_RUNNING"
                                    //                 }
                                    //                 for(let k = 0;k<liveMatchCheckMarket[j].runners.length;k++){
                                    //                     runner = bookdata.runners.find(item => item.selectionId == liveMatchCheckMarket[j].runners[k].id)
                                    //                     if(runner){
                                    //                         runner.metadata = liveMatchCheckMarket[j].runners[k].metadata
                                    //                         runner.runnerName = liveMatchCheckMarket[j].runners[k].name
                                    //                         runner.runnerId = runner.selectionId
                                    //                         runner.layPrices = runner.lay
                                    //                         runner.backPrices = runner.back
                                    //                         delete runner.back
                                    //                         delete runner.lay
                                    //                         delete runner.selectionId
                                    //                         liveMatchCheckMarket[j].runners[k] = runner
                                    //                     }else{
                                    //                         liveMatchCheckMarket[j].runners[k].runnerName = liveMatchCheckMarket[j].runners[k].name
                                    //                         liveMatchCheckMarket[j].runners[k].runnerId = liveMatchCheckMarket[j].runners[k].id
                                    //                         liveMatchCheckMarket[j].runners[k].layPrices = []
                                    //                         liveMatchCheckMarket[j].runners[k].backPrices = []
                                    //                         delete liveMatchCheckMarket[j].runners[k].name
                                    //                         delete liveMatchCheckMarket[j].runners[k].id
                                    //                     }
                                    //                 }
                                    //             }else{
                                    //                 for(let k = 0;k<liveMatchCheckMarket[j].runners.length;k++){
                                    //                     liveMatchCheckMarket[j].runners[k].runnerName = liveMatchCheckMarket[j].runners[k].name
                                    //                     liveMatchCheckMarket[j].runners[k].runnerId = liveMatchCheckMarket[j].runners[k].id
                                    //                     liveMatchCheckMarket[j].runners[k].layPrices = []
                                    //                     liveMatchCheckMarket[j].runners[k].backPrices = []
                                    //                     delete liveMatchCheckMarket[j].runners[k].name
                                    //                     delete liveMatchCheckMarket[j].runners[k].id
                                    //                 }
                                    //             }
                                    //         }
        
                                    //     }
                                    //     OtherSportLiveEventIds.push(eventIds[i])
                                    //     eventData.markets.matchOdds = liveMatchCheckMarket
                                    //     eventData.status == "IN_PLAY"
                                    //     await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                    //     for(let k = 0;k<liveMatchCheckMarket.length;k++){
                                    //         OtherSportLiveMarketIds.push(liveMatchCheckMarket[k].marketId)
                                    //     }
                                    // }else{
                                    //     eventData.markets.matchOdds = liveMatchCheckMarket
                                    //     eventData.status == "UPCOMING"
                                    //     await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                    // }
                                    showEvent.push(eventIds[i])
                                }
                            }else{
                                showEvent.push(eventIds[i])
                                // setNewEventDetails([eventIds[i]])
                            }
                        }else{
                            showEvent.push(eventIds[i])
                            // setNewEventDetails([eventIds[i]])
                        }
                        for(let i = 0;i<OnlyMOBMmARKETOpenArr.length;i++){
                            if(!OtherSportLiveMarketIds.includes(OnlyMOBMmARKETOpenArr[i])){
                                OtherSportLiveMarketIds.push(OnlyMOBMmARKETOpenArr[i])
                            }
                        }
                    }catch(error){
                        showEvent.push(eventIds[i])
                        console.log("Error",error)
                    }
                }       
    
                if(newEventAdded){
                    // setNewLiveEvent(newEventIdsArray)
                }
                await client.set('crone_liveMarketIds_diamond_UPD',JSON.stringify(OtherSportLiveMarketIds));
                await client.set('crone_OtherSportLiveEventIds_diamond_UPD',JSON.stringify(OtherSportLiveEventIds));
                await client.set('crone_TennisLiveEventIds_diamond_UPD',JSON.stringify(tennisLiveEventIds));
                await client.set(`crone_getEventIds_OtherSport_diamond_UPD`,JSON.stringify(showEvent))
                addotherlivemarketcronFunc()
            }catch(error){
                addotherlivemarketcronFunc()
                console.log(error,'Errorrr addOtherLiveMarketCronbackup')
            }
        }
    // })
// }

module.exports = addotherlivemarketcronFunc

