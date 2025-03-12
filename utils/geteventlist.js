const cron = require('node-cron');
const cheerio = require('cheerio');
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
    async function fetchMOBook(marketIds) {
        let fetchMarketData = await fetch(`http://13.42.165.216:8443/api/betfair/${marketIds}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        let fetchMarketDatajson = await fetchMarketData.json()
        return fetchMarketDatajson
    }
    cron.schedule('00 */6 * * *', async() => {
    // cron.schedule('41 * * * *', async() => {
            console.log(`Set ${sportName} CompId Cron Started.....111111111111111111111111111111111111111111111111`)
            try{
                async function geteventListBySportId () {
                    try{
                        let eventlist = []
                        let parsedata2 = []
                        let fetchEventList = await fetch(`http://13.42.165.216/betfair/get_latest_event_list/${sportId}`,{
                            method:'GET',
                            headers:{
                                'Content-type' : 'application/json'
                            }
                        })
                        let fetchTouranamaentevents = await fetch(`http://13.42.165.216/betfair/tournament_winner/${sportId}`,{
                            method:'GET',
                            headers:{
                                'Content-type' : 'application/json'
                            }
                        })
                        fetchTouranamaentevents = await fetchTouranamaentevents.text()
                        if (typeof fetchTouranamaentevents === "string" && fetchTouranamaentevents.trim() !== "") {
                            parsedata2 = JSON.parse(fetchTouranamaentevents)
                        } else {
                            console.error("Invalid JSON data:", fetchTouranamaentevents);
                        }
                        fetchEventList = await fetchEventList.text()
                        let parsedata = JSON.parse(fetchEventList)
                        parsedata = parsedata.concat(parsedata2)
                        for(let j = 0;j<parsedata.length;j++){
                            let isTestMatch = false
                            let isElection = false
                            let eventdata = parsedata[j]
                            if(eventdata.competition && (eventdata.competition.name.toLowerCase().indexOf("test") !== -1 || eventdata.competition.name.toLowerCase().indexOf("ranji trophy") !== -1 || eventdata.competition.name.toLowerCase().indexOf("west indies championship") !== -1)){
                                isTestMatch = true
                                console.log(eventdata.competition.name,'competetion name')
                            }else{
                                if(eventdata.eventType.id == 500){
                                    isElection = true
                                }
                            }
                            if(isTestMatch){
                                if(isDateWithinLast5Days(eventdata.event.openDate)){
                                    let fetchMarketData = await fetchMOBook(eventdata.marketId)
                                    let matchodds = fetchMarketData[0]
                                    if(matchodds && (matchodds.status !== 'CLOSED')){
                                        eventlist.push(eventdata)
                                    }
                                }
                            }else if(isElection){
                                eventlist.push(eventdata)
                            }else if(eventdata.competition && (eventdata.event.name.trim() == eventdata.competition.name.trim())){
                                let fetchMarketData = await fetchMOBook(eventdata.marketId)
                                let winner = fetchMarketData[0]
                                if(winner && (winner.status !== 'CLOSED')){
                                    eventlist.push(eventdata)
                                }
                            }
                            else if(isUpcomingEvent(eventdata.event.openDate)){
                                if(["7","4339"].includes(eventdata.eventType.id)){
                                    let tempObj = {
                                        marketId:eventdata.marketId,
                                        marketName:eventdata.marketName,
                                        runners:eventdata.runners,
                                        description:eventdata.description,
                                        marketStartTime:eventdata.marketStartTime
                                    }
                                    let thatEvent = eventlist.find(item => item.event.id == eventdata.event.id)
                                    if(thatEvent){
                                        thatEvent.catalogues.push(tempObj)
                                        let index = eventlist.findIndex(item => item.event.id == eventdata.event.id)
                                        if(index !== -1){
                                            eventlist.splice(index,1,thatEvent)
                                        }
                                        if(eventdata.event.id == "34066937"){
                                        }
                                    }else{
                                        eventdata.catalogues = [tempObj]
                                        delete eventdata.marketId
                                        delete eventdata.marketName
                                        delete eventdata.runners
                                        delete eventdata.description
                                        if(eventdata.event.id == "34066937"){
                                        }
                                        eventlist.push(eventdata)
                                    }
                                }else{
                                    eventlist.push(eventdata)
                                }
                            }
                        }
                        client.set(`crone_getEvent_list_${sportName}_diamond`,JSON.stringify(eventlist))  
                        console.log(`Set ${sportName} CompititionId Cron Ended...`) 
                        await setFinalResult(sportName)
                    }catch(error){
                        geteventListBySportId()
                    }
                    
                } 
                geteventListBySportId()
            }catch(error){
                console.log(error,'Errorrr setCompIdCrone')
                // getEventList(sportName)
            }
    })
}

module.exports = getEventList