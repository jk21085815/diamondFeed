const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const clientme = redis.createClient({url:process.env.redisurlme});
const Publishclient = redis.createClient({url:process.env.redisurl});
const fs = require('fs');
const path = require('path');
client.connect()
clientme.connect()
Publishclient.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const updateFancyDetailsFunc = async (eventId) => {
    try {
        const logFilePath = path.join(__dirname, `fancyArray.txt`);
        let fancyArr = [];
          async function fetchData() {
            let response
            let result
            const url = ` https://odds.datafeed365.com/api/active-fancy/${eventId}`;
            try {
                response = await fetch(url,{
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
                result = await response.json();
                result = result.data
                return result;

            } catch (error) {
                console.error('Error fetching data:', error);
                return null
            }
            
        }
        // async function processResponse(response) {
        //     for (const key in response) {
        //         if (response.hasOwnProperty(key)) {
        //             const market = JSON.parse(response[key]);
        //             let marketData;
        //             try {
        //                 const cachedData = await client.get(`${key}_diamond`);
        //                 marketData = cachedData ? JSON.parse(cachedData) : null;
        //                 if (marketData) {
        //                     marketData.status = market.status1 == "ACTIVE" ?"OPEN":market.status1,
        //                     marketData.inPlay = market.in_play;
        //                     marketData.noValue = market.l1;
        //                     marketData.noRate = market.ls1;
        //                     marketData.yesValue = market.b1;
        //                     marketData.yesRate = market.bs1;
        //                     let runner1 = marketData.runners[0]
        //                     let runner2 = marketData.runners[1]
        //                     let runner3 = marketData.runners[2]
        //                     if(runner1){
        //                         runner1.status = market.status1
        //                         runner1.layPrices[0].price = market.l1
        //                         runner1.layPrices[0].line = market.ls1
        //                         runner1.backPrices[0].price = market.b1
        //                         runner1.backPrices[0].line = market.bs1
        //                     }
        //                     if(runner2){
        //                         runner2.status = market.status2
        //                         runner2.layPrices[0].price = market.l2
        //                         runner2.layPrices[0].line = market.ls2
        //                         runner2.backPrices[0].price = market.b2
        //                         runner2.backPrices[0].line = market.bs2
        //                     }else{
        //                         console.log(marketData.runners,eventId,'marketid with no runnerrrrrr111111')
        //                     }
        //                     if(runner3){
        //                         runner3.status = market.status3
        //                         runner3.layPrices[0].price = market.l3
        //                         runner3.layPrices[0].line = market.ls3
        //                         runner3.backPrices[0].price = market.b3
        //                         runner3.backPrices[0].line = market.bs3
        //                     }else{
        //                         console.log(marketData.runners,eventId,'marketid with no runnerrrr222222222222')
        //                     }
        //                     await client.set(`${marketData.marketId}_diamond`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
        //                     await clientme.set(`${marketData.marketId}_diamond`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
        //                     fancyArr.push(marketData)
        //                 }
        //                 else{
        //                     let tempRunner = []
        //                     let category = ""
        //                     let tempObj = {
        //                         "marketId": market.id,
        //                         "marketTime": new Date(),
        //                         "provider": "DIAMOND",
        //                         "marketName": market.name,
        //                         "bettingType": "LINE",
        //                         "marketType": "FANCY",
        //                         "status": market.status1 == "ACTIVE" ?"OPEN":market.status1,
        //                         "noValue": market.l1,
        //                         "noRate": market.ls1,
        //                         "yesValue": market.b1,
        //                         "yesRate": market.bs1,
        //                         "inPlay": market.in_play
        //                     }
        //                     // console.log(market.type_code,'market.type_codemarket.type_codemarket.type_code')
        //                     if(["4","10","12","8","5","53","0"].includes(market.type_code.toString())){
        //                         category = "OVERS"
        //                     }else if(["42","20","18","22","36","14","38","44"].includes(market.type_code.toString())){
        //                         category = "BATSMAN"
        //                     }else if(market.type_code.toString() == "2"){
        //                         category = "SINGLE_OVER"
        //                     }else if(["28","26"].includes(market.type_code.toString())){
        //                         category = "ODD_EVEN"
        //                     }else if(market.type_code.toString() == "6"){
        //                         category = "BALL_BY_BALL"
        //                     }else{
        //                         category = "OTHER"
        //                     }
        //                     tempObj.category = category
        //                     let tempObjrunner1 = 
        //                     {
        //                         "status": market.status1,
        //                         "metadata": "",
        //                         "runnerName": market.name,
        //                         "runnerId": market.id + "1",
        //                         "layPrices": [{
        //                             "price":market.l1,
        //                             "line":market.ls1
        //                         }],
        //                         "backPrices": [{
        //                             "price":market.b1,
        //                             "line":market.bs1
        //                         }]
        //                     }
        //                     let tempObjrunner2 = 
        //                     {
        //                         "status": market.status2,
        //                         "metadata": "",
        //                         "runnerName": market.name,
        //                         "runnerId": market.id + "2",
        //                         "layPrices": [{
        //                             "price":market.l2,
        //                             "line":market.ls2
        //                         }],
        //                         "backPrices": [{
        //                             "price":market.b2,
        //                             "line":market.bs2
        //                         }]
        //                     }
        //                     let tempObjrunner3 = 
        //                     {
        //                         "status": market.status3,
        //                         "metadata": "",
        //                         "runnerName": market.name,
        //                         "runnerId": market.id + "3",
        //                         "layPrices": [{
        //                             "price":market.l3,
        //                             "line":market.ls3
        //                         }],
        //                         "backPrices": [{
        //                             "price":market.b3,
        //                             "line":market.bs3
        //                         }]
        //                     }
        //                     tempRunner.push(tempObjrunner1)
        //                     tempRunner.push(tempObjrunner2)
        //                     tempRunner.push(tempObjrunner3)
        //                     tempObj.runners = tempRunner
        //                     await client.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
        //                     await clientme.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
        //                     fancyArr.push(tempObj)
        //                 }
        //             } catch (error) {
        //                 console.log(error, eventId, ":Errorrrrrr in procesing");
        //             }
        //         }
        //     }
        // }
        async function processResponse(response) {
            try {
                // Prepare all keys for batch fetching
                const keys = Object.keys(response).map(key => `${key}_diamond`);
                
                // Batch fetch all cached data
                const cachedDataArray = await client.mGet(keys);
                
                // Create pipelines for batch writes
                const clientPipeline = client.multi();
                const clientmePipeline = clientme.multi();
                
                const processingPromises = Object.entries(response).map(async ([key, value], index) => {
                    const market = JSON.parse(value);
                    let marketData;
                    
                    try {
                        const cachedData = cachedDataArray[index];
                        marketData = cachedData ? JSON.parse(cachedData) : null;
                        
                        if (marketData) {
                            // Update existing market data
                            marketData.status = market.status1 === "ACTIVE" ? "OPEN" : market.status1;
                            marketData.inPlay = market.in_play;
                            marketData.noValue = market.l1;
                            marketData.noRate = market.ls1;
                            marketData.yesValue = market.b1;
                            marketData.yesRate = market.bs1;
                            
                            // Update runners
                            const runners = marketData.runners;
                            if (runners[0]) {
                                runners[0].status = market.status1;
                                runners[0].layPrices[0].price = market.l1;
                                runners[0].layPrices[0].line = market.ls1;
                                runners[0].backPrices[0].price = market.b1;
                                runners[0].backPrices[0].line = market.bs1;
                            }
                            if (runners[1]) {
                                runners[1].status = market.status2;
                                runners[1].layPrices[0].price = market.l2;
                                runners[1].layPrices[0].line = market.ls2;
                                runners[1].backPrices[0].price = market.b2;
                                runners[1].backPrices[0].line = market.bs2;
                            } else {
                                console.log(marketData.runners, eventId, 'marketid with no runnerrrrrr111111');
                            }
                            if (runners[2]) {
                                runners[2].status = market.status3;
                                runners[2].layPrices[0].price = market.l3;
                                runners[2].layPrices[0].line = market.ls3;
                                runners[2].backPrices[0].price = market.b3;
                                runners[2].backPrices[0].line = market.bs3;
                            } else {
                                console.log(marketData.runners, eventId, 'marketid with no runnerrrr222222222222');
                            }
                            
                            // Add to pipeline
                            clientPipeline.set(`${marketData.marketId}_diamond`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
                            clientmePipeline.set(`${marketData.marketId}_diamond`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
                            
                            fancyArr.push(marketData);
                            return marketData;
                        } else {
                            // Create new market data
                            let category = "";
                            const typeCode = market.type_code.toString();
                            
                            if (["4", "10", "12", "8", "5", "53", "0"].includes(typeCode)) {
                                category = "OVERS";
                            } else if (["42", "20", "18", "22", "36", "14", "38", "44"].includes(typeCode)) {
                                category = "BATSMAN";
                            } else if (typeCode === "2") {
                                category = "SINGLE_OVER";
                            } else if (["28", "26"].includes(typeCode)) {
                                category = "ODD_EVEN";
                            } else if (typeCode === "6") {
                                category = "BALL_BY_BALL";
                            } else {
                                category = "OTHER";
                            }
                            
                            const tempObj = {
                                marketId: market.id,
                                marketTime: new Date(),
                                provider: "DIAMOND",
                                marketName: market.name,
                                bettingType: "LINE",
                                marketType: "FANCY",
                                status: market.status1 === "ACTIVE" ? "OPEN" : market.status1,
                                noValue: market.l1,
                                noRate: market.ls1,
                                yesValue: market.b1,
                                yesRate: market.bs1,
                                inPlay: market.in_play,
                                category,
                                runners: [
                                    {
                                        status: market.status1,
                                        metadata: "",
                                        runnerName: market.name,
                                        runnerId: market.id + "1",
                                        layPrices: [{ price: market.l1, line: market.ls1 }],
                                        backPrices: [{ price: market.b1, line: market.bs1 }]
                                    },
                                    {
                                        status: market.status2,
                                        metadata: "",
                                        runnerName: market.name,
                                        runnerId: market.id + "2",
                                        layPrices: [{ price: market.l2, line: market.ls2 }],
                                        backPrices: [{ price: market.b2, line: market.bs2 }]
                                    },
                                    {
                                        status: market.status3,
                                        metadata: "",
                                        runnerName: market.name,
                                        runnerId: market.id + "3",
                                        layPrices: [{ price: market.l3, line: market.ls3 }],
                                        backPrices: [{ price: market.b3, line: market.bs3 }]
                                    }
                                ]
                            };
                            
                            // Add to pipeline
                            clientPipeline.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
                            clientmePipeline.set(`${tempObj.marketId}_diamond`, JSON.stringify(tempObj), 'EX', 24 * 60 * 60);
                            
                            fancyArr.push(tempObj);
                            return tempObj;
                        }
                    } catch (error) {
                        console.log(error, eventId, ":Error in processing market", key);
                        return null;
                    }
                });
                
                // Wait for all processing to complete
                await Promise.all(processingPromises);
                
                // Execute all Redis commands in pipeline
                await Promise.all([
                    clientPipeline.exec(),
                    clientmePipeline.exec()
                ]);
                
            } catch (error) {
                console.log(error, eventId, ":Error in processResponse");
            }
        }
        async function processMarketArray() {
            const response = await fetchData(); // get fancy market data from eventid
            if (Object.keys(response).length !== 0) {
                await processResponse(response); // fancy data get krine aenu status and yesvalue ne ae badha field update krine redis save and fancy array ma push krie chie
            }
            const apiResponses = response;
            return apiResponses;
        }
        await processMarketArray();
        try{
            // console.log('API Responses:', fancyArr);
            if(fancyArr.length !== 0){
                 try{
                    fs.appendFile(logFilePath, `[${new Date()}] ${' eventId: ' + eventId + ' '}  ${JSON.stringify(fancyArr)}\n` + '\n', (err) => {
                    if (err) throw err;
                    // console.log('Data appended to fancyArraywss.txt');
                    });
                }catch(err){
                    console.log(err, 'errerrerrerrerr');
                    
                }
            }
            await client.set(`/topic/diamond_fancy_update/${eventId}`, JSON.stringify(fancyArr), 'EX', 24 * 60 * 60);  // fancyarray ne event id parthi redis ma save and publish krie chie
            await Publishclient.publish(`/topic/diamond_fancy_update/${eventId}`, JSON.stringify(fancyArr));
            let eventData = await client.get(`${eventId}_diamondEventData`);
            eventData = JSON.parse(eventData);
            eventData.markets.fancyMarkets = fancyArr;
            await client.set(`${eventId}_diamondEventData`, JSON.stringify(eventData), 'EX', 24 * 60 * 60); // event no data redis mathi get krine fancy udpate krine pacho redis ma save krie chie
            await clientme.set(`${eventId}_diamondEventData`, JSON.stringify(eventData), 'EX', 24 * 60 * 60);
        }catch(error){
            console.log(error,'Error222222')
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

module.exports = updateFancyDetailsFunc

