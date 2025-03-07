const cron = require('node-cron');
const updateBMMarketDetails = require('../utils/updateBMLiveMarketDetails')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});

    const updateBookmaker = async () => {
        try {
          setInterval(async () => {
            try {
              let cricketEventIds = await client.get('crone_CricketliveEventIds_diamond_UPD');
              cricketEventIds = JSON.parse(cricketEventIds);
              if (!Array.isArray(cricketEventIds) || cricketEventIds.length === 0) {
                // console.log('No event IDs found.');
                return;
              }
              cricketEventIds.map(async (eventId) => {
                try {
                  let bookmakerlist = await client.get(`bookmakerlist_${eventId}`)
                  if(bookmakerlist){
                    bookmakerlist = JSON.parse(bookmakerlist);
                    if (bookmakerlist) {
                        updateBMMarketDetails(bookmakerlist);
                    }
                  }
                } catch (error) {
                  console.error(`Error updating event ${eventId}:`, error);
                }
              });
            } catch (innerError) {
              console.error('Error in setInterval:', innerError);
            }
          }, 505);
        } catch (error) {
          console.error('Error initializing updateBookmaker:', error);
        }
      };
      
      
//     })
// }
module.exports = updateBookmaker