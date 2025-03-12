const cron = require('node-cron');
const setNewAddedEvent = require('../utils/newEventUpdate')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


// module.exports = () => {
    // cron.schedule('*/10 * * * *', async() => {
    const addotherlivemarket =  async () => {
        setInterval(async () => {
            let starttime = new Date();
            // console.log(starttime,'Add Other sport MarketIds Cron Started.....')
            try{
                let OtherSportLiveMarketIds = [];
                let OtherSportLiveEventIds = [];
                let OherSportClosedEventIds = [];
                let OherSportinActivedEventIds = [];
                let newEventIdsArray = []
                let newEventAdded = false
                let eventIds_HR = await client.get(`crone_getEventIds_HorseRacing`)
                eventIds_HR = JSON.parse(eventIds_HR)
                let eventIds_GH = await client.get(`crone_getEventIds_GreyHound`)
                eventIds_GH = JSON.parse(eventIds_GH)
                let eventIds = await client.get('crone_getEventIds_OtherSport');
                let liveEventIds = await client.get('crone_OtherSportLiveEventIds_UPD');
                liveEventIds = JSON.parse(liveEventIds)
                eventIds = JSON.parse(eventIds)
                await client.set('crone_OtherSportClosedEventIds',JSON.stringify([]))
                await client.set('crone_OtherSportInactiveEventIds',JSON.stringify([]))
                let closedeventids = await client.get('crone_OtherSportClosedEventIds')
                let inActiveeventids = await client.get('crone_OtherSportInactiveEventIds')
                if(closedeventids){
                    closedeventids = JSON.parse(closedeventids)
                    eventIds = eventIds.filter(item => !closedeventids.includes(item))
                }
                if(inActiveeventids){
                    inActiveeventids = JSON.parse(inActiveeventids)
                    // console.log(inActiveeventids,'inActiveeventidsinActiveeventidsinActiveeventids')
                    eventIds = eventIds.filter(item => !inActiveeventids.includes(item))
                }
                let EventIdOfHRGH = eventIds_HR.concat(eventIds_GH)
                let NewEventIdsOfHRGH = EventIdOfHRGH.filter(item => !eventIds.includes(item))
                eventIds = eventIds.concat(NewEventIdsOfHRGH)
                console.log(eventIds.length,'Add Other eventIds')
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                for(let i = 0;i<eventIds.length;i++){
                    let MOBMMarketArr = []
                    let OherSportClosedMarketIds = [];
                    let OtherSportInactiveMarketIds = [];
                    console.log(new Date(),i,eventIds[i],'Add Other eventIds and Market iiiiiiiii')
                    let liveMatchCheckMarket
                    let liveMatchCheckMarket2;
                    let liveMatchCheckMarket3;
                    let liveMatchCheckMarket4;
                    let isLiveStatus = false
                    let isCloseEvent = false
                    let fetchMarketData
                    let issportHRGH = true
                    let eventODDSBMMarketIds = []
                    fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[i]}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    const contentType = fetchMarketData.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        // If the response is JSON, parse it
                        fetchMarketData = await fetchMarketData.json();
                        // console.log("Data:", fetchMarketData);
                    } else {
                        fetchMarketData = await fetchMarketData.text();
                        console.log("Non-JSON response received");

                    }
                    // await delay(1000 * 30);
                    // Check Event Live Status
                    liveMatchCheckMarket = fetchMarketData.catalogues.find(item => item.marketName == 'Match Odds')
                    liveMatchCheckMarket2 = fetchMarketData.catalogues.find(item => item.marketName == 'Bookmaker')
                    if(!liveMatchCheckMarket2 || fetchMarketData.eventType.id == "500"){
                        liveMatchCheckMarket2 = fetchMarketData.catalogues.find(item => item.marketName == "Bookmaker 0 Commission")
                        if(!liveMatchCheckMarket2 && fetchMarketData.eventType.id == "500"){
                            liveMatchCheckMarket3 = fetchMarketData.catalogues.find(item => item.bettingType == "BOOKMAKER" && item.status == "OPEN")
                        }
                    }
                    liveMatchCheckMarket4 = fetchMarketData.catalogues.find(item => item.marketType == 'TOURNAMENT_WINNER')
                    if(fetchMarketData.eventType.id == "500"){
                        console.log(liveMatchCheckMarket,liveMatchCheckMarket2,liveMatchCheckMarket3,liveMatchCheckMarket4,'liveMatchCheckMarket333333333')
                    }

                 
                    if(fetchMarketData && !["7","4339"].includes(fetchMarketData.eventType.id)){
                        if(liveMatchCheckMarket3){
                            if((liveMatchCheckMarket3.inPlay == true && liveMatchCheckMarket3.status == 'OPEN')){
                                if(!liveEventIds.includes(eventIds[i])){
                                    newEventAdded = true
                                    newEventIdsArray.push(eventIds[i])
                                }
                                OtherSportLiveEventIds.push(eventIds[i])
                                isLiveStatus = true
                                for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                    if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                        OtherSportLiveMarketIds.push(fetchMarketData.catalogues[k].marketId)
                                    }
                                }
                            }else{
                                if(liveMatchCheckMarket3.status == 'CLOSED'){
                                    OherSportClosedEventIds.push(eventIds[i])
                                    isCloseEvent = true
                                }
                            }
                        }
                        else if(liveMatchCheckMarket4){
                            if((liveMatchCheckMarket4.inPlay == true) && (liveMatchCheckMarket4.status == 'OPEN')){
                                if(!liveEventIds.includes(eventIds[i])){
                                    newEventAdded = true
                                    newEventIdsArray.push(eventIds[i])
                                }
                                OtherSportLiveEventIds.push(eventIds[i])
                                isLiveStatus = true
                                for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                    if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                        OtherSportLiveMarketIds.push(fetchMarketData.catalogues[k].marketId)
                                    }
                                }
                            }else{
                                if(liveMatchCheckMarket4.status == 'CLOSED'){
                                    OherSportClosedEventIds.push(eventIds[i])
                                    isCloseEvent = true
                                }else if(liveMatchCheckMarket4.status == 'INACTIVE'){
                                    OherSportinActivedEventIds.push(eventIds[i])
                                }
                            }
                        }
                        else if(liveMatchCheckMarket && liveMatchCheckMarket2){
                            if((liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED') || (liveMatchCheckMarket2.inPlay == true && liveMatchCheckMarket2.status !== 'CLOSED')){
                                if(!liveEventIds.includes(eventIds[i])){
                                    newEventAdded = true
                                    newEventIdsArray.push(eventIds[i])
                                }
                                OtherSportLiveEventIds.push(eventIds[i])
                                isLiveStatus = true
                                for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                    if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                        OtherSportLiveMarketIds.push(fetchMarketData.catalogues[k].marketId)
                                    }
                                }
                            }else{
                                if(liveMatchCheckMarket.status == 'CLOSED'){
                                    OherSportClosedEventIds.push(eventIds[i])
                                    isCloseEvent = true
                                }
                            }
                        }else if(liveMatchCheckMarket && !liveMatchCheckMarket2){
                            if(liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED'){
                                if(!liveEventIds.includes(eventIds[i])){
                                    newEventAdded = true
                                    newEventIdsArray.push(eventIds[i])
                                }
                                OtherSportLiveEventIds.push(eventIds[i])
                                isLiveStatus = true
                                for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                    if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                        OtherSportLiveMarketIds.push(fetchMarketData.catalogues[k].marketId)
                                    }
                                }
                            }else{
                                if(liveMatchCheckMarket.status == 'CLOSED'){
                                    OherSportClosedEventIds.push(eventIds[i])
                                    isCloseEvent = true
                                }
                            }
                        }else if(!liveMatchCheckMarket && liveMatchCheckMarket2){
                            if(liveMatchCheckMarket2.inPlay == true && liveMatchCheckMarket2.status !== 'CLOSED'){
                                if(!liveEventIds.includes(eventIds[i])){
                                    newEventAdded = true
                                    newEventIdsArray.push(eventIds[i])
                                }
                                OtherSportLiveEventIds.push(eventIds[i])
                                isLiveStatus = true
                                for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                    if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                        OtherSportLiveMarketIds.push(fetchMarketData.catalogues[k].marketId)
                                    }
                                }
                            }else{
                                if(liveMatchCheckMarket2.status == 'CLOSED'){
                                    OherSportClosedEventIds.push(eventIds[i])
                                    isCloseEvent = true
                                }
                            }
                        }
                        if(fetchMarketData.catalogues.length == 0){
                            OherSportClosedEventIds.push(eventIds[i])
                        }


                        let eventStatus = isLiveStatus == true?'IN_PLAY':'UPCOMING'
                        let eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            let allmarketids = eventData.markets.matchOdds.concat(eventData.markets.bookmakers,eventData.markets.fancyMarkets)
                            if(allmarketids.length == 0){
                                OherSportClosedEventIds.push(eventIds[i])
                            }
                            eventData.status = eventStatus
                            let mobmmarkets = fetchMarketData.catalogues.filter(item => item.bettingType !== "LINE")
                            for(let j = 0;j<mobmmarkets.length;j++){
                                if(mobmmarkets[j].status == "CLOSED"){
                                    OherSportClosedMarketIds.push(mobmmarkets[j].marketId)
                                // }else if(mobmmarkets[j].status == "INACTIVE"){
                                //     OtherSportInactiveMarketIds.push(mobmmarkets[j].marketId)
                                }else if(mobmmarkets[j].status == "OPEN"){
                                    OtherSportLiveMarketIds.push(mobmmarkets[j].marketId)
                                }
                            }
                            // let closemarketIds = OherSportClosedMarketIds.concat(OtherSportInactiveMarketIds)
                            let closemarketIds = OherSportClosedMarketIds
                            let openmatchoddsMarket = eventData.markets.matchOdds.filter(item => !closemarketIds.includes(item.marketId))
                            let openbookMakerMarket = eventData.markets.bookmakers.filter(item => !closemarketIds.includes(item.marketId))
                            eventData.markets.matchOdds = openmatchoddsMarket;
                            eventData.markets.bookmakers = openbookMakerMarket;
                            await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                        }
                    }else{
                        let eventData = await client.get(`${eventIds[i]}_diamondEventData`)
                        if(eventData){
                            eventData = JSON.parse(eventData)
                            let liveMatchCheckMarket = fetchMarketData.catalogues.filter(item => ["OPEN","SUSPENDED"].includes(item.status))
                            if(liveMatchCheckMarket.length > 0){
                                OtherSportLiveEventIds.push(eventIds[i])
                                eventData.markets.matchOdds = liveMatchCheckMarket
                                await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                                for(let k = 0;k<liveMatchCheckMarket.length;k++){
                                    OtherSportLiveMarketIds.push(liveMatchCheckMarket[k].marketId)
                                }
                            }else{
                                eventData.markets.matchOdds = liveMatchCheckMarket
                                await client.set(`${eventIds[i]}_diamondEventData`,JSON.stringify(eventData))
                            }
                        }
                    }
                }       
    
                if(newEventAdded){
                    await client.set('isNewLiveEventAdded',JSON.stringify(true))
                    await client.set('isNewLiveEventAddedForFancy',JSON.stringify(true))
                    await client.set('newEventIds_Other',JSON.stringify(newEventIdsArray))
                    await setNewAddedEvent(newEventIdsArray)
                }
                
                await client.set('crone_liveMarketIds_UPD',JSON.stringify(OtherSportLiveMarketIds));
                await client.set('crone_OtherSportLiveEventIds_UPD',JSON.stringify(OtherSportLiveEventIds));
                if(await client.get('crone_OtherSportClosedEventIds')){
                    let closedOldEventId = await client.get('crone_OtherSportClosedEventIds') 
                    closedOldEventId = JSON.parse(closedOldEventId)
                    await client.set('crone_OtherSportClosedEventIds',JSON.stringify(OherSportClosedEventIds.concat(closedOldEventId)))
                    
                }else{
                    await client.set('crone_OtherSportClosedEventIds',JSON.stringify(OherSportClosedEventIds),'EX',24 * 60 * 60)
                }
                if(await client.get('crone_OtherSportInactiveEventIds')){
                    let InacliveOldEventId = await client.get('crone_OtherSportInactiveEventIds') 
                    InacliveOldEventId = JSON.parse(InacliveOldEventId)
                    await client.set('crone_OtherSportInactiveEventIds',JSON.stringify(OherSportinActivedEventIds.concat(InacliveOldEventId)))
                }else{
                    await client.set('crone_OtherSportInactiveEventIds',JSON.stringify(OherSportinActivedEventIds),'EX',24 * 60 * 60)
                }
                await client.set(`crone_getEventIds_OtherSport_UPD`,JSON.stringify(eventIds))
                // console.log(new Date(),(new Date().getTime() - starttime.getTime())/(1000),OtherSportLiveMarketIds,'Add Other sport MarketIds Cron Ended.....')    
            }catch(error){
                console.log(error,'Errorrr AddOtherLiveMarketCrone')
            }
        }, 1000 * 60)
    }
    // })
// }

module.exports =  addotherlivemarket