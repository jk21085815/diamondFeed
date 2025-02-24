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
                let eventIds_HR = await client.get(`crone_getEventIds_HorseRacing`)
                eventIds_HR = JSON.parse(eventIds_HR)
                let eventIds_GH = await client.get(`crone_getEventIds_GreyHound`)
                eventIds_GH = JSON.parse(eventIds_GH)
                let forcefullyLiveEvents = await client2.get('InPlayEventdata')
                forcefullyLiveEvents = JSON.parse(forcefullyLiveEvents)
                let eventIds2 = await client.get(`crone_getEventIds_Tennis`);
                let eventIds1 = await client.get(`crone_getEventIds_Soccer`);
                let eventIds3 = await client.get(`crone_getEventIds_Election`);
                let eventIds4 = await client.get(`crone_getEventIds_Kabaddi`);
                let eventIds5 = await client.get(`crone_getEventIds_GreyHound`);
                let eventIds6 = await client.get(`crone_getEventIds_HorseRacing`);
                eventIds1 = JSON.parse(eventIds1)
                eventIds2 = JSON.parse(eventIds2)
                eventIds3 = JSON.parse(eventIds3)
                eventIds4 = JSON.parse(eventIds4)
                eventIds5 = JSON.parse(eventIds5)
                eventIds6 = JSON.parse(eventIds6)
                let eventIds = eventIds1.concat(eventIds2,eventIds3,eventIds4,eventIds5,eventIds6)
                await client.set('crone_getEventIds_OtherSport',JSON.stringify(eventIds))
                let liveEventIds = await client.get('crone_OtherSportLiveEventIds_UPD');
                if(liveEventIds){
                    liveEventIds = JSON.parse(liveEventIds)
                }else{
                    liveEventIds = []
                }
                let EventIdOfHRGH = eventIds_HR.concat(eventIds_GH)
                let NewEventIdsOfHRGH = EventIdOfHRGH.filter(item => !eventIds.includes(item))
                eventIds = eventIds.concat(NewEventIdsOfHRGH)
                console.log(eventIds.length,'otherSportEventIdssssssss')
                // console.log(eventIds.find(item => item == "33915255"),"339152553391525533915255")
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                for(let i = 0;i<eventIds.length;i++){
                    try{
                        let MOBMMarketArr = []
                        // console.log(new Date(),i,eventIds[i],'Add Other eventIds and Market iiiiiiiii')
                        let liveMatchCheckMarket
                        let liveMatchCheckMarket2;
                        let liveMatchCheckMarket3;
                        let liveMatchCheckMarket4;
                        let isLiveStatus = false
                        let eventData
                        let fetchMarketData2
                        let issportHRGH = false
                        let OnlyMOBMmARKETOpenArr = [];
                        let OnlyMOBMMarketIdsArr = []
                        let eventODDSBMMarketIdsArr
                        let eventODDSBMMarketIds = await client.get(`${eventIds[i]}_MOBMMarketArr_shark`)
                        eventData = await client.get(`${eventIds[i]}_sharEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            if(eventODDSBMMarketIds){
                                if(["7","4339"].includes(eventData.sportId)){
                                    issportHRGH = true
                                }
                                MOBMMarketArr = await client.get(`${eventIds[i]}_MOBMMarketArr_shark`)
                                MOBMMarketArr = JSON.parse(MOBMMarketArr)
                                OnlyMOBMMarketIdsArr = await client.get(`${eventIds[i]}_OnlyMOBMMarketIdsArr_shark`)
                                OnlyMOBMMarketIdsArr = JSON.parse(OnlyMOBMMarketIdsArr)
                                if(OnlyMOBMMarketIdsArr.length !== 0 && !issportHRGH){
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
                                        throw new Error("Non-JSON response received");
                                    }
                                    fetchMarketData2 = await fetchMarketData2.json()
                                    let openMarkets = fetchMarketData2.filter(item => ["OPEN","SUSPENDED"].includes(item.catalogue.status))
                                    for(let i = 0;i<openMarkets.length;i++){
                                        OnlyMOBMmARKETOpenArr.push(openMarkets[i].catalogue.marketId)
                                    }
                                    liveMatchCheckMarket = fetchMarketData2.find(item => item.catalogue.marketName.trim() == 'Match Odds' && item.catalogue.status !== "CLOSED")
                                    liveMatchCheckMarket2 = fetchMarketData2.find(item => item.catalogue.marketName.trim() == 'Bookmaker' && item.catalogue.status !== "CLOSED")
                                    if(!liveMatchCheckMarket2 || eventData.sportId == "500"){
                                        liveMatchCheckMarket2 = fetchMarketData2.find(item => item.catalogue.marketName.trim() == "Bookmaker 0 Commission" && item.catalogue.status !== "CLOSED")
                                        if(!liveMatchCheckMarket2 && eventData.sportId == "500"){
                                            liveMatchCheckMarket3 = fetchMarketData2.find(item => item.catalogue.bettingType == "BOOKMAKER" && item.catalogue.status !== "CLOSED")
                                        }
                                    }
                                    liveMatchCheckMarket4 = fetchMarketData2.find(item => item.catalogue.marketType == 'TOURNAMENT_WINNER' && item.catalogue.status !== "CLOSED")
            
                                    if(liveMatchCheckMarket){
                                        liveMatchCheckMarket = liveMatchCheckMarket.catalogue
                                    }
                                    if(liveMatchCheckMarket2){
                                        liveMatchCheckMarket2 = liveMatchCheckMarket2.catalogue
                                    }
                                    if(liveMatchCheckMarket3){
                                        liveMatchCheckMarket3 = liveMatchCheckMarket3.catalogue
                                    }
                                    if(liveMatchCheckMarket4){
                                        liveMatchCheckMarket4 = liveMatchCheckMarket4.catalogue
                                    }
                                }
                                if(!issportHRGH){
                                    if(liveMatchCheckMarket3){
                                        if((liveMatchCheckMarket3.inPlay == true && liveMatchCheckMarket3.status == 'OPEN') || forcefullyLiveEvents.includes(eventIds[i])){
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
                                    else if(liveMatchCheckMarket4){
                                        if((liveMatchCheckMarket4.inPlay == true && liveMatchCheckMarket4.status == 'OPEN') || forcefullyLiveEvents.includes(eventIds[i])){
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
                                    else if(liveMatchCheckMarket && liveMatchCheckMarket2){
                                        if((liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED') || (liveMatchCheckMarket2.inPlay == true && liveMatchCheckMarket2.status !== 'CLOSED') || forcefullyLiveEvents.includes(eventIds[i])){
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
                                    }else if(liveMatchCheckMarket && !liveMatchCheckMarket2){
                                        if((liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED') || forcefullyLiveEvents.includes(eventIds[i])){
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
                                    }else if(!liveMatchCheckMarket && liveMatchCheckMarket2){
                                        if((liveMatchCheckMarket2.inPlay == true && liveMatchCheckMarket2.status !== 'CLOSED') || forcefullyLiveEvents.includes(eventIds[i])){
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
                                                                runner.runnerName = fetchMarketData2[k].catalogue.runners[j].name
                                                                runner.metadata = fetchMarketData2[k].catalogue.runners[j].metadata
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
                                                                // delete fetchMarketData2[k].catalogue.runners[j].metadata
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
                                                            // delete fetchMarketData2[k].catalogue.runners[j].metadata
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
                                        let thatMO = eventData.markets.matchOdds.find(ietm => ietm.marketType== 'MATCH_ODDS')
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
                                        if(eventData.eventId == "34010516"){
                                            // console.log(isLiveStatus,eventData.status,OnlyMOBMMarketIdsArr,matchOddsArr.concat(bookMakerMarketArr),'eventData')
                                        }
                                    }
                                    await client.set(`${eventIds[i]}_sharEventData`,JSON.stringify(eventData))
                                }else{
                                    let liveMatchCheckMarket = []
                                    let fetchMarketData4
                                    let fetchMarketData3
                                    if(MOBMMarketArr.length !== 0){
                                        eventODDSBMMarketIdsArr = MOBMMarketArr.join(",")
                                        try{
                                            fetchMarketData3 = await fetch(` http://18.171.69.133:6008/sports/markets/${eventODDSBMMarketIdsArr}`,{
                                                method: 'GET',
                                                headers: {
                                                    'Content-type': 'application/json',
                                                }
                                            })
                                            // await delay(505)
                                        }catch(error){
                                            await delay(1000 * 10)
                                            fetchMarketData3 = await fetch(` http://18.171.69.133:6008/sports/markets/${eventODDSBMMarketIdsArr}`,{
                                                method: 'GET',
                                                headers: {
                                                    'Content-type': 'application/json',
                                                }
                                            })
                                        }
                                        const contentType = fetchMarketData3.headers.get("content-type");
                                        if (!contentType || !contentType.includes("application/json")) {
                                            console.log(fetchMarketData3,"fetchMarketData3fetchMarketData3")
                                            throw new Error("Non-JSON response received");
                                        }
                                        fetchMarketData3 = await fetchMarketData3.json()
                                        liveMatchCheckMarket = fetchMarketData3.filter(item => (item && ["OPEN","SUSPENDED"].includes(item.catalogue.status)))
                                        let liveMatchCheckMarket2 = []
                                        for(let j = 0;j<liveMatchCheckMarket.length;j++){
                                            liveMatchCheckMarket2.push(liveMatchCheckMarket[j].catalogue)
                                        }
                                        liveMatchCheckMarket = liveMatchCheckMarket2
                                    }
                                    if(liveMatchCheckMarket.length > 0){
                                        try{
                                            fetchMarketData4 = await fetch(` http://18.171.69.133:6008/sports/books/${eventODDSBMMarketIdsArr}`,{
                                                method: 'GET',
                                                headers: {
                                                    'Content-type': 'application/json',
                                                }
                                            })
        
                                        }catch(error){
                                            await delay(1000 * 10)
                                            fetchMarketData4 = await fetch(` http://18.171.69.133:6008/sports/books/${eventODDSBMMarketIdsArr}`,{
                                                method: 'GET',
                                                headers: {
                                                    'Content-type': 'application/json',
                                                }
                                            })
                                        }
                                        const contentType2 = fetchMarketData4.headers.get("content-type");
                                        if (!contentType2 || !contentType2.includes("application/json")) {
                                            throw new Error("Non-JSON response received");
                                        }
                                        fetchMarketData4 = await fetchMarketData4.json()
                                        for(let j = 0;j<liveMatchCheckMarket.length;j++){
                                            let marketdata = await client.get(`${liveMatchCheckMarket[j].marketId}_shark`)
                                            if(marketdata){
                                                marketdata = JSON.parse(marketdata)
                                                liveMatchCheckMarket[j].runners = marketdata.runners
                                            }else{
                                                let bookdata = fetchMarketData4[liveMatchCheckMarket[j].marketId]
                                                if(bookdata){
                                                    if(bookdata.sportingEvent == true && bookdata.status !== "CLOSED"){
                                                        liveMatchCheckMarket[j].status = "BALL_RUNNING"
                                                    }
                                                    for(let k = 0;k<liveMatchCheckMarket[j].runners.length;k++){
                                                        runner = bookdata.runners.find(item => item.selectionId == liveMatchCheckMarket[j].runners[k].id)
                                                        if(runner){
                                                            runner.metadata = liveMatchCheckMarket[j].runners[k].metadata
                                                            runner.runnerName = liveMatchCheckMarket[j].runners[k].name
                                                            runner.runnerId = runner.selectionId
                                                            runner.layPrices = runner.lay
                                                            runner.backPrices = runner.back
                                                            delete runner.back
                                                            delete runner.lay
                                                            delete runner.selectionId
                                                            liveMatchCheckMarket[j].runners[k] = runner
                                                        }else{
                                                            liveMatchCheckMarket[j].runners[k].runnerName = liveMatchCheckMarket[j].runners[k].name
                                                            liveMatchCheckMarket[j].runners[k].runnerId = liveMatchCheckMarket[j].runners[k].id
                                                            liveMatchCheckMarket[j].runners[k].layPrices = []
                                                            liveMatchCheckMarket[j].runners[k].backPrices = []
                                                            delete liveMatchCheckMarket[j].runners[k].name
                                                            delete liveMatchCheckMarket[j].runners[k].id
                                                        }
                                                    }
                                                }else{
                                                    for(let k = 0;k<liveMatchCheckMarket[j].runners.length;k++){
                                                        liveMatchCheckMarket[j].runners[k].runnerName = liveMatchCheckMarket[j].runners[k].name
                                                        liveMatchCheckMarket[j].runners[k].runnerId = liveMatchCheckMarket[j].runners[k].id
                                                        liveMatchCheckMarket[j].runners[k].layPrices = []
                                                        liveMatchCheckMarket[j].runners[k].backPrices = []
                                                        delete liveMatchCheckMarket[j].runners[k].name
                                                        delete liveMatchCheckMarket[j].runners[k].id
                                                    }
                                                }
                                            }
        
                                        }
                                        OtherSportLiveEventIds.push(eventIds[i])
                                        eventData.markets.matchOdds = liveMatchCheckMarket
                                        eventData.status == "IN_PLAY"
                                        await client.set(`${eventIds[i]}_sharEventData`,JSON.stringify(eventData))
                                        for(let k = 0;k<liveMatchCheckMarket.length;k++){
                                            OtherSportLiveMarketIds.push(liveMatchCheckMarket[k].marketId)
                                        }
                                    }else{
                                        eventData.markets.matchOdds = liveMatchCheckMarket
                                        eventData.status == "UPCOMING"
                                        await client.set(`${eventIds[i]}_sharEventData`,JSON.stringify(eventData))
                                    }
                                    showEvent.push(eventIds[i])
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
                    setNewLiveEvent(newEventIdsArray)
                }
                await client.set('crone_liveMarketIds_UPD',JSON.stringify(OtherSportLiveMarketIds));
                await client.set('crone_OtherSportLiveEventIds_UPD',JSON.stringify(OtherSportLiveEventIds));
                await client.set('crone_TennisLiveEventIds_UPD',JSON.stringify(tennisLiveEventIds));
                await client.set(`crone_getEventIds_OtherSport_UPD`,JSON.stringify(showEvent))
                addotherlivemarketcronFunc()
            }catch(error){
                addotherlivemarketcronFunc()
                console.log(error,'Errorrr addOtherLiveMarketCronbackup')
            }
        }
    // })
// }

module.exports = addotherlivemarketcronFunc

