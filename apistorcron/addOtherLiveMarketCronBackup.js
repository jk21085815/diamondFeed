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
                                        let matchoddmarketdata = await fetchOtherMOMarketData(eventIds[i])
                                        let bookmakerdata = await fetchBMBook(eventIds[i])
                                        for(let d = 0;d<matchoddmarketdata.length;d++){
                                            let matchodddata = await fetchMOBook(matchoddmarketdata[d].marketId)
                                            for(let e = 0;e<matchodddata.length;e++){
                                                if(matchodddata[e]){
                                                    let tempObj
                                                    let tempRunner = []
                                                    tempObj = {
                                                        "marketId": matchodddata[e].marketId,
                                                        "marketTime": matchodddata[e].lastMatchTime,
                                                        "marketType": matchoddmarketdata[d].description.marketType,
                                                        "bettingType": matchoddmarketdata[d].description.bettingType,
                                                        "marketName": matchoddmarketdata[d].marketName,
                                                        "provider": "DIAMOND",
                                                        "status": matchodddata[e].status
                                                    }
                                                    for(let c = 0;c<matchodddata[e].runners.length;c++){
                                                        let runner
                                                        runner = matchoddmarketdata[d].runners.find(item => item.selectionId == matchodddata[e].runners[c].selectionId)
                                                        let tempObjrunner = 
                                                        {
                                                            "status": matchodddata[e].runners[c].status,
                                                            "metadata": runner.metadata,
                                                            "runnerName": runner.runnerName,
                                                            "runnerId": matchodddata[e].runners[c].selectionId,
                                                            "layPrices": matchodddata[e].runners[c].ex.availableToLay,
                                                            "backPrices": matchodddata[e].runners[c].ex.availableToBack
                                                        }
                                                        tempRunner.push(tempObjrunner)
                                                    }
                                                    tempObj.runners = tempRunner
                                                    if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                                                        matchOddMarketArr.push(tempObj)
                                                    }
                                                }
                                            }
                                        }
                                        if(bookmakerdata){
                                            for(let a = 0; a<bookmakerdata.length; a++){
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
                                                if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                                                    bookmakersMarketArr.push(tempObj)
                                                }
                                            }
                                        }
                                        if(eventData.sportId == 1){
                                            let matchoddmarketdata = await fetchUOMarketData(eventData.eventId)
                                            for(let d = 0;d<matchoddmarketdata.length;d++){
                                                let matchodddata = await fetchMOBook(matchoddmarketdata[d].marketId)
                                                for(let e = 0;e<matchodddata.length;e++){
                                                    if(matchodddata[e] && matchoddmarketdata[d].marketName !== "Match Odds"){
                                                        let tempObj
                                                        let tempRunner = []
                                                        tempObj = {
                                                            "marketId": matchodddata[e].marketId,
                                                            "marketTime": matchodddata[e].lastMatchTime,
                                                            "marketType": matchoddmarketdata[d].description.marketType,
                                                            "bettingType": matchoddmarketdata[d].description.bettingType,
                                                            "marketName": matchoddmarketdata[d].marketName,
                                                            "provider": "DIAMOND",
                                                            "status": matchodddata[e].status
                                                        }
                                                        for(let c = 0;c<matchodddata[e].runners.length;c++){
                                                            let runner
                                                            runner = matchoddmarketdata[d].runners.find(item => item.selectionId == matchodddata[e].runners[c].selectionId)
                                                            let tempObjrunner = 
                                                            {
                                                                "status": matchodddata[e].runners[c].status,
                                                                "metadata": runner.metadata,
                                                                "runnerName": runner.runnerName,
                                                                "runnerId": matchodddata[e].runners[c].selectionId,
                                                                "layPrices": matchodddata[e].runners[c].ex.availableToLay,
                                                                "backPrices": matchodddata[e].runners[c].ex.availableToBack
                                                            }
                                                            tempRunner.push(tempObjrunner)
                                                        }
                                                        tempObj.runners = tempRunner
                                                        if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                                                            matchOddMarketArr.push(tempObj)
                                                        }
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
                                    if(MOBMMarketArr.length !== 0){
                                        let momarketIds = MOBMMarketArr.join(",")
                                        try{
                                            fetchMarketData3 = await fetchMOBook(momarketIds)
                                        }catch(error){
                                            await delay(1000 * 10)
                                            fetchMarketData3 = await fetchMOBook(momarketIds)
                                        }
                                        fetchMarketData3 = await fetchMarketData3.json()
                                        liveMatchCheckMarket = fetchMarketData3.filter(item => (item && ["OPEN","SUSPENDED"].includes(item.status)))
                                    }
                                    if(liveMatchCheckMarket.length > 0){
                                        for(let a = 0;a<liveMatchCheckMarket.length;a++){
                                            let thismarketdetail = await client.get(`${liveMatchCheckMarket[a].marketId}_diamond`)
                                            if(thismarketdetail){
                                                thismarketdetail = JSON.parse(thismarketdetail)
                                                thismarketdetail.status = liveMatchCheckMarket[a].status
                                                thismarketdetail.marketTime = liveMatchCheckMarket[a].lastMatchTime
                                                for(let c = 0;c<liveMatchCheckMarket[a].runners.length;c++){
                                                    let thisrunner = thismarketdetail.runners.find(item => item.runnerId == liveMatchCheckMarket[a].runners[c].selectionId)
                                                    thisrunner.status = liveMatchCheckMarket[a].runners[c].status
                                                    thisrunner.layPrices = liveMatchCheckMarket[a].runners[c].ex.availableToLay,
                                                    thisrunner.backPrices = liveMatchCheckMarket[a].runners[c].ex.availableToBack
                                                }
                                                matchOddsArr2.push(thismarketdetail)
                                            }

                                        }
                                        eventData.markets.matchOdds = liveMatchCheckMarket
                                        eventData.status == "IN_PLAY"
                                        await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                        OtherSportLiveEventIds.push(eventIds[i])
                                        for(let k = 0;k<liveMatchCheckMarket.length;k++){
                                            OtherSportLiveMarketIds.push(liveMatchCheckMarket[k].marketId)
                                        }
                                    }else{
                                        eventData.markets.matchOdds = liveMatchCheckMarket
                                        eventData.status == "UPCOMING"
                                        await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                    }
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

