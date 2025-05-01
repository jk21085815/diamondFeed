const express = require('express');
const router = express.Router();
const viewController = require('./../controller/viewController')

// FOR TESTING API //
router.get('/', viewController.homePage);
router.get('/API2', viewController.APIcall2);
router.get("/sportDetails", viewController.getSportList);
router.get("/getCricketData", viewController.getCricketData);
// router.get("/getFootballData", viewController.getFootballData);
router.get("/getMarketDetails", viewController.getmarketDetailsByMarketId);
router.get("/getLiveTv", viewController.getLiveTv);
router.get("/getMarketResult", viewController.getMarketResult);
router.get("/htmlDATA", viewController.getHTMLSCOREIFRm);
router.get('/liveMarkets', viewController.liveAllMarkets)
router.get('/liveAllMarkets2', viewController.liveAllMarkets2)

// Admin Panal 


module.exports = router