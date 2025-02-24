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
    cron.schedule('*/30 * * * *', async() => {
    // const updateFancy = async() => {   
        try{
            // setInterval(async() => {
                console.log('get new event ids of HR & GH Started..........')
                let eventIds_HR = [];
                let eventIds_GH = [];
                let compIdUpcoming = [];
                let compId_HRGH = await client.get('crone_getCompIds_HRGH_Upcoming')
                compId_HRGH = JSON.parse(compId_HRGH)
                console.log(compId_HRGH,compId_HRGH.length,'compitition Idsssssss')
                function isUpcomingEvent(date) {
                    let today = new Date();
                    today.setUTCHours(0, 0, 0, 0);  
                    today.toISOString()   
                    let eventDate = new Date(date);
                    eventDate.setUTCHours(0, 0, 0, 0); 
                    eventDate.toISOString()
                    return eventDate.getTime() >= today.getTime();
                }
                function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                for(let i = 0;i<compId_HRGH.length;i++){
                    isUpcomingComp = false
                    // console.log(compId_HRGH[i],i,'iiiiiiiiii')
                    let fetchEventData = await fetch(` http://18.171.69.133:6008/sports/competitions/${compId_HRGH[i]}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        }
                    })
                    const contentType = fetchEventData.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        // If the response is JSON, parse it
                        fetchEventData = await fetchEventData.json();
                    } else {
                        fetchEventData = await fetchEventData.text();
                        console.log("Non-JSON response received");

                    }
                    await delay(1000 * 30);
                    if(fetchEventData && fetchEventData.events){
                        for(let k = 0;k<fetchEventData.events.length;k++){
                            if(isUpcomingEvent(fetchEventData.events[k].openDate)){
                                if(!isUpcomingComp){
                                    isUpcomingComp = true
                                }
                                if(fetchEventData.eventType.id == 7){
                                    eventIds_HR.push(fetchEventData.events[k].id)
                                }else if(fetchEventData.eventType.id == 4339){
                                    eventIds_GH.push(fetchEventData.events[k].id)
                                }
                            }
                        }
                    }else{
                        console.log(fetchEventData,'fetchEventDataaaaaaaaaaaa')
                    }
                    if(isUpcomingComp){
                        compIdUpcoming.push(compId_HRGH[i])
                    }
                }      

                // await client.set(`crone_getCompIds_HRGH_Upcoming`,JSON.stringify(compIdUpcoming))
                await client.set(`crone_getEventIds_HorseRacing`,JSON.stringify(eventIds_HR))
                await client.set(`crone_getEventIds_GreyHound`,JSON.stringify(eventIds_GH))
                // console.log('get new event ids of HR & GH Ended..........')
            // }, 1000 * 60);
        }catch(error){
            console.log(error,'Errorrr AddNeweventIdsHRGHCron')
        }
    // }
    })
}
// module.exports = updateFancy