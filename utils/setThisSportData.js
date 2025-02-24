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
            async function fetchMOBook(marketId) {
                let fetchMarketData = await fetch(` http://13.42.165.216:8443/api/betfair/${marketId}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketDatajson = await fetchMarketData.json()
                return fetchMarketDatajson.result[0]
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
            async function fetchFancyBook(eventId) {
                let fetchMarketData = await fetch(` hthttps://odds.datafeed365.com/api/fancy-list/${eventId}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketDatajson = await fetchMarketData.json()
                return fetchMarketDatajson.data
            }
            for(let k = 0;k<eventlist.length;k++){
                console.log(k,new Date(),'kkk')
                let matchOddsArr = [];
                let matchOddsArr2 = [];
                let bookMakerMarketArr = [];
                let bookMakerMarketArr2 = [];
                let fanctMarketArr = [];
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
                eventlist[k].status = 'UPCOMING'
                delete eventlist[k]['eventType']
                delete eventlist[k]['competition']
                delete eventlist[k]['event']
                // delete eventlist[k]['description']
                delete eventlist[k]['marketStartTime']
                delete eventlist[k]['totalMatched']
                // delete eventlist[k]['marketName']
                // delete eventlist[k]['runners']
                thisSportEventId.push(eventlist[k].eventId)
                let matchodddata = await fetchMOBook(eventlist[k].marketId)
                let bookmakerdata = await fetchBMBook(eventlist[k].eventId)
                let fancydata = await fetchFancyBook(eventlist[k].eventId)
                let fancyMarketIdArray = Object.keys(fancydata)
                delete eventlist[k]['marketId']
                if(matchodddata){
                    let tempRunner = []
                    let tempObj = {
                        "marketId": matchodddata.marketId,
                        "marketTime": matchodddata.lastMatchTime,
                        "marketType": eventlist[k].description.marketType,
                        "bettingType": eventlist[k].description.bettingType,
                        "marketName": eventlist[k].marketName,
                        "provider": "DIAMOND",
                        "status": matchodddata.status
                    }
                    for(let c = 0;c<matchodddata.runners.length;c++){
                        let runner = eventlist[k].runners.find(item => item.selectionId == matchodddata.runners.selectionId)
                        let tempObjrunner = 
                        {
                            "status": matchodddata.runners[c].status,
                            "metadata": runner.metadata,
                            "runnerName": runner.runnerName,
                            "runnerId": matchodddata.runners[c].selectionId,
                            "layPrices": matchodddata.runners[c].ex.availableToLay,
                            "backPrices": matchodddata.runners[c].ex.availableToBack
                        }
                        tempRunner.push(tempObjrunner)
                    }
                    tempObj.runners = tempRunner
                    matchOddsArr = [tempObj]
                }
                for(let a = 0; a<bookmakerdata.length; a++){
                    let tempRunner = []
                    let marketName = ""
                    let marketType = ""
                    let bettingType = ""
                    let tempObj = {
                        "marketId": bookmakerdata[a].bookmaker_id,
                        "marketTime": new Date(),
                        "bettingType": "BOOKMAKER",
                        "provider": "DIAMOND",
                        "status": bookmakerdata[a].data.status
                    }
                    if(bookmakerdata[a].data.type == "MATCH_ODDS"){
                        marketName = "Bookmaker"
                        marketType = "BOOKMAKER"
                        bettingType = "BOOKMAKER"
                    }else if(bookmakerdata[a].data.type == "MINI_BOOKMAKER"){
                        marketName = "Bookmaker 0 Commission"
                        marketType = "BOOKMAKER"
                        bettingType = "BOOKMAKER"
                    }else if(bookmakerdata[a].data.type == "TO_WIN_THE_TOSS"){
                        marketName = "To Win The Toss"
                        marketType = "BOOKMAKER"
                        bettingType = "BOOKMAKER"
                    }
                    tempObj.marketName = marketName
                    tempObj.marketType = marketType
                    tempObj.bettingType = bettingType

                    let bookmakerrunner = JSON.parse(bookmakerdata[a].runners)
                    for(let c = 0;c<bookmakerrunner.length;c++){
                        let runner = bookmakerrunner[c]
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
                    bookMakerMarketArr2.push(tempObj)
                    if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                        bookMakerMarketArr.push(tempObj)
                    }
                }
                for(let b = 0; b<fancyMarketIdArray.length; b++){
                    let tempRunner = []
                    let tempObjfancy = fancydata[fancyMarketIdArray[b]]
                    tempObjfancy = JSON.parse(tempObjfancy)
                    let tempObj = {
                        "marketId": tempObjfancy.id,
                        "marketTime": new Date(),
                        "bettingType": "BOOKMAKER",
                        "provider": "DIAMOND",
                        "marketName": tempObjfancy.name,
                        "bettingType": "LINE",
                        "marketType": "FANCY",
                        "category": "FANCY"
                    }
                    let bookmakerrunner = JSON.parse(tempObjfancy.runners)
                    for(let c = 0;c<bookmakerrunner.length;c++){
                        let runner = bookmakerrunner[c]
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
                    fanctMarketArr.push(tempObj)

                }
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
                await client.set(`${eventlist[k].eventId}_MOBMMarketArr_shark_diamond`,JSON.stringify(MOBMMarketArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_OnlyMOBMMarketIdsArr_shark_diamond`,JSON.stringify(OnlyMOBMMarketIdsArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_sharEventData_diamond`,JSON.stringify(eventlist[k]),'EX',7 * 24 * 60 * 60)
            }
            await client.set(`crone_getEventIds_${SportName}_diamond`,JSON.stringify(thisSportEventId))
            console.log(starttime,new Date(),(Date.now()-(starttime.getTime()))/1000,`Set ${SportName} Sport Cron  Ended.....`)
        }
        await seteventdataFunc()
        
    }catch(error){
        await setThisSportData()
        console.log(error,'Errorrr setthisSportData')
    }

}

module.exports = setThisSportData

