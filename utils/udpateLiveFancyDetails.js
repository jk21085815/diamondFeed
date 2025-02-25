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
const updateFancyDetailsFunc = async (marketIdsArr, eventId) => {
    try {
        let fancyArr = [];
        function chunkArray(array, chunkSize) {
            const result = [];
            for (let i = 0; i < array.length; i += chunkSize) {
                result.push(array.slice(i, i + chunkSize));
            }
            return result;
        }
       function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        async function fetchData(marketIds) {
            let response
            let result
            const url = `http://18.171.69.133:6008/sports/books/${marketIds.join(",")}`;
            try {
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                result = await response.json();
            } catch (error) {
                try{
                    await delay(1000 * 10)
                    response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    result = await response.json();
                }catch(error){
                    console.error('Error fetching data:', error);
                    return null
                }
                console.error('Error fetching data:', error);
            }
            return result;
        }
        async function processResponse(response) {
            for (const key in response) {
                if (response.hasOwnProperty(key)) {
                    const market = response[key];
                    if (market && ["OPEN","SUSPENDED"].includes(market.status.trim())) {
                        // if(["2096657","2096613"].includes(market.marketId)){
                        //     console.log(market.marketId,"market.marketIdmarket.marketIdmarket.marketId")
                        // }
                        if (market.sportingEvent === true) {
                            market.status = "BALL_RUNNING";
                        }
                        let marketData = await client.get(`${key}_shark`);
                        marketData = marketData ? JSON.parse(marketData) : null;
                        if (marketData && marketData.status) {
                            let isMarketupdate = market.updateTime > marketData.updateTime ? true:false
                            if(isMarketupdate){
                                marketData.status = market.status;
                                marketData.inPlay = market.inPlay;
                                marketData.sportingEvent = market.sportingEvent;
                                if(false){
                                    for(let i = 0;i<market.runners.length;i++){
                                        let runner = marketData.runners.find(item => item.runnerId == market.runners[i].selectionId);
                                        if (runner) {
                                            if(i == 0){
                                                marketData.noValue = market.runners[i].lay.length ? market.runners[i].lay[0].line : "0";
                                                marketData.noRate = market.runners[i].lay.length ? market.runners[i].lay[0].price : "0";
                                                marketData.yesValue = market.runners[i].back.length ? market.runners[i].back[0].line : "0";
                                                marketData.yesRate = market.runners[i].back.length ? market.runners[i].back[0].price : "0";
                                            }
                                            runner.layPrices = market.runners[i].lay
                                            runner.backPrices = market.runners[i].back
                                            runner.status = market.runners[i].status
                                            runner.pnl = market.runners[i].pnl
                                        }else{
                                            if(i ==0){
                                                marketData.noValue = "0";
                                                marketData.noRate = "0";
                                                marketData.yesValue = "0";
                                                marketData.yesRate = "0";
                                            }
                                            runner.layPrices = []
                                            runner.backPrices = []
                                            runner.status = market.runners[i].status
                                            runner.pnl = market.runners[i].pnl
                                        }
                                    }
                                    fancyArr.push(marketData);
                                    await client.set(`${marketData.marketId}_shark`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
                                }else{
                                    let runner = market.runners.find(item => item.status === "ACTIVE");
                                    if (runner) {
                                        marketData.noValue = runner.lay.length ? runner.lay[0].line : "0";
                                        marketData.noRate = runner.lay.length ? runner.lay[0].price : "0";
                                        marketData.yesValue = runner.back.length ? runner.back[0].line : "0";
                                        marketData.yesRate = runner.back.length ? runner.back[0].price : "0";
                                        fancyArr.push(marketData);
                                        await client.set(`${marketData.marketId}_shark`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
                                    }else{
                                        marketData.noValue = "0";
                                        marketData.noRate = "0";
                                        marketData.yesValue = "0";
                                        marketData.yesRate = "0";
                                        fancyArr.push(marketData);
                                        await client.set(`${marketData.marketId}_shark`, JSON.stringify(marketData), 'EX', 24 * 60 * 60);
                                    }
                                }
                            }else{
                                fancyArr.push(marketData);
                            }
                        }else{
                            let fetchMarketData2
                            try{
                                fetchMarketData2 = await fetch(`http://18.171.69.133:6008/sports/markets/${market.marketId}`, {
                                    method: 'GET',
                                    headers: { 'Content-type': 'application/text' }
                                });
                            } catch (error) {
                                try{
                                    await delay(1000 * 10)
                                    fetchMarketData2 = await fetch(`http://18.171.69.133:6008/sports/markets/${market.marketId}`, {
                                        method: 'GET',  
                                        headers: { 'Content-type': 'application/text' }
                                    });
                                }catch(error){

                                    console.error('Error fetching data:', error);
                                }
                                console.error('Error fetching data:', error);
                            }
                            let fetchMarketDatajson2 = await fetchMarketData2.json();
                            if(false){
                                console.log('hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
                                let marketDetail = fetchMarketDatajson2.find(item => item.catalogue.marketId === market.marketId);
                                market.marketName = marketDetail.catalogue.marketName;
                                market.category = marketDetail.catalogue.marketType;
                                market.bettingType = marketDetail.catalogue.bettingType;
                                market.marketType = "FANCY";
                                for(let i = 0;i<market.runners.length;i++){
                                    try{
                                        let runner = marketDetail.catalogue.runners.find(item => item.id == market.runners[i].selectionId);
                                        if (runner) {
                                            if(i == 0){
                                                market.noValue = market.runners[i].lay.length ? market.runners[i].lay[0].line : "0";
                                                market.noRate = market.runners[i].lay.length ? market.runners[i].lay[0].price : "0";
                                                market.yesValue = market.runners[i].back.length ? market.runners[i].back[0].line : "0";
                                                market.yesRate = market.runners[i].back.length ? market.runners[i].back[0].price : "0";
                                            }
                                            market.runners[i].metadata = runner.metadata
                                            market.runners[i].runnerName = runner.name
                                            market.runners[i].runnerId = market.runners[i].selectionId
                                            market.runners[i].layPrices = market.runners[i].lay
                                            market.runners[i].backPrices = market.runners[i].back
                                            delete market.runners[i].back
                                            delete market.runners[i].lay
                                            delete market.runners[i].selectionId
                                        }else{
                                            // if(i == 0){
                                            //     market.noValue = "0";
                                            //     market.noRate = "0";
                                            //     market.yesValue = "0";
                                            //     market.yesRate =  "0";
                                            // }
                                            // market.runners[i].runnerName = marketDetail.catalogue.runners[i].name
                                            // market.runners[i].runnerId = market.runners[i].selectionId
                                            // market.runners[i].layPrices = []
                                            // market.runners[i].backPrices = []
                                            // delete market.runners[i].back
                                            // delete market.runners[i].lay
                                            // delete market.runners[i].selectionId
                                        }
                                    }catch(error){
                                        console.log(market.runners,market.marketId,'runeerrrrrrrr')
                                        console.log(error,'errorrrrrrrrrrr')
                                    }
                                    
                                }
                                await client.set(`${key}_shark`, JSON.stringify(market), 'EX', 24 * 60 * 60);
                                fancyArr.push(market);
                            }else{
                                let runner = market.runners.find(item => item.status === "ACTIVE");
                                if (runner) {
                                    let marketDetail = fetchMarketDatajson2.find(item => item.catalogue.marketId === market.marketId);
                                    market.marketName = marketDetail.catalogue.marketName;
                                    market.category = marketDetail.catalogue.marketType;
                                    market.bettingType = marketDetail.catalogue.bettingType;
                                    market.marketType = "FANCY";
                                    market.noValue = runner.lay.length ? runner.lay[0].line : "0";
                                    market.noRate = runner.lay.length ? runner.lay[0].price : "0";
                                    market.yesValue = runner.back.length ? runner.back[0].line : "0";
                                    market.yesRate = runner.back.length ? runner.back[0].price : "0";
                                    delete market.runners;
                                    await client.set(`${key}_shark`, JSON.stringify(market), 'EX', 24 * 60 * 60);
                                    fancyArr.push(market);
                                }else{
                                    let marketDetail = fetchMarketDatajson2.find(item => item.catalogue.marketId === market.marketId);
                                    market.marketName = marketDetail.catalogue.marketName;
                                    market.category = marketDetail.catalogue.marketType;
                                    market.bettingType = marketDetail.catalogue.bettingType;
                                    market.marketType = "FANCY";
                                    market.noValue = "0";
                                    market.noRate = "0";
                                    market.yesValue = "0";
                                    market.yesRate =  "0";
                                    delete market.runners;
                                    await client.set(`${key}_shark`, JSON.stringify(market), 'EX', 24 * 60 * 60);
                                    fancyArr.push(market);
                                }
                            }
                            
                        }
                    }
                }
            }
        }
        async function processMarketArray(marketArray) {
            const chunks = chunkArray(marketArray, 150);
            const apiResponses = [];
            for (const chunk of chunks) {
                const apiStartDate = Date.now()
                const response = await fetchData(chunk);
                const apiEndDate =  Date.now() - apiStartDate
                fs.appendFile('../../response_time_log2.txt', `API Fetch Tima: ${apiEndDate}ms\n`, (err) => {
                    if (err) console.error('Error writing to log file:', err);
                });
                if (response) {
                    await processResponse(response);
                }
                apiResponses.push(response); 
            }
            return apiResponses;
        }
        const startTime = Date.now();
        processMarketArray(marketIdsArr).then(async(responses) => {
            // console.log('API Responses:', responses);
            await client.set(`${eventId}_shark`, JSON.stringify(fancyArr), 'EX', 24 * 60 * 60);
            Publishclient.publish(`/topic/tommy_fancy_update/${eventId}`, JSON.stringify(fancyArr));
    
            let eventData = await client.get(`${eventId}_sharEventData`);
            eventData = JSON.parse(eventData);
            eventData.markets.fancyMarkets = fancyArr;
            await client.set(`${eventId}_sharEventData`, JSON.stringify(eventData), 'EX', 24 * 60 * 60);
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

