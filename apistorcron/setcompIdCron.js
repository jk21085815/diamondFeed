const cron = require('node-cron');
const getCompIdFunc = require('../utils/getcompIds')
const setNewEventDetails = require('../utils/setNewThisEvent')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setcompIdCrone.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});

module.exports = () => {
        try{
            // setNewEventDetails(["34058554"])
            getCompIdFunc('4','Cricket')
            getCompIdFunc('1','Soccer')
            getCompIdFunc('2','Tennis')
            getCompIdFunc('500','Election')
            getCompIdFunc('400','Kabaddi')
            getCompIdFunc('4339','GreyHound')
            getCompIdFunc('7','HorseRacing')
        }catch(error){
            console.log(error,'Errorrr setCompIdCrone')
        }
}
