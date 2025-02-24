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
    // cron.schedule('00 * * * * *', async() => {
    const addcricketlivemarketCrone = async () => {
        setInterval(async() => {
            let starttime = new Date();
            // console.log(starttime,'Add Live Market And Live Event Cricket Cron Started.....')
            try{
                let cricketClosedEvent = []
                let marketIdsArr = [];
                let liveEventInCricket = [];
                let CricketinActivedEventIds = [];
                let newEventAdded = false
                let newEventIdsArray = []
                let eventIds = await client.get('crone_getEventIds_Cricket');
                let CricketLiveEventIds = await client.get('crone_CricketliveEventIds_UPD');
                CricketLiveEventIds = JSON.parse(CricketLiveEventIds)
                eventIds = JSON.parse(eventIds)
                await client.set('crone_CricketClosedEventIds',JSON.stringify([]))
                await client.set('crone_CricketSportInactiveEventIds',JSON.stringify([]))
                let cricketclosedEventIds = await client.get('crone_CricketClosedEventIds')
                let cricketinActiveEventIds = await client.get('crone_CricketSportInactiveEventIds')
                if(closedeventIds){
                    cricketclosedEventIds = JSON.parse(cricketclosedEventIds)
                    eventIds = eventIds.filter(item => !cricketclosedEventIds.includes(item))
                }
                if(cricketinActiveEventIds){
                    cricketinActiveEventIds = JSON.parse(cricketinActiveEventIds)
                    eventIds = eventIds.filter(item => !cricketinActiveEventIds.includes(item))
                }
                console.log(eventIds.length,'eventIdssssssssssss1111111')
                // Get Event Details By Sport Id 
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                for(let i = 0;i<eventIds.length;i++){
                    let MOBMMarketArr = []
                    let CricketClosedMarketIds = [];
                    let CricketInactiveMarketIds = [];
                    let isLiveStatus = false
                    let isClosedEvent = false;
                    let liveMatchCheckMarket
                    let liveMatchCheckMarket2;
                    let liveMatchCheckMarket4;
                    let eventODDSBMMarketIds = []
                    let starttime = Date.now()
                    let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[i]}`,{
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
                    console.log(Date.now() - starttime,'time to respond')
                    await delay(1000 * 30);
                    console.log(Date.now() - starttime,'600ms delay')
                    liveMatchCheckMarket = fetchMarketData.catalogues.find(item => item.marketName == 'Match Odds')
                    liveMatchCheckMarket2 = fetchMarketData.catalogues.find(item => item.marketName == 'Bookmaker')
                    if(!liveMatchCheckMarket2){
                        liveMatchCheckMarket2 = fetchMarketData.catalogues.find(item => item.marketName == "Bookmaker 0 Commission")
                    }
                    liveMatchCheckMarket4 = fetchMarketData.catalogues.find(item => item.marketType == 'TOURNAMENT_WINNER')


                  

                    if(liveMatchCheckMarket4){
                        if((liveMatchCheckMarket4.inPlay == true) && (liveMatchCheckMarket4.status == 'OPEN')){
                            if(!CricketLiveEventIds.includes(eventIds[i])){
                                newEventAdded = true
                                newEventIdsArray.push(eventIds[i])
                            }
                            liveEventInCricket.push(eventIds[i])
                            isLiveStatus = true
                            for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                    marketIdsArr.push(fetchMarketData.catalogues[k].marketId)
                                }
                            }
                        }else{
                            if(liveMatchCheckMarket4.status == 'CLOSED'){
                                cricketClosedEvent.push(eventIds[i])
                                isClosedEvent = true
                            }else if(liveMatchCheckMarket4.status == 'INACTIVE'){
                                CricketinActivedEventIds.push(eventIds[i])
                            }
                        }
                    }
                    else if(liveMatchCheckMarket && liveMatchCheckMarket2){
                        if((liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED') || (liveMatchCheckMarket2.inPlay == true &&liveMatchCheckMarket2.status !== 'CLOSED')){
                            if(!CricketLiveEventIds.includes(eventIds[i])){
                                newEventAdded = true
                                newEventIdsArray.push(eventIds[i])
                            }
                            liveEventInCricket.push(eventIds[i])
                            isLiveStatus = true
                            for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                    marketIdsArr.push(fetchMarketData.catalogues[k].marketId)
                                }
                            }
                            // if(liveMatchCheckMarket.status == 'CLOSED'){
                            //     isClosedEvent = true
                            //     cricketClosedEvent.push(eventIds[i])
                            // }
                        }else{
                            if(liveMatchCheckMarket.status == 'CLOSED'){
                                isClosedEvent = true
                                cricketClosedEvent.push(eventIds[i])
                            }
                        }
                    }else if(liveMatchCheckMarket && !liveMatchCheckMarket2){
                        if(liveMatchCheckMarket.inPlay == true && liveMatchCheckMarket.status !== 'CLOSED'){
                            if(!CricketLiveEventIds.includes(eventIds[i])){
                                newEventAdded = true
                                newEventIdsArray.push(eventIds[i])
                            }
                            liveEventInCricket.push(eventIds[i])
                            isLiveStatus = true
                            for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                    marketIdsArr.push(fetchMarketData.catalogues[k].marketId)
                                }
                            }
                            // if(liveMatchCheckMarket.status == 'CLOSED'){
                            //     isClosedEvent = true
                            //     cricketClosedEvent.push(eventIds[i])
                            // }
                        }else{
                            if(liveMatchCheckMarket.status == 'CLOSED'){
                                isClosedEvent = true
                                cricketClosedEvent.push(eventIds[i])
                            }
                        }
                    }else if(!liveMatchCheckMarket && liveMatchCheckMarket2){
                        if(liveMatchCheckMarket2.inPlay == true && liveMatchCheckMarket2.status !== 'CLOSED'){
                            if(!CricketLiveEventIds.includes(eventIds[i])){
                                newEventAdded = true
                                newEventIdsArray.push(eventIds[i])
                            }
                            liveEventInCricket.push(eventIds[i])
                            isLiveStatus = true
                            for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                    marketIdsArr.push(fetchMarketData.catalogues[k].marketId)
                                }
                            }
                            // if(liveMatchCheckMarket2.status == 'CLOSED'){
                            //     isClosedEvent = true
                            //     cricketClosedEvent.push(eventIds[i])
                            // }
                        }else{
                            if(liveMatchCheckMarket2.status == 'CLOSED'){
                                isClosedEvent = true
                                cricketClosedEvent.push(eventIds[i])
                            }
                        }
                    }
                    if(fetchMarketData.catalogues.length == 0){
                        cricketClosedEvent.push(eventIds[i])
                    }

                    // Update Market Show Or Not Show Other than LINE Market
                    
                    let eventStatus = isLiveStatus == true?'IN_PLAY':'UPCOMING'
                    let eventData = await client.get(`${eventIds[i]}_sharEventData`)
                    eventData = JSON.parse(eventData)
                    eventData.status = eventStatus
                    let mobmmarkets = fetchMarketData.catalogues.filter(item => item.bettingType !== "LINE")
                    for(let j = 0;j<mobmmarkets.length;j++){
                        if(mobmmarkets[j].status == "CLOSED"){
                            CricketClosedMarketIds.push(mobmmarkets[j].marketId)
                        }else if(mobmmarkets[j].status == "INACTIVE"){
                            CricketInactiveMarketIds.push(mobmmarkets[j].marketId)
                        }else if(mobmmarkets[j].status == "OPEN"){
                            marketIdsArr.push(mobmmarkets[j].marketId)
                        }
                    }
                    let closeinActiveMarketIds = CricketClosedMarketIds.concat(CricketInactiveMarketIds)
                    // let closeinActiveMarketIds = CricketClosedMarketIds
                    let openmatchoddsMarket = eventData.markets.matchOdds.filter(item => !closeinActiveMarketIds.includes(item.marketId))
                    let openbookMakerMarket = eventData.markets.bookmakers.filter(item => !closeinActiveMarketIds.includes(item.marketId))
                    eventData.markets.matchOdds = openmatchoddsMarket;
                    eventData.markets.bookmakers = openbookMakerMarket;
                    if(!isLiveStatus){
                        await client.set(`${eventIds[i]}_shark`,JSON.stringify(eventData.markets.fancyMarkets))
                    }
                    await client.set(`${eventIds[i]}_sharEventData`,JSON.stringify(eventData))
                }       
                if(newEventAdded){
                    await client.set('isNewLiveEventAdded',JSON.stringify(true))
                    await client.set('isNewLiveEventAddedForFancy',JSON.stringify(true))
                    await client.set('newEventIds_Cricket',JSON.stringify(newEventIdsArray))
                    await setNewAddedEvent(newEventIdsArray)
                }
                    
                await client.set('crone_CricketliveEventIds_UPD',JSON.stringify(liveEventInCricket));
                await client.set('crone_getEventIds_Cricket_UPD',JSON.stringify(eventIds));
                await client.set('crone_CricketliveMarketIds_UPD',JSON.stringify(marketIdsArr));
                if(await client.get('crone_CricketClosedEventIds')){
                    let closedOldEventId = await client.get('crone_CricketClosedEventIds') 
                    closedOldEventId = JSON.parse(closedOldEventId)
                    await client.set('crone_CricketClosedEventIds',JSON.stringify(cricketClosedEvent.concat(closedOldEventId)))
                }else{
                    await client.set('crone_CricketClosedEventIds',JSON.stringify(cricketClosedEvent),'EX',24 * 60 * 60)
                }
                if(await client.get('crone_CricketSportInactiveEventIds')){
                    let inActiveOldEventId = await client.get('crone_CricketSportInactiveEventIds') 
                    inActiveOldEventId = JSON.parse(inActiveOldEventId)
                    await client.set('crone_CricketSportInactiveEventIds',JSON.stringify(CricketinActivedEventIds.concat(inActiveOldEventId)))
                }else{
                    await client.set('crone_CricketSportInactiveEventIds',JSON.stringify(CricketinActivedEventIds),'EX',24 * 60 * 60)
                }
                // console.log(await client.get('crone_CricketClosedEventIds') );
                
                // client.set('crone_getEvent_list_v2',JSON.stringify(finalResutl));
                // console.log(new Date(),(new Date().getTime() - starttime.getTime())/(1000*60),liveEventInCricket,marketIdsArr.length,'Add Live Market And Live Event Cricket Cron Ended.....')    
            }catch(error){
                console.log(error,'Errorrr')
            }
        }, 1000 * 60)
    }
    // })
// }

module.exports = addcricketlivemarketCrone