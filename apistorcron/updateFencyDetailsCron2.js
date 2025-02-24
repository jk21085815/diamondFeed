const cron = require('node-cron');
const updateFanctDetails = require('../utils/udpateLiveFancyDetails')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
const { promisify } = require('util');
const { log } = require('console');
client.on('connect', () => {
    // console.log('Connected to Redis1');
});

    const updateFancy = async () => {
        try {
          setInterval(async () => {
            try {
              let cricketEventIds = await client.get('crone_CricketliveEventIds_UPD');
              cricketEventIds = JSON.parse(cricketEventIds);
              let otherEventIds = await client.get(`crone_getEventIds_Election`)
              otherEventIds = JSON.parse(otherEventIds)
              cricketEventIds = cricketEventIds.concat(otherEventIds)
              if (!Array.isArray(cricketEventIds) || cricketEventIds.length === 0) {
                // console.log('No event IDs found.');
                return;
              }
              cricketEventIds.map(async (eventId) => {
                try {
                  let marketIds = await client.get(`cricketFanctMarketIds_${eventId}`);
                  marketIds = JSON.parse(marketIds);
      
                  if (marketIds) {
                    if(eventId == "33815465"){
                      // console.log(marketIds,'marketiddddddddddddssssssssss')
                    }
                    updateFanctDetails(marketIds, eventId);
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
          console.error('Error initializing updateFancy:', error);
        }
      };
      
      
//     })
// }
module.exports = updateFancy