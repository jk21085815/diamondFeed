const cron = require('node-cron');
const cricketdataModel = require('../model/cricketdataModel')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(getcricketdatacron.js): ${err}`);
  });
  client.on('connect', () => {
    // console.log('Connected to Redis');
  });

module.exports = () => {
    cron.schedule('*/2 * * * *', async() => {
        // console.log('criclet')
        try{
            var fullUrl = 'https://admin-api.dreamexch9.com/api/dream/cron/get-cricketdata';
            fetch(fullUrl, {
                method: 'GET'
            })
            .then(res =>{
                const contentType = res.headers.get('content-type')
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    return res.json();
                  } else {
                    // throw new Error('Response is not in JSON format');
                    return res.text();
                  }
            })
            .then(async(result) => {
                // console.log(result, "resultresultresultresultresult")
                // let date = new Date()
                let data = JSON.stringify(result)
                console.log('get cricket data cron')
                // const existingRecord = await cricketdataModel.findOne();
                await client.set('ABCDEFGHIJKCRICKET', data)
                // if (existingRecord) {
                //     await cricketdataModel.findOneAndUpdate({}, { data, date });
                // }else{
                //     await cricketdataModel.create({data,date})
                // }
            })

        }catch(err){
            console.log(err)
        }
        
    })
}