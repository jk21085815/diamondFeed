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
                let marketIdsArrMO = [];
                // let marketIdsArrBM = [];
                let liveEventInCricket = [];
                let newEventAdded = false
                let newEventIdsArray = []
                let showEvent = []
                let eventIds = await client.get('crone_getEventIds_Cricket');
                // let eventIds = await client.get('crone_getEventIds_Cricket_diamond');
                // let CricketLiveEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD');
                // let forcefullyLiveEvents = await client2.get('InPlayEventdata')
                // forcefullyLiveEvents = JSON.parse(forcefullyLiveEvents)
                // console.log(forcefullyLiveEvents,'forcefulllllllllllllllttttttttt')
                // if(CricketLiveEventIds){
                //     CricketLiveEventIds = JSON.parse(CricketLiveEventIds)
                // }else{
                //     CricketLiveEventIds = []
                // }
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
                    console.log(fetchMarketDatajson,"fetchMarketDatajsonfetchMarketDatajson")
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
                        let MOBMMarketArr = []
                        let isLiveStatus = false
                        let liveMatchCheckMarket
                        let eventData
                        let fetchMarketData2 = []
                        let OnlyMOBMmARKETOpenArr = []
                        let OnlyMOBMMarketIdsArr = []
                        // let isTest = false
                        eventData = await client.get(`${eventIds[i]}_sharEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            // if(eventData.competitionName == "Test Matches"){
                            //     isTest = true
                            // }
                            // MOBMMarketArr = await client.get(`${eventIds[i]}_MOBMMarketArr_diamond`)
                            // MOBMMarketArr = JSON.parse(MOBMMarketArr)
                            // OnlyMOBMMarketIdsArr = await client.get(`${eventIds[i]}_OnlyMOMarketIdsArr_diamond`)
                            // OnlyMOBMMarketIdsArr = JSON.parse(OnlyMOBMMarketIdsArr)
                            // console.log(OnlyMOBMMarketIdsArr,"OnlyMOBMMarketIdsArr")
                            // if(OnlyMOBMMarketIdsArr.length !== 0){
                            //     let count = Math.ceil(OnlyMOBMMarketIdsArr.length/chunkSize)
                            //     for(let k = 0;k<count;k++){
                            //         let marketchunks = OnlyMOBMMarketIdsArr.slice((k*chunkSize),(chunkSize * (1+k)))
                            //         marketchunks = marketchunks.join(',')
                            //         let fetchMarketDatachunk
                            //         try{
                            //             fetchMarketDatachunk = await fetchMOBook(marketchunks)
                            //         }catch(error){
                            //             await delay(1000 * 30)
                            //             fetchMarketDatachunk = await fetchMOBook(marketchunks)
                            //         }
                            //         fetchMarketData2 = fetchMarketData2.concat(fetchMarketDatachunk)
                            //     }
                            //     // let openMarkets = fetchMarketData2.filter(item => ["OPEN","SUSPENDED"].includes(item.status))
                            //     // for(let i = 0;i<openMarkets.length;i++){
                            //     //     OnlyMOBMmARKETOpenArr.push(openMarkets[i].marketId)
                            //     // }
                            //     liveMatchCheckMarket = fetchMarketData2.find(item => item.status !== "CLOSED")
                            // }
                            // if(liveMatchCheckMarket){
                            //     if(liveMatchCheckMarket.inplay == true && liveMatchCheckMarket.status !== 'CLOSED'){
                            //         if(!CricketLiveEventIds.includes(eventIds[i])){
                            //             newEventAdded = true
                            //             newEventIdsArray.push(eventIds[i])
                            //         }
                            //         liveEventInCricket.push(eventIds[i])
                            //         isLiveStatus = true
                            //         // marketIdsArr = marketIdsArr.concat(MOBMMarketArr)
                            //     }else{
                            //         if(liveMatchCheckMarket.status !== 'CLOSED'){
                            //             if(isTest){
                            //                 if(new Date(eventData.openDate).getTime() + (1000 * 60 * 60 * 24 * 5) >= Date.now()){
                            //                     if(!CricketLiveEventIds.includes(eventIds[i])){
                            //                         newEventAdded = true
                            //                         newEventIdsArray.push(eventIds[i])
                            //                     }
                            //                     liveEventInCricket.push(eventIds[i])
                            //                 }
                            //             }else{
                            //                 if(new Date(eventData.openDate).getTime() - (1000 * 60 * 60 * 2) <= Date.now()){
                            //                     if(!CricketLiveEventIds.includes(eventIds[i])){
                            //                         newEventAdded = true
                            //                         newEventIdsArray.push(eventIds[i])
                            //                     }
                            //                     liveEventInCricket.push(eventIds[i])
                            //                 }
                            //             }
                            //         }
                            //     }
                            // }
                            // let eventStatus = isLiveStatus?'IN_PLAY':'UPCOMING'
                            // eventData.status = eventStatus
                            // if(OnlyMOBMMarketIdsArr.length !== 0){
                                let pushstatus = false 
                                // let thatMO = liveMatchCheckMarket
                                // console.log(liveMatchCheckMarket,'liveMatchCheckMarketliveMatchCheckMarket')
                                // if(thatMO){
                                //     if(['OPEN','SUSPENDED'].includes(thatMO.status)){
                                //         pushstatus = true
                                //     }
                                // }
                                if(pushstatus || true){
                                    // let matchoddmarketdata = await fetchOtherMOMarketData(eventIds[i])
                                    let bookmakerdata = await fetchBMBook(eventIds[i])
                                    // for(let d = 0;d<matchoddmarketdata.length;d++){
                                    //     let matchodddata = await fetchMOBook(matchoddmarketdata[d].marketId)
                                    //     for(let e = 0;e<matchodddata.length;e++){
                                    //         if(matchodddata[e]){
                                    //             let tempObj
                                    //             let tempRunner = []
                                    //             tempObj = {
                                    //                 "marketId": matchodddata[e].marketId,
                                    //                 "marketTime": matchodddata[e].lastMatchTime,
                                    //                 "marketType": matchoddmarketdata[d].description.marketType,
                                    //                 "bettingType": matchoddmarketdata[d].description.bettingType,
                                    //                 "marketName": matchoddmarketdata[d].marketName,
                                    //                 "provider": "DIAMOND",
                                    //                 "status": matchodddata[e].status
                                    //             }
                                    //             for(let c = 0;c<matchodddata[e].runners.length;c++){
                                    //                 let runner
                                    //                 runner = matchoddmarketdata[d].runners.find(item => item.selectionId == matchodddata[e].runners[c].selectionId)
                                    //                 let tempObjrunner = 
                                    //                 {
                                    //                     "status": matchodddata[e].runners[c].status,
                                    //                     "metadata": runner.metadata,
                                    //                     "runnerName": runner.runnerName,
                                    //                     "runnerId": matchodddata[e].runners[c].selectionId,
                                    //                     "layPrices": matchodddata[e].runners[c].ex.availableToLay,
                                    //                     "backPrices": matchodddata[e].runners[c].ex.availableToBack
                                    //                 }
                                    //                 tempRunner.push(tempObjrunner)
                                    //             }
                                    //             tempObj.runners = tempRunner
                                    //             if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                                    //                 matchOddMarketArr.push(tempObj)
                                    //                 if(!marketIdsArrMO.includes(tempObj.marketId)){
                                    //                     marketIdsArrMO.push(tempObj.marketId)
                                    //                 }
                                    //             }
                                    //         }
                                    //     }
                                    // }
                                    console.log(bookmakerdata,'bookmakerdataaaaaaaaaaaaa')
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
                            
                                                // console.log(bookmakerdata[a],bookmakerdata[a].data.runners,"bookmakerrunnerbookmakerrunner")
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
                                                    console.log(tempObj,"tempObjtempObjtempObjtempObjtempObj")
                                                    await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
                                                    // if(!marketIdsArrBM.includes(tempObj.marketId)){
                                                    //     marketIdsArrBM.push(tempObj.marketId)
                                                    // }
                                                }
                                            }
                                        }
                                    }
                                    // eventData.markets.matchOdds = matchOddMarketArr
                                    eventData.markets.bookmakers = bookmakersMarketArr
                                    showEvent.push(eventIds[i])
                                }
                            // }

                            await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                        }else{
                            showEvent.push(eventIds[i])
                            // setNewEventDetails([eventIds[i]])
                        }
                        // for(let i = 0;i<OnlyMOBMmARKETOpenArr.length;i++){
                        //     if(!marketIdsArr.includes(OnlyMOBMmARKETOpenArr[i])){
                        //         marketIdsArr.push(OnlyMOBMmARKETOpenArr[i])
                        //     }
                        // }
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
                await client.set('crone_CricketliveMarketIds_MO_diamond_UPD',JSON.stringify(marketIdsArrMO));
                // await client.set('crone_CricketliveMarketIds_BM_diamond_UPD',JSON.stringify(marketIdsArrBM));
                addcricketlivemarketcronFunc()
            }catch(error){
                addcricketlivemarketcronFunc()
                console.log(error,'ErrorrrAddCricketLiveMarketCroneBackup')
            }
        }
    // })
// }

module.exports = addcricketlivemarketcronFunc

