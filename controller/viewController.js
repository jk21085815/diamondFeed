const AppError = require('./../utils/AppError');
const catchAsync = require('./../utils/catchAsync');
const fetch = require("node-fetch")
const fs = require('fs');
const path = require('path');

exports.homePage = catchAsync(async(req, res, next) => {

    res.status(200).render('index',{
        status:"success"
    })
});


exports.APIcall2 = catchAsync(async(req, res, next) => {
    // console.log("Working")
    // Example usage
    function readPem (filename) {
        return fs.readFileSync(path.resolve(__dirname, '../prev/' + filename)).toString('ascii');
      }
const privateKey = readPem('private.pem');
let body = {
    "operatorId": "sheldon",
    "userId":"6438f3b5d2eb67c8f67fe065",
    "providerName": "EZUGI",
    "platformId":"DESKTOP",
    "currency":"INR",
    "username":"user1",
    "lobby":false,
    "clientIp":"46.101.225.192",
    "gameId":"105001",
    "balance":766
   }
// console.log(privateKey)
const textToSign = JSON.stringify(body)
// console.log(privateKey, textToSign)
const hashedOutput = SHA256(privateKey, textToSign);
// console.log(hashedOutput)

    var fullUrl = 'https://dev-api.dreamdelhi.com/api/operator/login';
    fetch(fullUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Signature': hashedOutput ,
            'accept': 'application/json'
            },
        body:JSON.stringify(body)

    })
    .then(res => res.json())
    .then(result => {
        res.status(200).json({
            result
        })
    })
});

exports.getHTMLSCOREIFRm = catchAsync(async(req, res, next) => {
    res.status(200).render('./forSimpleHtmlOFSports')
})



exports.getSportList = catchAsync(async(req, res, next) => {
    var fullUrl = 'https://admin-api.dreamexch9.com/api/dream/cron/get-sportdata';
    fetch(fullUrl, {
        method: 'GET'
    })
    .then(res =>res.json())
    .then(result => {
        // let data = result.gameList.filter(item => item.sport_name == "Football")
        // let data2 = data[0].eventList.filter(item => item.eventData.type == "IN_PLAY")
        // console.log(data2[0].marketList.score[0].data)
        res.status(200).json({
            result
        })
    })
});


exports.getCricketData = catchAsync(async(req, res, next) => {
    var fullUrl = 'https://admin-api.dreamexch9.com/api/dream/cron/get-cricketdata';
    fetch(fullUrl, {
        method: 'GET'
    })
    .then(res =>res.json())
    .then(result => {
        // console.log(result)
        res.status(200).json({
            result
        })
    })
});


exports.getmarketDetailsByMarketId = catchAsync(async(req, res, next) => {
    let body = JSON.stringify(["1.223365377", "1.223365378", "4.1704946928360-BM", "4.1702115752278-OE"]);
    // console.log(body)
    var fullUrl = 'https://oddsserver.dbm9.com/dream/get_odds';
    fetch(fullUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'accept': 'application/json'
            },
        body:body 
    })
    .then(res =>res.json())
    .then(result => {
        res.status(200).json({
            result
        })
    })
});


exports.getLiveTv = catchAsync(async(req, res, next) => {
    let body = {
        ipv4 : "172.105.58.243",
        channel : "1029"
    }
    var fullUrl = 'https://score-session.dbm9.com/api/tv-stream-2';
    fetch(fullUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'accept': 'application/json' ,
            "Origin":"http://dev.ollscores.com/",
            "Referer":"http://dev.ollscores.com/"},
        body:JSON.stringify(body) 
    })
    .then(res =>res.json())
    .then(result => {
        res.status(200).json({
            result
        })
    })
});


exports.getMarketResult = catchAsync(async(req, res, next) => {
    let body = JSON.stringify([ "4.1701832199070-F2", "1.222032054", "4.1701498444440-BM", "4.1702616096118-OE", "4.1702629732107-OE", "4.1702629739420-OE"]);
    // console.log(body)
    let fullUrl = "https://admin-api.dreamexch9.com/api/dream/markets/result";
    fetch(fullUrl, {
        method: 'POST',
        body:body 
    })
    .then(res =>res.json())
    .then(result => {
        // console.log(result)
        res.status(200).json({
            result
        })
    })
})



exports.liveAllMarkets = catchAsync(async(req, res, next) => {
    // let body = JSON.stringify([ "4.1701832199070-F2", "1.222032054", "4.1701498444440-BM", "4.1702616096118-OE", "4.1702629732107-OE", "4.1702629739420-OE"]);
    // console.log(body)
    let fullUrl = "https://fbot.1cricket.co/api/Admin/getmarketsbysid/?sid=4";
    // console.log('fullUrl :', fullUrl)
    fetch(fullUrl, {
        method: 'get',
        headers: { 
            'Accept': 'application/json'
            },
        // body:body 
    })
    .then(res =>res.json())
    .then(result => {
        // console.log('result:', result)
        try{
            res.status(200).json({
                result:JSON.parse(result)
            })
        }catch(err){
            console.log(err)
        }
    })
})


exports.liveAllMarkets2 = catchAsync(async(req, res, next) => {
    // let body = JSON.stringify([ "4.1701832199070-F2", "1.222032054", "4.1701498444440-BM", "4.1702616096118-OE", "4.1702629732107-OE", "4.1702629739420-OE"]);
    // console.log(body)
    let fullUrl = "https://fbot.1cricket.co/api/Admin/getmarkets";
    // console.log('fullUrl :', fullUrl)
    fetch(fullUrl, {
        method: 'get',
        headers: { 
            'Accept': 'application/json'
            },
        // body:body 
    })
    .then(res =>res.json())
    .then(result => {
        // console.log('result:', result)
        try{
            res.status(200).json({
                result : JSON.parse(result)
            })
        }catch(err){
            console.log(err)
        }
    })
})