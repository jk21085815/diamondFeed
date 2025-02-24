const redis = require('redis');
const setFinalResult = require('./setFinalResult');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const getEventlistFunc = async(sportName) => {
    let starttime = new Date();
    console.log(starttime,'Set Event list Cron Started.....')
    try{
        async function geteventdataFunc () {
            let eventlistArr = [];
            let eventIds = await client.get(`crone_getEventIds_${sportName}`)
            eventIds = JSON.parse(eventIds)
            console.log(eventIds.length,`${sportName} eventIds length`)
            function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
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
            for(let i = 0;i<eventIds.length;i++){
                console.log(eventIds[i],i,'eventid in eventlist main crone................')
                let fetchMarketData;
                try{
                    fetchMarketData = await fetchEventDataFunc(eventIds[i])
                }catch(error){
                    await delay(1000 * 30)
                    fetchMarketData = await fetchEventDataFunc(eventIds[i])
                }
                await delay(1000)
                eventlistArr.push(fetchMarketData)
            }     
            await client.set(`crone_getEvent_list_${sportName}`,JSON.stringify(eventlistArr)); 
            console.log(new Date(),(new Date().getTime() - starttime.getTime())/(1000 * 60),eventlistArr.length,`Set ${sportName} Event list Cron Ended.....`)    
            await setFinalResult(sportName)
        }
        await geteventdataFunc()
    }catch(error){
        console.log(error,'Errorrr')
        await getEventlistFunc(sportName)
    }

}

module.exports = getEventlistFunc

