const cron = require('node-cron');
const setNewLiveEvent = require('../utils/newEventUpdate')
const setNewEventDetails = require('../utils/setNewThisEvent')
const fs = require('fs');
const path = require('path');
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const clientme = redis.createClient({url:process.env.redisurlme});
const Publishclient = redis.createClient({url:process.env.redisurl});
client.connect()
clientme.connect()
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
                const logFilePath = path.join(__dirname, `logs_Cricket.txt`);
                const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
                let chunkSize = 30
                let marketIdsArrMO = [];
                let liveEventInCricket = [];
                let showEvent = []
                let eventIds = await client.get('crone_getEventIds_Cricket_diamond');
                let CricketLiveEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD');
                let otherEvents = await client.get('crone_getEventIds_Other_diamond')
                let forcefullyLiveEvents = await client2.get('InPlayEventdata')  // get forcefully live event from redis of admin panel
                if(!forcefullyLiveEvents){
                    forcefullyLiveEvents = []
                }else{
                    forcefullyLiveEvents = JSON.parse(forcefullyLiveEvents)
                }
                if(CricketLiveEventIds){
                    CricketLiveEventIds = JSON.parse(CricketLiveEventIds)
                }else{
                    CricketLiveEventIds = []
                }
                if(otherEvents){
                    otherEvents = JSON.parse(otherEvents)
                }else{
                    otherEvents = []
                }
                // console.log(otherEvents,'other eventssssssssssss')
                eventIds = JSON.parse(eventIds)
                eventIds = eventIds.concat(otherEvents)
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                async function fetchMOBook(marketIds) {
                    let fetchMarketData = await fetch(`http://13.42.165.216:8443/api/betfair/${marketIds}`,{
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
                console.log(eventIds.length,'cricket eventIdssssssssssssssssss')
                // console.log(eventIds.find(item => item == "34410861"),'3441086134410861344108613441086134410861')
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
                        let OnlyMOMarketIdsArr = []
                        // let isTest = false
                        eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            // if(eventData.competitionName == "Test Matches"){
                            //     isTest = true
                            // }
                            OtherMOMarketArr = await client.get(`${eventIds[i]}_OnlyOtherMOMarketIdsArr_diamond`) // get other MO marketIds
                            OtherMOMarketArr = JSON.parse(OtherMOMarketArr)
                            OnlyMOMarketIdsArr = await client.get(`${eventIds[i]}_OnlyMOMarketIdsArr_diamond`) // get MO marketIds
                            OnlyMOMarketIdsArr = JSON.parse(OnlyMOMarketIdsArr)
                            // if(eventData.eventId == "34316669"){
                                // console.log(OnlyMOMarketIdsArr,"OnlyMOMarketIdsArr")
                            // }

                            // get MO market detail
                            if(OnlyMOMarketIdsArr.length !== 0){
                                // let count = Math.ceil(OnlyMOMarketIdsArr.length/chunkSize)
                                // for(let k = 0;k<count;k++){
                                //     let marketchunks = OnlyMOMarketIdsArr.slice((k*chunkSize),(chunkSize * (1+k)))
                                //     marketchunks = marketchunks.join(',')
                                //     let fetchMarketDatachunk
                                //     try{
                                //         fetchMarketDatachunk = await fetchMOBook(marketchunks)
                                //     }catch(error){
                                //         // await delay(1000 * 30)
                                //         fetchMarketDatachunk = await fetchMOBook(marketchunks)
                                //     }
                                //     fetchMarketData2 = fetchMarketData2.concat(fetchMarketDatachunk)
                                // }
                                let MOMarketId = OnlyMOMarketIdsArr.join(",")
                                let fetchMarketData2 = await fetchMOBook(MOMarketId)
                                liveMatchCheckMarket = fetchMarketData2.find(item => (item && item.status !== "CLOSED"))
                            }
                            if(liveMatchCheckMarket){  // if MO exist and its status is not CLOSED
                                if((liveMatchCheckMarket.inplay == true && liveMatchCheckMarket.status !== 'CLOSED') || forcefullyLiveEvents.includes(eventData.eventId)){
                                    liveEventInCricket.push(eventIds[i])  // push in liveevent Array
                                    isLiveStatus = true
                                }else{
                                    // jo MO closed no hoi and inplay ma pn no hoi to 2.5 kalak pela aene live event list ma nakhi devi chu but status UPCOMING j rakhvi chi jethi 2.5 kalak pela ae event na market update thay
                                    if(liveMatchCheckMarket.status !== 'CLOSED'){
                                        if(new Date(eventData.openDate).getTime() - (1000 * 60 * 60 * 2) <= Date.now()){
                                            liveEventInCricket.push(eventIds[i])
                                        }
                                    }
                                }
                            }else if(forcefullyLiveEvents.includes(eventData.eventId)){ // jo event ne admin panel thi forcefully inplay ma nakhie to 
                                liveEventInCricket.push(eventIds[i])
                                isLiveStatus = true
                            }
                            let eventStatus = isLiveStatus?'IN_PLAY':'UPCOMING'
                            eventData.status = eventStatus
                            if(eventData.isother){  // jo event other ni hoi to date > currentdate hoi tyare ae inplay ma aave
                                if(new Date(eventData.openDate).getTime() <= Date.now()){
                                    liveEventInCricket.push(eventIds[i])
                                    eventData.status = "IN_PLAY"
                                }else{
                                    eventData.status = "UPCOMING"
                                }
                            }
                            let pushstatus = false 
                            let showvirtual = false
                            let thatMO = liveMatchCheckMarket
                            if(thatMO){ // jo eventma MO hoi and  CLOSED no hoi to aene FE ma show kravani
                                if(['OPEN','SUSPENDED',"BALL_RUNNING"].includes(thatMO.status)){
                                    pushstatus = true
                                }
                            }else{ 
                                if(eventData.competitionName.trim() == eventData.eventName.trim()){  // jo competition name and eventname same hoi to ae event FE ma show kravani
                                    pushstatus = true
                                }else if(eventData.isother){  // jo event other ni hoi to pn FE ma show kravani
                                    pushstatus = true
                                }
                            }
                            if(pushstatus){
                                let bookmakerdata = await fetchBMBook(eventIds[i])  // get bookmaker book data from eventId
                                // MO ni market get and push in MOmarketArray variable
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
                                                    await clientme.set(`${matchoddmarketRedis.marketId}_diamond`, JSON.stringify(matchoddmarketRedis), 'EX', 24 * 60 * 60);
    
                                                }
                                            }
                                        }
                                    }
                                }

                                // BM na market data get krine BMmarketArray variable ma push krie chie
                                if(bookmakerdata){
                                    for(let a = 0; a<bookmakerdata.length; a++){
                                        if(Object.keys(bookmakerdata[a].data).length !== 0){
                                            if(bookmakerdata[a].data.status !== 'CLOSED'){
                                                showvirtual = true
                                            }
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
                                            if(bookmakerdata[a].data.name == "BOOKMAKER"){
                                                marketName = "Bookmaker"
                                            }else if(bookmakerdata[a].data.name == "MINI BOOKMAKER"){
                                                marketName = "Bookmaker 0 Commission"
                                            }else if(bookmakerdata[a].data.name == "TOSS"){
                                                marketName = "To Win The Toss"
                                            }else{
                                                marketName = bookmakerdata[a].data.name
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
                                                await clientme.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
                                                await client.set(`/topic/diamond_bm_update/${tempObj.marketId}`,JSON.stringify(tempObj));
                                                Publishclient.publish(`/topic/diamond_bm_update/${tempObj.marketId}`,JSON.stringify(tempObj));
                                            }
                                        }
                                    }
                                }
                                let liveMatchCheckMarket2 = []
                                let fetchMarketData3
                                // other MO ni market fetch krine MOmarketArray variable ma push krie chie
                                if(OtherMOMarketArr.length !== 0){
                                    let momarketIds = OtherMOMarketArr.join(",")
                                    fetchMarketData3 = await fetchMOBook(momarketIds)
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
                                                if(thisrunner){
                                                    thisrunner.status = liveMatchCheckMarket2[a].runners[c].status
                                                    thisrunner.layPrices = liveMatchCheckMarket2[a].runners[c].ex.availableToLay,
                                                    thisrunner.backPrices = liveMatchCheckMarket2[a].runners[c].ex.availableToBack
                                                }
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
                                // jo event other ni hoi to aema MO no hoi BM & Fancy j hoi to ae banne aek sathe empty no hova joie aej other event show kravani FE ma
                                if(eventData.isother){
                                    if(!showvirtual){
                                        if(eventData.markets.fancyMarkets.length > 0){
                                            showvirtual = true
                                        }
                                    }
                                    if(showvirtual){
                                        showEvent.push(eventIds[i])
                                    }
                                }else{
                                    showEvent.push(eventIds[i])
                                }
                            }
                            const timestamp = new Date().toISOString();
                            logStream.write(`[${timestamp}]  ${eventData.eventId + ' ' + eventData.status + ' '}${thatMO?thatMO.status:showvirtual}\n`);
                            await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                            await clientme.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
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

