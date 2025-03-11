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
    // cron.schedule('*/02 * * * *', async() => {
        const addcricketlivemarketcronFunc = async() => {
            try{
                let chunkSize = 30
                let marketIdsArrMO = [];
                let liveEventInCricket = [];
                let newEventIdsArray = []
                let showEvent = []
                let eventIds = await client.get('crone_getEventIds_Cricket_diamond');
                let CricketLiveEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD');
                let forcefullyLiveEvents = await client2.get('InPlayEventdata')
                forcefullyLiveEvents = JSON.parse(forcefullyLiveEvents)
                if(CricketLiveEventIds){
                    CricketLiveEventIds = JSON.parse(CricketLiveEventIds)
                }else{
                    CricketLiveEventIds = []
                }
                eventIds = JSON.parse(eventIds)
                // console.log(eventIds.length,'cricketEventIdssssssss')
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
                async function fetchBMBook(eventId) {
                    let fetchMarketData = await fetch(`https://odds.datafeed365.com/api/active-bm/${eventId}`,{
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
                        // console.log(new Date(),i,eventIds[i],'Add Cricket eventIds and Market iiiiiiiii')
                        let matchOddMarketArr = []
                        let bookmakersMarketArr = []
                        let OtherMOMarketArr = []
                        let isLiveStatus = false
                        let liveMatchCheckMarket
                        let eventData
                        let fetchMarketData2 = []
                        let OnlyMOBMmARKETOpenArr = []
                        let OnlyMOMarketIdsArr = []
                        let isTest = false
                        eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            if(eventData.competitionName == "Test Matches"){
                                isTest = true
                            }
                            OtherMOMarketArr = await client.get(`${eventIds[i]}_OnlyOtherMOMarketIdsArr_diamond`)
                            OtherMOMarketArr = JSON.parse(OtherMOMarketArr)
                            OnlyMOMarketIdsArr = await client.get(`${eventIds[i]}_OnlyMOMarketIdsArr_diamond`)
                            OnlyMOMarketIdsArr = JSON.parse(OnlyMOMarketIdsArr)
                            // console.log(OnlyMOMarketIdsArr,"OnlyMOMarketIdsArr")
                            if(OnlyMOMarketIdsArr.length !== 0){
                                let count = Math.ceil(OnlyMOMarketIdsArr.length/chunkSize)
                                for(let k = 0;k<count;k++){
                                    let marketchunks = OnlyMOMarketIdsArr.slice((k*chunkSize),(chunkSize * (1+k)))
                                    marketchunks = marketchunks.join(',')
                                    let fetchMarketDatachunk
                                    try{
                                        fetchMarketDatachunk = await fetchMOBook(marketchunks)
                                    }catch(error){
                                        await delay(1000 * 30)
                                        fetchMarketDatachunk = await fetchMOBook(marketchunks)
                                    }
                                    fetchMarketData2 = fetchMarketData2.concat(fetchMarketDatachunk)
                                }
                                console.log(fetchMarketData2,eventIds[i],"fetchMarketData2fetchMarketData2fetchMarketData2")
                                liveMatchCheckMarket = fetchMarketData2.find(item => (item.status !== "CLOSED"))
                            }
                            if(liveMatchCheckMarket){
                                if(liveMatchCheckMarket.inplay == true && liveMatchCheckMarket.status !== 'CLOSED'){
                                    if(!CricketLiveEventIds.includes(eventIds[i])){
                                        newEventAdded = true
                                        newEventIdsArray.push(eventIds[i])
                                    }
                                    liveEventInCricket.push(eventIds[i])
                                    isLiveStatus = true
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
                            let pushstatus = false 
                            let thatMO = liveMatchCheckMarket
                            if(thatMO){
                                if(['OPEN','SUSPENDED',"BALL_RUNNING"].includes(thatMO.status)){
                                    pushstatus = true
                                }
                            }else{
                                if(eventData.competitionName.trim() == eventData.eventName.trim()){
                                    pushstatus = true
                                }
                            }
                            if(pushstatus){
                                let bookmakerdata = await fetchBMBook(eventIds[i])
                                if(liveMatchCheckMarket){
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
                                                    if(!marketIdsArrMO.includes(matchoddmarketRedis.marketId)){
                                                        marketIdsArrMO.push(matchoddmarketRedis.marketId)
                                                    }
                                                    await client.set(`${matchoddmarketRedis.marketId}_diamond`, JSON.stringify(matchoddmarketRedis), 'EX', 24 * 60 * 60);
    
                                                }
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
                                                // if(!marketIdsArrBM.includes(tempObj.marketId)){
                                                //     marketIdsArrBM.push(tempObj.marketId)
                                                // }
                                            }
                                        }
                                    }
                                }
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
                                            if(!marketIdsArrMO.includes(thismarketdetail.marketId)){
                                                marketIdsArrMO.push(thismarketdetail.marketId)
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
                            showEvent.push(eventIds[i])
                        }
                    }catch(error){
                        showEvent.push(eventIds[i])
                        console.log("Error:",error)
                    }
                }       
                await client.set('crone_CricketliveEventIds_diamond_UPD',JSON.stringify(liveEventInCricket));
                await client.set('crone_getEventIds_Cricket_diamond_UPD',JSON.stringify(showEvent));
                await client.set('crone_CricketliveMarketIds_MO_diamond_UPD',JSON.stringify(marketIdsArrMO));
                addcricketlivemarketcronFunc()
            }catch(error){
                addcricketlivemarketcronFunc()
                console.log(error,'ErrorrrAddCricketLiveMarketCroneBackup')
            }
        }
    // })
// }

module.exports = addcricketlivemarketcronFunc

