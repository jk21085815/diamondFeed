const cron = require('node-cron');
const setNewLiveEvent = require('../utils/newEventUpdate')
const setNewEventDetails = require('../utils/setNewThisEvent')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


module.exports = () => {
    cron.schedule('*/02 * * * *', async() => {
            let starttime = new Date();
            try{
                let marketIdsArr = [];
                let liveEventInCricket = [];
                let newEventAdded = false
                let newEventIdsArray = []
                let showEvent = []
                let eventIds = await client.get('crone_getEventIds_Cricket');
                let CricketLiveEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD');
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
                for(let i = 0;i<eventIds.length;i++){
                    // console.log(new Date(),i,eventIds[i],'Add Cricket eventIds and Market iiiiiiiii')
                    let MOBMMarketArr = []
                    let isLiveStatus = false
                    let liveMatchCheckMarket
                    let liveMatchCheckMarket2;
                    let liveMatchCheckMarket4;
                    let eventData
                    let fetchMarketData2
                    let OnlyMOBMmARKETOpenArr = []
                    let OnlyMOBMMarketIdsArr = []
                    let eventODDSBMMarketIdsArr
                    let isTest = false
                    eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                    let eventODDSBMMarketIds = await client.get(`${eventIds[i]}_MOBMMarketArr_shark`)
                    if(eventData){
                        eventData = JSON.parse(eventData)
                        if(eventData.competitionName == "Test Matches"){
                            isTest = true
                        }
                        if(eventODDSBMMarketIds){
                            MOBMMarketArr = await client.get(`${eventIds[i]}_MOBMMarketArr_shark`)
                            MOBMMarketArr = JSON.parse(MOBMMarketArr)
                            OnlyMOBMMarketIdsArr = await client.get(`${eventIds[i]}_OnlyMOBMMarketIdsArr_shark`)
                            OnlyMOBMMarketIdsArr = JSON.parse(OnlyMOBMMarketIdsArr)
                            // if(eventIds[i] == "33856426"){
                                // console.log(eventIds[i],OnlyMOBMMarketIdsArr,"OnlyMOBMMarketIdsArrOnlyMOBMMarketIdsArr")
                            // }
                            if(OnlyMOBMMarketIdsArr.length !== 0){
                                eventODDSBMMarketIdsArr = OnlyMOBMMarketIdsArr.join(",")
                                try{
                                    fetchMarketData2 = await fetch(` http://18.171.69.133:6008/sports/markets/${eventODDSBMMarketIdsArr}`,{
                                        method: 'GET',
                                        headers: {
                                            'Content-type': 'application/text',
                                        }
                                    })
                                    // await delay(505)
                                }catch(error){
                                    console.log(error,'error in add cricket')
                                    await delay(1000 * 10)
                                    fetchMarketData2 = await fetch(` http://18.171.69.133:6008/sports/markets/${eventODDSBMMarketIdsArr}`,{
                                        method: 'GET',
                                        headers: {
                                            'Content-type': 'application/text',
                                        }
                                    })
                                }
                                const contentType = fetchMarketData2.headers.get("content-type");
                                
                                if (!contentType || !contentType.includes("application/json")) {
                                    console.log(contentType, fetchMarketData2, 'ewewewewewe');
                                    throw new Error("Non-JSON response received");
                                    
                                }
                                fetchMarketData2 = await fetchMarketData2.json()
                                let openMarkets = fetchMarketData2.filter(item => ["OPEN","SUSPENDED"].includes(item.catalogue.status))
                                for(let i = 0;i<openMarkets.length;i++){
                                    OnlyMOBMmARKETOpenArr.push(openMarkets[i].catalogue.marketId)
                                }
                                liveMatchCheckMarket = fetchMarketData2.find(item => item.catalogue.marketName == 'Match Odds' && item.catalogue.status !== "CLOSED")
                                liveMatchCheckMarket2 = fetchMarketData2.find(item => item.catalogue.marketName == 'Bookmaker' && item.catalogue.status !== "CLOSED")
                                if(!liveMatchCheckMarket2){
                                    liveMatchCheckMarket2 = fetchMarketData2.find(item => item.catalogue.marketName == "Bookmaker 0 Commission" && item.catalogue.status !== "CLOSED")
                                }
                                liveMatchCheckMarket4 = fetchMarketData2.find(item => item.catalogue.marketType == 'TOURNAMENT_WINNER' && item.catalogue.status !== "CLOSED")
                                if(liveMatchCheckMarket){
                                    liveMatchCheckMarket = liveMatchCheckMarket.catalogue
                                }
                                if(liveMatchCheckMarket2){
                                    liveMatchCheckMarket2 = liveMatchCheckMarket2.catalogue
                                }
                                if(liveMatchCheckMarket4){
                                    liveMatchCheckMarket4 = liveMatchCheckMarket4.catalogue
                                }
                            }
                            if(liveMatchCheckMarket4){
                                if((liveMatchCheckMarket4.inPlay == true && liveMatchCheckMarket4.status == 'OPEN')){
                                    if(!CricketLiveEventIds.includes(eventIds[i])){
                                        newEventAdded = true
                                        newEventIdsArray.push(eventIds[i])
                                    }
                                    liveEventInCricket.push(eventIds[i])
                                    isLiveStatus = true
                                    marketIdsArr = marketIdsArr.concat(MOBMMarketArr)
                                }
                            }
                            else if(liveMatchCheckMarket && liveMatchCheckMarket2){
                                if((liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED') || (liveMatchCheckMarket2.inPlay == true &&liveMatchCheckMarket2.status !== 'CLOSED')){
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
                            }else if(liveMatchCheckMarket && !liveMatchCheckMarket2){
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
                            }else if(!liveMatchCheckMarket && liveMatchCheckMarket2){
                                if(liveMatchCheckMarket2.inPlay == true && liveMatchCheckMarket2.status !== 'CLOSED'){
                                    if(!CricketLiveEventIds.includes(eventIds[i])){
                                        newEventAdded = true
                                        newEventIdsArray.push(eventIds[i])
                                    }
                                    liveEventInCricket.push(eventIds[i])
                                    isLiveStatus = true
                                    marketIdsArr = marketIdsArr.concat(MOBMMarketArr)
                                }else{
                                    if(liveMatchCheckMarket2.status !== 'CLOSED'){
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
                            let matchOddsArr = []
                            let bookMakerMarketArr = []
                            if(OnlyMOBMMarketIdsArr.length !== 0){
                                for(let k = 0;k<fetchMarketData2.length;k++){
                                    if([ "OPEN","SUSPENDED"].includes(fetchMarketData2[k].catalogue.status)){
                                        let marketData = await client.get(`${fetchMarketData2[k].catalogue.marketId}_shark`);
                                        marketData = marketData ? JSON.parse(marketData) : null;
                                        if (marketData && marketData.status){
                                            fetchMarketData2[k].catalogue.runners = marketData.runners
                                        }else{
                                            let fetchMarketDataBookData
                                            try{
                                                fetchMarketDataBookData = await fetch(` http://18.171.69.133:6008/sports/books/${fetchMarketData2[k].catalogue.marketId}`,{
                                                    method: 'GET',
                                                    headers: {
                                                        'Content-type': 'application/text',
                                                    }
                                                })
                                                // await delay(500)
                                            }catch(error){
                                                await delay(1000 * 10)
                                                fetchMarketDataBookData = await fetch(` http://18.171.69.133:6008/sports/books/${fetchMarketData2[k].catalogue.marketId}`,{
                                                    method: 'GET',
                                                    headers: {
                                                        'Content-type': 'application/text',
                                                    }
                                                })
                                            }
                                            let fetchBookDatajson = await fetchMarketDataBookData.json()
                                            let bookdata = fetchBookDatajson[fetchMarketData2[k].catalogue.marketId]
                                            if(bookdata){
                                                for(let j = 0;j<fetchMarketData2[k].catalogue.runners.length;j++){
                                                    runner = bookdata.runners.find(item => item.selectionId == fetchMarketData2[k].catalogue.runners[j].id)
                                                    if(runner){
                                                        runner.metadata = fetchMarketData2[k].catalogue.runners[j].metadata
                                                        runner.runnerName = fetchMarketData2[k].catalogue.runners[j].name
                                                        runner.runnerId = runner.selectionId
                                                        runner.layPrices = runner.lay
                                                        runner.backPrices = runner.back
                                                        delete runner.back
                                                        delete runner.lay
                                                        delete runner.selectionId
                                                        fetchMarketData2[k].catalogue.runners[j] = runner
                                                    }else{
                                                        fetchMarketData2[k].catalogue.runners[j].runnerName = fetchMarketData2[k].catalogue.runners[j].name
                                                        fetchMarketData2[k].catalogue.runners[j].runnerId = fetchMarketData2[k].catalogue.runners[j].id
                                                        fetchMarketData2[k].catalogue.runners[j].layPrices = []
                                                        fetchMarketData2[k].catalogue.runners[j].backPrices = []
                                                        delete fetchMarketData2[k].catalogue.runners[j].name
                                                        delete fetchMarketData2[k].catalogue.runners[j].id
                                                    }
                                                }
                                            }else{
    
                                                for(let j = 0;j<fetchMarketData2[k].catalogue.runners.length;j++){
                                                    fetchMarketData2[k].catalogue.runners[j].runnerName = fetchMarketData2[k].catalogue.runners[j].name
                                                    fetchMarketData2[k].catalogue.runners[j].runnerId = fetchMarketData2[k].catalogue.runners[j].id
                                                    fetchMarketData2[k].catalogue.runners[j].layPrices = []
                                                    fetchMarketData2[k].catalogue.runners[j].backPrices = []
                                                    delete fetchMarketData2[k].catalogue.runners[j].name
                                                    delete fetchMarketData2[k].catalogue.runners[j].id
                                                }
                                            }
                                        }
                                        if(fetchMarketData2[k].catalogue.bettingType == "ODDS"){
                                            matchOddsArr.push(fetchMarketData2[k].catalogue)
                                        }else if(fetchMarketData2[k].catalogue.bettingType == "BOOKMAKER"){
                                            bookMakerMarketArr.push(fetchMarketData2[k].catalogue)
                                        }
                                    }
                                }
                                eventData.markets.matchOdds = matchOddsArr;
                                eventData.markets.bookmakers = bookMakerMarketArr;
                                let pushstatus = false 
                                let thatMO = eventData.markets.matchOdds.find(item => item.marketType== 'MATCH_ODDS')
                                if(thatMO){
                                    if(['OPEN','SUSPENDED'].includes(thatMO.status)){
                                    pushstatus = true
                                    }
                                }else{
                                    let winner = eventData.markets.matchOdds.find(item => item.marketType == "TOURNAMENT_WINNER")
                                    if((eventData.markets.bookmakers.concat(eventData.markets.fancyMarkets).length !== 0 || winner) && !["7","4339"].includes(eventData.sportId)){
                                        pushstatus = true
                                    }else if(["7","4339"].includes(eventData.sportId)){
                                        pushstatus = true
                                    }
                                }
                                if(pushstatus){
                                    showEvent.push(eventIds[i])
                                }
                                await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                            }
                        }else{
                            showEvent.push(eventIds[i])
                            setNewEventDetails([eventIds[i]])
                        }
                    }else{
                        showEvent.push(eventIds[i])
                        setNewEventDetails([eventIds[i]])
                    }
                    for(let i = 0;i<OnlyMOBMmARKETOpenArr.length;i++){
                        if(!marketIdsArr.includes(OnlyMOBMmARKETOpenArr[i])){
                            marketIdsArr.push(OnlyMOBMmARKETOpenArr[i])
                        }
                    }
                }       
                if(newEventAdded){
                    await setNewLiveEvent(newEventIdsArray)
                }
                await client.set('crone_CricketliveEventIds_diamond_UPD',JSON.stringify(liveEventInCricket));
                await client.set('crone_getEventIds_Cricket_UPD',JSON.stringify(showEvent));
                await client.set('crone_CricketliveMarketIds_UPD',JSON.stringify(marketIdsArr));
            }catch(error){
                console.log(error,'ErrorrrAddCricketLiveMarketCroneBackup')
            }
    })
}

