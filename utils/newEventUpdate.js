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

