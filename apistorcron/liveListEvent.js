const cron = require('node-cron');
const AllsportModel = require('../model/allsportdataModel')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(liveListEvent.js): ${err}`);
  });
  client.on('connect', () => {
    // console.log('Connected to Redis1');
  });

module.exports = () => {
    cron.schedule('*/30 * * * * *', async() => {
        console.log('get list live events')
        let eventdataarray = []
        try{
                let result = ['2', '1', '4']
                // for(let i = 0;i<result.length;i++){
                        let fullUrl = "https://api.mysportsfeed.io/api/v1/feed/list-live-events";
                        let eventdata = await fetch(fullUrl, {
                            method: 'POST',
                            headers: {
                                'Content-type': 'application/json',
                            },
                            body:JSON.stringify({
                                "operatorId": "sheldonfeed",
                                "partnerId": "SHPID01",
                                // "sportId":result[i]
                                //  "providerId":"BetFair"
                            })
                    
                        })
                        let eventdatajson = await eventdata.json()
                        // console.log(eventdatajson.events,'eventdata')
                        // eventdatajson.sportId = result[i]
                        // eventdataarray.push(eventdatajson)
                // }
                // let allsportdata = {}
                // allsportdata.result = eventdataarray
                for(let i = 0; i < eventdatajson.events.length; i++){
                    // console.log(eventdatajson.events[i])
                    let thatMatchINplayStatus = await client.get(`${eventdatajson.events[i].eventId}/INPLAYSTATUS`)
                    if(!thatMatchINplayStatus){
                        if(eventdatajson.events[i].status == 'IN_PLAY'){
                            client.set(`${eventdatajson.events[i].eventId}/INPLAYSTATUS`, JSON.stringify(true),'EX', 24 * 60 * 60)
                        }else{
                            if(eventdatajson.events[i].competitionName === eventdatajson.events[i].eventName){
                                client.set(`${eventdatajson.events[i].eventId}/INPLAYSTATUS`, JSON.stringify(true),'EX', 24 * 60 * 60)
                            }else{
                                client.del(`${eventdatajson.events[i].eventId}/INPLAYSTATUS`)
                            }
                        }
                    }else if (eventdatajson.events[i].status != 'IN_PLAY'){
                        if(eventdatajson.events[i].competitionName === eventdatajson.events[i].eventName){
                            client.set(`${eventdatajson.events[i].eventId}/INPLAYSTATUS`, JSON.stringify(true),'EX', 24 * 60 * 60)
                        }else{
                            client.del(`${eventdatajson.events[i].eventId}/INPLAYSTATUS`)
                        }
                        // client.del(`${eventdatajson.events[i].eventId}/INPLAYSTATUS`)
                    }
                }
                // let cricket = eventdatajson.events.find(item => item.sportId == "4")
                // let footbal = eventdatajson.events.find(item => item.sportId == "1")
                // let tennis = eventdatajson.events.find(item => item.sportId == "2")
                // console.log(cricket, footbal, tennis, eventdatajson.events, 'allcricket')
                // await client.set('LIVEcricketallsportdata', JSON.stringify(cricket))
                // await client.set('LIVEfootbalallsportdata', JSON.stringify(footbal))
                // await client.set('LIVEtennisallsportdata', JSON.stringify(tennis))
                // await client.set('LIVEallsportdata', JSON.stringify(eventdatajson.events))
                // let date = new Date()
          

        }catch(err){
            console.log(err)
        }
        
    })
}
