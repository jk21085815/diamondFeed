const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const setThisSportData = async(eventlist,SportName) => {
    let starttime = new Date();
    console.log(starttime,`Set ${SportName} Sport Cron Started.....`)
    try{
        async function seteventdataFunc () {
            let thisSportEventId = []
            console.log(eventlist.length,`Event list length  in ${SportName} Sport`)
            function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            async function fetchBookDataFunc(marketId) {
                let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${marketId}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketDatajson = await fetchMarketData.json()
                return fetchMarketDatajson
            }
            for(let k = 0;k<eventlist.length;k++){
                console.log(k,new Date(),'kkk')
                let isLiveStatus = false
                let matchOddsArr = [];
                let matchOddsArr2 = [];
                let bookMakerMarketArr = [];
                let bookMakerMarketArr2 = [];
                let fanctMarketArr = [];
                let liveMatchCheckMarket;
                let liveMatchCheckMarket2;
                let liveMatchCheckMarket3;
                let liveMatchCheckMarket4;
                eventlist[k].openDate = eventlist[k].event.openDate
                eventlist[k].providerName = eventlist[k].competition.provider
                eventlist[k].sportId = eventlist[k].eventType.id
                eventlist[k].sportName = eventlist[k].eventType.name
                eventlist[k].competitionId = eventlist[k].competition.id
                eventlist[k].competitionName = eventlist[k].competition.name
                eventlist[k].eventId = eventlist[k].event.id
                eventlist[k].eventName = eventlist[k].event.name
                eventlist[k].country = eventlist[k].event.countryCode
                eventlist[k].venue = eventlist[k].event.venue
                delete eventlist[k]['eventType']
                delete eventlist[k]['competition']
                delete eventlist[k]['event']
                delete eventlist[k]['metadata']
                liveMatchCheckMarket = eventlist[k].catalogues.find(item => item.marketName.trim() == 'Match Odds' && item.status !== "CLOSED")
                liveMatchCheckMarket2 = eventlist[k].catalogues.find(item => item.marketName.trim() == 'Bookmaker' && item.status !== "CLOSED")
                if(!liveMatchCheckMarket2 || eventlist[k].sportId == "500"){
                    liveMatchCheckMarket2 = eventlist[k].catalogues.find(item => item.marketName.trim() == "Bookmaker 0 Commission" && item.status !== "CLOSED")
                    if(!liveMatchCheckMarket2 && eventlist[k].sportId == "500"){
                        liveMatchCheckMarket3 = eventlist[k].catalogues.find(item => item.bettingType == "BOOKMAKER" && item.status !== "CLOSED")
                    }
                }
                liveMatchCheckMarket4 = eventlist[k].catalogues.find(item => item.marketType == 'TOURNAMENT_WINNER' && item.status !== "CLOSED")
                if(liveMatchCheckMarket3){
                    if((liveMatchCheckMarket3.inPlay == true && liveMatchCheckMarket3.status == 'OPEN')){
                        isLiveStatus = true
                    }
                }
                else if(liveMatchCheckMarket4){
                    if((liveMatchCheckMarket4.inPlay == true && liveMatchCheckMarket4.status == 'OPEN')){
                        isLiveStatus = true
                    }
                }
                else if(liveMatchCheckMarket && liveMatchCheckMarket2){
                    if((liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED') || (liveMatchCheckMarket2.inPlay == true && liveMatchCheckMarket2.status !== 'CLOSED')){
                        isLiveStatus = true
                    }
                }else if(liveMatchCheckMarket && !liveMatchCheckMarket2){
                    if(liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED'){
                        isLiveStatus = true
                    }
                }else if(!liveMatchCheckMarket && liveMatchCheckMarket2){
                    if(liveMatchCheckMarket2.inPlay == true && liveMatchCheckMarket2.status !== 'CLOSED'){
                        isLiveStatus = true
                    }
                }
                eventlist[k].status = isLiveStatus?'IN_PLAY':'UPCOMING'
                thisSportEventId.push(eventlist[k].eventId)
    
                for(let l = 0;l<eventlist[k].catalogues.length;l++){
                    
                    
                    let fetchMarketDatajson;
                    try{
                        fetchMarketDatajson = await fetchBookDataFunc(eventlist[k].catalogues[l].marketId)
                    }catch(error){
                        await delay(1000 * 10)
                        fetchMarketDatajson = await fetchBookDataFunc(eventlist[k].catalogues[l].marketId)
                    }
                    if(fetchMarketDatajson[eventlist[k].catalogues[l].marketId]){
                        if(!["CLOSED"].includes(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].status)){
                            if(eventlist[k].catalogues[l].bettingType == "LINE" && fetchMarketDatajson[eventlist[k].catalogues[l].marketId].status !== "INACTIVE"){
                                if(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].sportingEvent == true && eventlist[k].catalogues[l].status !== "CLOSED"){
                                    eventlist[k].catalogues[l].status = "BALL_RUNNING"
                                }
                                if(false){
                                    for(let i = 0;i<eventlist[k].catalogues[l].runners.length;i++){
                                        let runner = fetchMarketDatajson[eventlist[k].catalogues[l].marketId].runners.find(item => item.selectionId == eventlist[k].catalogues[l].runners[i].id)
                                        if(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].sportingEvent == true && eventlist[k].catalogues[l].status !== "CLOSED"){
                                            eventlist[k].catalogues[l].status = "BALL_RUNNING"
                                        }
                                        if(runner){
                                            if(i == 0){
                                                if(runner.lay.length > 0){
                                                    eventlist[k].catalogues[l].noValue = runner.lay[0].line
                                                    eventlist[k].catalogues[l].noRate = runner.lay[0].price
                                                }else{
                                                    eventlist[k].catalogues[l].noValue = "0"
                                                    eventlist[k].catalogues[l].noRate = "0"
                                                }
                                                if(runner.back.length > 0){
                                                    eventlist[k].catalogues[l].yesValue = runner.back[0].line
                                                    eventlist[k].catalogues[l].yesRate = runner.back[0].price
                                                }else{
                                                    eventlist[k].catalogues[l].yesValue = "0"
                                                    eventlist[k].catalogues[l].yesRate = "0"
                                                }
                                                
                                            }
                                            runner.runnerName = eventlist[k].catalogues[l].runners[i].name
                                            runner.runnerId = runner.selectionId
                                            runner.layPrices = runner.lay
                                            runner.backPrices = runner.back
                                            delete runner.back
                                            delete runner.lay
                                            delete runner.selectionId
                                            eventlist[k].catalogues[l].runners[i] = runner
                                        }else{
                                            if(i = 0){
                                                eventlist[k].catalogues[l].noValue = "0"
                                                eventlist[k].catalogues[l].noRate = "0"
                                                eventlist[k].catalogues[l].yesValue = "0"
                                                eventlist[k].catalogues[l].yesRate = "0"
                                            }
                                            eventlist[k].catalogues[l].runners[i].runnerName = eventlist[k].catalogues[l].runners[i].name
                                            eventlist[k].catalogues[l].runners[i].runnerId = eventlist[k].catalogues[l].runners[i].id
                                            eventlist[k].catalogues[l].runners[i].layPrices = []
                                            eventlist[k].catalogues[l].runners[i].backPrices = []
                                            delete eventlist[k].catalogues[l].runners[i].name
                                            delete eventlist[k].catalogues[l].runners[i].id
                                        }
                                    }
                                    eventlist[k].catalogues[l].category = eventlist[k].catalogues[l].marketType
                                    eventlist[k].catalogues[l].marketType = "FANCY"
                                    fanctMarketArr.push(eventlist[k].catalogues[l])

                                }else{
                                    for(let i = 0;i<eventlist[k].catalogues[l].runners.length;i++){
                                        let runner = fetchMarketDatajson[eventlist[k].catalogues[l].marketId].runners.find(item => (item.selectionId == eventlist[k].catalogues[l].runners[i].id && item.status == "ACTIVE"))
                                        if(runner){
                                            if(runner.lay.length > 0){
                                                eventlist[k].catalogues[l].noValue = runner.lay[0].line
                                                eventlist[k].catalogues[l].noRate = runner.lay[0].price
                                            }else{
                                                eventlist[k].catalogues[l].noValue = "0"
                                                eventlist[k].catalogues[l].noRate = "0"
                                            }
                                            if(runner.back.length > 0){
                                                eventlist[k].catalogues[l].yesValue = runner.back[0].line
                                                eventlist[k].catalogues[l].yesRate = runner.back[0].price
                                            }else{
                                                eventlist[k].catalogues[l].yesValue = "0"
                                                eventlist[k].catalogues[l].yesRate = "0"
                                            }
                                            
                                            delete eventlist[k].catalogues[l].runners
                                            eventlist[k].catalogues[l].category = eventlist[k].catalogues[l].marketType
                                            eventlist[k].catalogues[l].marketType = "FANCY"
                                            fanctMarketArr.push(eventlist[k].catalogues[l])
                                            break
                                        }else{
                                            eventlist[k].catalogues[l].noValue = "0"
                                            eventlist[k].catalogues[l].noRate = "0"
                                            eventlist[k].catalogues[l].yesValue = "0"
                                            eventlist[k].catalogues[l].yesRate = "0"
                                            delete eventlist[k].catalogues[l].runners
                                            eventlist[k].catalogues[l].category = eventlist[k].catalogues[l].marketType
                                            eventlist[k].catalogues[l].marketType = "FANCY"
                                            fanctMarketArr.push(eventlist[k].catalogues[l])
                                            break
                                        }
                                    }
                                }
                               
                                    
                            }else{
                                for(let i = 0;i<eventlist[k].catalogues[l].runners.length;i++){
                                    let runner = fetchMarketDatajson[eventlist[k].catalogues[l].marketId].runners.find(item => item.selectionId == eventlist[k].catalogues[l].runners[i].id)
                                    if(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].sportingEvent == true && eventlist[k].catalogues[l].status !== "CLOSED"){
                                        eventlist[k].catalogues[l].status = "BALL_RUNNING"
                                    }
                                    if(runner){
                                        runner.runnerName = eventlist[k].catalogues[l].runners[i].name
                                        runner.runnerId = runner.selectionId
                                        runner.layPrices = runner.lay
                                        runner.backPrices = runner.back
                                        delete runner.back
                                        delete runner.lay
                                        delete runner.selectionId
                                        eventlist[k].catalogues[l].runners[i] = runner
                                    }else{
                                        eventlist[k].catalogues[l].runners[i].runnerName = eventlist[k].catalogues[l].runners[i].name
                                        eventlist[k].catalogues[l].runners[i].runnerId = eventlist[k].catalogues[l].runners[i].id
                                        eventlist[k].catalogues[l].runners[i].layPrices = []
                                        eventlist[k].catalogues[l].runners[i].backPrices = []
                                        // delete eventlist[k].catalogues[l].runners[i].metadata
                                        delete eventlist[k].catalogues[l].runners[i].name
                                        delete eventlist[k].catalogues[l].runners[i].id
                                    }
                                }
                                // console.log(eventlist[k].catalogues[l].runners,'eventlist[k].catalogues[l].runners')
                                if(eventlist[k].catalogues[l].bettingType == "ODDS"){
                                    matchOddsArr2.push(eventlist[k].catalogues[l])
                                    if(["OPEN","SUSPENDED"].includes(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].status)){
                                        matchOddsArr.push(eventlist[k].catalogues[l])
                                    }
                                }else if(eventlist[k].catalogues[l].bettingType == "BOOKMAKER"){
                                    bookMakerMarketArr2.push(eventlist[k].catalogues[l])
                                    if(["OPEN","SUSPENDED"].includes(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].status)){
                                        bookMakerMarketArr.push(eventlist[k].catalogues[l])
                                    }
                                }
                            }
                        }
                    }else{
                        if(!["CLOSED"].includes(eventlist[k].catalogues[l].status)){
                            if(eventlist[k].catalogues[l].bettingType == "LINE" && eventlist[k].catalogues[l].status !== "INACTIVE"){
                                if(false){
                                    for(let i = 0;i<eventlist[k].catalogues[l].runners.length;i++){
                                        if(i == 0){
                                            eventlist[k].catalogues[l].noValue = "0"
                                            eventlist[k].catalogues[l].noRate = "0"
                                            eventlist[k].catalogues[l].yesValue = "0"
                                            eventlist[k].catalogues[l].yesRate = "0"
                                        }
                                        eventlist[k].catalogues[l].runners[i].runnerName = eventlist[k].catalogues[l].runners[i].name
                                        eventlist[k].catalogues[l].runners[i].runnerId = eventlist[k].catalogues[l].runners[i].id
                                        eventlist[k].catalogues[l].runners[i].layPrices = []
                                        eventlist[k].catalogues[l].runners[i].backPrices = []
                                        delete eventlist[k].catalogues[l].runners[i].name
                                        delete eventlist[k].catalogues[l].runners[i].id
                                    }
                                    eventlist[k].catalogues[l].category = eventlist[k].catalogues[l].marketType
                                    eventlist[k].catalogues[l].marketType = "FANCY"
                                    fanctMarketArr.push(eventlist[k].catalogues[l])
                                }else{
                                    eventlist[k].catalogues[l].noValue = "0"
                                    eventlist[k].catalogues[l].noRate = "0"
                                    eventlist[k].catalogues[l].yesValue = "0"
                                    eventlist[k].catalogues[l].yesRate = "0"
                                    delete eventlist[k].catalogues[l].runners
                                    eventlist[k].catalogues[l].category = eventlist[k].catalogues[l].marketType
                                    eventlist[k].catalogues[l].marketType = "FANCY"
                                    fanctMarketArr.push(eventlist[k].catalogues[l])
                                }
                                
                            }else{
                                for(let i = 0;i<eventlist[k].catalogues[l].runners.length;i++){
                                    eventlist[k].catalogues[l].runners[i].runnerName = eventlist[k].catalogues[l].runners[i].name
                                    eventlist[k].catalogues[l].runners[i].runnerId = eventlist[k].catalogues[l].runners[i].id
                                    eventlist[k].catalogues[l].runners[i].layPrices = []
                                    eventlist[k].catalogues[l].runners[i].backPrices = []
                                    delete eventlist[k].catalogues[l].runners[i].name
                                    delete eventlist[k].catalogues[l].runners[i].id
                                }
                                if(eventlist[k].catalogues[l].bettingType == "ODDS"){
                                    matchOddsArr2.push(eventlist[k].catalogues[l])
                                    if(["OPEN","SUSPENDED"].includes(eventlist[k].catalogues[l].status)){
                                        matchOddsArr.push(eventlist[k].catalogues[l])
                                    }
                                }else if(eventlist[k].catalogues[l].bettingType == "BOOKMAKER"){
                                    bookMakerMarketArr2.push(eventlist[k].catalogues[l])
                                    if(["OPEN","SUSPENDED"].includes(eventlist[k].catalogues[l].status)){
                                        bookMakerMarketArr.push(eventlist[k].catalogues[l])
                                    }
                                }
                            }
                        }
                    }
                    
                }
                eventlist[k].markets = {
                    matchOdds: matchOddsArr,
                    bookmakers: bookMakerMarketArr,
                    fancyMarkets: fanctMarketArr
                }
                delete eventlist[k]['catalogues']
                let OnlyMOBMMarketIdsArr = [];
                let MOBMMarketArr = [];
                let MOBMMarketDetailsArr = matchOddsArr2.concat(bookMakerMarketArr2)
                let OnlyMOBMMarketIds = MOBMMarketDetailsArr.filter(item => ((item.bettingType == "BOOKMAKER" || item.marketType == "MATCH_ODDS" || item.marketType == "COMPLETED_MATCH" || item.marketType == "TIED_MATCH" || item.marketType == "WINNING_ODDS" || item.marketType == "TOURNAMENT_WINNER"  || item.marketName.trim().toLowerCase().startsWith('over/under') && ["OPEN","SUSPENDED"].includes(item.status))))
                for(let j = 0;j<MOBMMarketDetailsArr.length;j++){
                    MOBMMarketArr.push(MOBMMarketDetailsArr[j].marketId)
                }
                for(let j = 0;j<OnlyMOBMMarketIds.length;j++){
                    OnlyMOBMMarketIdsArr.push(OnlyMOBMMarketIds[j].marketId)
                }
                // console.log(OnlyMOBMMarketIdsArr,"OnlyMOBMMarketIdsArrOnlyMOBMMarketIdsArrINThisSportttttttt")
                await client.set(`${eventlist[k].eventId}_MOBMMarketArr_shark`,JSON.stringify(MOBMMarketArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_OnlyMOBMMarketIdsArr_shark`,JSON.stringify(OnlyMOBMMarketIdsArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_sharEventData`,JSON.stringify(eventlist[k]),'EX',7 * 24 * 60 * 60)
            }
            await client.set(`crone_getEventIds_${SportName}`,JSON.stringify(thisSportEventId))
            console.log(starttime,new Date(),(Date.now()-(starttime.getTime()))/1000,`Set ${SportName} Sport Cron  Ended.....`)
        }
        await seteventdataFunc()
        
    }catch(error){
        await setThisSportData()
        console.log(error,'Errorrr setthisSportData')
    }

}

module.exports = setThisSportData

