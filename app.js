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
const seteventList = require('./apistorcron/seteventlistCron')
const addLiveMarketCron = require('./apistorcron/addCricketLiveMarketCronBackup2')
const addOtherSportLiveMarketCron = require('./apistorcron/addOtherLiveMarketCronBackup')
const updateMOLiveMarketDetails = require('./apistorcron/updateMOMarketDetailsCron')
const updateMOLiveMarketDetails2 = require('./apistorcron/updateMOMarketDetailsCrone2')
const updateBMLiveMarketDetails = require('./apistorcron/updateBMMarketDetailsCron')
const setSportDataCron = require('./apistorcron/setsportdataCron')
const updateFancyCron = require('./apistorcron/updateFencyDetailsCron')
const updateLiveFanctCron2 = require('./apistorcron/updateFencyDetailsCron2')
const updateLiveFanctCron3 = require('./apistorcron/updateFencyDetailsCron3')
const updateAdvFanctCron = require('./apistorcron/updateAdvFancyCron')
const exchangePageCron = require('./apistorcron/exchangePageCron')
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

app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

seteventList()
// updateLiveMarketDetails() 
// updateLiveMarketDetails2()
// updateBMLiveMarketDetails()
addLiveMarketCron()
addOtherSportLiveMarketCron()
updateFancyCron()
// updateAdvFanctCron()
// updateLiveFanctCron2()
updateLiveFanctCron3()
// exchangePageCron()
// setSportDataCron()

app.use(morgan('dev'));
app.use("/api/v1/", APIRoutes);
app.use(globleErrorHandler);

app.listen(process.env.port, () => {
  console.log(`app is running on port ${process.env.port}`)
})
