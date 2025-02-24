const redis = require('redis');
const getEventListFun = require('./geteventlist')
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In seteventIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});



const geteventIdArrFunc = async(sportName) => {
    function isUpcomingEvent(date) {
        // Get today's date without the time
        let today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        today.setUTCDate(today.getUTCDate() - 1);
        today.setUTCHours(0, 0, 0, 0);  // Set today's time to 00:00:00.000 
        today.toISOString()  // Set today's time to 00:00:00.000 
        let eventDate = new Date(new Date(date).getTime() + (5.5 * 60 * 60 * 1000));
        eventDate.setUTCHours(0, 0, 0, 0); // Remove time for accurate comparison 
        eventDate.toISOString()
        // eventDate = new Date(eventDate.getTime() + (5.5 * 60 *60 * 1000))  
        // Check if the given date falls within today's range
        // console.log(today,date,eventDate,eventDate >= today,'is upcoming event')
        // console.log(date,today,eventDate,eventDate.getTime() >= today.getTime())
        return eventDate.getTime() >= today.getTime();
        // return true
    }
    function isLastFiveDayEvent(date) {
        // Get today's date without the time
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);  // Set today's time to 00:00:00.000 
        today.toISOString()  // Set today's time to 00:00:00.000 
        let eventDate = new Date(date);
        eventDate.setUTCHours(0, 0, 0, 0); // Remove time for accurate comparison 
        eventDate.toISOString()
        // Check if the given date falls within today's range
        // console.log(today,eventDate,today.getTime(),eventDate.getTime(),eventDate.getTime() === today.getTime(),'is todays event')
        return eventDate.getTime() === today.getTime();

        // return true
    }
    function isDateWithinLast5Days(inputDate) {
        // Get the current date in UTC
        const currentDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    
        // Calculate the date 5 days ago in UTC
        const fiveDaysAgo = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        fiveDaysAgo.setUTCDate(currentDate.getUTCDate() - 5);
        fiveDaysAgo.setUTCHours(0, 0, 0, 0);  // Set today's time to 00:00:00.000 
        fiveDaysAgo.toISOString()
    
        // Convert the inputDate (ISO format) to a Date object
        const dateToCheck = new Date(new Date(inputDate).getTime() + (5.5 * 60 * 60 * 1000));
        dateToCheck.setUTCHours(0, 0, 0, 0); // Remove time for accurate comparison 
        dateToCheck.toISOString()
    
        // Check if the date is between the current date and five days ago
        // console.log(dateToCheck >= fiveDaysAgo && dateToCheck <= currentDate,'condition in istest 5 day')
        return dateToCheck >= fiveDaysAgo && dateToCheck <= currentDate;
    }
    async function fetchEventDataFunc(eventId) {
        let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${eventId}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        fetchMarketData = await fetchMarketData.json()
        return fetchMarketData
    }
    async function fetchCompetitionDataFunc(compId) {
        let fetchEventData = await fetch(`http://18.171.69.133:6008/sports/competitions/${compId}`,{ 
            method:'GET',
            headers:{
                'Content-type' : 'application/json'
            }
        })
        fetchEventData = await fetchEventData.json()
        return fetchEventData
    }
    try{
        async function geteventFunc () {
            let startdate = new Date();
            console.log(startdate,'EventIds Get Func Started')
            let eventIdsArr = [];
            let compIdUpcoming = []
            let compIds = await client.get(`crone_getCompIds_${sportName}`)
            compIds = JSON.parse(compIds)
            console.log(compIds.length,`length of ${sportName} comp ids`)
            function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            for(let i = 0;i<compIds.length;i++){
                let isTestMatch = false
                let isElection = false
                let fetchEventData;
                try{
                    fetchEventData = await fetchCompetitionDataFunc(compIds[i])
                }catch(error){
                    await delay(1000 * 30)
                    fetchEventData = await fetchCompetitionDataFunc(compIds[i])
                }
                if(fetchEventData.competition.name.toLowerCase().indexOf("test") !== -1 || fetchEventData.competition.name.toLowerCase().indexOf("ranji trophy") !== -1 || fetchEventData.competition.name.toLowerCase().indexOf("west indies championship") !== -1){
                    isTestMatch = true
                    console.log(fetchEventData.competition.name,'competetion name')
                }else{
                    if(fetchEventData.eventType.id == 500){
                        isElection = true
                    }
                }
                let isUpcomingComp = false
                for(let k = 0;k<fetchEventData.events.length;k++){
                    // if(fetchEventData.events[k].id == "33915801"){
                        // }
                    // console.log(fetchEventData.events[k].id,'fetchEventData.events[k].id')
                    if(isTestMatch){
                        if(isDateWithinLast5Days(fetchEventData.events[k].openDate)){
                            let fetchMarketData;
                            try{
                                fetchMarketData = await fetchEventDataFunc(fetchEventData.events[k].id)
                            }catch(error){
                                await delay(1000 * 30)
                                fetchMarketData = await fetchEventDataFunc(fetchEventData.events[k].id)
                            }
                            await delay(1000)
                            let matchodds = fetchMarketData.catalogues.find(item => item.marketName.trim() == "Match Odds")
                            if(matchodds && (matchodds.status !== 'CLOSED')){
                                eventIdsArr.push(fetchEventData.events[k].id)
                            }else{
                                let bookmaker = fetchMarketData.catalogues.find(item => item.marketName.trim() == "Bookmaker")
                                if(!bookmaker){
                                    bookmaker = fetchMarketData.catalogues.find(item => item.marketName.trim() == "Bookmaker 0 Commission")
                                }
                                if(bookmaker && (bookmaker.status !== 'CLOSED')){
                                    eventIdsArr.push(fetchEventData.events[k].id)
                                }
                            }
                        }
                    }else if(isElection){
                        eventIdsArr.push(fetchEventData.events[k].id)
                    }else if(fetchEventData.events[k].name.trim() == fetchEventData.competition.name.trim()){
                        let fetchMarketData;
                        try{
                            fetchMarketData = await fetchEventDataFunc(fetchEventData.events[k].id)
                        }catch(error){
                            await delay(1000 * 30)
                            fetchMarketData = await fetchEventDataFunc(fetchEventData.events[k].id)
                        }
                        await delay(1000)
                        let winner = fetchMarketData.catalogues.find(item => item.marketType == "TOURNAMENT_WINNER")
                        if(winner && (winner.status !== 'CLOSED')){
                            eventIdsArr.push(fetchEventData.events[k].id)
                        }
                    }
                    else if(isUpcomingEvent(fetchEventData.events[k].openDate)){
                        eventIdsArr.push(fetchEventData.events[k].id)
                        if(["7","4339"].includes(fetchEventData.eventType.id) && isUpcomingComp == false){
                            isUpcomingComp = true
                        }
                    }
                }
                if(isUpcomingComp){
                    compIdUpcoming.push(compIds[i])
                }
                
            }       
            if(sportName == "GreyHound" || sportName == "HorseRacing"){
                client.set(`crone_getCompIds_HRGH_Upcoming_${sportName}`,JSON.stringify(compIdUpcoming))
            }
            await client.set(`crone_getEventIds_${sportName}`,JSON.stringify(eventIdsArr));
            console.log(new Date(),(new Date().getTime() - startdate.getTime())/(1000 * 60),eventIdsArr,`Set ${sportName} EventIds Cron Ended.....`)    
            await getEventListFun(sportName)
        }
        await geteventFunc()
    }catch(error){
        console.log('outer catch block')
        await geteventIdArrFunc(sportName)
    }
}

module.exports = geteventIdArrFunc

