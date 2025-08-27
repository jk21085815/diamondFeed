const cron = require('node-cron');
const getEventListFunc = require('../utils/geteventlist')
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
            getEventListFunc('4','Cricket')
            getEventListFunc('1','Soccer')
            getEventListFunc('2','Tennis')
            getEventListFunc('4339','GreyHound')
            getEventListFunc('7','HorseRacing')
            getEventListFunc('99994','Kabaddi')
            // getEventListFunc('500','Election')
        }catch(error){
            console.log(error,'Errorrr setCompIdCrone')
        }
}
