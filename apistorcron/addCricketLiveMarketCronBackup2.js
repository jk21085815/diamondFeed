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
                    let fetchMarketData = await fetch(` https://odds.datafeed365.com/api/active-bm/${marketIds}`,{
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
                            if(eventData.eventId == "34058805" || true){
                                console.log(OnlyMOBMMarketIdsArr,'OnlyMOBMMarketIdsArrOnlyMOBMMarketIdsArr')
                            }
                            if(OnlyMOBMMarketIdsArr.length !== 0){
                                let count = Math.ceil(OnlyMOBMMarketIdsArr.length/chunkSize)
                                // console.log(OnlyMOBMMarketIdsArr.length,count,'counttttttttt')
                                for(let k = 0;k<count;k++){
                                    let marketchunks = OnlyMOBMMarketIdsArr.slice((k*chunkSize),(chunkSize * (1+k)))
                                    // console.log((k*chunkSize),(chunkSize * (1+k)),'chunkkkkkkkkkkkk')
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
                                if(eventData.eventId == "34058805" || true){
                                    console.log(fetchMarketData2,'fetchMarketData2fetchMarketData2')
                                }
                                let openMarkets = fetchMarketData2.filter(item => ["OPEN","SUSPENDED"].includes(item.status))
                                for(let i = 0;i<openMarkets.length;i++){
                                    OnlyMOBMmARKETOpenArr.push(openMarkets[i].marketId)
                                }
                                liveMatchCheckMarket = fetchMarketData2.find(item => item.status !== "CLOSED")
                            }
                            if(liveMatchCheckMarket){
                                if(liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED'){
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
                            // let matchOddsArr = []
                            // let bookMakerMarketArr = []
                            // if(OnlyMOBMMarketIdsArr.length !== 0){
                            //     for(let k = 0;k<fetchMarketData2.length;k++){
                            //         if([ "OPEN","SUSPENDED"].includes(fetchMarketData2[k].catalogue.status.trim())){
                            //             let marketData = await client.get(`${fetchMarketData2[k].catalogue.marketId}_diamond`);
                            //             marketData = marketData ? JSON.parse(marketData) : null;
                            //             if (marketData && marketData.status){
                            //                 fetchMarketData2[k].catalogue.runners = marketData.runners
                            //             }else{
                            //                 let fetchMarketDataBookData
                            //                 try{
                            //                     fetchMarketDataBookData = await fetch(` http://18.171.69.133:6008/sports/books/${fetchMarketData2[k].catalogue.marketId}`,{
                            //                         method: 'GET',
                            //                         headers: {
                            //                             'Content-type': 'application/text',
                            //                         }
                            //                     })
                            //                     // await delay(500)
                            //                 }catch(error){
                            //                     await delay(1000 * 10)
                            //                     fetchMarketDataBookData = await fetch(` http://18.171.69.133:6008/sports/books/${fetchMarketData2[k].catalogue.marketId}`,{
                            //                         method: 'GET',
                            //                         headers: {
                            //                             'Content-type': 'application/text',
                            //                         }
                            //                     })
                            //                 }
                            //                 let fetchBookDatajson = await fetchMarketDataBookData.json()
                            //                 let bookdata = fetchBookDatajson[fetchMarketData2[k].catalogue.marketId]
                            //                 if(bookdata){
                            //                     for(let j = 0;j<fetchMarketData2[k].catalogue.runners.length;j++){
                            //                         runner = bookdata.runners.find(item => item.selectionId == fetchMarketData2[k].catalogue.runners[j].id)
                            //                         if(runner){
                            //                             runner.metadata = fetchMarketData2[k].catalogue.runners[j].metadata
                            //                             runner.runnerName = fetchMarketData2[k].catalogue.runners[j].name
                            //                             runner.runnerId = runner.selectionId
                            //                             runner.layPrices = runner.lay
                            //                             runner.backPrices = runner.back
                            //                             delete runner.back
                            //                             delete runner.lay
                            //                             delete runner.selectionId
                            //                             fetchMarketData2[k].catalogue.runners[j] = runner
                            //                         }else{
                            //                             fetchMarketData2[k].catalogue.runners[j].runnerName = fetchMarketData2[k].catalogue.runners[j].name
                            //                             fetchMarketData2[k].catalogue.runners[j].runnerId = fetchMarketData2[k].catalogue.runners[j].id
                            //                             fetchMarketData2[k].catalogue.runners[j].layPrices = []
                            //                             fetchMarketData2[k].catalogue.runners[j].backPrices = []
                            //                             delete fetchMarketData2[k].catalogue.runners[j].name
                            //                             delete fetchMarketData2[k].catalogue.runners[j].id
                            //                         }
                            //                     }
                            //                 }else{
    
                            //                     for(let j = 0;j<fetchMarketData2[k].catalogue.runners.length;j++){
                            //                         fetchMarketData2[k].catalogue.runners[j].runnerName = fetchMarketData2[k].catalogue.runners[j].name
                            //                         fetchMarketData2[k].catalogue.runners[j].runnerId = fetchMarketData2[k].catalogue.runners[j].id
                            //                         fetchMarketData2[k].catalogue.runners[j].layPrices = []
                            //                         fetchMarketData2[k].catalogue.runners[j].backPrices = []
                            //                         delete fetchMarketData2[k].catalogue.runners[j].name
                            //                         delete fetchMarketData2[k].catalogue.runners[j].id
                            //                     }
                            //                 }
                            //             }
                            //             if(fetchMarketData2[k].catalogue.bettingType == "ODDS"){
                            //                 matchOddsArr.push(fetchMarketData2[k].catalogue)
                            //             }else if(fetchMarketData2[k].catalogue.bettingType == "BOOKMAKER"){
                            //                 bookMakerMarketArr.push(fetchMarketData2[k].catalogue)
                            //             }
                            //         }
                            //     }
                            //     eventData.markets.matchOdds = matchOddsArr;
                            //     eventData.markets.bookmakers = bookMakerMarketArr;
                            //     let pushstatus = false 
                            //     let thatMO = eventData.markets.matchOdds.find(item => item.marketType== 'MATCH_ODDS')
                            //     if(thatMO){
                            //         if(['OPEN','SUSPENDED'].includes(thatMO.status)){
                            //         pushstatus = true
                            //         }
                            //     }else{
                            //         let winner = eventData.markets.matchOdds.find(item => item.marketType == "TOURNAMENT_WINNER")
                            //         if((eventData.markets.bookmakers.concat(eventData.markets.fancyMarkets).length !== 0 || winner) && !["7","4339"].includes(eventData.sportId)){
                            //             pushstatus = true
                            //         }else if(["7","4339"].includes(eventData.sportId)){
                            //             pushstatus = true
                            //         }
                            //     }
                            //     if(pushstatus){
                            //         showEvent.push(eventIds[i])
                            //     }
                            // }
                            showEvent.push(eventIds[i])
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

