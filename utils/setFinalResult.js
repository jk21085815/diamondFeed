const SetThisSportData = require('./setThisSportData')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const setFinalResultFunc = async(sportName) => {
    let starttime = new Date();
    console.log(starttime,`Set Final ${sportName} Result Cron Started.....`)
    try{
        let eventlist = await client.get(`crone_getEvent_list_${sportName}_diamond`)
        eventlist = JSON.parse(eventlist)
        // console.log(eventlist,'eventlisttttttttttttt')
        // await SetThisSportData(eventlist,sportName)
        console.log(starttime,new Date(),(Date.now()-(starttime.getTime()))/1000,`Set Final ${sportName} Result Cron Ended.....`)
    }catch(error){
        setFinalResultFunc(sportName)
        console.log(error,'Errorrr')
    }

}

module.exports = setFinalResultFunc

