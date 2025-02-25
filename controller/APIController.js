const cricketdataModel = require('../model/cricketdataModel')
const eventwisemarketdataModel = require('../model/eventwisemarketdata')
const marketappoddsModel = require('../model/getmarketappodds')
const marketmoddsModel = require('../model/getmarketmodds')
const marketoddsModel = require('../model/getmarketodds')
const marketoddsbymarketidModel = require('../model/getmarketoddsbymarketid')
const marketrulesModel = require('../model/getmarketrules')
const marketresultModel = require('../model/marketresultModel')
const sportdataModel = require('../model/sportdataModel')
const marketidsstoreModel = require('../model/marketidstoreModel')
const catchAsync = require('../utils/catchAsync')
const redis = require('redis');
const { json } = require('body-parser')
const client = redis.createClient({url:process.env.redisurl});
client.connect()



exports.getcricketdata = catchAsync(async(req,res,next)=>{
    // let data = await cricketdataModel.find({}).sort({date:-1}).limit(1)
    let data =  await client.get('ABCDEFGHIJKCRICKET');
    // console.log(data)
    try{
        let result = JSON.parse(data)
        res.status(200).json({
            result
        })
    }catch(err){
        console.log(err)
        // let data = await cricketdataModel.find({}).sort({date:-1}).limit(1)
        // let result = JSON.parse(data[0].data)
        // res.status(200).json({
        //     result
        // })
    }
})

exports.getsportdata = catchAsync(async(req,res,next)=>{
    // let data = await sportdataModel.find({}).sort({date:-1}).limit(1)
    try{
        let data =  await client.get('ABCDEFGHIJKSPORT');
        // console.log(data, "data2data2")
        let result = JSON.parse(data)
        res.status(200).json({
            status:'success',
            result
        })
    }catch(err){
        console.log(err)
        // let data = await sportdataModel.find({}).sort({date:-1}).limit(1)
        // let result = JSON.parse(data[0].data)
        // res.status(200).json({
        //     result
        // })
    }
})
exports.getothersportdata = catchAsync(async(req,res,next)=>{
    // let data = await sportdataModel.find({}).sort({date:-1}).limit(1)
    try{
        let data =  await client.get('ABCDEFGHIJKSPORT11');
        // console.log(data, "data2data2")
        let result = JSON.parse(data)
        res.status(200).json({
            status:'success',
            result
        })
    }catch(err){
        console.log(err)
        // let data = await sportdataModel.find({}).sort({date:-1}).limit(1)
        // let result = JSON.parse(data[0].data)
        // res.status(200).json({
        //     result
        // })
    }
})

exports.getallsportdata = catchAsync(async(req, res, next)=>{
     // let data = await cricketdataModel.find({}).sort({date:-1}).limit(1)
     let data =  await client.get('allsportdata');
     // console.log(data)
     try{
         let result = JSON.parse(data)
         res.status(200).json({
            status:'success',
            result:result.result
         })
     }catch(err){
         console.log(err)
         // let data = await cricketdataModel.find({}).sort({date:-1}).limit(1)
         // let result = JSON.parse(data[0].data)
         // res.status(200).json({
         //     result
         // })
     }
})

exports.getAlleventIds = catchAsync(async(req, res, next) => {
    let data =  await client.get('allsportdata');
    let result = JSON.parse(data)
    result = result.result
    let allData = []
    if(result){
        cricketdata = result.find(item => item.sportId == 4 )
        footballdata = result.find(item => item.sportId == 1 )
        tennissdata = result.find(item => item.sportId == 2 )
        allData = cricketdata.events.concat(footballdata.events, tennissdata.events)
        allData = allData.map(item => {
            if(item.eventId){
                let data = {
                    eventId: item.eventId,
                    sportId : item.sportId
                }
                return data
            }
        })
    }
    // console.log(allData, 'resultresult')
    res.status(200).json({
            result:allData
    })
})


exports.GetALLEENTLIST = catchAsync(async(req, res, next) => {
    let data =  await client.get('ALLEVENTS');
    // console.log(data)
    let result = JSON.parse(data)
    // console.log(result)
    res.status(200).json({
        result
    })
})

