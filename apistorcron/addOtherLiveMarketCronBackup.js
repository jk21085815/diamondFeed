const cron = require('node-cron');
const setNewLiveEvent = require('../utils/newEventUpdate')
const setNewEventDetails = require('../utils/setNewThisEvent')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const Publishclient = redis.createClient({url:process.env.redisurl});
client.connect()
Publishclient.connect()
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
                let OtherSportLiveMarketIdsMO = [];
                // let OtherSportLiveMarketIdsBM = [];
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
                // let eventIds2 = await client.get(`crone_getEventIds_Tennis`);
                // let eventIds1 = await client.get(`crone_getEventIds_Soccer`);
                // let eventIds3 = await client.get(`crone_getEventIds_GreyHound`);
                // let eventIds4 = await client.get(`crone_getEventIds_HorseRacing`);
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
                    let fetchMarketDatajson = await fetchMarketData.json()
                    return fetchMarketDatajson
                }
                async function fetchOtherMOMarketData(eventId) {
                    let fetchMarketData = await fetch(`http://13.42.165.216/betfair/cricket_extra_market_list/${eventId}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    let fetchMarketDatajson = await fetchMarketData.json()
                    return fetchMarketDatajson
                }
                async function fetchUOMarketData(eventId) {
                    let fetchMarketData = await fetch(`http://13.42.165.216/betfair/under_over_goal_market_list/${eventId}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    let fetchMarketDatajson = await fetchMarketData.json()
                    return fetchMarketDatajson
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
                        let matchOddMarketArr = []
                        let bookmakersMarketArr = []
                        let OtherMOMarketArr = []
                        // console.log(new Date(),i,eventIds[i],'Add Other eventIds and Market iiiiiiiii')
                        let liveMatchCheckMarket
                        let isLiveStatus = false
                        let eventData
                        let fetchMarketData2
                        let issportHRGH = false
                        let OnlyMOBMmARKETOpenArr = [];
                        let OnlyMOMarketIdsArr = []

                        eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            if(["7","4339"].includes(eventData.sportId)){
                                issportHRGH = true
                            }
                            OtherMOMarketArr = await client.get(`${eventIds[i]}_OnlyOtherMOMarketIdsArr_diamond`)
                            OtherMOMarketArr = JSON.parse(OtherMOMarketArr)
                            OnlyMOMarketIdsArr = await client.get(`${eventIds[i]}_OnlyMOMarketIdsArr_diamond`)
                            OnlyMOMarketIdsArr = JSON.parse(OnlyMOMarketIdsArr)
                            // console.log(eventData.eventId,OnlyMOMarketIdsArr,"OnlyMOMarketIdsArrOnlyMOMarketIdsArr")
                            if(OnlyMOMarketIdsArr.length !== 0 && !issportHRGH){
                                let MOMarketId = OnlyMOMarketIdsArr.join(",")
                                try{
                                    fetchMarketData2 = await fetchMOBook(MOMarketId)
                                }catch(error){
                                    await delay(1000 * 10)
                                    fetchMarketData2 = await fetchMOBook(MOMarketId)
                                }
                                
                                // let openMarkets = fetchMarketData2.filter(item => (item && ["OPEN","SUSPENDED"].includes(item.status)))
                                // for(let i = 0;i<openMarkets.length;i++){
                                //     OnlyMOBMmARKETOpenArr.push(openMarkets[i].marketId)
                                // }
                                liveMatchCheckMarket = fetchMarketData2.find(item => (item.status !== "CLOSED"))
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
                                    }
                                }else{
                                    // console.log(fetchMarketData2,'fetchMarketData2fetchMarketData2')
                                }
                                let eventStatus = isLiveStatus?'IN_PLAY':'UPCOMING'
                                eventData.status = eventStatus
                                let pushstatus = false 
                                let thatMO = liveMatchCheckMarket
                                // console.log(thatMO.status,'thatMOoooooooooooooooo')
                                if(thatMO){
                                    if(['OPEN','SUSPENDED','BALL_RUNNING'].includes(thatMO.status)){
                                        pushstatus = true
                                    }
                                }
                                if(pushstatus){
                                    let bookmakerdata = await fetchBMBook(eventIds[i])
                                    let matchoddmarketRedis = await client.get(`${liveMatchCheckMarket.marketId}_diamond`)
                                    if(matchoddmarketRedis){
                                        matchoddmarketRedis = JSON.parse(matchoddmarketRedis)
                                        let matchodddata = await fetchMOBook(liveMatchCheckMarket.marketId)
                                        for(let e = 0;e<matchodddata.length;e++){
                                            if(matchodddata[e]){
                                                matchoddmarketRedis.status = matchodddata[e].status
                                                for(let c = 0;c<matchodddata[e].runners.length;c++){
                                                    let runner
                                                    runner = matchoddmarketRedis.runners.find(item => item.runnerId == matchodddata[e].runners[c].selectionId)
                                                    runner.status = matchodddata[e].runners[c].status
                                                    runner.layPrices = matchodddata[e].runners[c].ex.availableToLay
                                                    runner.backPrices = matchodddata[e].runners[c].ex.availableToBack
                                                }
                                                if(["OPEN","SUSPENDED","BALL_RUNNING"].includes(matchoddmarketRedis.status)){
                                                    matchOddMarketArr.push(matchoddmarketRedis)
                                                    if(!OtherSportLiveMarketIdsMO.includes(matchoddmarketRedis.marketId)){
                                                        OtherSportLiveMarketIdsMO.push(matchoddmarketRedis.marketId)
                                                    }
                                                    await client.set(`${matchoddmarketRedis.marketId}_diamond`, JSON.stringify(matchoddmarketRedis), 'EX', 24 * 60 * 60);
    
                                                }
                                            }
                                        }
                                    }
                                    if(bookmakerdata){
                                        for(let a = 0; a<bookmakerdata.length; a++){
                                            if(Object.keys(bookmakerdata[a].data).length !== 0){
                                                let tempRunner = []
                                                let marketName
                                                let tempObj = {
                                                    "marketId": bookmakerdata[a].bookmaker_id,
                                                    "marketTime": new Date(),
                                                    "bettingType": "BOOKMAKER",
                                                    "marketType": "BOOKMAKER",
                                                    "provider": "DIAMOND",
                                                    "status": bookmakerdata[a].data.status
                                                }
                                                if(bookmakerdata[a].data.type == "MATCH_ODDS"){
                                                    marketName = "Bookmaker"
                                                }else if(bookmakerdata[a].data.type == "MINI_BOOKMAKER"){
                                                    marketName = "Bookmaker 0 Commission"
                                                }else if(bookmakerdata[a].data.type == "TO_WIN_THE_TOSS"){
                                                    marketName = "To Win The Toss"
                                                }else{
                                                    marketName = "Other Bookmaker"
                                                }
                                                tempObj["marketName"] = marketName
                            
                                                let bookmakerrunner = JSON.parse(bookmakerdata[a].data.runners)
                                                let runnerIds = Object.keys(bookmakerrunner)
                                                for(let c = 0;c<runnerIds.length;c++){
                                                    let runner = bookmakerrunner[runnerIds[c]]
                                                    let tempObjrunner = 
                                                    {
                                                        "status": runner.status,
                                                        "metadata": "",
                                                        "runnerName": runner.name,
                                                        "runnerId": runner.selection_id,
                                                        "layPrices": [{
                                                            "price":runner.lay_price,
                                                            "size":runner.lay_volume
                                                        }],
                                                        "backPrices": [{
                                                            "price":runner.back_price,
                                                            "size":runner.back_volume
                                                        }]
                                                    }
                                                    tempRunner.push(tempObjrunner)
                                                }
                                                tempObj.runners = tempRunner
                                                if(["OPEN","SUSPENDED","BALL_RUNNING"].includes(tempObj.status)){
                                                    bookmakersMarketArr.push(tempObj)
                                                    await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
                                                    await client.set(`/topic/diamond_bm_update/${tempObj.marketId}`,JSON.stringify(tempObj));
                                                    Publishclient.publish(`/topic/diamond_bm_update/${tempObj.marketId}`,JSON.stringify(tempObj));
                                                    // if(!OtherSportLiveMarketIdsBM.includes(tempObj.marketId)){
                                                    //     OtherSportLiveMarketIdsBM.push(tempObj.marketId)
                                                    // }
                                                }
                                            }
                                        }
                                    }
                                    // if(eventData.sportId == 1){
                                    //     let matchoddmarketdata = await fetchUOMarketData(eventData.eventId)
                                    //     for(let d = 0;d<matchoddmarketdata.length;d++){
                                    //         let matchodddata = await fetchMOBook(matchoddmarketdata[d].marketId)
                                    //         for(let e = 0;e<matchodddata.length;e++){
                                    //             if(matchodddata[e] && matchoddmarketdata[d].marketName !== "Match Odds"){
                                    //                 let tempObj
                                    //                 let tempRunner = []
                                    //                 tempObj = {
                                    //                     "marketId": matchodddata[e].marketId,
                                    //                     "marketTime": matchodddata[e].lastMatchTime,
                                    //                     "marketType": matchoddmarketdata[d].description.marketType,
                                    //                     "bettingType": matchoddmarketdata[d].description.bettingType,
                                    //                     "marketName": matchoddmarketdata[d].marketName,
                                    //                     "provider": "DIAMOND",
                                    //                     "status": matchodddata[e].status
                                    //                 }
                                    //                 for(let c = 0;c<matchodddata[e].runners.length;c++){
                                    //                     let runner
                                    //                     runner = matchoddmarketdata[d].runners.find(item => item.selectionId == matchodddata[e].runners[c].selectionId)
                                    //                     let tempObjrunner = 
                                    //                     {
                                    //                         "status": matchodddata[e].runners[c].status,
                                    //                         "metadata": runner.metadata,
                                    //                         "runnerName": runner.runnerName,
                                    //                         "runnerId": matchodddata[e].runners[c].selectionId,
                                    //                         "layPrices": matchodddata[e].runners[c].ex.availableToLay,
                                    //                         "backPrices": matchodddata[e].runners[c].ex.availableToBack
                                    //                     }
                                    //                     tempRunner.push(tempObjrunner)
                                    //                 }
                                    //                 tempObj.runners = tempRunner
                                    //                 if(["OPEN","SUSPENDED","BALL_RUNNING"].includes(tempObj.status)){
                                    //                     matchOddMarketArr.push(tempObj)
                                    //                     if(!OtherSportLiveMarketIdsMO.includes(tempObj.marketId)){
                                    //                         OtherSportLiveMarketIdsMO.push(tempObj.marketId)
                                    //                     }
                                    //                     await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);

                                    //                 }
                                    //             }
                                    //         }
                                    //     }
                    
                                    // }
                                    let liveMatchCheckMarket2 = []
                                    let fetchMarketData3
                                    if(OtherMOMarketArr.length !== 0){
                                        let momarketIds = OtherMOMarketArr.join(",")
                                        try{
                                            fetchMarketData3 = await fetchMOBook(momarketIds)
                                        }catch(error){
                                            await delay(1000 * 10)
                                            fetchMarketData3 = await fetchMOBook(momarketIds)
                                        }
                                        liveMatchCheckMarket2 = fetchMarketData3.filter(item => (item && ["OPEN","SUSPENDED","BALL_RUNNING"].includes(item.status)))
                                    }
                                    if(liveMatchCheckMarket2.length > 0){
                                        for(let a = 0;a<liveMatchCheckMarket2.length;a++){
                                            let thismarketdetail = await client.get(`${liveMatchCheckMarket2[a].marketId}_diamond`)
                                            if(thismarketdetail){
                                                thismarketdetail = JSON.parse(thismarketdetail)
                                                thismarketdetail.status = liveMatchCheckMarket2[a].status
                                                for(let c = 0;c<liveMatchCheckMarket2[a].runners.length;c++){
                                                    let thisrunner = thismarketdetail.runners.find(item => item.runnerId == liveMatchCheckMarket2[a].runners[c].selectionId)
                                                    thisrunner.status = liveMatchCheckMarket2[a].runners[c].status
                                                    thisrunner.layPrices = liveMatchCheckMarket2[a].runners[c].ex.availableToLay,
                                                    thisrunner.backPrices = liveMatchCheckMarket2[a].runners[c].ex.availableToBack
                                                }
                                                matchOddMarketArr.push(thismarketdetail)
                                                if(!OtherSportLiveMarketIdsMO.includes(thismarketdetail.marketId)){
                                                    OtherSportLiveMarketIdsMO.push(thismarketdetail.marketId)
                                                }
                                            }
    
                                        }
                                    }
                                    eventData.markets.matchOdds = matchOddMarketArr
                                    eventData.markets.bookmakers = bookmakersMarketArr
                                    showEvent.push(eventIds[i])
                                                
                                }
                                await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                            }else{
                                let liveMatchCheckMarket = []
                                let fetchMarketData3
                                if(OtherMOMarketArr.length !== 0){
                                    let momarketIds = OtherMOMarketArr.join(",")
                                    try{
                                        fetchMarketData3 = await fetchMOBook(momarketIds)
                                    }catch(error){
                                        await delay(1000 * 10)
                                        fetchMarketData3 = await fetchMOBook(momarketIds)
                                    }
                                    liveMatchCheckMarket = fetchMarketData3.filter(item => (item && ["OPEN","SUSPENDED","BALL_RUNNING"].includes(item.status)))
                                }
                                if(liveMatchCheckMarket.length > 0){
                                    for(let a = 0;a<liveMatchCheckMarket.length;a++){
                                        let thismarketdetail = await client.get(`${liveMatchCheckMarket[a].marketId}_diamond`)
                                        if(thismarketdetail){
                                            thismarketdetail = JSON.parse(thismarketdetail)
                                            thismarketdetail.status = liveMatchCheckMarket[a].status
                                            for(let c = 0;c<liveMatchCheckMarket[a].runners.length;c++){
                                                let thisrunner = thismarketdetail.runners.find(item => item.runnerId == liveMatchCheckMarket[a].runners[c].selectionId)
                                                thisrunner.status = liveMatchCheckMarket[a].runners[c].status
                                                thisrunner.layPrices = liveMatchCheckMarket[a].runners[c].ex.availableToLay,
                                                thisrunner.backPrices = liveMatchCheckMarket[a].runners[c].ex.availableToBack
                                            }
                                            matchOddMarketArr.push(thismarketdetail)
                                            if(!OtherSportLiveMarketIdsMO.includes(thismarketdetail.marketId)){
                                                OtherSportLiveMarketIdsMO.push(thismarketdetail.marketId)
                                            }
                                        }

                                    }
                                    eventData.markets.matchOdds = matchOddMarketArr
                                    eventData.status == "IN_PLAY"
                                    await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                    OtherSportLiveEventIds.push(eventIds[i])
                                    // for(let k = 0;k<liveMatchCheckMarket.length;k++){
                                    //     OtherSportLiveMarketIds.push(liveMatchCheckMarket[k].marketId)
                                    // }
                                }else{
                                    eventData.markets.matchOdds = liveMatchCheckMarket
                                    eventData.status == "UPCOMING"
                                    await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                }
                                await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                showEvent.push(eventIds[i])
                            }
                        }else{
                            showEvent.push(eventIds[i])
                            // setNewEventDetails([eventIds[i]])
                        }
                        // for(let i = 0;i<OnlyMOBMmARKETOpenArr.length;i++){
                        //     if(!OtherSportLiveMarketIds.includes(OnlyMOBMmARKETOpenArr[i])){
                        //         OtherSportLiveMarketIds.push(OnlyMOBMmARKETOpenArr[i])
                        //     }
                        // }
                    }catch(error){
                        showEvent.push(eventIds[i])
                        console.log("Error",error)
                    }
                }       
    
                if(newEventAdded){
                    // setNewLiveEvent(newEventIdsArray)
                }
                await client.set('crone_liveMarketIds_MO_diamond_UPD',JSON.stringify(OtherSportLiveMarketIdsMO));
                // await client.set('crone_liveMarketIds_BM_diamond_UPD',JSON.stringify(OtherSportLiveMarketIdsBM));
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

