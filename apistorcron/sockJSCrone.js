const SockJS = require('sockjs-client');
const Stomp = require('stompjs');
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
const cron = require('node-cron');
let connectionStatus = false
client.connect()
client.on('error', (err) => {
    console.log(`Error(sockJSCrone.js): ${err}`);
  });
  client.on('connect', () => {
    // console.log('Connected to Redis');
  });
let dreamClient = null;
async function matchOddsConnect(matchId, marketId){
    console.log('MO')
    dreamClient.subscribe(
        `/topic/betfair_match_odds_update/${matchId}/${marketId}`,
        function (message) {
            let OddsJSON = message.body;
            if(matchId == "33198944"){
                let json = JSON.parse(OddsJSON)
                // console.log(json.runners[0].backPrices, 'matchjOdds')
            }
            // console.log(OddsJSON, 'OddsJSONOddsJSON')
            client.set(`${marketId}`, OddsJSON, 'EX', 24 * 60 * 60)
        }
        );
}
async function BmConnection(matchId, marketId){
    console.log('BM')
    dreamClient.subscribe(
        `/topic/tommy_bm_update/${matchId}/${marketId}`,
        function (message) {
            let OddsJSON = message.body;
            if(matchId == '33198944'){
                let jsonDATA =  JSON.parse(OddsJSON)
                console.log('status',jsonDATA.status )
                console.log('gtBACK', jsonDATA.runners[0].backPrices[0].price, "gtLAY",  jsonDATA.runners[0].layPrices[0].price)
                console.log('dcBACK', jsonDATA.runners[1].backPrices[0].price, "dcLAY",  jsonDATA.runners[1].layPrices[0].price)
            }
            client.set(`${marketId}`, OddsJSON, 'EX', 24 * 60 * 60)
        }
        );
}

async function fancyConnect(matchId){
    console.log('FANCY')
    dreamClient.subscribe(
        `/topic/tommy_fancy_update/${matchId}`,
        function (message) {
            let OddsJSON = message.body;
            if(matchId == "33202968"){
                let data = JSON.parse(OddsJSON)
                // console.log(data, 'datadata')
            }
            client.set(`${matchId}`, OddsJSON, 'EX', 24 * 60 * 60)
        }
        );
}
async function SockJSCall2(){ 
       
        const dreamSocket = new SockJS('https://feed.mysportsfeed.io/odds-feed');
        dreamClient = Stomp.over(dreamSocket);
                    dreamClient.debug = null;
                    dreamClient.heartbeat.outgoing = 5000;
                    dreamClient.connect(
                    {
                        // token: 'xxxx-xxxxx-xxx-xxxx',
                        // operatorId: 'abc',
                        // userId: 'abc',
                    },
                    function (frame) {
                        console.log('DR Connected: ' + frame + ' time ' + Date.now());
                        async function eventrefresh(){
                            let data =  await client.get('ALLEVENTS');
                            let allDATA = JSON.parse(data)
                            // console.log('got hererererrer')
                            for(let i = 0; i < allDATA.length ; i++){
                                if(allDATA[i].status == 'IN_PLAY' || allDATA[i].competitionName === allDATA[i].eventName){
                                let matchId = allDATA[i].eventId
                                let sportID = allDATA[i].sportId
                                let markets = allDATA[i].markets
                                let data = {matchId, sportID, markets}
                            
                            if(data.markets.matchOdds != null){
                                for(let i = 0 ; i < data.markets.matchOdds.length; i++){
                                    let matchOddsOFThatMatch = await client.get(`${data.markets.matchOdds[i].marketId}/INPLAYCONNECTIONSTATUS`)
                                    // console.log(matchOddsOFThatMatch)
                                    if(!matchOddsOFThatMatch || !connectionStatus){
                                        matchOddsConnect(data.matchId,data.markets.matchOdds[i].marketId)
                                       
                                        client.set(`${data.markets.matchOdds[i].marketId}/INPLAYCONNECTIONSTATUS`, JSON.stringify(true), 'EX', 24 * 60 * 60)
                                    }
                                    // dreamClient.subscribe(
                                    //     `/topic/betfair_match_odds_update/${data.matchId}/${data.markets.matchOdds[i].marketId}`,
                                    //     function (message) {
                                    //         let OddsJSON = message.body;
                                    //         client.set(`${data.markets.matchOdds[i].marketId}`, OddsJSON, 'EX', 24 * 60 * 60)
                                    //     }
                                    //     );
                
                                }
                            }
                    
                            if(data.markets.bookmakers != null){
                                for(let i = 0 ; i < data.markets.bookmakers.length; i++){
                                    let thatBMDATA = await client.get(`${data.markets.bookmakers[i].marketId}/INPLAYCONNECTIONSTATUS`)
                                    if(!thatBMDATA || !connectionStatus){
                                        BmConnection( data.matchId, data.markets.bookmakers[i].marketId)
                                        client.set(`${data.markets.bookmakers[i].marketId}/INPLAYCONNECTIONSTATUS`, 'EX', 24 * 60 * 60)
                                    }
                                // dreamClient.subscribe(
                                //     `/topic/tommy_bm_update/${data.matchId}/${data.markets.bookmakers[i].marketId}`,
                                //     function (message) {
                                //         let OddsJSON = message.body;
                                //         client.set(`${data.markets.bookmakers[i].marketId}`, OddsJSON, 'EX', 24 * 60 * 60)
                                //     }
                                //     );
                                }
                            }
                            
                            if(data.markets.fancyMarkets != null && data.markets.fancyMarkets.length > 0){
                                let thatFancydata = await client.get(`${data.matchId}/INPLAYCONNECTIONSTATUS`)
                                if(!thatFancydata || !connectionStatus){
                                    fancyConnect( data.matchId)
                                    client.set(`${data.matchId}/INPLAYCONNECTIONSTATUS`, 'EX', 24 * 60 * 60)
                                }
                                // dreamClient.subscribe(
                                //     `/topic/tommy_fancy_update/${data.matchId}`,
                                //     function (message) {
                                //         let OddsJSON = message.body;
                                //         client.set(`${data.matchId}`, OddsJSON, 'EX', 24 * 60 * 60)
                                //     }
                                //     );
                            }
                                
                        }
                    }
                        connectionStatus = true
                        }
                        eventrefresh()


                        setInterval(()=>{
                            eventrefresh()
                        },1000)


                    },
                    function (error) {
                        connectionStatus = false
                        console.log('dream ws_error: ' + error + ' time ' + Date.now());
                        SockJSCall2()
                    }
                    );
}



module.exports = SockJSCall2