exports.geteventwisemarketdata = catchAsync(async(req,res,next)=>{
    let data
    let result
    try{
        if(req.query.eventId){
            data = await eventwisemarketdataModel.find({eventId:req.query.eventId}).sort({date:-1}).limit(1)
            if(data.length != 0){
                result = JSON.parse(data[0].data)
            }
        }
        res.status(200).json({
            result
        })

    }catch(err){
        console.log(err)
    }
})
exports.getmarketappodds = catchAsync(async(req,res,next)=>{
    try{
        let data = await marketappoddsModel.find({}).sort({date:-1}).limit(1)
        let result = JSON.parse(data[0].data)
        res.status(200).json({
            result
        })

    }catch(err){
        console.log(err)
    }
})
exports.getmarketmodds = catchAsync(async(req,res,next)=>{
    try{
        let data = await marketmoddsModel.find({}).sort({date:-1}).limit(1)
        let result = JSON.parse(data[0].data)
        res.status(200).json({
            result
        })

    }catch(err){
        console.log(err)
    }
})
exports.getmarketodds = catchAsync(async(req,res,next)=>{
    // console.log(req.body, "getmarketoddsgetmarketoddsgetmarketodds")
    let data =  await client.get('allsportdata');
    console.log(data,'datadata')
    data = JSON.parse(data)
    // console.log(data, 'datadatda')
    let cricketdata
    let footballdata
    let tennissdata 
    let sportData = ['1', '2', '3']
    let allData = []
    if(data.result){
        cricketdata = data.result.find(item => item.sportId == 4 )
        footballdata = data.result.find(item => item.sportId == 1 )
        tennissdata = data.result.find(item => item.sportId == 2 )
        allData = cricketdata.events.concat(footballdata.events, tennissdata.events)
    }
    // console.log(allData)
    let sendData = allData.filter(item => req.body.marketids.includes(item.eventId) && item.markets.matchOdds != null && item.markets.matchOdds.length != 0)
    // console.log(sendDsendDataata,'jkjkjkjkj')
    sendData = sendData.map(function(item) {
        return item.markets.matchOdds;
    });

    res.status(200).json({
        result : sendData
    })
    // let data;

    // let result;
    // try{
    //     if(req.body.marketids && Array.isArray(req.body.marketids)){
    //         // data = await marketoddsModel.find({}).sort({date:-1}).limit(1)
    //         // data = await marketoddsModel.findOne({}, {}, { sort: { 'date': -1 } }).lean();
    //         // result = JSON.parse(data.data)
    
    //         //     console.log('WORKING2')
    //         const value = await client.get('ABCDEFGHIJK');
    //         // console.log(value, "valuevaluevaluevaluevalue")
    //         result = JSON.parse(value)
    //         // await client.disconnect();
    //         console.log(result.data)
    //         let items2 = []
    //         if(result.data){
    //             items2 =  result.data.items.filter(item => req.body.marketids.includes(item.market_id))

    //         }
    //         // console.log(items2)
    //         result.data.items = items2
    //         // console.log(result,'result')
    //     }
    //     res.status(200).json({
    //         result
    //     })
    // }catch(err){
    //     console.log(err)
    //     // data = await marketoddsModel.findOne({}, {}, { sort: { 'date': -1 } }).lean();
    //     // result = JSON.parse(data.data)
    //     // let items2 =  result.data.items.filter(item => req.body.marketids.includes(item.market_id))
    //     // result.data.items = items2
    //     // res.status(200).json({
    //     //     result
    //     // })
    // }
})

exports.getmarketoddsInplay = catchAsync(async(req,res,next)=>{
    // console.log(req.body, "getmarketoddsgetmarketoddsgetmarketodds")
    let data =  await client.get('allsportdata');
    // console.log(data)
    data = JSON.parse(data)
    // console.log(data, 'datadatda')
    let cricketdata
    let footballdata
    let tennissdata 
    let sportData = ['1', '2', '3']
    let allData = []
    if(data.result){
        cricketdata = data.result.find(item => item.sportId == 4 )
        footballdata = data.result.find(item => item.sportId == 1 )
        tennissdata = data.result.find(item => item.sportId == 2 )
        allData = cricketdata.events.concat(footballdata.events, tennissdata.events)
    }
    // console.log(allData)
    let sendData = allData.find(item => item.eventId == req.body.eventId )
    // console.log(sendDsendDataata,'jkjkjkjkj')

    res.status(200).json({
        result : sendData
    })
})
exports.getmarketoddsbymarketid = catchAsync(async(req,res,next)=>{
    let data
    let result
    try{
        if(req.query.marketid){
            data = await marketoddsbymarketidModel.find({marketId:req.query.marketid}).sort({date:-1}).limit(1)
            if(data.length != 0){
                result = JSON.parse(data[0].data)
            }
        }
        res.status(200).json({
            result
        })

    }catch(err){
        console.log(err)
    }
})
exports.getmarketrules = catchAsync(async(req,res,next)=>{
    let data
    let result
    try{
        if(req.query.marketid){
            data = await marketrulesModel.find({marketId:req.query.marketid}).sort({date:-1}).limit(1)
            if(data.length != 0){
                result = JSON.parse(data[0].data)
            }
        }
        res.status(200).json({
            result
        })

    }catch(err){
        console.log(err)
    }
})
exports.getmarketresult = catchAsync(async(req,res,next)=>{
    let data
    let result
    let outputarray = []
    try{
        if(req.body.marketids && Array.isArray(req.body.marketids)){
            data = await marketresultModel.find().sort({"date":-1}).limit(1)
            if(data.length != 0){
                let marketIds = await marketidsstoreModel.findOne({})
                let includestatus = marketIds.marketIds.filter(element => req.body.marketids.includes(element))
                if(includestatus.length !== 0){
                    result = JSON.parse(data[0].data)
                    result.data.map(item => {
                        if(req.body.marketids.includes(item.mid)){
                            outputarray.push(item)
                        }
                    })
                    result.data = outputarray
                }
            }
        }
        res.status(200).json({
            result
        })
    }catch(err){
        console.log(err, "ERRRRRRR")
    }
})



