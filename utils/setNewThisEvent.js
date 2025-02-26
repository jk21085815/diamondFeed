const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const setNewThisEventData = async(eventIds) => {
    let starttime = new Date();
    console.log(starttime,`Set New Event Data Cron Started.....`)
    try{
            console.log(eventIds.length,eventIds,'Event list length')
            for(let k = 0;k<eventIds.length;k++){
                console.log(k,new Date(),'kkk')
                let liveMatchCheckMarket;
                let liveMatchCheckMarket2;
                let liveMatchCheckMarket3;
                let liveMatchCheckMarket4;
                let isLiveStatus = false
                let matchOddsArr = [];
                let matchOddsArr2 = [];
                let bookMakerMarketArr = [];
                let bookMakerMarketArr2 = [];
                let fanctMarketArr = [];
                let fetchMarketEventData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[k]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                fetchMarketEventData = await fetchMarketEventData.json()
                fetchMarketEventData.openDate = fetchMarketEventData.event.openDate
                fetchMarketEventData.providerName = fetchMarketEventData.competition.provider
                fetchMarketEventData.sportId = fetchMarketEventData.eventType.id
                fetchMarketEventData.sportName = fetchMarketEventData.eventType.name
                fetchMarketEventData.competitionId = fetchMarketEventData.competition.id
                fetchMarketEventData.competitionName = fetchMarketEventData.competition.name
                fetchMarketEventData.eventId = fetchMarketEventData.event.id
                fetchMarketEventData.eventName = fetchMarketEventData.event.name
                fetchMarketEventData.country = fetchMarketEventData.event.countryCode
                fetchMarketEventData.venue = fetchMarketEventData.event.venue

                delete fetchMarketEventData['eventType']
                delete fetchMarketEventData['competition']
                delete fetchMarketEventData['event']
                delete fetchMarketEventData['metadata']

                liveMatchCheckMarket = fetchMarketEventData.catalogues.find(item => item.marketName.trim() == 'Match Odds' && item.status !== "CLOSED")
                liveMatchCheckMarket2 = fetchMarketEventData.catalogues.find(item => item.marketName.trim() == 'Bookmaker' && item.status !== "CLOSED")
                if(!liveMatchCheckMarket2 || fetchMarketEventData.sportId == "500"){
                    liveMatchCheckMarket2 = fetchMarketEventData.catalogues.find(item => item.marketName.trim() == "Bookmaker 0 Commission" && item.status !== "CLOSED")
                    if(!liveMatchCheckMarket2 && fetchMarketEventData.sportId == "500"){
                        liveMatchCheckMarket3 = fetchMarketEventData.catalogues.find(item => item.bettingType == "BOOKMAKER" && item.status !== "CLOSED")
                    }
                }
                liveMatchCheckMarket4 = fetchMarketEventData.catalogues.find(item => item.marketType == 'TOURNAMENT_WINNER' && item.status !== "CLOSED")
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
                fetchMarketEventData.status = isLiveStatus?'IN_PLAY':'UPCOMING'
                for(let l = 0;l<fetchMarketEventData.catalogues.length;l++){
                    try{
                        let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${fetchMarketEventData.catalogues[l].marketId}`,{
                            method: 'GET',
                            headers: {
                                'Content-type': 'application/json',
                            }
                        })
                        let fetchMarketDatajson = await fetchMarketData.json()
                        if(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId]){
                            if(!["CLOSED"].includes(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].status)){
                                if(fetchMarketEventData.catalogues[l].bettingType == "LINE" && fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].status !== "INACTIVE"){
                                    if(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].sportingEvent == true){
                                        fetchMarketEventData.catalogues[l].status = "BALL_RUNNING"
                                    }
                                    if(false){
                                        for(let i = 0;i<fetchMarketEventData.catalogues[l].runners.length;i++){
                                            let runner = fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].runners.find(item => item.selectionId == fetchMarketEventData.catalogues[l].runners[i].id)
                                            if(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].sportingEvent == true && fetchMarketEventData.catalogues[l].status !== "CLOSED"){
                                                fetchMarketEventData.catalogues[l].status = "BALL_RUNNING"
                                            }
                                            if(runner){
                                                if(i == 0){
                                                    if(runner.lay.length > 0){
                                                        fetchMarketEventData.catalogues[l].noValue = runner.lay[0].line
                                                        fetchMarketEventData.catalogues[l].noRate = runner.lay[0].price
                                                    }else{
                                                        fetchMarketEventData.catalogues[l].noValue = "0"
                                                        fetchMarketEventData.catalogues[l].noRate = "0"
                                                    }
                                                    if(runner.back.length > 0){
                                                        fetchMarketEventData.catalogues[l].yesValue = runner.back[0].line
                                                        fetchMarketEventData.catalogues[l].yesRate = runner.back[0].price
                                                    }else{
                                                        fetchMarketEventData.catalogues[l].yesValue = "0"
                                                        fetchMarketEventData.catalogues[l].yesRate = "0"
                                                    }
                                                    
                                                }
                                                runner.runnerName = fetchMarketEventData.catalogues[l].runners[i].name
                                                runner.runnerId = runner.selectionId
                                                runner.layPrices = runner.lay
                                                runner.backPrices = runner.back
                                                delete runner.back
                                                delete runner.lay
                                                delete runner.selectionId
                                                fetchMarketEventData.catalogues[l].runners[i] = runner
                                            }else{
                                                if(i = 0){
                                                    fetchMarketEventData.catalogues[l].noValue = "0"
                                                    fetchMarketEventData.catalogues[l].noRate = "0"
                                                    fetchMarketEventData.catalogues[l].yesValue = "0"
                                                    fetchMarketEventData.catalogues[l].yesRate = "0"
                                                }
                                                fetchMarketEventData.catalogues[l].runners[i].runnerName = fetchMarketEventData.catalogues[l].runners[i].name
                                                fetchMarketEventData.catalogues[l].runners[i].runnerId = fetchMarketEventData.catalogues[l].runners[i].id
                                                fetchMarketEventData.catalogues[l].runners[i].layPrices = []
                                                fetchMarketEventData.catalogues[l].runners[i].backPrices = []
                                                delete fetchMarketEventData.catalogues[l].runners[i].name
                                                delete fetchMarketEventData.catalogues[l].runners[i].id
                                            }
                                        }
                                        fetchMarketEventData.catalogues[l].category = fetchMarketEventData.catalogues[l].marketType
                                        fetchMarketEventData.catalogues[l].marketType = "FANCY"
                                        fanctMarketArr.push(fetchMarketEventData.catalogues[l])
    
                                    }else{
                                        for(let i = 0;i<fetchMarketEventData.catalogues[l].runners.length;i++){
                                            let runner = fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].runners.find(item => (item.selectionId == fetchMarketEventData.catalogues[l].runners[i].id && item.status == "ACTIVE"))
                                            if(runner){
                                                if(runner.lay.length > 0){
                                                    fetchMarketEventData.catalogues[l].noValue = runner.lay[0].line
                                                    fetchMarketEventData.catalogues[l].noRate = runner.lay[0].price
                                                }else{
                                                    fetchMarketEventData.catalogues[l].noValue = "0"
                                                    fetchMarketEventData.catalogues[l].noRate = "0"
                                                }
                                                if(runner.back.length > 0){
                                                    fetchMarketEventData.catalogues[l].yesValue = runner.back[0].line
                                                    fetchMarketEventData.catalogues[l].yesRate = runner.back[0].price
                                                }else{
                                                    fetchMarketEventData.catalogues[l].yesValue = "0"
                                                    fetchMarketEventData.catalogues[l].yesRate = "0"
                                                }
                                                
                                                delete fetchMarketEventData.catalogues[l].runners
                                                fetchMarketEventData.catalogues[l].category = fetchMarketEventData.catalogues[l].marketType
                                                fetchMarketEventData.catalogues[l].marketType = "FANCY"
                                                fanctMarketArr.push(fetchMarketEventData.catalogues[l])
                                                break
                                            }else{
                                                fetchMarketEventData.catalogues[l].noValue = "0"
                                                fetchMarketEventData.catalogues[l].noRate = "0"
                                                fetchMarketEventData.catalogues[l].yesValue = "0"
                                                fetchMarketEventData.catalogues[l].yesRate = "0"
                                                delete fetchMarketEventData.catalogues[l].runners
                                                fetchMarketEventData.catalogues[l].category = fetchMarketEventData.catalogues[l].marketType
                                                fetchMarketEventData.catalogues[l].marketType = "FANCY"
                                                fanctMarketArr.push(fetchMarketEventData.catalogues[l])
                                                break
                                            }
                                        }
                                    }
                                }else{
                                    for(let i = 0;i<fetchMarketEventData.catalogues[l].runners.length;i++){
                                        let runner = fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].runners.find(item => item.selectionId == fetchMarketEventData.catalogues[l].runners[i].id)
                                        if(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].sportingEvent == true && fetchMarketEventData.catalogues[l].status !== "CLOSED"){
                                            fetchMarketEventData.catalogues[l].status = "BALL_RUNNING"
                                        }
                                        if(runner){
                                            runner.runnerName = fetchMarketEventData.catalogues[l].runners[i].name
                                            runner.runnerId = runner.selectionId
                                            runner.layPrices = runner.lay
                                            runner.backPrices = runner.back
                                            delete runner.back
                                            delete runner.lay
                                            delete runner.selectionId
                                            fetchMarketEventData.catalogues[l].runners[i] = runner
                                        }else{
                                            fetchMarketEventData.catalogues[l].runners[i].runnerName = fetchMarketEventData.catalogues[l].runners[i].name
                                            fetchMarketEventData.catalogues[l].runners[i].runnerId = fetchMarketEventData.catalogues[l].runners[i].id
                                            fetchMarketEventData.catalogues[l].runners[i].layPrices = []
                                            fetchMarketEventData.catalogues[l].runners[i].backPrices = []
                                            delete fetchMarketEventData.catalogues[l].runners[i].name
                                            delete fetchMarketEventData.catalogues[l].runners[i].id
                                        }
                                    }
                                    if(fetchMarketEventData.catalogues[l].bettingType == "ODDS"){
                                        matchOddsArr2.push(fetchMarketEventData.catalogues[l])
                                        if(["OPEN","SUSPENDED"].includes(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].status)){
                                            matchOddsArr.push(fetchMarketEventData.catalogues[l])
                                        }
                                    }else if(fetchMarketEventData.catalogues[l].bettingType == "BOOKMAKER"){
                                        bookMakerMarketArr2.push(fetchMarketEventData.catalogues[l])
                                        if(["OPEN","SUSPENDED"].includes(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].status)){
                                            bookMakerMarketArr.push(fetchMarketEventData.catalogues[l])
                                        }
                                    }
                                }
                            }
    
                        }else{
                            if(!["CLOSED"].includes(fetchMarketEventData.catalogues[l].status)){
                                if(fetchMarketEventData.catalogues[l].bettingType == "LINE"&& fetchMarketEventData.catalogues[l].status !== "INACTIVE"){
                                    if(false){
                                        for(let i = 0;i<fetchMarketEventData.catalogues[l].runners.length;i++){
                                            if(i == 0){
                                                fetchMarketEventData.catalogues[l].noValue = "0"
                                                fetchMarketEventData.catalogues[l].noRate = "0"
                                                fetchMarketEventData.catalogues[l].yesValue = "0"
                                                fetchMarketEventData.catalogues[l].yesRate = "0"
                                            }
                                            fetchMarketEventData.catalogues[l].runners[i].runnerName = fetchMarketEventData.catalogues[l].runners[i].name
                                            fetchMarketEventData.catalogues[l].runners[i].runnerId = fetchMarketEventData.catalogues[l].runners[i].id
                                            fetchMarketEventData.catalogues[l].runners[i].layPrices = []
                                            fetchMarketEventData.catalogues[l].runners[i].backPrices = []
                                            delete fetchMarketEventData.catalogues[l].runners[i].name
                                            delete fetchMarketEventData.catalogues[l].runners[i].id
                                        }
                                        fetchMarketEventData.catalogues[l].category = fetchMarketEventData.catalogues[l].marketType
                                        fetchMarketEventData.catalogues[l].marketType = "FANCY"
                                        fanctMarketArr.push(fetchMarketEventData.catalogues[l])
                                    }else{
                                        fetchMarketEventData.catalogues[l].noValue = "0"
                                        fetchMarketEventData.catalogues[l].noRate = "0"
                                        fetchMarketEventData.catalogues[l].yesValue = "0"
                                        fetchMarketEventData.catalogues[l].yesRate = "0"
                                        delete fetchMarketEventData.catalogues[l].runners
                                        fetchMarketEventData.catalogues[l].category = fetchMarketEventData.catalogues[l].marketType
                                        fetchMarketEventData.catalogues[l].marketType = "FANCY"
                                        fanctMarketArr.push(fetchMarketEventData.catalogues[l])
                                    }
                                
                                }else{
                                    for(let i = 0;i<fetchMarketEventData.catalogues[l].runners.length;i++){
                                        fetchMarketEventData.catalogues[l].runners[i].runnerName = fetchMarketEventData.catalogues[l].runners[i].name
                                        fetchMarketEventData.catalogues[l].runners[i].runnerId = fetchMarketEventData.catalogues[l].runners[i].id
                                        fetchMarketEventData.catalogues[l].runners[i].layPrices = []
                                        fetchMarketEventData.catalogues[l].runners[i].backPrices = []
                                        delete fetchMarketEventData.catalogues[l].runners[i].name
                                        delete fetchMarketEventData.catalogues[l].runners[i].id
                                    }
                                    if(fetchMarketEventData.catalogues[l].bettingType == "ODDS"){
                                        matchOddsArr2.push(fetchMarketEventData.catalogues[l])
                                        if(["OPEN","SUSPENDED"].includes(fetchMarketEventData.catalogues[l].status)){
                                            matchOddsArr.push(fetchMarketEventData.catalogues[l])
                                        }
                                    }else if(fetchMarketEventData.catalogues[l].bettingType == "BOOKMAKER"){
                                        bookMakerMarketArr2.push(fetchMarketEventData.catalogues[l])
                                        if(["OPEN","SUSPENDED"].includes(fetchMarketEventData.catalogues[l].status)){
                                            bookMakerMarketArr.push(fetchMarketEventData.catalogues[l])
                                        }
                                    }
                                }
                            }
                        }
                    }catch(error){
                        console.log(error,'errorrrrrrrrrrrr')
                    }
                }
                console.log('hereeeeeeeeeeee')
                fetchMarketEventData.markets = {
                    matchOdds: matchOddsArr,
                    bookmakers: bookMakerMarketArr,
                    fancyMarkets: fanctMarketArr
                }
                delete fetchMarketEventData['catalogues']
                let OnlyMOBMMarketIdsArr = [];
                let MOBMMarketArr = [];
                let MOBMMarketDetailsArr = matchOddsArr2.concat(bookMakerMarketArr2)
                let OnlyMOBMMarketIds = MOBMMarketDetailsArr.filter(item => ((item.bettingType == "BOOKMAKER" || item.marketType == "MATCH_ODDS" || item.marketType == "COMPLETED_MATCH" || item.marketType == "TIED_MATCH" || item.marketType == "WINNING_ODDS" || item.marketType == "TOURNAMENT_WINNER" || item.marketName.trim().toLowerCase().startsWith('over/under') && ["OPEN","SUSPENDED"].includes(item.status))))
                for(let j = 0;j<MOBMMarketDetailsArr.length;j++){
                    MOBMMarketArr.push(MOBMMarketDetailsArr[j].marketId)
                }
                for(let j = 0;j<OnlyMOBMMarketIds.length;j++){
                    OnlyMOBMMarketIdsArr.push(OnlyMOBMMarketIds[j].marketId)
                }
                await client.set(`${fetchMarketEventData.eventId}_MOBMMarketArr_shark`,JSON.stringify(MOBMMarketArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${fetchMarketEventData.eventId}_OnlyMOBMMarketIdsArr_shark`,JSON.stringify(OnlyMOBMMarketIdsArr),'EX',7 * 24 * 60 * 60)
                await client.set(`${fetchMarketEventData.eventId}_diamondEventData`,JSON.stringify(fetchMarketEventData),'EX',24 * 60 * 60)
            }
            console.log(starttime,new Date(),(Date.now()-(starttime.getTime()))/1000,`Set New Event Data Cron Ended.....`)
        
    }catch(error){
        console.log(error,'Errorrr setNewrThis events')
    }

}

module.exports = setNewThisEventData

