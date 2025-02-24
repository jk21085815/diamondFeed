const cron = require('node-cron');
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
    cron.schedule('00 29 15 * * *', async() => {
        console.log('Set Sport Data Cron Started.....')
        try{
            let fetchSportTypes = await fetch('http://18.171.69.133:6008/sports/eventtypes',{
                method:'GET',
                headers:{
                    'Content-type' : 'application/json'
                }
            })
            fetchSportTypes = await fetchSportTypes.json()
            let sportlist = fetchSportTypes.map(item => {
                item.sportName = item.name;
                item.sportId = item.id;
                delete item.name
                delete item.id
                return item
            })
            client.set('crone_getSportData',JSON.stringify(sportlist))
            console.log('Set Sport Data Cron Ended...') 
        }catch(error){
            console.log(error,'Errorrr setSportDataCrone')
        }
    })
}