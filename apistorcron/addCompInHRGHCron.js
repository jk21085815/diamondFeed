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
                console.log('add new compition ids of HR & GH Started..........')
                let fetchSportTypes = 
                [{
                        "id": "7",
                        "name": "Horse Racing"
                    },{
                        "id": "4339",
                        "name": "Greyhound Racing"
                    }
                ]
                let compIdArr = []
                let compIdUpcoming = []
                for(let i = 0;i<fetchSportTypes.length;i++){
                    let fetchCompData = await fetch(`http://18.171.69.133:6008/sports/competitions/list/${fetchSportTypes[i].id}`,{
                        method:'GET',
                        headers:{
                            'Content-type' : 'application/json'
                        }
                    })
                    fetchCompData = await fetchCompData.json()
                    for(let j = 0;j<fetchCompData.length;j++){
                        compIdArr.push(fetchCompData[j].competition.id)
                    }
                }     
                console.log(compIdArr.length,'compIdArrcompIdArr')
                function isUpcomingEvent(date) {
                    let today = new Date();
                    today.setUTCHours(0, 0, 0, 0);  // Set today's time to 00:00:00.000 
                    today.toISOString()  // Set today's time to 00:00:00.000 
                    let eventDate = new Date(date);
                    eventDate.setUTCHours(0, 0, 0, 0); // Remove time for accurate comparison 
                    eventDate.toISOString()
                    return eventDate.getTime() >= today.getTime();
                    // return true
                }
                for(let i = 0;i<compIdArr.length;i++){
                    // console.log(i,compIdArr[i],"comp iiiiiiiiii")
                    let fetchEventData = await fetch(`http://18.171.69.133:6008/sports/competitions/${compIdArr[i]}`,{
                        method:'GET',
                        headers:{
                            'Content-type' : 'application/json'
                        }
                    })
                    fetchEventData = await fetchEventData.json()
                    let isUpcomingComp = false
                    for(let k = 0;k<fetchEventData.events.length;k++){
                        if(isUpcomingEvent(fetchEventData.events[k].openDate)){
                            if(isUpcomingComp == false){
                                isUpcomingComp = true
                            }
                        }
                    }
                    if(isUpcomingComp){
                        compIdUpcoming.push(compIdArr[i])
                    }
                }       
                client.set('crone_getCompIds_HRGH_Upcoming',JSON.stringify(compIdUpcoming))
            }catch(error){
                console.log(error,'Errorrr')
            }
    // }
    })
}
// module.exports = updateFancy