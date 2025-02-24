const express = require('express');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = express();
const compression = require('compression');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const globleErrorHandler = require('./controller/errorController');
const fileUpload = require('express-fileupload');
const requestIp = require("request-ip");
const cors = require('cors');
// const viewRoutes = require('./routes/viewRoutes');
const APIRoutes = require('./routes/APIRoutes')

// const cricketdatacron = require('./apistorcron/getcricketdatacron')
// const liveListEvent = require('./apistorcron/liveListEvent');
// const getothersportdata = require('./apistorcron/getothersportdatacron');
// const setUpcominData = require('./apistorcron/setUpcominData');
// const getallapidata = require('./apistorcron/getallapidatacron')
// const setEventIdsCron = require('./apistorcron/setEventIdsCron')
// const setMarketIdsCron = require('./apistorcron/setMarketIdsCron')
// const setFinalDataCron = require('./apistorcron/setFinalSportDataCron')
// const setMarketIdsCronTest = require('./apistorcron/setMarketIdsCronTest')
// const finalResultTest = require('./apistorcron/setFinalSportDataCronTest')
const setCompIdsCron = require('./apistorcron/setcompIdCron')
const addLiveMarketCron = require('./apistorcron/addCricketLiveMarketCronBackup2')
const addOtherSportLiveMarketCron = require('./apistorcron/addOtherLiveMarketCronBackup')
const updateLiveMarketDetails = require('./apistorcron/updateMarketDetailsCron')
const updateLiveMarketDetails2 = require('./apistorcron/updateMarketDetailsCrone2')
const setSportDataCron = require('./apistorcron/setsportdataCron')
const updateFancyCron = require('./apistorcron/updateFencyDetailsCron')
const updateLiveFanctCron2 = require('./apistorcron/updateFencyDetailsCron2')
const updateLiveFanctCron3 = require('./apistorcron/updateFencyDetailsCron3')
const updateAdvFanctCron = require('./apistorcron/updateAdvFancyCron')
const addNewCompInHRGHCron = require('./apistorcron/addCompInHRGHCron')
const setLiveFanctCron = require('./apistorcron/newEventFancySetCron')
const updateHRGHMOCron = require('./apistorcron/udpateHRGHMOCrone')
const addNewHRGHEventIdsCron = require('./apistorcron/addNewEventIdsHRGHCron')
const updateCricketMarketCron  =  require('./apistorcron/updateCricketMarketCron')
const updateOtherSportMarketCrone  =  require('./apistorcron/updateOtherSportMarketCrone')
// const updateAllSportData = require('./apistorcron/updateAllDataCrone')
const exchangePageCron = require('./apistorcron/exchangePageCron')
const logheapmemmry = require('./apistorcron/logheapmemory')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    // console.log('Connected to Redis1');
});
app.use(requestIp.mw());
app.use(compression());
app.use(cors());
app.set('trust proxy', true);

// console.log(process.env.db)
// mongoose.connect(process.env.db, {
//   maxPoolSize:5000,
//   minPoolSize:1000,
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => {
//   console.log("MongoDB connected")
// })

app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// setMarketIdsCronTest()
// finalResultTest()

// setCompIdsCron()
// updateLiveMarketDetails() 
// updateLiveMarketDetails2()
// addLiveMarketCron()
// addOtherSportLiveMarketCron()
// updateFancyCron()
// updateAdvFanctCron()
// updateLiveFanctCron2()
// exchangePageCron()

// updateLiveFanctCron3()

// updateHRGHMOCron()
// addNewHRGHEventIdsCron()
// addNewCompInHRGHCron()
// updateCricketMarketCron()
// updateOtherSportMarketCrone()
// setSportDataCron()
// setLiveFanctCron()
// updateAllSportData()
// logheapmemmry()

// setEventIdsCron()
// setMarketIdsCron()
// setFinalDataCron()
// getallapidata()
// eventCrone()
// liveListEvent()
// getothersportdata()
// setUpcominData()
// SockJSCall2()
// sportdatacron()
// getmarketIdsCRONE()
// marketodds()
// cricketdatacron()
// deleteCrone()
// eventwisemarket()
// marketresultcron()
// marketrulecron()
// marketmodds()
// marketappodds()
// marketoddsbymarketid()
// marketidsstorcron()

app.use(morgan('dev'));
app.use("/api/v1/", APIRoutes);
// app.use("/", viewRoutes);
app.use(globleErrorHandler);




// if (cluster.isMaster) {
//   const numCPUs = require('os').cpus().length;
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }
// } else {

// }
app.listen(process.env.port, () => {
  console.log(`app is running on port ${process.env.port}`)
})
