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
const updateFancyDetailsFunc = async(marketIdsArr,eventId,jj,countLenth,isNewLiveEventAdded) => {
    let starttime = new Date();
    // console.log(starttime,`*${jj}*`,'Update Fanct Details Cron Started.....')
    try{
        // console.log(marketIdsArr.length,'marketArrrr')
        let resultlength = 30
        let fetchMarketData2
        let fetchMarketDatajson2
        let count = Math.ceil((marketIdsArr.length)/resultlength)
        let fancyArr = [];
        // console.log(count,'countttt')
        // console.log(isNewLiveEventAdded,'isnewliveeventaddedddfor fanct')
        for(let l = 0;l<count;l++){
            // console.log(l,'ll')
            let marketids = marketIdsArr.slice((l*resultlength),(resultlength * (1+l)))
            // console.log(marketids.length,'markeidlength')
            marketids = marketids.join(',')
            // console.log(marketids,'marketidssss')
            // starttime = Date.now()
            let fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${marketids}`,{
                method: 'GET',
                headers: {
                    'Content-type': 'application/json',
                }
            })
            
            fetchMarketData2 = await fetch(` http://18.171.69.133:6008/sports/markets/${marketids}`,{
                method: 'GET',
                headers: {
                    'Content-type': 'application/text',
                }
            })
            fetchMarketDatajson2 = await fetchMarketData2.json()
            
            // console.log((Date.now() - starttime)/1000,jj,"jj timeeeeeeeeee before code exicutionnn")
            // console.log(`*${k}*`,new Date(),(new Date().getTime() - starttime.getTime())/(1000),'API CALL Ended.....')
            let fetchMarketDatajson = await fetchMarketData.json()
            console.log(fetchMarketDatajson2, fetchMarketDatajson, 'fetchMarketDatajsonfetchMarketDatajson');

            // fetchMarketDatajson2 = await JSON.parse(fetchMarketDatajson2)
            let keys = Object.keys(fetchMarketDatajson)
            for(let i = 0;i<keys.length;i++){
                if(fetchMarketDatajson[keys[i]]){
                    if(fetchMarketDatajson[keys[i]].sportingEvent == true){
                        fetchMarketDatajson[keys[i]].status = "BALL_RUNNING"
                    }
                    for(let j = 0;j<fetchMarketDatajson[keys[i]].runners.length;j++){
                        let runner = fetchMarketDatajson[keys[i]].runners.find(item => (item.status == "ACTIVE"))
                        if(runner){
                            let marketdetail = fetchMarketDatajson2.find(item => item.catalogue.marketId == fetchMarketDatajson[keys[i]].marketId)
                            let marketName = marketdetail.catalogue.marketName
                            let marketType = marketdetail.catalogue.marketType
                            fetchMarketDatajson[keys[i]].marketName = marketName
                            fetchMarketDatajson[keys[i]].category = marketType
                            fetchMarketDatajson[keys[i]].marketType = "FANCY"
                            if(runner.lay.length !== 0){
                                fetchMarketDatajson[keys[i]].noValue = runner.lay[0].line
                                fetchMarketDatajson[keys[i]].noRate = runner.lay[0].price
                            }else{
                                fetchMarketDatajson[keys[i]].noValue = "0"
                                fetchMarketDatajson[keys[i]].noRate = "0"
                            }

                            if(runner.back.length !== 0){
                                fetchMarketDatajson[keys[i]].yesValue = runner.back[0].line
                                fetchMarketDatajson[keys[i]].yesRate = runner.back[0].price
                            }else{
                                fetchMarketDatajson[keys[i]].yesValue = "0"
                                fetchMarketDatajson[keys[i]].yesRate = "0"
                            }
                        
                            delete fetchMarketDatajson[keys[i]].runners
                            await client.set(`${keys[i]}_shark`,JSON.stringify(fetchMarketDatajson[keys[i]]),'EX',24 * 60 * 60)
                            fancyArr.push(fetchMarketDatajson[keys[i]])
                            break
                        }
                    }
                }
            }
        }
        // console.log(fancyArr.length,eventId,'fancyArrfancyArr',jj)
        
        if(fancyArr.length > 0){
            await client.set(`${eventId}_shark`,JSON.stringify(fancyArr),'EX',24 * 60 * 60)
            let eventData = await client.get(`${eventId}_diamondEventData`)
            eventData = JSON.parse(eventData)
            eventData.markets.fancyMarkets = fancyArr
            await client.set(`${eventId}_diamondEventData`,JSON.stringify(eventData),'EX',24 * 60 * 60)
        }
        if(jj == countLenth -1){
            let isNewLiveEventAdded = await client.get('isNewLiveEventAdded')
            isNewLiveEventAdded = JSON.parse(isNewLiveEventAdded)
            if(isNewLiveEventAdded){
                await client.set("isNewLiveEventAdded",JSON.stringify(false))
            }
        }
        // console.log((Date.now() - starttime)/1000,jj,"jj timeeeeeeeeee after my code exicution")
        // console.log(`*${jj}*`,new Date(),(new Date().getTime() - starttime.getTime())/(1000),'Update Fanct Details Cron Ended.....')    
    }catch(error){
        console.log(error,'Errorrr setNewLiveFanctDetails')
    }

}

module.exports = updateFancyDetailsFunc

