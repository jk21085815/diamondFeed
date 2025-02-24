const cron = require('node-cron');
const sportDataModel = require('../model/sportdataModel')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(getothersportdatacron.js): ${err}`);
  });
  client.on('connect', () => {
    // console.log('Connected to Redis');
  });

module.exports = () => {
    cron.schedule('*/2 * * * *', async() => {
        console.log('sport')
        let JsonStatus = false
        try{
            var fullUrl = 'https://admin-api.dreamexch9.com/api/dream/cron/get-sportdata';
            fetch(fullUrl, {
                method: 'GET'
            })
            .then(res =>{
                const contentType = res.headers.get('content-type')
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    JsonStatus = true
                    return res.json();
                  } else {
                    // throw new Error('Response is not in JSON format');
                    console.log('Response is not in JSON format')
                    return res.text();
                  }
            })
            .then(async(result) => {
                // console.log(result, "resultresultresultresultresult")
                if(JsonStatus){
                let date = new Date()
                let data
                // console.log(result, "resultresultresultresult")
                let tennis = result.gameList.find(item => item.sportId == 2)
                let Football = result.gameList.find(item => item.sportId == 1)
                // console.log(footbalData, 'footbalDatafootbalData')
                if(tennis.eventList.length > 0 || Football.eventList.length > 0){

                    data = JSON.stringify(result)
                    // const existingRecord = await sportDataModel.findOne();
                    await client.set('ABCDEFGHIJKSPORT11', data)
                    // if (existingRecord) {
                    //     await sportDataModel.findOneAndUpdate({}, { data, date });
                    // }else{
                    //     await sportDataModel.create({data,date})
                    // }
                }
                }
                console.log('get sport data cron')
                // await sportDataModel.create({data,date})
    
            })

        }catch(err){
            console.log(err)
        }
        
    })
}