exports.thatperticularMatch = catchAsync(async(req, res, next) => {
    try{
        console.log(req.query, 'ghothkjhkjhkjhkj')
        let data =  await client.get('ALLEVENTS');
        let result = JSON.parse(data)
        if(req.query.id){
            let thatMatch = result.find(item => item.eventId == req.query.id)
            res.status(200).json({
                thatMatch
            })
        }
    }catch(err){
        console.log(err)
    }
})
exports.eventData = catchAsync(async(req, res, next) => {
    let fetchMarketData
    try{
        fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/events/${req.body.eventId}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        // console.log(new Date(),i,eventIds[i],'iiiiiiiii')
        fetchMarketData = await fetchMarketData.json()
    }catch(err){
        console.log(err)
    }
    res.status(200).json({
        status:'success',
        data:fetchMarketData
    })
})
exports.bookdata = catchAsync(async(req, res, next) => {
    let fetchMarketData
    try{
        fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/books/${req.body.marketId}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        // console.log(new Date(),i,eventIds[i],'iiiiiiiii')
        fetchMarketData = await fetchMarketData.json()
    }catch(err){
        console.log(err)
    }
    res.status(200).json({
        status:'success',
        data:fetchMarketData
    })
})

exports.marketData = catchAsync(async(req, res, next) => {
    let fetchMarketData
    try{
        fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/markets/${req.body.marketId}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        // console.log(new Date(),i,eventIds[i],'iiiiiiiii')
        fetchMarketData = await fetchMarketData.json()
    }catch(err){
        console.log(err)
    }
    res.status(200).json({
        status:'success',
        data:fetchMarketData
    })
})
exports.marketData = catchAsync(async(req, res, next) => {
    let fetchMarketData
    try{
        fetchMarketData = await fetch(` http://18.171.69.133:6008/sports/markets/${req.body.marketId}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        // console.log(new Date(),i,eventIds[i],'iiiiiiiii')
        fetchMarketData = await fetchMarketData.json()
    }catch(err){
        console.log(err)
    }
    res.status(200).json({
        status:'success',
        data:fetchMarketData
    })
})
exports.cricketextramarketlist = catchAsync(async(req, res, next) => {
    let fetchMarketData
    try{
        fetchMarketData = await fetch(` http://13.42.165.216/betfair/cricket_extra_market_list/${req.body.eventId}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        // console.log(new Date(),i,eventIds[i],'iiiiiiiii')
        console.log(fetchMarketData,'fetcvhMarketdataaaaaaa')
        fetchMarketData = await fetchMarketData.json()
        console.log(fetchMarketData,'fetcvhMarketdataaaaaaa22222222')
    }catch(err){
        console.log(err)
    }
    res.status(200).json({
        status:'success',
        data:fetchMarketData
    })
})
exports.tournamentwinner = catchAsync(async(req, res, next) => {
    let fetchMarketData
    try{
        fetchMarketData = await fetch(` http://13.42.165.216/betfair/tournament_winner/${req.body.eventId}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        // console.log(new Date(),i,eventIds[i],'iiiiiiiii')
        console.log(fetchMarketData,'fetcvhMarketdataaaaaaa')
        fetchMarketData = await fetchMarketData.json()
        console.log(fetchMarketData,'fetcvhMarketdataaaaaaa22222222')
    }catch(err){
        console.log(err)
    }
    res.status(200).json({
        status:'success',
        data:fetchMarketData
    })
})
exports.underover = catchAsync(async(req, res, next) => {
    let fetchMarketData
    try{
        fetchMarketData = await fetch(` http://13.42.165.216/betfair/under_over_goal_market_list/${req.body.eventId}`,{
            method: 'GET',
            headers: {
                'Content-type': 'application/json',
            }
        })
        // console.log(new Date(),i,eventIds[i],'iiiiiiiii')
        console.log(fetchMarketData,'fetcvhMarketdataaaaaaa')
        fetchMarketData = await fetchMarketData.json()
        console.log(fetchMarketData,'fetcvhMarketdataaaaaaa222222222')
    }catch(err){
        console.log(err)
    }
    res.status(200).json({
        status:'success',
        data:fetchMarketData
    })
})

// exports.thatperticularMatch = catchAsync(async(req, res, next) => {
//     try{
//         console.log(req.query, 'ghothkjhkjhkjhkj')
//         let data =  await client.get('ALLEVENTS');
//         let result = JSON.parse(data)
//         if(req.query.id){
//             let thatMatch = result.find(item => item.eventId == req.query.id)
//             res.status(200).json({
//                 thatMatch
//             })
//         }
//     }catch(err){
//         console.log(err)
//     }
// })

