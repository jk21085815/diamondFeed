const cron = require('node-cron');
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const Publishclient = redis.createClient({url:process.env.redisurl});
client.connect()
Publishclient.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


module.exports = () => {
    cron.schedule('00 * * * * *', async() => {
    // const exchangePageUpdate =  async () => {
        // setInterval(async() => {
            let starttime = new Date();
            // console.log(starttime,'Exchange Page Cron Started......................')
            try{
                let cricketData
                let OtherSportData
                let eventlist = []
                cricketData = await client.get('crone_getEventIds_Cricket_diamond_UPD')
                if(!cricketData){
                    cricketData = await client.get('crone_getEventIds_Cricket_diamond')
                }
                cricketData = JSON.parse(cricketData)
                OtherSportData = await client.get('crone_getEventIds_OtherSport_diamond_UPD')
                if(!OtherSportData){
                    OtherSportData = await client.get('crone_getEventIds_OtherSport_diamond')
                }
                OtherSportData = JSON.parse(OtherSportData)
                let allData = cricketData.concat(OtherSportData)
                let eventIds = [...allData]
                // console.log(eventIds.length,'eventIdsttttttttttt in exchange page Lengthhhh')
                for(let i = 0;i<eventIds.length;i++){
                    // console.log(i,'exchange page iiiiiiiiii')
                    if(await client.get(`${eventIds[i]}_diamondEventData`)){
                        let eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        eventData = JSON.parse(eventData)
                        if(eventData.markets.matchOdds != null && eventData.markets.matchOdds[0]){
                            let index = eventData.markets.matchOdds.findIndex(item => item.marketName.trim() == "Match Odds")
                            if(index !== -1){
                                let matchodddetails = await client.get(`${eventData.markets.matchOdds[index].marketId}_diamond`)
                                if(matchodddetails){
                                    matchodddetails = JSON.parse(matchodddetails)
                                    eventData.markets.matchOdds[index] = matchodddetails
                                    // await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                }
                            }
                            eventData.matchOddStatus = true
                        }else{
                            eventData.matchOddStatus = false
                        }
                        if(eventData.markets.bookmakers != null && eventData.markets.bookmakers[0]){
                            eventData.bookmakerStatus = true
                        }else{
                            eventData.bookmakerStatus = false
                        }
                        if(eventData.markets.fancyMarkets != null && eventData.markets.fancyMarkets[0]){
                            eventData.fancyStatus = true
                        }else{
                            eventData.fancyStatus = false
                        }
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
                        delete eventData.markets['bookmakers']
                        delete eventData.markets['fancyMarkets']
                        if(pushstatus){
                            eventlist.push(eventData)
                        }
                    }
                }
                await client.set('/topic/diamond_exchange',JSON.stringify(eventlist))
                Publishclient.publish('/topic/diamond_exchange',JSON.stringify(eventlist))
                // console.log(starttime,'Exchange Page Cron End......................')

            }catch(error){
                console.log(error,'Errorrr exchagnePageCron')
            }
        // }, 1000 * 60);
    })
    // })
}
