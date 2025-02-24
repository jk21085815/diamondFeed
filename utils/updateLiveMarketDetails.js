const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const Publishclient = redis.createClient({url:process.env.redisurl});
client.connect()
Publishclient.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
const updateLiveMarketDetails = async(marketIds,k,count) => {
    let fetchMarketDatajson2
    let marketdetail
    let runner
    try{
        let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${marketIds}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        let fetchMarketDatajson = await fetchMarketData.json()
        let keys = Object.keys(fetchMarketDatajson)
        for(let i = 0;i<keys.length;i++){
            if(fetchMarketDatajson[keys[i]] && ["OPEN","SUSPENDED"].includes(fetchMarketDatajson[keys[i]].status.trim())){
                if(fetchMarketDatajson[keys[i]].sportingEvent == true){
                    fetchMarketDatajson[keys[i]].status = "BALL_RUNNING"
                }
                let marketdata = await client.get(`${keys[i]}_shark`)
                if(!marketdata){
                    let fetchMarketData2 = await fetch(` http://18.171.69.133:6008/sports/markets/${keys[i]}`,{
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/text',
                        }
                    })
                    fetchMarketDatajson2 = await fetchMarketData2.json()
                    marketdetail = fetchMarketDatajson2.find(item => item.catalogue.marketId == fetchMarketDatajson[keys[i]].marketId)
                    let marketName = marketdetail.catalogue.marketName
                    let marketType = marketdetail.catalogue.marketType
                    let bettingType = marketdetail.catalogue.bettingType
                    fetchMarketDatajson[keys[i]].marketType = marketType
                    fetchMarketDatajson[keys[i]].marketName = marketName
                    fetchMarketDatajson[keys[i]].bettingType = bettingType
                    for(let j = 0;j<fetchMarketDatajson[keys[i]].runners.length;j++){
                        runner = marketdetail.catalogue.runners.find(item => item.id == fetchMarketDatajson[keys[i]].runners[j].selectionId)
                        if(runner){
                            fetchMarketDatajson[keys[i]].runners[j].metadata = runner.metadata
                            fetchMarketDatajson[keys[i]].runners[j].runnerName = runner.name
                            fetchMarketDatajson[keys[i]].runners[j].runnerId = fetchMarketDatajson[keys[i]].runners[j].selectionId
                            fetchMarketDatajson[keys[i]].runners[j].layPrices = fetchMarketDatajson[keys[i]].runners[j].lay
                            fetchMarketDatajson[keys[i]].runners[j].backPrices = fetchMarketDatajson[keys[i]].runners[j].back
                            delete fetchMarketDatajson[keys[i]].runners[j].back
                            delete fetchMarketDatajson[keys[i]].runners[j].lay
                            delete fetchMarketDatajson[keys[i]].runners[j].selectionId
                        }else{
                            delete fetchMarketDatajson[keys[i]].runners[j]
                        }
                    }
                    await client.set(`${keys[i]}_shark`,JSON.stringify(fetchMarketDatajson[keys[i]]),'EX',24 * 60 * 60)
                    if(bettingType == "ODDS"){
                        await client.set(`/topic/betfair_match_odds_update/${keys[i]}`,JSON.stringify(fetchMarketDatajson[keys[i]]));
                        Publishclient.publish(`/topic/betfair_match_odds_update/${keys[i]}`,JSON.stringify(fetchMarketDatajson[keys[i]]));
                    }else if(bettingType == "BOOKMAKER"){
                        await client.set(`/topic/tommy_bm_update/${keys[i]}`,JSON.stringify(fetchMarketDatajson[keys[i]]));
                        Publishclient.publish(`/topic/tommy_bm_update/${keys[i]}`,JSON.stringify(fetchMarketDatajson[keys[i]]));
                    }


                }else{
                    marketdata = JSON.parse(marketdata)
                    let isMarketupdate = fetchMarketDatajson[keys[i]].updateTime > marketdata.updateTime ? true:false
                    if(isMarketupdate){
                        marketdata.status = fetchMarketDatajson[keys[i]].status
                        marketdata.inPlay = fetchMarketDatajson[keys[i]].inPlay
                        marketdata.sportingEvent = fetchMarketDatajson[keys[i]].sportingEvent
                        for(let j = 0;j<fetchMarketDatajson[keys[i]].runners.length;j++){
                            runner = marketdata.runners.find(item => (item && item.runnerId && item.runnerId == fetchMarketDatajson[keys[i]].runners[j].selectionId))
                            if(runner){
                                runner.layPrices = fetchMarketDatajson[keys[i]].runners[j].lay
                                runner.backPrices = fetchMarketDatajson[keys[i]].runners[j].back
                                runner.status = fetchMarketDatajson[keys[i]].runners[j].status
                                runner.pnl = fetchMarketDatajson[keys[i]].runners[j].pnl
                            }
                        }
                        if(keys[i] == "1.237726377"){
                            // console.log(marketdata.runners[0].backPrices,marketdata.bettingType,'marketdatamarketdatamarketdatamarketdata')
                        }
                        await client.set(`${keys[i]}_shark`,JSON.stringify(marketdata),'EX',24 * 60 * 60)
                        if(marketdata.bettingType == "ODDS"){
                            await client.set(`/topic/betfair_match_odds_update/${keys[i]}`,JSON.stringify(marketdata));
                            Publishclient.publish(`/topic/betfair_match_odds_update/${keys[i]}`,JSON.stringify(marketdata));
                        }else if(marketdata.bettingType == "BOOKMAKER"){
                            await client.set(`/topic/tommy_bm_update/${keys[i]}`,JSON.stringify(marketdata));
                            Publishclient.publish(`/topic/tommy_bm_update/${keys[i]}`,JSON.stringify(marketdata));
                        }
                    }
                }
            }
        }
    }catch(error){
        console.log("error","marketIds",'Errorrr updateLiveMarketDetailss')
    }

}

module.exports = updateLiveMarketDetails

