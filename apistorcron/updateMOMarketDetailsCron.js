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
            cricketLiveMarkerIds = await client.get('crone_CricketliveMarketIds_MO_diamond_UPD');
            if(!cricketLiveMarkerIds){
                cricketLiveMarkerIds = await client.get('crone_CricketliveMarketIds_MO_diamond'); 
            }
            cricketLiveMarkerIds = JSON.parse(cricketLiveMarkerIds)
            liveMarketIds = await client.get('crone_liveMarketIds_MO_diamond_UPD'); 
            if(!liveMarketIds){
                liveMarketIds = await client.get('crone_liveMarketIds_MO_diamond'); 
            }
            liveMarketIds = JSON.parse(liveMarketIds)
            liveMarketIds = liveMarketIds.concat(cricketLiveMarkerIds)
            // console.log(liveMarketIds.find(item => item == "1.241627539"),"1.2416275391.2416275391.2416275391.2416275391.241627539")
            let resultlength = 100
            let count = Math.ceil((liveMarketIds.length)/resultlength)
            await client.set('marketidCounts_MO',JSON.stringify(count))
            for(let k = 0;k<count;k++){
                let marketids = liveMarketIds.slice((k*resultlength),(resultlength * (1+k)))
                marketids = marketids.join(',')
                await client.set(`marketidkcount_MO_${k}`,marketids)
            }
            
        }catch(error){
            console.log(error,'Errorrr udpaetMarketDetailsCrone')
        }
    })
}

