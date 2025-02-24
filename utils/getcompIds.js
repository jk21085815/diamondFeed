const cron = require('node-cron');
const getEventIdsFunc = require('../utils/geteventIds')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setcompIdCrone.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});

const getcompIdFunc = async(sportId,sportName) => {
    cron.schedule('00 */6 * * *', async() => {
    // cron.schedule('07 12 * * *', async() => {
            console.log(`Set ${sportName} CompId Cron Started.....111111111111111111111111111111111111111111111111`)
            try{
                async function getcompitionFinc () {
                    let compIdArr = [];
                    let fetchCompData = await fetch(`http://18.171.69.133:6008/sports/competitions/list/${sportId}`,{
                        method:'GET',
                        headers:{
                            'Content-type' : 'application/json'
                        }
                    })
                    fetchCompData = await fetchCompData.json()
                    for(let j = 0;j<fetchCompData.length;j++){
                        compIdArr.push(fetchCompData[j].competition.id)
                    }
                    client.set(`crone_getCompIds_${sportName}`,JSON.stringify(compIdArr))  
                    console.log(`Set ${sportName} CompititionId Cron Ended...`) 
                    await getEventIdsFunc(sportName)
                } 
                getcompitionFinc()
            }catch(error){
                console.log(error,'Errorrr setCompIdCrone')
                getcompIdFunc(sportName)
            }
    })
}

module.exports = getcompIdFunc