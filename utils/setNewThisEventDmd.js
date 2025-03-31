const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const setThisEvent = async(eventIds) => {
    try{
        console.log(eventIds.length,`Event list length`)

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
        
        for(let k = 0;k<eventIds.length;k++){
            console.log(eventIds[k],'kkkkkkkkkkk')
            let udpateevent = true
            let eventUpdateTime = await client.get(`${eventIds[k]}_udpateTime_diamond`)
            if(eventUpdateTime){
                if(new Date(JSON.parse(eventUpdateTime)).getTime() >= (Date.now() - (5 * 1000 * 60)) ){
                    return false
                }else{
                    udpateevent = true
                    await client.set(`${eventIds[k]}_udpateTime_diamond`,JSON.stringify(new Date()),'EX',24 * 60 * 60)
                }
            }else{
                udpateevent = true
                await client.set(`${eventIds[k]}_udpateTime_diamond`,JSON.stringify(new Date()),'EX',24 * 60 * 60)
            }
            if(udpateevent){
                let eventData = await client.get(`${eventIds[k]}_diamondEventData`)
                if(!eventData){
                    let matchOddsArr = [];
                    let matchOddsArr2 = [];
                    let bookMakerMarketArr = [];
                    let fanctMarketArr = [];
                    let fetchActiveEvent = await fetch(`https://odds.datafeed365.com/api/active-events`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    fetchActiveEvent = await fetchActiveEvent.json()
                    let eventlist = fetchActiveEvent.data
                    let thisevent = eventlist.find(item => item.id == eventIds[k])
                    if(thisevent){
                        thisevent.openDate = new Date(new Date(thisevent.open_date).getTime() + (1000 * 60 * 60 * 5.5)).toISOString()
                        thisevent.providerName = ""
                        thisevent.sportId = thisevent.event_type_id.toString()
                        thisevent.sportName = thisevent.event_type_name
                        thisevent.competitionId = "12547896542"
                        thisevent.competitionName = "Other"
                        thisevent.eventId = thisevent.id
                        thisevent.eventName = thisevent.name
                        thisevent.country = ""
                        thisevent.venue = ""
                        thisevent.isvirtual = false
                        thisevent.isother = true
                        thisevent.status = 'UPCOMING'
                        let bookmakerdata = await fetchBMBook(thisevent.eventId)
                        let fancydata = await fetchFancyBook(thisevent.eventId)
                        let fancyMarketIdArray = Object.keys(fancydata)
                        delete thisevent['marketId']
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
                                    if(bookmakerdata[a].data.name == "BOOKMAKER"){
                                        marketName = "Bookmaker"
                                    }else if(bookmakerdata[a].data.type == "MINI_BOOKMAKER"){
                                        marketName = "Bookmaker 0 Commission"
                                    }else if(bookmakerdata[a].data.type == "TO_WIN_THE_TOSS"){
                                        marketName = "To Win The Toss"
                                    }else{
                                        marketName = bookmakerdata[a].data.name
                                    }
                                    tempObj["marketName"] = marketName
                
                                    let bookmakerrunner = bookmakerdata[a].data.runners
                                    if (typeof bookmakerrunner === "string" && bookmakerrunner.trim() !== "") {
                                        bookmakerrunner = JSON.parse(bookmakerrunner);
                                    } else {
                                        console.error("Invalid JSON data:", bookmakerrunner);
                                    }
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
                                    await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
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
                                    "provider": "DIAMOND",
                                    "marketName": tempObjfancy.name,
                                    "bettingType": "LINE",
                                    "marketType": "FANCY",
                                    "status": ["ACTIVE","SUSPENDED","BALL_RUNNING"].includes(tempObjfancy.status1)?"OPEN":"CLOSED",
                                    "noValue": tempObjfancy.l1,
                                    "noRate": tempObjfancy.ls1,
                                    "yesValue": tempObjfancy.b1,
                                    "yesRate": tempObjfancy.bs1,
                                    "inPlay": tempObjfancy.in_play
                                }
                                // if(["4","10","36","14","18","42","22","34"].includes(tempObjfancy.type_code)){
                                //     category = "NORMAL"
                                // }else if([].includes(tempObjfancy.type_code)){
                                //     category = "FANCY1"
                                // }else if(tempObjfancy.type_code == 2){
                                //     category = "METER"
                                // }else if(tempObjfancy.type_code == 28){
                                //     category = "ODD_EVEN"
                                // }else if(tempObjfancy.type_code == 6){
                                //     category = "BALL_BY_BALL"
                                // }else{
                                //     category = "OTHER"
                                // }
                                if(["4","10","12"].includes(tempObjfancy.type_code.toString())){
                                    category = "OVERS"
                                }else if(["42","20","18","22","36","14"].includes(tempObjfancy.type_code.toString())){
                                    category = "BATSMAN"
                                }else if(tempObjfancy.type_code.toString() == "2"){
                                    category = "SINGLE_OVER"
                                }else if(tempObjfancy.type_code.toString() == "28"){
                                    category = "ODD_EVEN"
                                }else if(tempObjfancy.type_code.toString() == "6"){
                                    category = "BALL_BY_BALL"
                                }else{
                                    category = "OTHER"
                                }
                                tempObj.category = category
                                let tempObjrunner1 = 
                                {
                                    "status": tempObjfancy.status1,
                                    "metadata": "",
                                    "runnerName": tempObjfancy.name,
                                    "runnerId": tempObjfancy.id + '1',
                                    "layPrices": [{
                                        "price":tempObjfancy.l1,
                                        "line":tempObjfancy.ls1
                                    }],
                                    "backPrices": [{
                                        "price":tempObjfancy.b1,
                                        "line":tempObjfancy.bs1
                                    }]
                                }
                                let tempObjrunner2 = 
                                {
                                    "status": tempObjfancy.status2,
                                    "metadata": "",
                                    "runnerName": tempObjfancy.name,
                                    "runnerId": tempObjfancy.id + '2',
                                    "layPrices": [{
                                        "price":tempObjfancy.l2,
                                        "line":tempObjfancy.ls2
                                    }],
                                    "backPrices": [{
                                        "price":tempObjfancy.b2,
                                        "line":tempObjfancy.bs2
                                    }]
                                }
                                let tempObjrunner3 = 
                                {
                                    "status": tempObjfancy.status3,
                                    "metadata": "",
                                    "runnerName": tempObjfancy.name,
                                    "runnerId": tempObjfancy.id + '3',
                                    "layPrices": [{
                                        "price":tempObjfancy.l3,
                                        "line":tempObjfancy.ls3
                                    }],
                                    "backPrices": [{
                                        "price":tempObjfancy.b3,
                                        "line":tempObjfancy.bs3
                                    }]
                                }
                                tempRunner.push(tempObjrunner1)
                                tempRunner.push(tempObjrunner2)
                                tempRunner.push(tempObjrunner3)
                                tempObj.runners = tempRunner
                                fanctMarketArr.push(tempObj)
            
                            }
                        }
                        delete thisevent['marketName']
                        delete thisevent['runners']
                        delete thisevent['description']
                        thisevent.markets = {
                            matchOdds: matchOddsArr,
                            bookmakers: bookMakerMarketArr,
                            fancyMarkets: fanctMarketArr
                        }
                        let OnlyOtherMOMarketIdsArr = [];
                        let OnlyMOMarketIdArr = []
                        let MOMarketDetailsArr = matchOddsArr2
                        let OnlyOtherMOMarketDetails = MOMarketDetailsArr.filter(item => ((item.marketType == "COMPLETED_MATCH" || item.marketType == "TIED_MATCH" || item.marketType == "WINNING_ODDS" || item.marketType == "WIN" || item.marketType == "TOURNAMENT_WINNER"  || item.marketName.trim().toLowerCase().startsWith('over/under') && ["OPEN","SUSPENDED","BALL_RUNNING"].includes(item.status))))
                        let OnlyMOMarketId = MOMarketDetailsArr.filter(item => (item.marketType == "MATCH_ODDS"))
                        for(let j = 0;j<OnlyOtherMOMarketDetails.length;j++){
                            OnlyOtherMOMarketIdsArr.push(OnlyOtherMOMarketDetails[j].marketId)
                        }
                        for(let j = 0;j<OnlyMOMarketId.length;j++){
                            OnlyMOMarketIdArr.push(OnlyMOMarketId[j].marketId)
                        }
                        await client.set(`${eventIds[k]}_OnlyOtherMOMarketIdsArr_diamond`,JSON.stringify(OnlyOtherMOMarketIdsArr),'EX',7 * 24 * 60 * 60)
                        await client.set(`${eventIds[k]}_OnlyMOMarketIdsArr_diamond`,JSON.stringify(OnlyMOMarketIdArr),'EX',7 * 24 * 60 * 60)

                        let otherEventIds = await client.get(`crone_getEventIds_Other_diamond`)
                        if(!otherEventIds){
                            await client.set(`crone_getEventIds_Other_diamond`,JSON.stringify([]))
                            otherEventIds = []
                        }else{
                            otherEventIds = JSON.parse(otherEventIds)
                        }
                        if(!otherEventIds.includes(eventIds[k])){
                            otherEventIds = otherEventIds.concat(eventIds[k])
                            await client.set(`crone_getEventIds_Other_diamond`,JSON.stringify(otherEventIds))
                        }
                        await client.set(`${eventIds[k]}_diamondEventData`,JSON.stringify(thisevent),'EX',7 * 24 * 60 * 60)
                    }
                }
            }

        }
        return true
    }catch(error){
        // setThisEvent(eventIds,SportName)
        console.log(error,'Errorrr setThisEvent')
        return false
    }

}

module.exports = setThisEvent

