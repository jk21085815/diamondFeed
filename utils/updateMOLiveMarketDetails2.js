const redis = require('redis');
// const { log } = require('./utils/logger');
const client = redis.createClient({url:process.env.redisurl});
const clientme = redis.createClient({url:process.env.redisurlme});
const Publishclient = redis.createClient({url:process.env.redisurl});
client.connect()
clientme.connect()
Publishclient.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const updateLiveMarketDetails2 = async(bookdataArray) => {
    let runner
    // console.log(i,'iiiiiii2222222222222')
    try{
        if (!Array.isArray(bookdataArray) || bookdataArray.length === 0) return;  // jo bookdataArray array no hoi to return kri devanu
         // STEP 1: Prepare all Redis keys
        const redisKeys = bookdataArray.map(b => `${b.marketId}_diamond`);  // 200 marketna data mathi marketid no array banavyo like [marketId1_diamond,marketId2_diamond]
        // STEP 2: MGET from Redis
        let marketDataList = await client.mGet(redisKeys);  // aek sathe 200 market na data ne redis mathi get kryo
        // STEP 3: Prepare Redis pipeline for batch update
        const pipeline = client.multi();      // For Redis SETs
        const pipelineMe = clientme.multi();  // For mirror storage (if needed)
        for (let i = 0; i < bookdataArray.length; i++) {
            const bookdata = bookdataArray[i];
            let rawData = marketDataList[i];
            if (!rawData) continue;

            try {
                // market na status and runner no data update kryo che ahiya
                if (["OPEN", "SUSPENDED", "BALL_RUNNING"].includes(bookdata.status?.trim())) {
                    let marketdata = JSON.parse(rawData);
                    marketdata.status = bookdata.status;

                    // Build runner map
                    const runnerMap = new Map(
                        marketdata.runners.map(r => [r?.runnerId, r])
                    );

                    for (const runnerUpdate of bookdata.runners) {
                        const runner = runnerMap.get(runnerUpdate.selectionId);
                        if (runner) {
                            runner.layPrices = runnerUpdate.ex?.availableToLay || [];
                            runner.backPrices = runnerUpdate.ex?.availableToBack || [];
                            runner.status = runnerUpdate.status;
                        }
                    }

                    // if(bookdata.marketId == "1.244277489"){
                        // console.log(marketdata.runners[0].backPrices,'backpriceeeeee22222222')
                        // log(`Logs 2 [${timestamp}] ${JSON.stringify(marketdata.runners[0].backPrices)}\n`);
                    // }

                    const updatedStr = JSON.stringify(marketdata);
                    const redisKey = `${bookdata.marketId}_diamond`;
                    const topicKey = `/topic/diamond_match_odds_update/${bookdata.marketId}`;

                    // Add to pipeline
                    pipeline.set(redisKey, updatedStr, 'EX', 86400); // 24 hours
                    pipeline.set(topicKey, updatedStr);
                    pipelineMe.set(redisKey, updatedStr, 'EX', 86400);

                    // Publish (not part of pipeline in node-redis, do async)
                    Publishclient.publish(topicKey, updatedStr);
                }
            } catch (err) {
                console.error(`Error processing market ${bookdataArray[i].marketId}:`, err);
            }
        }

         // STEP 4: Execute batch commands
        try {
            await pipeline.exec();
            await pipelineMe.exec();
        } catch (execErr) {
            console.error("Redis pipeline execution error:", execErr);
        }
        
    }catch(error){
        console.log(error,"marketIds",'Errorrr updateLiveMarketDetails2')
    }

}

module.exports = updateLiveMarketDetails2

