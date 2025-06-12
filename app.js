const express = require('express');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = express();
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const globleErrorHandler = require('./controller/errorController');
const fileUpload = require('express-fileupload');
const requestIp = require("request-ip");
const cors = require('cors');
const APIRoutes = require('./routes/APIRoutes')
const maincron = require('./apistorcron/seteventlistCron')
const updateMOBMData = require('./apistorcron/addCricketLiveMarketCronBackup2')
const updateMOBMDataOtherSport = require('./apistorcron/addOtherLiveMarketCronBackup')
const savemarketBetches = require('./apistorcron/updateMOMarketDetailsCron')
const getmarketBetches = require('./apistorcron/updateMOMarketDetailsCrone2')
const updateBMLiveMarketDetails = require('./apistorcron/updateBMMarketDetailsCron')
const updateBMLiveMarketDetails2 = require('./apistorcron/updateBMMarketDetailsCron2')
const setSportDataCron = require('./apistorcron/setsportdataCron')
const updateUCFency = require('./apistorcron/updateFencyDetailsCron')
const updateLiveFanctCron2 = require('./apistorcron/updateFencyDetailsCron2')
const updateLiveFanctCronTemp = require('./apistorcron/updateFencyDetailsCron3Backup')
const updateLiveFanctCron = require('./apistorcron/updateFencyDetailsCron3')
const updateAdvFanctCron = require('./apistorcron/updateAdvFancyCron')
const exchangePageCron = require('./apistorcron/exchangePageCron')
const liveexchangePageCron = require('./apistorcron/liveexchangePageCron')
const redis = require('redis');
const client = redis.createClient({url:process.env.redisurl});
client.connect()
client.on('error', (err) => {
    console.log(`Error(In setMarketIdsCron.js):${err}`);
});
client.on('connect', () => {
    console.log('Connected to Redis1');
});
app.use(requestIp.mw());
app.use(compression());
app.use(cors());
app.set('trust proxy', true);

app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

maincron()  // Main Cron Run Every 30 min. fetch all event data and market data
// updateMOBMData() // Update MO and BM markets and eventStatus of Cricket 
// updateMOBMDataOtherSport() // Update MO and BM markets and eventStatus of Other Sports 
// savemarketBetches()  // 200 ni bach ma MO marketIds save krva mate
// getmarketBetches()  // ae baches ne get kri ne MO market detail update krva matena Function ma pass krie chie 
// updateBMLiveMarketDetails() // BM ne 505ms update
// updateUCFency() // Upcoming Fency detail update in evenry 10 min
// updateLiveFanctCron() //Live Fency dtail update in 505ms
// exchangePageCron()  // upcoming event na exchange no data udpate thay che
// liveexchangePageCron() // live event na exchange no data udpate thay che


// updateLiveFanctCronTemp()
// updateLiveFanctCron2()
// updateAdvFanctCron()
// updateBMLiveMarketDetails2()
// setSportDataCron()

app.use(morgan('dev'));
app.use("/api/v1/", APIRoutes);
app.use(globleErrorHandler);

app.listen(process.env.port, () => {
  console.log(`app is running on port ${process.env.port}`)
})
