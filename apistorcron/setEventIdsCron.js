const cron = require('node-cron');
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In seteventIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});


module.exports = () => {
    cron.schedule('0 5 0 * * *', async() => {
    // cron.schedule('25 56 * * * *', async() => {
        console.log('Set EventIds Cron Started.....')
        function isToday(date) {
            // Get today's date without the time
            let today = new Date();
            today.setHours(0, 0, 0, 0);  // Set today's time to 00:00:00.000
        
            // Get the start of tomorrow (for comparison)
            let tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
        
            // Check if the given date falls within today's range
            return date >= today && date < tomorrow;
        }
        try{
            let eventIdsArr = [];
            let cricketEventIdsArr = [];
            let compIds = await client.get('crone_getCompIds')
            compIds = JSON.parse(compIds)
            console.log(compIds.length,'length of comp ids')
            for(let i = 0;i<compIds.length;i++){
                console.log(new Date(),i,'ii')
                let fetchEventData = await fetch(`http://18.171.69.133:6008/sports/competitions/${compIds[i]}`,{
                    method:'GET',
                    headers:{
                        'Content-type' : 'application/json'
                    }
                })
                fetchEventData = await fetchEventData.json()
                for(let k = 0;k<fetchEventData.events.length;k++){
                    if(isToday(fetchEventData.events[k].openDate)){
                        eventIdsArr.push(fetchEventData.events[k].id)
                        if(fetchEventData.eventType.id == 4){
                            cricketEventIdsArr.push(fetchEventData.events[k].id)
                        }
                    }
                }
                if(i % 100 == 0 && i !== compIds.length - 1){
                    client.set('crone_getEventIds',JSON.stringify(eventIdsArr));
                    client.set('crone_getEventIds_Cricket',JSON.stringify(cricketEventIdsArr));
                } 
                if(i == compIds.length - 1){
                    client.set('crone_getEventIds',JSON.stringify(eventIdsArr));
                    client.set('crone_getEventIds_Cricket',JSON.stringify(cricketEventIdsArr));
                    // client.set('crone_getEventIds_old',JSON.stringify(eventIdsArr))
                }

            }       
            console.log(eventIdsArr,'Set EventIds Cron Ended.....')    
        }catch(error){
            console.log(error,'Errorrr seteventIdsCrone')
        }
    })
}