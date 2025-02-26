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
                return fetchMarketDatajson[0]
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
                let fetchMarketData = await fetch(` https://odds.datafeed365.com/api/fancy-list/${eventId}`,{
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
                        let runner = eventlist[k].runners.find(item => item.selectionId == matchodddata.runners[c].selectionId)
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
                    matchOddsArr2 = [tempObj]
                }
                if(bookmakerdata){
                    for(let a = 0; a<bookmakerdata.length; a++){
                        console.log(bookmakerdata[a],'bookmakerdataaaaaaaaaa')
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
                        console.log(bookmakerrunner,"bookmakerrunnerbookmakerrunner")
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
                            "bettingType": "BOOKMAKER",
                            "provider": "DIAMOND",
                            "marketName": tempObjfancy.name,
                            "bettingType": "LINE",
                            "marketType": "FANCY",
                            "noValue": tempObjfancy.l1,
                            "noRate": tempObjfancy.ls1,
                            "yesValue": tempObjfancy.b1,
                            "yesRate": tempObjfancy.bs1,
                        }
                        if(tempObjfancy.type_code == 10){
                            category = "OVERS"
                        }else if(tempObjfancy.type_code == 20){
                            category = "BATSMAN"
                        }else if(tempObjfancy.type_code == 2){
                            category = "SINGLE_OVER"
                        }else if(tempObjfancy.type_code == 28){
                            category = "ODD_EVEN"
                        }else if(tempObjfancy.type_code == 6){
                            category = "BALL_BY_BALL"
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
                let MOBMMarketDetailsArr = matchOddsArr2.concat(bookMakerMarketArr2)
                let OnlyMOBMMarketIds = MOBMMarketDetailsArr.filter(item => ((item.bettingType == "BOOKMAKER" || item.marketType == "MATCH_ODDS" || item.marketType == "COMPLETED_MATCH" || item.marketType == "TIED_MATCH" || item.marketType == "WINNING_ODDS" || item.marketType == "TOURNAMENT_WINNER"  || item.marketName.trim().toLowerCase().startsWith('over/under') && ["OPEN","SUSPENDED"].includes(item.status))))
                for(let j = 0;j<MOBMMarketDetailsArr.length;j++){
                    MOBMMarketArr.push(MOBMMarketDetailsArr[j].marketId)
                }
                for(let j = 0;j<OnlyMOBMMarketIds.length;j++){
                    OnlyMOBMMarketIdsArr.push(OnlyMOBMMarketIds[j].marketId)
                }
                // console.log(OnlyMOBMMarketIdsArr,"OnlyMOBMMarketIdsArrOnlyMOBMMarketIdsArrINThisSportttttttt")
                await client.set(`${eventlist[k].eventId}_MOBMMarketArr_diamond`,JSON.stringify(MOBMMarketArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_OnlyMOBMMarketIdsArr_diamond`,JSON.stringify(OnlyMOBMMarketIdsArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${eventlist[k].eventId}_sharEventData_diamond`,JSON.stringify(eventlist[k]),'EX',7 * 24 * 60 * 60)
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

