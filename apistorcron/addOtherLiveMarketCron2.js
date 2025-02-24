const cron = require('node-cron');
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


module.exports = () => {
    cron.schedule('*/3 * * * * *', async() => {
        let starttime = new Date();
        // console.log(starttime,'Add Other sport MarketIds Cron Started.....')
        try{
            let OtherSportLiveMarketIds = [];
            let OtherSportLiveEventIds = [];
            let OherSportClosedEventIds = [];
            let isLiveStatus = false
            let isCloseEvent = false
            let eventIds = await client.get('crone_getEventIds_OtherSport');
            eventIds = JSON.parse(eventIds)
            if(await client.get('crone_OtherSportClosedEventIds')){
                let closedeventids = await client.get('crone_OtherSportClosedEventIds')
                closedeventids = JSON.parse(closedeventids)
                eventIds = eventIds.filter(item => !closedeventids.includes(item))
            }
            
            // console.log(eventIds,'eventIds')
            // Get Event Details By Sport Id 
            for(let i = 0;i<eventIds.length;i++){
                let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${eventIds[i]}`,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                fetchMarketData = await fetchMarketData.json()
                // console.log(fetchEventData.events.length,'event length')
                let matchodds = fetchMarketData.catalogues.find(item => item.marketName == 'Match Odds')
                if(matchodds){
                    if(matchodds.inPlay == true && matchodds.status !== 'CLOSED'){
                        OtherSportLiveEventIds.push(eventIds[i])
                        for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                            if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                OtherSportLiveMarketIds.push(fetchMarketData.catalogues[k].marketId)
                                isLiveStatus = true
                            }
                        }
                    }else{
                        if(matchodds.status == 'CLOSED'){
                            OherSportClosedEventIds.push(eventIds[i])
                            isCloseEvent = true
                        }
                    }
                }else{
                    let bookmaker = fetchMarketData.catalogues.find(item => item.marketName == 'Bookmaker 0 Commission')
                    if(bookmaker){
                        if(bookmaker.inPlay == true && bookmaker.status !== 'CLOSED'){
                            OtherSportLiveEventIds.push(eventIds[i])
                            for(let k = 0;k<fetchMarketData.catalogues.length;k++){
                                if(fetchMarketData.catalogues[k].bettingType !== "LINE"){
                                    OtherSportLiveMarketIds.push(fetchMarketData.catalogues[k].marketId)
                                    isLiveStatus = true
                                }
                            }
                        }
                    }
                }
                fetchMarketData.status = isLiveStatus?'IN_PLAY':'UPCOMING'
                let finalResutl = await client.get(`${eventIds[i]}_sharkEventId`)
                finalResutl = JSON.parse(finalResutl)
                let index = finalResutl.findIndex(item => item.eventId == eventIds[i]);  // Find the index of element 3
                if (index !== -1) {
                    if(!isCloseEvent){
                        finalResutl[index] = fetchMarketData;  // Replace the element at the found index
                    }else{
                        finalResutl.splice(index,1)
                    }
                }
                await client.set('crone_getEvent_list_OtherSport_UPD',JSON.stringify(finalResutl))
            }       
            await client.set('crone_liveMarketIds_UPD',JSON.stringify(OtherSportLiveMarketIds));
            await client.set('crone_OtherSportLiveEventIds_UPD',JSON.stringify(OtherSportLiveEventIds));
            await client.set('crone_OtherSportClosedEventIds',JSON.stringify(OherSportClosedEventIds))
            // console.log(new Date(),(new Date().getTime() - starttime.getTime())/(1000*60),otherSportLiveEventIds,'Add Other sport MarketIds Cron Ended.....')    
        }catch(error){
            console.log(error,'Errorrr addOtherLiveMarketCrone2')
        }
    })
}