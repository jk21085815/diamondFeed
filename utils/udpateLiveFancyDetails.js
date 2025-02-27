const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const Publishclient = redis.createClient({url:process.env.redisurl});
const fs = require('fs');
client.connect()
Publishclient.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const updateFancyDetailsFunc = async (eventId,fencydata) => {
    try {
        let fancyArr = [];
        async function processResponse(response) {
            for (const key in response) {
                if (response.hasOwnProperty(key)) {
                    const market = JSON.parse(response[key]);
                    if (market) {
                        let marketData = await client.get(`${key}_diamond`);
                        marketData = marketData ? JSON.parse(marketData) : null;
                        if (marketData && marketData.status1) {
                            marketData.status = market.is_active == 1?"OPEN":"CLOSED";
                            marketData.inPlay = market.in_play;
                            marketData.noValue = market.l1;
                            marketData.noRate = market.ls1;
                            marketData.yesValue = market.b1;
                            marketData.yesRate = market.bs1;
                            let runner = marketData.runners[0]
                            runner.status = market.is_active == 1?"OPEN":"CLOSED"
                            runner.layPrices[0].price = market.l1
                            runner.layPrices[0].line = market.ls1
                            runner.backPrices[0].price = market.b1
                            runner.backPrices[0].line = market.bs1
                            await client.set(`${marketData.marketId}_diamond`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
                        }else{
                            let tempRunner = []
                            let category = ""
                            let tempObj = {
                                "marketId": market.id,
                                "marketTime": new Date(),
                                "provider": "DIAMOND",
                                "marketName": market.name,
                                "bettingType": "LINE",
                                "marketType": "FANCY",
                                "status": market.is_active == 1?"OPEN":"CLOSED",
                                "noValue": market.l1,
                                "noRate": market.ls1,
                                "yesValue": market.b1,
                                "yesRate": market.bs1,
                                "inPlay": market.in_play
                            }
                            if(market.type_code == 10){
                                category = "OVERS"
                            }else if(market.type_code == 34){
                                category = "BATSMAN"
                            }else if(market.type_code == 2){
                                category = "SINGLE_OVER"
                            }else if(market.type_code == 28){
                                category = "ODD_EVEN"
                            }else if(market.type_code == 6){
                                category = "BALL_BY_BALL"
                            }else{
                                category = "OTHER"
                            }
                            tempObj.category = category
                            let tempObjrunner = 
                            {
                                "status": market.is_active == 1?"OPEN":"CLOSED",
                                "metadata": "",
                                "runnerName": market.name,
                                "runnerId": market.id,
                                "layPrices": [{
                                    "price":market.l1,
                                    "line":market.ls1
                                }],
                                "backPrices": [{
                                    "price":market.b1,
                                    "line":market.bs1
                                }]
                            }
                            tempRunner.push(tempObjrunner)
                            tempObj.runners = tempRunner
                            await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
                            fancyArr.push(tempObj)
                            
                        }
                    }
                }
            }
        }
        async function processMarketArray(fencydata) {
            const apiResponses = fencydata;
            await processResponse(fencydata);
            return apiResponses;
        }
        const startTime = Date.now();
        processMarketArray(fencydata).then(async(responses) => {
            // console.log('API Responses:', responses);
            await client.set(`${eventId}_diamond`, JSON.stringify(fancyArr), 'EX', 24 * 60 * 60);
            Publishclient.publish(`/topic/diamond_fancy_update/${eventId}`, JSON.stringify(fancyArr));
            let eventData = await client.get(`${eventId}_diamondEventData`);
            eventData = JSON.parse(eventData);
            eventData.markets.fancyMarkets = fancyArr;
            await client.set(`${eventId}_diamondEventData`, JSON.stringify(eventData), 'EX', 24 * 60 * 60);
            const api1ResponseTime = Date.now() - startTime;
        fs.appendFile('../../response_time_log2.txt', `Total Time: ${api1ResponseTime}ms\n`, (err) => {
            if (err) console.error('Error writing to log file:', err);
        });
        });        
    } catch (error) {
        console.error('Error:', "error");
    }
};

module.exports = updateFancyDetailsFunc

