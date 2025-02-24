const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const setFinalResultFunc = async() => {
    let starttime = new Date();
    let newStatus = true
    console.log(starttime,'Set Final Result Cron Started.....')
    try{
        let eventlist = await client.get('crone_getEvent_list')
        eventlist = JSON.parse(eventlist)

        async function eventfunction(start, end) {
            let startFunctionTime = new Date()
    console.log(startFunctionTime,'Final Function Start')
        let livemarketIds = []
        let cricketlivemarketIds = []
        let cricketEventIds = []
        let otherSportEventIds = []
        let cricketLiveEventIds = []
        let otherSportLiveEventIds = []
        let cricketEventList = []
        let otherSportEventList = []
        
        console.log(eventlist.length,'Event list length')
        for(let k = start;k<end;k++){
            console.log(k,new Date(),'kkk')
            let matchodds = eventlist[k].catalogues?.find(item => item.marketName == 'Match Odds')
            let isLiveEvent = false
            let matchOddsArr = [];
            let bookMakerMarketArr = [];
            let fanctMarketArr = [];
            if(matchodds){
                if(matchodds.inPlay == true && matchodds.status !== 'CLOSED'){
                    isLiveEvent = true
                    
                }
            }else{
                let bookmaker = eventlist[k].catalogues?.find(item => item.marketName == 'Bookmaker 0 Commission') 
                if(bookmaker){
                    if(bookmaker.inPlay == true && bookmaker.status !== 'CLOSED'){
                        isLiveEvent = true
                    }
                }
            }

           

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
            eventlist[k].status = isLiveEvent?'IN_PLAY':'UPCOMING'

            delete eventlist[k]['eventType']
            delete eventlist[k]['competition']
            delete eventlist[k]['event']
            delete eventlist[k]['metadata']

            if(eventlist[k].sportId == 4){
                if(isLiveEvent == true){
                    cricketLiveEventIds.push(eventlist[k].eventId)
                }else{
                    cricketEventIds.push(eventlist[k].eventId)
                }
            }else{
                if(isLiveEvent == true){
                    otherSportLiveEventIds.push(eventlist[k].eventId)
                }else{
                    otherSportEventIds.push(eventlist[k].eventId)
                }
            }

            for(let l = 0;l<eventlist[k].catalogues.length;l++){
                if(isLiveEvent){
                    if(eventlist[k].sportId == 4){
                        if(eventlist[k].catalogues[l].bettingType !== 'LINE'){
                            cricketlivemarketIds.push(eventlist[k].catalogues[l].marketId)
                        }
                    }else{
                        livemarketIds.push(eventlist[k].catalogues[l].marketId)
                    }
                }
                if(eventlist[k].catalogues[l].marketType == "MATCH_ODDS"){
                    matchOddsArr.push(eventlist[k].catalogues[l])
                }else if(eventlist[k].catalogues[l].marketType == "BOOKMAKER"){
                    bookMakerMarketArr.push(eventlist[k].catalogues[l])
                // }else if(eventlist[k].catalogues[l].bettingType == "LINE" || eventlist[k].catalogues[l].marketType == "WINNING_ODDS"){
                }else if(eventlist[k].catalogues[l].bettingType == "LINE"){
                    eventlist[k].catalogues[l].category = eventlist[k].catalogues[l].marketType
                    fanctMarketArr.push(eventlist[k].catalogues[l])
                }
                let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${eventlist[k].catalogues[l].marketId}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                let fetchMarketDatajson = await fetchMarketData.json()
                if(fetchMarketDatajson[eventlist[k].catalogues[l].marketId]){
                    // if(eventlist[k].catalogues[l].bettingType == "LINE" || eventlist[k].catalogues[l].marketType == "WINNING_ODDS"){
                    if(eventlist[k].catalogues[l].bettingType == "LINE"){
                        if(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].status !== "CLOSED" && fetchMarketDatajson[eventlist[k].catalogues[l].marketId].status !== "INACTIVE"){
                            delete eventlist[k].catalogues[l].marketType
                            for(let i = 0;i<eventlist[k].catalogues[l].runners.length;i++){
                                let runner = fetchMarketDatajson[eventlist[k].catalogues[l].marketId].runners.find(item => (item.selectionId == eventlist[k].catalogues[l].runners[i].id && item.status == "ACTIVE"))
                                // console.log(runner,'runners')
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
                                    if(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].sportingEvent == true){
                                        eventlist[k].catalogues[l].status = "BALL_RUNNING"
                                    }
                                    delete eventlist[k].catalogues[l].runners
                                    break
                                }
                            }
                        }else{
                            delete eventlist[k].catalogues[l]
                        }
                    }else{
                        for(let i = 0;i<eventlist[k].catalogues[l].runners.length;i++){
                            let runner = fetchMarketDatajson[eventlist[k].catalogues[l].marketId].runners.find(item => item.selectionId == eventlist[k].catalogues[l].runners[i].id)
                            if(fetchMarketDatajson[eventlist[k].catalogues[l].marketId].sportingEvent == true){
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
                                delete eventlist[k].catalogues[l].runners[i].metadata
                                delete eventlist[k].catalogues[l].runners[i].name
                                delete eventlist[k].catalogues[l].runners[i].id
                            }
                        }
                    }
                }else{
                    if(eventlist[k].catalogues[l].bettingType == "LINE"){
                        if(eventlist[k].catalogues[l].status !== 'CLOSED' && eventlist[k].catalogues[l].status !== 'INACTIVE'){
                            delete eventlist[k].catalogues[l].marketType
                            eventlist[k].catalogues[l].noValue = "0"
                            eventlist[k].catalogues[l].noRate = "0"
                            eventlist[k].catalogues[l].yesValue = "0"
                            eventlist[k].catalogues[l].yesRate = "0"
                            delete eventlist[k].catalogues[l].runners
                        }else{
                            delete eventlist[k].catalogues[l]
                        }
                    }else{
                        for(let i = 0;i<eventlist[k].catalogues[l].runners.length;i++){
                            eventlist[k].catalogues[l].runners[i].runnerName = eventlist[k].catalogues[l].runners[i].name
                            eventlist[k].catalogues[l].runners[i].runnerId = eventlist[k].catalogues[l].runners[i].id
                            eventlist[k].catalogues[l].runners[i].layPrices = []
                            eventlist[k].catalogues[l].runners[i].backPrices = []
                            delete eventlist[k].catalogues[l].runners[i].metadata
                            delete eventlist[k].catalogues[l].runners[i].name
                            delete eventlist[k].catalogues[l].runners[i].id
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
            if(eventlist[k].sportId == 4){
                cricketEventList.push(eventlist[k])
            }else{
                otherSportEventList.push(eventlist[k])
            }

            // let findIndexArr = eventlist.findIndex(item => item.eventId == eventlist[k].eventId)
            // if(findIndexArr >-1){
            //     eventlist[findIndexArr] = {}
            // }

        }
        if(newStatus){
            await client.set('crone_getEvent_list_Cricket_TEMP',JSON.stringify(cricketEventList)); // Final List
            await client.set('crone_getEvent_list_OtherSport_TEMP',JSON.stringify(otherSportEventList)); // Final List
            await client.set('crone_liveMarketIds_TEMP',JSON.stringify(livemarketIds)); // Other Sport Live Market Ids 
            await client.set('crone_CricketliveMarketIds_TEMP',JSON.stringify(cricketlivemarketIds));  // Cricket Live Market Ids 
            await client.set('crone_getEventIds_Cricket_TEMP',JSON.stringify(cricketEventIds));  // Cricket Event Ids 
            await client.set('crone_getEventIds_OtherSport_TEMP',JSON.stringify(otherSportEventIds)); // Oher Sport Event Ids 
            await client.set('crone_CricketliveEventIds_TEMP',JSON.stringify(cricketLiveEventIds)); // Cricket Live Event Ids 
            await client.set('crone_OtherSportLiveEventIds_TEMP',JSON.stringify(otherSportLiveEventIds)); // Other Sport Live Event Ids
            console.log(new Date(),(new Date().getTime() - starttime.getTime())/(1000 * 60),eventlist.length,'Set Final Result Cron Ended.....')    
            newStatus = false
        }else{
            // Final List Cricket
            let crone_getEvent_list_Cricket_TEMP = await client.get('crone_getEvent_list_Cricket_TEMP')
            if(crone_getEvent_list_Cricket_TEMP){
                crone_getEvent_list_Cricket_TEMP  = JSON.parse(crone_getEvent_list_Cricket_TEMP)
                let saveData = crone_getEvent_list_Cricket_TEMP.concat(cricketEventList)
                await client.set('crone_getEvent_list_Cricket_TEMP',JSON.stringify(saveData))
            }else{
                await client.set('crone_getEvent_list_Cricket_TEMP',JSON.stringify(cricketEventList));
            }

            // Final List Other
            let crone_getEvent_list_OtherSport_TEMP = await client.get('crone_getEvent_list_OtherSport_TEMP')
            if(crone_getEvent_list_OtherSport_TEMP){
                crone_getEvent_list_OtherSport_TEMP  = JSON.parse(crone_getEvent_list_OtherSport_TEMP)
                let saveData = crone_getEvent_list_OtherSport_TEMP.concat(otherSportEventList)
                await client.set('crone_getEvent_list_OtherSport_TEMP',JSON.stringify(saveData))
            }else{
                await client.set('crone_getEvent_list_OtherSport_TEMP',JSON.stringify(otherSportEventList));
            }

            //Other Sport Live Market Ids
            let crone_liveMarketIds_TEMP = await client.get('crone_liveMarketIds_TEMP')
            if(crone_liveMarketIds_TEMP){
                crone_liveMarketIds_TEMP  = JSON.parse(crone_liveMarketIds_TEMP)
                let saveData = crone_liveMarketIds_TEMP.concat(livemarketIds)
                await client.set('crone_liveMarketIds_TEMP',JSON.stringify(saveData))
            }else{
                await client.set('crone_liveMarketIds_TEMP',JSON.stringify(livemarketIds));
            }

            //Cricket Live Market Ids
            let crone_CricketliveMarketIds_TEMP = await client.get('crone_CricketliveMarketIds_TEMP')
            if(crone_CricketliveMarketIds_TEMP){
                crone_CricketliveMarketIds_TEMP  = JSON.parse(crone_CricketliveMarketIds_TEMP)
                let saveData = crone_CricketliveMarketIds_TEMP.concat(cricketlivemarketIds)
                await client.set('crone_CricketliveMarketIds_TEMP',JSON.stringify(saveData))
            }else{
                await client.set('crone_CricketliveMarketIds_TEMP',JSON.stringify(cricketlivemarketIds));
            }

            //Cricket Event Ids
            let crone_getEventIds_Cricket_TEMP = await client.get('crone_getEventIds_Cricket_TEMP')
            if(crone_getEventIds_Cricket_TEMP){
                crone_getEventIds_Cricket_TEMP  = JSON.parse(crone_getEventIds_Cricket_TEMP)
                let saveData = crone_getEventIds_Cricket_TEMP.concat(cricketEventIds)
                await client.set('crone_getEventIds_Cricket_TEMP',JSON.stringify(saveData))
            }else{
                await client.set('crone_getEventIds_Cricket_TEMP',JSON.stringify(cricketEventIds));
            }

            //Oher Sport Event Ids
            let crone_getEventIds_OtherSport_TEMP = await client.get('crone_getEventIds_OtherSport_TEMP')
            if(crone_getEventIds_OtherSport_TEMP){
                crone_getEventIds_OtherSport_TEMP  = JSON.parse(crone_getEventIds_OtherSport_TEMP)
                let saveData = crone_getEventIds_OtherSport_TEMP.concat(otherSportEventIds)
                await client.set('crone_getEventIds_OtherSport_TEMP',JSON.stringify(saveData))
            }else{
                await client.set('crone_getEventIds_OtherSport_TEMP',JSON.stringify(otherSportEventIds));
            }

            //Cricket Live Event Ids
            let crone_CricketliveEventIds_TEMP = await client.get('crone_CricketliveEventIds_TEMP')
            if(crone_CricketliveEventIds_TEMP){
                crone_CricketliveEventIds_TEMP  = JSON.parse(crone_CricketliveEventIds_TEMP)
                let saveData = crone_CricketliveEventIds_TEMP.concat(cricketLiveEventIds)
                await client.set('crone_CricketliveEventIds_TEMP',JSON.stringify(saveData))
            }else{
                await client.set('crone_CricketliveEventIds_TEMP',JSON.stringify(cricketLiveEventIds));
            }

            //Other Sport Live Event Ids
            let crone_OtherSportLiveEventIds_TEMP = await client.get('crone_OtherSportLiveEventIds_TEMP')
            if(crone_OtherSportLiveEventIds_TEMP){
                crone_OtherSportLiveEventIds_TEMP  = JSON.parse(crone_OtherSportLiveEventIds_TEMP)
                let saveData = crone_OtherSportLiveEventIds_TEMP.concat(otherSportLiveEventIds)
                await client.set('crone_OtherSportLiveEventIds_TEMP',JSON.stringify(saveData))
            }else{
                await client.set('crone_OtherSportLiveEventIds_TEMP',JSON.stringify(otherSportLiveEventIds));
            }
        }

        if(end == eventlist.length){
            console.log('got here end 12345678987r');
            
            let crone_getEvent_list_Cricket_TEMP = await client.get('crone_getEvent_list_Cricket_TEMP')
            if(crone_getEvent_list_Cricket_TEMP){
                await client.set('crone_getEvent_list_Cricket',crone_getEvent_list_Cricket_TEMP)
            }

            // Final List Other
            let crone_getEvent_list_OtherSport_TEMP = await client.get('crone_getEvent_list_OtherSport_TEMP')
            if(crone_getEvent_list_OtherSport_TEMP){
                await client.set('crone_getEvent_list_OtherSport',crone_getEvent_list_OtherSport_TEMP)
            }

            //Other Sport Live Market Ids
            let crone_liveMarketIds_TEMP = await client.get('crone_liveMarketIds_TEMP')
            if(crone_liveMarketIds_TEMP){
                await client.set('crone_liveMarketIds',crone_liveMarketIds_TEMP)
            }

            //Cricket Live Market Ids
            let crone_CricketliveMarketIds_TEMP = await client.get('crone_CricketliveMarketIds_TEMP')
            if(crone_CricketliveMarketIds_TEMP){
                await client.set('crone_CricketliveMarketIds',crone_CricketliveMarketIds_TEMP)
            }

            //Cricket Event Ids
            let crone_getEventIds_Cricket_TEMP = await client.get('crone_getEventIds_Cricket_TEMP')
            if(crone_getEventIds_Cricket_TEMP){
                await client.set('crone_getEventIds_Cricket',crone_getEventIds_Cricket_TEMP)
            }

            //Oher Sport Event Ids
            let crone_getEventIds_OtherSport_TEMP = await client.get('crone_getEventIds_OtherSport_TEMP')
            if(crone_getEventIds_OtherSport_TEMP){
                await client.set('crone_getEventIds_OtherSport',crone_getEventIds_OtherSport_TEMP)
            }

            //Cricket Live Event Ids
            let crone_CricketliveEventIds_TEMP = await client.get('crone_CricketliveEventIds_TEMP')
            if(crone_CricketliveEventIds_TEMP){
                await client.set('crone_CricketliveEventIds',crone_CricketliveEventIds_TEMP)
            }

            //Other Sport Live Event Ids
            let crone_OtherSportLiveEventIds_TEMP = await client.get('crone_OtherSportLiveEventIds_TEMP')
            if(crone_OtherSportLiveEventIds_TEMP){
                await client.set('crone_OtherSportLiveEventIds',crone_OtherSportLiveEventIds_TEMP)
            }

        }

        console.log(new Date(),(new Date().getTime() - startFunctionTime.getTime())/(1000 * 60),eventlist.length,'final Function End....')    
        }

        if(eventlist.length <= 100){
            eventfunction(0, 100)
        }else{
            eventfunction(0, 100)
            const totalBatches = Math.ceil(eventlist.length / 100);
            for (let i = 1; i < totalBatches; i++) {
                setTimeout(() => {
                    let start = 100 * i
                    let end = Math.min(((100 * i) + 100), eventlist.length)
                    eventfunction(start, end)

                }, 2 * 60 * 1000 * i);
            }
        }

        
    }catch(error){
        console.log(error,'Errorrr')
    }

}

module.exports = setFinalResultFunc

