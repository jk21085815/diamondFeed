const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const setNewAddedEvents = async(eventIds) => {
    let starttime = new Date();
    console.log(starttime,eventIds,`Set New Live Added Event Cron Started.....`)
    try{    
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        for(let k = 0;k<eventIds.length;k++){
            let matchOddsArr = [];
            let matchOddsArr2 = [];
            let bookMakerMarketArr = [];
            let bookMakerMarketArr2 = [];
            let fetchMarketEventData
            let liveMatchCheckMarket;
            let liveMatchCheckMarket2;
            let liveMatchCheckMarket3;
            let liveMatchCheckMarket4;
            let isLiveStatus = false
            try{
                fetchMarketEventData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[k]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
            }catch(error){
                await delay(1000 * 10)
                fetchMarketEventData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[k]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
            }
            
            fetchMarketEventData = await fetchMarketEventData.json()
            for(let l = 0;l<fetchMarketEventData.catalogues.length;l++){
                let fetchMarketData
                try{
                    fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${fetchMarketEventData.catalogues[l].marketId}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                }catch(error){
                    await delay(1000 * 10)
                    fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${fetchMarketEventData.catalogues[l].marketId}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                }
                let fetchMarketDatajson = await fetchMarketData.json()
                if(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId]){
                    if(fetchMarketDatajson[fetchMarketEventData.catalogues[l].marketId].status !== "CLOSED"){
                        if(fetchMarketEventData.catalogues[l].bettingType !== "LINE"){
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
                                    // delete fetchMarketEventData.catalogues[l].runners[i].metadata
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
                    if(fetchMarketEventData.catalogues[l].bettingType !== "LINE" && fetchMarketEventData.catalogues[l].status !== "CLOSED"){
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
            let eventData = await client.get(`${eventIds[k]}_diamondEventData`)
            eventData = JSON.parse(eventData)
            // eventData.status = isLiveStatus?'IN_PLAY':'UPCOMING'
            eventData.openDate = fetchMarketEventData.event.openDate
            eventData.markets.matchOdds = matchOddsArr
            eventData.markets.bookmakers = bookMakerMarketArr
            let MOBMMarketArr = []
            let OnlyMOBMMarketIdsArr = []
            let MOBMMarketDetailsArr = matchOddsArr2.concat(bookMakerMarketArr2)
            let OnlyMOBMMarketIds = MOBMMarketDetailsArr.filter(item => ((item.bettingType == "BOOKMAKER" || item.marketType == "MATCH_ODDS" || item.marketType == "COMPLETED_MATCH" || item.marketType == "TIED_MATCH" || item.marketType == "WINNING_ODDS"  || item.marketType == "TOURNAMENT_WINNER" || item.marketName.trim().toLowerCase().startsWith('over/under') && ["OPEN","SUSPENDED"].includes(item.status))))
            for(let j = 0;j<MOBMMarketDetailsArr.length;j++){
                MOBMMarketArr.push(MOBMMarketDetailsArr[j].marketId)
            }
            for(let j = 0;j<OnlyMOBMMarketIds.length;j++){
                OnlyMOBMMarketIdsArr.push(OnlyMOBMMarketIds[j].marketId)
            }
            console.log('this is newEventUpdate');
            
            await client.set(`${eventIds[k]}_MOBMMarketArr_shark`,JSON.stringify(MOBMMarketArr),'EX',7 * 24 * 60 * 60)
            await client.set(`${eventIds[k]}_OnlyMOBMMarketIdsArr_shark`,JSON.stringify(OnlyMOBMMarketIdsArr),'EX',7 * 24 * 60 * 60)
            await client.set(`${eventIds[k]}_diamondEventData`,JSON.stringify(eventData),'EX',24 * 60 * 60)
        }
        console.log(eventIds,starttime,new Date(),(Date.now()-(starttime.getTime()))/1000,`Set New Live Added Event Cron  Ended.....`)
        
    }catch(error){
        console.log(error,'Errorrr')
    }

}

module.exports = setNewAddedEvents

