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
            async function fetchMOBook(marketIds) {
                let fetchMarketData = await fetch(`http://13.42.165.216:8443/api/betfair/${marketIds}`,{
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
                let fetchMarketData = await fetch(`https://odds.datafeed365.com/api/active-bm/${eventId}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketDatajson = await fetchMarketData.json()
                return fetchMarketDatajson.data
            }
            async function fetchFancyBook(eventId) {
                let fetchMarketData = await fetch(`https://odds.datafeed365.com/api/active-fancy/${eventId}`,{
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
                eventlist[k].providerName = eventlist[k].competition?eventlist[k].competition.provider:""
                eventlist[k].sportId = eventlist[k].eventType.id
                eventlist[k].sportName = eventlist[k].eventType.name
                eventlist[k].competitionId = eventlist[k].competition?eventlist[k].competition.id:eventlist[k].event.id
                eventlist[k].competitionName = eventlist[k].competition?eventlist[k].competition.name:eventlist[k].event.countryCode
                eventlist[k].eventId = eventlist[k].event.id
                eventlist[k].eventName = eventlist[k].event.name
                eventlist[k].country = eventlist[k].event.countryCode
                eventlist[k].venue = eventlist[k].event.venue
                eventlist[k].status = 'UPCOMING'
                delete eventlist[k]['eventType']
                delete eventlist[k]['competition']
                delete eventlist[k]['event']
                delete eventlist[k]['marketStartTime']
                delete eventlist[k]['totalMatched']
                thisSportEventId.push(eventlist[k].eventId)
                // console.log(eventlist[k],'eventlist[kkkkkkkkkkkkkkk')
                let marketIds = []
                if(["7","4339"].includes(eventlist[k].sportId)){
                    eventlist[k].catalogues.forEach(item => {
                        marketIds.push(item.marketId)
                    })
                    marketIds = marketIds.join(",")
                }else{
                    marketIds = [eventlist[k].marketId]
                    marketIds = marketIds.join(",")
                }
                let matchodddata = await fetchMOBook(marketIds)
                let bookmakerdata = await fetchBMBook(eventlist[k].eventId)
                let fancydata = await fetchFancyBook(eventlist[k].eventId)
                let fancyMarketIdArray = Object.keys(fancydata)
                delete eventlist[k]['marketId']
                for(let d = 0;d<matchodddata.length;d++){
                    if(matchodddata[d]){
                        console.log(matchodddata[d],"matchodddata[d]matchodddata[d]")
                        let tempObj
                        let thatcatalog
                        let tempRunner = []
                        if(["7","4339"].includes(eventlist[k].sportId)){
                            thatcatalog = eventlist[k].catalogues.find(item => item.marketId == matchodddata[d].marketId)
                            tempObj = {
                                "marketId": matchodddata[d].marketId,
                                "marketTime": matchodddata[d].lastMatchTime,
                                "marketType": thatcatalog.description.marketType,
                                "bettingType": thatcatalog.description.bettingType,
                                "marketName": thatcatalog.marketName,
                                "provider": "DIAMOND",
                                "status": matchodddata[d].status
                            }
                        }else{
                            tempObj = {
                                "marketId": matchodddata[d].marketId,
                                "marketTime": matchodddata[d].lastMatchTime,
                                "marketType": eventlist[k].description.marketType,
                                "bettingType": eventlist[k].description.bettingType,
                                "marketName": eventlist[k].marketName,
                                "provider": "DIAMOND",
                                "status": matchodddata[d].status
                            }
                        }
                        for(let c = 0;c<matchodddata[d].runners.length;c++){
                            let runner
                            if(["7","4339"].includes(eventlist[k].sportId)){
                                runner = thatcatalog.runners.find(item => item.selectionId == matchodddata[d].runners[c].selectionId)
                            }else{
                                runner = eventlist[k].runners.find(item => item.selectionId == matchodddata[d].runners[c].selectionId)
                            }
                            let tempObjrunner = 
                            {
                                "status": matchodddata[d].runners[c].status,
                                "metadata": runner.metadata,
                                "runnerName": runner.runnerName,
                                "runnerId": matchodddata[d].runners[c].selectionId,
                                "layPrices": matchodddata[d].runners[c].ex.availableToLay,
                                "backPrices": matchodddata[d].runners[c].ex.availableToBack
                            }
                            tempRunner.push(tempObjrunner)
                        }
                        tempObj.runners = tempRunner
                        matchOddsArr2.push(tempObj)
                        if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                            matchOddsArr.push(tempObj)
                        }
                        await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);

                    }
                }
                if(eventlist[k].sportId == 4){
                    let matchoddmarketdata = await fetchOtherMOMarketData(eventlist[k].eventId)
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
                                matchOddsArr2.push(tempObj)
                                if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                                    matchOddsArr.push(tempObj)
                                }
                                await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);

                            }
                        }
                    }

                }
                if(eventlist[k].sportId == 1){
                    let matchoddmarketdata = await fetchUOMarketData(eventlist[k].eventId)
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
                                matchOddsArr2.push(tempObj)
                                if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                                    matchOddsArr.push(tempObj)
                                }
                                await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);

                            }
                        }
                    }

                }
                if(["7","4339"].includes(eventlist[k].sportId)){
                    delete eventlist[k]['catalogues']
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
                        bookMakerMarketArr2.push(tempObj)
                        if(["OPEN","SUSPENDED"].includes(tempObj.status)){
                            bookMakerMarketArr.push(tempObj)
                        }
                        await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);

                    }
                }
                if(Object.keys(fancyMarketIdArray).length > 0){
                    for(let b = 0; b<fancyMarketIdArray.length; b++){
                        let tempRunner = []
                        let category = ""
                        let tempObjfancy = fancydata[fancyMarketIdArray[b]]
                        tempObjfancy = JSON.parse(tempObjfancy)
                        let tempObj = {
                            "marketId": tempObjfancy.id,
                            "marketTime": new Date(),
                            "provider": "DIAMOND",
                            "marketName": tempObjfancy.name,
                            "bettingType": "LINE",
                            "marketType": "FANCY",
                            "status": tempObjfancy.is_active == 1?"OPEN":"CLOSED",
                            "noValue": tempObjfancy.l1,
                            "noRate": tempObjfancy.ls1,
                            "yesValue": tempObjfancy.b1,
                            "yesRate": tempObjfancy.bs1,
                            "inPlay": tempObjfancy.in_play
                        }
                        if(["4","10","12"].includes(tempObjfancy.type_code)){
                            category = "OVERS"
                        }else if(["42","20","18","34","22","36"].includes(tempObjfancy.type_code)){
                            category = "BATSMAN"
                        }else if(tempObjfancy.type_code == 2){
                            category = "SINGLE_OVER"
                        }else if(tempObjfancy.type_code == 28){
                            category = "ODD_EVEN"
                        }else if(tempObjfancy.type_code == 6){
                            category = "BALL_BY_BALL"
                        }else{
                            category = "OTHER"
                        }
                        tempObj.category = category
                        let tempObjrunner = 
                        {
                            "status": tempObjfancy.status1,
                            "metadata": "",
                            "runnerName": tempObjfancy.name,
                            "runnerId": tempObjfancy.id,
                            "layPrices": [{
                                "price":tempObjfancy.l1,
                                "line":tempObjfancy.ls1
                            }],
                            "backPrices": [{
                                "price":tempObjfancy.b1,
                                "line":tempObjfancy.bs1
                            }]
                        }
                        tempRunner.push(tempObjrunner)
                        tempObj.runners = tempRunner
                        fanctMarketArr.push(tempObj)
    
                    }
                }
                delete eventlist[k]['marketName']
                delete eventlist[k]['runners']
                delete eventlist[k]['description']
                eventlist[k].markets = {
                    matchOdds: matchOddsArr,
                    bookmakers: bookMakerMarketArr,
                    fancyMarkets: fanctMarketArr
                }
                let OnlyMOBMMarketIdsArr = [];
                let MOBMMarketArr = [];
                let OnlyMOMarketIdArr = []
                let MOBMMarketDetailsArr = matchOddsArr2.concat(bookMakerMarketArr2)
                let OnlyMOBMMarketIds = MOBMMarketDetailsArr.filter(item => ((item.bettingType == "BOOKMAKER" || item.marketType == "MATCH_ODDS" || item.marketType == "COMPLETED_MATCH" || item.marketType == "TIED_MATCH" || item.marketType == "WINNING_ODDS" || item.marketType == "TOURNAMENT_WINNER"  || item.marketName.trim().toLowerCase().startsWith('over/under') && ["OPEN","SUSPENDED"].includes(item.status))))
                let OnlyMOMarketId = MOBMMarketDetailsArr.filter(item => (item.marketType == "MATCH_ODDS"))
                console.log(OnlyMOMarketId,"OnlyMOMarketIdOnlyMOMarketId")
                for(let j = 0;j<MOBMMarketDetailsArr.length;j++){
                    MOBMMarketArr.push(MOBMMarketDetailsArr[j].marketId)
                }
                for(let j = 0;j<OnlyMOBMMarketIds.length;j++){
                    OnlyMOBMMarketIdsArr.push(OnlyMOBMMarketIds[j].marketId)
                }
                for(let j = 0;j<OnlyMOMarketId.length;j++){
                    OnlyMOMarketIdArr.push(OnlyMOMarketId[j].marketId)
                }
                // console.log(OnlyMOBMMarketIdsArr,"OnlyMOBMMarketIdsArrOnlyMOBMMarketIdsArrINThisSportttttttt")
                await client.set(`${eventlist[k].eventId}_MOBMMarketArr_diamond`,JSON.stringify(MOBMMarketArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_OnlyMOBMMarketIdsArr_diamond`,JSON.stringify(OnlyMOBMMarketIdsArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_OnlyMOMarketIdsArr_diamond`,JSON.stringify(OnlyMOMarketIdArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_diamondEventData`,JSON.stringify(eventlist[k]),'EX',7 * 24 * 60 * 60)
            }
            await client.set(`crone_getEventIds_${SportName}_diamond`,JSON.stringify(thisSportEventId))
            console.log(starttime,new Date(),(Date.now()-(starttime.getTime()))/1000,`Set ${SportName} Sport Cron  Ended.....`)
        }
        await seteventdataFunc()
        
    }catch(error){
        // await setThisSportData(eventlist,SportName)
        console.log(error,'Errorrr setthisSportData')
    }

}

module.exports = setThisSportData

