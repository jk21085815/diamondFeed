const cron = require('node-cron');
const setFinalResult = require('./setFinalResult');
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setcompIdCrone.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});

const getEventList = async(sportId,sportName) => {

    function isUpcomingEvent(date) {
        let today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        today.setUTCDate(today.getUTCDate() - 1);
        today.setUTCHours(0, 0, 0, 0);
        today.toISOString() 
        let eventDate = new Date(new Date(date).getTime() + (5.5 * 60 * 60 * 1000));
        eventDate.setUTCHours(0, 0, 0, 0);
        eventDate.toISOString()
        return eventDate.getTime() >= today.getTime();
    }
    function isDateWithinLast5Days(inputDate) {
        const currentDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        const fiveDaysAgo = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        fiveDaysAgo.setUTCDate(currentDate.getUTCDate() - 5);
        fiveDaysAgo.setUTCHours(0, 0, 0, 0);
        fiveDaysAgo.toISOString()
        const dateToCheck = new Date(new Date(inputDate).getTime() + (5.5 * 60 * 60 * 1000));
        dateToCheck.setUTCHours(0, 0, 0, 0);
        dateToCheck.toISOString()
        return dateToCheck >= fiveDaysAgo && dateToCheck <= currentDate;
    }
    // cron.schedule('00 */6 * * *', async() => {
    cron.schedule('*/30 * * * * *', async() => {
            console.log(`Set ${sportName} CompId Cron Started.....111111111111111111111111111111111111111111111111`)
            try{
                async function geteventListBySportId () {
                    let eventlist = []
                    let compIdUpcoming = []
                    let fetchEventList = await fetch(`http://13.42.165.216/betfair/get_latest_event_list/${sportId}`,{
                        method:'GET',
                        // headers:{
                            // 'Content-type' : 'application/text'
                        // }
                    })
                    fetchEventList = await fetchEventList.json()
                    fetchEventList = await JSON.parse(fetchEventList)
                    console.log(fetchEventList,'fetchEventListfetchEventList')
                    for(let j = 0;j<fetchEventList.length;j++){
                        let isTestMatch = false
                        let isElection = false
                        let eventdata = fetchEventList[j]
                        console.log(eventdata,'eventdataaaaaaaaaa')
                        if(eventdata.competition.name.toLowerCase().indexOf("test") !== -1 || eventdata.competition.name.toLowerCase().indexOf("ranji trophy") !== -1 || eventdata.competition.name.toLowerCase().indexOf("west indies championship") !== -1){
                            isTestMatch = true
                            console.log(eventdata.competition.name,'competetion name')
                        }else{
                            if(eventdata.eventType.id == 500){
                                isElection = true
                            }
                        }
                        let isUpcomingComp = false
                        if(isTestMatch){
                            if(isDateWithinLast5Days(eventdata.event.openDate)){
                                let fetchMarketData;
                                try{
                                    fetchMarketData = await fetchEventDataFunc(eventdata.event.id)
                                }catch(error){
                                    await delay(1000 * 30)
                                    fetchMarketData = await fetchEventDataFunc(eventdata.event.id)
                                }
                                await delay(1000)
                                let matchodds = fetchMarketData.catalogues.find(item => item.marketName.trim() == "Match Odds")
                                if(matchodds && (matchodds.status !== 'CLOSED')){
                                    eventlist.push(eventdata)
                                }
                                // else{
                                //     let bookmaker = fetchMarketData.catalogues.find(item => item.marketName.trim() == "Bookmaker")
                                //     if(!bookmaker){
                                //         bookmaker = fetchMarketData.catalogues.find(item => item.marketName.trim() == "Bookmaker 0 Commission")
                                //     }
                                //     if(bookmaker && (bookmaker.status !== 'CLOSED')){
                                //         eventlist.push(eventdata.event.id)
                                //     }
                                // }
                            }
                        }else if(isElection){
                            eventlist.push(eventdata)
                        }else if(eventdata.event.name.trim() == eventdata.event.competition.name.trim()){
                            let fetchMarketData;
                            try{
                                fetchMarketData = await fetchEventDataFunc(eventdata.event.id)
                            }catch(error){
                                await delay(1000 * 30)
                                fetchMarketData = await fetchEventDataFunc(eventdata.event.id)
                            }
                            await delay(1000)
                            let winner = fetchMarketData.catalogues.find(item => item.marketType == "TOURNAMENT_WINNER")
                            if(winner && (winner.status !== 'CLOSED')){
                                eventlist.push(eventdata)
                            }
                        }
                        else if(isUpcomingEvent(eventdata.event.openDate)){
                            eventlist.push(eventdata)
                            if(["7","4339"].includes(eventdata.eventType.id) && isUpcomingComp == false){
                                isUpcomingComp = true
                            }
                        }
                        if(isUpcomingComp){
                            compIdUpcoming.push(compIds[i])
                        }

                    }
                    if(sportName == "GreyHound" || sportName == "HorseRacing"){
                        client.set(`crone_getCompIds_HRGH_Upcoming_${sportName}_diamond`,JSON.stringify(compIdUpcoming))
                    }
                    client.set(`crone_getEvent_list_${sportName}_diamond`,JSON.stringify(eventlist))  
                    console.log(`Set ${sportName} CompititionId Cron Ended...`) 
                    await setFinalResult(sportName)
                } 
                geteventListBySportId()
            }catch(error){
                console.log(error,'Errorrr setCompIdCrone')
                getEventList(sportName)
            }
    })
}

module.exports = getEventList