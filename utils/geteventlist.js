const cron = require('node-cron');
const cheerio = require('cheerio');
const setFinalResult = require('./setFinalResult');
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const fs = require('fs');
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
    function isTodaysEvent(date) {
        let today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        today.setUTCHours(0, 0, 0, 0);
        today.toISOString() 
        let yesterday = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        yesterday.setUTCHours(0, 0, 0, 0);
        yesterday.toISOString() 
        let eventDate = new Date(new Date(date).getTime() + (5.5 * 60 * 60 * 1000));
        eventDate.setUTCHours(0, 0, 0, 0);
        eventDate.toISOString()
        // console.log(date,eventDate.getTime() <= today.getTime() && eventDate.getTime() >= yesterday.getTime(),'dateeeeeeeeeeeee')
        return eventDate.getTime() <= today.getTime() && eventDate.getTime() >= yesterday.getTime();
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
        // console.log(inputDate,dateToCheck,currentDate,fiveDaysAgo,dateToCheck >= fiveDaysAgo,'dateeeeee')
        return dateToCheck >= fiveDaysAgo;
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
    async function fetchactiveevent() {
        let fetchMarketData = await fetch(`https://odds.datafeed365.com/api/active-events`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        let fetchMarketDatajson = await fetchMarketData.json()
        return fetchMarketDatajson
    }
    cron.schedule('21 * * * *', async() => {
    // cron.schedule('0 */3 * * *', async() => {
        let starttime = new Date();
        console.log(starttime,`Set ${sportName} CompId Cron Started.....111111111111111111111111111111111111111111111111`)
        try{
            async function geteventListBySportId () {
                try{
                    let eventlist = []
                    let parsedata2 = []
                    let virtualCricket
                    let fetchEventList
                    let fetchTouranamaentevents
                    let parsedata = []
                    // Fetch Betfair Event List By Passing SportId
                    if(sportId !== "99994"){
                        fetchEventList = await fetch(`http://13.42.165.216/betfair/get_latest_event_list/${sportId}`,{
                            method:'GET',
                            headers:{
                                'Content-type' : 'application/json'
                            }
                        })
                        fetchEventList = await fetchEventList.text()
                        parsedata = JSON.parse(fetchEventList)

                        // Fetch Winner Event Like IPL, Big Bash from sportId
                        fetchTouranamaentevents = await fetch(`http://13.42.165.216/betfair/tournament_winner/${sportId}`,{
                            method:'GET',
                            headers:{
                                'Content-type' : 'application/json'
                            }
                        })
                        fetchTouranamaentevents = await fetchTouranamaentevents.text()   // convert data into text
                        parsedata2 = JSON.parse(fetchTouranamaentevents) // if data is string then convert into JSON
                        parsedata = parsedata.concat(parsedata2)  // merge winner and betfair events

                    }
                    
                    // if (typeof fetchTouranamaentevents === "string" && fetchTouranamaentevents.trim() !== "") { // condition for check data is string or not empty
                    // } else {
                    //     console.error("Invalid JSON data:", fetchTouranamaentevents);
                    // }
                    // if sportid is 4(Cricket) then fetch Virtual event(which contain in event name T10)
                    if(sportId == "4"){
                        let activeevent = await fetchactiveevent() // fetch active-event list
                        virtualCricket = activeevent.data.filter(item => item.name.indexOf('T10') !== -1)  // filter T10 only virtual events
                        parsedata = parsedata.concat(virtualCricket)  // then merge with main parsedata array
                    }else if(sportId == "99994"){
                        let activeevent = await fetchactiveevent() // fetch active-event list
                        kabaddievents = activeevent.data.filter(item => item.event_type_id == sportId)  // filter T10 only virtual events
                        parsedata = parsedata.concat(kabaddievents)  // then merge with main parsedata array
                    }
                    // console.log(parsedata, 'parsedataparsedata');
                    // if(sportName=== 'Cricket'){
                    //     fs.writeFile('./print.txt', JSON.stringify(parsedata, null, 2), (err) => {
                    //         if (err) {
                    //           console.error('Error writing file:', err);
                    //         } else {
                    //           console.log('parsedata saved to ./print.txt');
                    //         }
                    //       });

                    // }
                    

                    // Badhi event ne loop ma lidhi 
                    for(let j = 0;j<parsedata.length;j++){
                        let isTestMatch = false
                        let isElection = false
                        let eventdata = parsedata[j]
                        // console.log(parsedata[j], parsedata.length, 'parsedata');
                        // aa logs mate che ae ingnore krje
                        // try{
                        //     fs.appendFile('eventData.txt', JSON.stringify(eventdata) + '\n', (err) => {
                        //     if (err) throw err;
                        //     console.log('Data appended to eventData.txt');
                        //     });
                        // }catch(err){
                        //     console.log(err, 'errerrerrerrerr');
                            
                        // }

                        if(eventdata.competition && (eventdata.competition.name.toLowerCase().indexOf("test") !== -1 || eventdata.competition.name.toLowerCase().indexOf("ranji trophy") !== -1 || eventdata.competition.name.toLowerCase().indexOf("west indies championship") !== -1)){  // test competition mateni condition che
                            isTestMatch = true
                        }else{
                            if(eventdata.eventType && eventdata.eventType.id == 500){  // election sport mateni condition che
                                isElection = true
                            }
                        }
                        if(eventdata.event_type_id && eventdata.event_type_id == 4){  // active-event mathi je T10 vali event lidhi aeni condition che
                            if(isTodaysEvent(new Date(new Date(eventdata.open_date).getTime() + (1000 * 60 * 60 * 5.5)).toISOString())){  // only today ni j event filter kri
                                let tempObj = {
                                    eventType:{
                                        id:"4",
                                        name:'Cricket'
                                    },
                                    event:{
                                        id:eventdata.id.toString(),
                                        name:eventdata.name,
                                        openDate:new Date(new Date(eventdata.open_date).getTime() + (1000 * 60 * 60 * 5.5)).toISOString(),
                                        countryCode:"",
                                        venue:""
                                    },
                                    competition: {
                                        id: "354807569",
                                        name: "Virtual Cricket League"
                                    },
                                    runners:eventdata.runners,
                                    isvirtual:true,
                                    isother:true

                                }
                                eventlist.push(tempObj)
                            }
                        }
                        if(eventdata.event_type_id && eventdata.event_type_id == 99994){  // active-event mathi je T10 vali event lidhi aeni condition che
                            if(isUpcomingEvent(new Date(new Date(eventdata.open_date).getTime() + (1000 * 60 * 60 * 5.5)).toISOString()) || eventdata.name == "Pro Kabaddi League v Pro Kabaddi League"){  // only today ni j event filter kri
                                let tempObj = {
                                    eventType:{
                                        id:"99994",
                                        name:'Kabaddi'
                                    },
                                    event:{
                                        id:eventdata.id.toString(),
                                        name:eventdata.name,
                                        openDate:new Date(new Date(eventdata.open_date).getTime() + (1000 * 60 * 60 * 5.5)).toISOString(),
                                        countryCode:"",
                                        venue:""
                                    },
                                    competition: {
                                        id: "354807777",
                                        name: "Other"
                                    },
                                    runners:eventdata.runners,
                                    isvirtual:false,
                                    isother:true

                                }
                                eventlist.push(tempObj)
                            }
                        }
                        if(eventdata.event){    // betfair ni event ni condition che
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
                            }else if(eventdata.competition && (eventdata.event.name.trim() == eventdata.competition.name.trim())){  // jo competition name and event name same hoi to aene lay j levani
                                let fetchMarketData = await fetchMOBook(eventdata.marketId)
                                let winner = fetchMarketData[0]
                                // console.log(winner,'winnner markettttttttt')
                                if(winner && (winner.status !== 'CLOSED')){
                                    eventlist.push(eventdata)
                                }
                            }
                            else if(isUpcomingEvent(eventdata.event.openDate) && ((eventdata.competition && eventdata.competition.name && eventdata.competition.name !== "") || ["7","4339"].includes(eventdata.eventType.id))){ // gai kal thi aagal ni badhi event filter krvi chi
                                if(["7","4339"].includes(eventdata.eventType.id)){  // jo event HR or GH sport ni hoi to aapde eventlist mathi same event ma jetli MO(Match odds che) aene catalog field ma push kri devi chi
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
                                    }else{
                                        eventdata.catalogues = [tempObj]
                                        delete eventdata.marketId
                                        delete eventdata.marketName
                                        delete eventdata.runners
                                        delete eventdata.description
                                        eventlist.push(eventdata)
                                    }
                                }else{
                                    eventlist.push(eventdata)
                                }
                            }
                        }
                    }
                    // console.log(eventlist.find(item => item == "29510526"),"29510526295105262951052629510526")
                    if(sportName == "Kabaddi"){
                        console.log(eventlist,'kabaddieventlistkabaddieventlistkabaddieventlistkabaddieventlistkabaddieventlist')
                    }
                    client.set(`crone_getEvent_list_${sportName}_diamond`,JSON.stringify(eventlist))  
                    console.log(starttime,new Date(),(Date.now()-(starttime.getTime()))/1000,`Set ${sportName} CompititionId Cron Ended...`) 
                    await setFinalResult(sportName)
                }catch(error){
                    geteventListBySportId()
                    console.log(error, 'errorerrorerror');
                    
                }
                
            } 
            geteventListBySportId()
            if(sportId == "4"){
                let otherEventIds = []
                let otherotherEventIds = []
                let otherEvents = await client.get('crone_getEventIds_Other_diamond')
                otherEvents = JSON.parse(otherEvents)
                let otherotherEvents = await client.get('crone_getEventIds_Other_Other_diamond')
                otherotherEvents = JSON.parse(otherotherEvents)
                console.log(otherEvents,otherotherEvents,'other event idsssssssssss11111111')

                for(let i = 0;i<otherEvents.length;i++){
                    console.log(otherEvents[i],'eventId')
                    let eventData = await client.get(`${otherEvents[i]}_diamondEventData`)
                    if(eventData){
                        eventData = JSON.parse(eventData)
                        if(isDateWithinLast5Days(eventData.openDate)){
                            otherEventIds.push(eventData.eventId)
                        }
                    }
                }
                for(let i = 0;i<otherotherEvents.length;i++){
                    let eventData = await client.get(`${otherotherEvents[i]}_diamondEventData`)
                    if(eventData){
                        eventData = JSON.parse(eventData)
                        if(isDateWithinLast5Days(eventData.openDate)){
                            otherotherEventIds.push(eventData.eventId)
                        }
                    }
                }
                console.log(otherEventIds,otherotherEventIds,'other event idsssssssssss2222222')
                await client.set('crone_getEventIds_Other_diamond',JSON.stringify(otherEventIds))
                await client.set('crone_getEventIds_Other_Other_diamond',JSON.stringify(otherotherEventIds))
            }
        }catch(error){
            console.log(error,'Errorrr setCompIdCrone')
            // getEventList(sportName)
        }
    })
}

module.exports = getEventList