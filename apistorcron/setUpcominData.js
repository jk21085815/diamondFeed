const cron = require('node-cron');
const AllsportModel = require('../model/allsportdataModel')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(seetUpcominData.js): ${err}`);
  });
  client.on('connect', () => {
    // console.log('Connected to Redis1');
  });

  module.exports = () => {
    cron.schedule('*/30 * * * * *', async() => {
        console.log('UpcomingCrone')
        let ALLEVENTS = await client.get('allseventList')
        ALLEVENTS = JSON.parse(ALLEVENTS)
        let upcominEnvent = ALLEVENTS.filter(item => item.status === 'UPCOMING' && (item.sportId == 2 || item.sportId == 1))
        // console.log(ALLEVENTS, upcominEnvent, 'upcominEnventupcominEnvent')
        for(let i = 0; i < upcominEnvent.length; i++){
          if(upcominEnvent[i].markets.matchOdds != null){
            for(let j = 0 ; j < upcominEnvent[i].markets.matchOdds.length; j++){
              OddsJSON = JSON.stringify(upcominEnvent[i].markets.matchOdds[j])
              client.set(`${upcominEnvent[i].markets.matchOdds[j].marketId}`, OddsJSON, 'EX', 24 * 60 * 60)
          }}
          

          if(upcominEnvent[i].markets.bookmakers != null){
            for(let j = 0 ; j < upcominEnvent[i].markets.bookmakers.length; j++){
              if(upcominEnvent[i].eventId == '33198944'){
                console.log(upcominEnvent[i].markets.bookmakers)
              }
              OddsJSON = JSON.stringify(upcominEnvent[i].markets.bookmakers[j])
              client.set(`${upcominEnvent[i].markets.bookmakers[j].marketId}`, OddsJSON, 'EX', 24 * 60 * 60)
            }
          }

          if(upcominEnvent[i].markets.fancyMarkets != null && upcominEnvent[i].markets.fancyMarkets.length > 0){
            OddsJSON = JSON.stringify(upcominEnvent[i].markets.fancyMarkets)
            if(upcominEnvent[i].eventId == '33198944'){
              console.log(upcominEnvent[i].markets.fancyMarkets)
            }
            client.set(`${upcominEnvent[i].eventId}`, OddsJSON, 'EX', 24 * 60 * 60)
          }
        }        
    })
}