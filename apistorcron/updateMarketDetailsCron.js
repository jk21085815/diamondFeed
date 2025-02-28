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
    cron.schedule('*/5 * * * * *', async() => {
        try{
            let cricketLiveMarkerIds
            let liveMarketIds
            cricketLiveMarkerIds = await client.get('crone_CricketliveMarketIds_diamond_UPD');
            if(!cricketLiveMarkerIds){
                cricketLiveMarkerIds = await client.get('crone_CricketliveMarketIds_diamond'); 
            }
            cricketLiveMarkerIds = JSON.parse(cricketLiveMarkerIds)
            liveMarketIds = await client.get('crone_liveMarketIds_diamond_UPD'); 
            if(!liveMarketIds){
                liveMarketIds = await client.get('crone_liveMarketIds_diamond'); 
            }
            liveMarketIds = JSON.parse(liveMarketIds)
            liveMarketIds = liveMarketIds.concat(cricketLiveMarkerIds)
            // console.log(liveMarketIds.find(item => item == "1.237726377"),"1.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.2377263771.237726377")
            let resultlength = 150
            let count = Math.ceil((liveMarketIds.length)/resultlength)
            await client.set('marketidCounts',JSON.stringify(count))
            for(let k = 0;k<count;k++){
                let marketids = liveMarketIds.slice((k*resultlength),(resultlength * (1+k)))
                marketids = marketids.join(',')
                await client.set(`marketidkcount${k}`,JSON.stringify(marketids))
            }
            
        }catch(error){
            console.log(error,'Errorrr udpaetMarketDetailsCrone')
        }
    })
}

