const express = require('express');
const router = express.Router();
const APIController = require('./../controller/APIController')
const authController = require('./../controller/authorizationController')
router.get('/getothersportdata',authController.isProtected,APIController.getsportdata)
router.get('/getcricketdata',authController.isProtected,APIController.getcricketdata)
router.get('/getallsportdata',authController.isProtected,APIController.getallsportdata)
router.post('/getmarketdata',authController.isProtected,APIController.getmarketodds)
router.post('/getmarketdataInPlay',authController.isProtected,APIController.getmarketoddsInplay)
router.get('/getAllEventId',authController.isProtected,APIController.getAlleventIds)
router.get('/getEventDATA', authController.isProtected, APIController.GetALLEENTLIST)
router.get('/thatperticularMatch', authController.isProtected, APIController.thatperticularMatch)
router.post('/eventData', APIController.eventData)
router.post('/bookdata', APIController.bookdata)
router.post('/martketdata', APIController.marketData)
router.post('/cricketextramarketlist', APIController.cricketextramarketlist)
router.post('/tournamentwinner', APIController.tournamentwinner)
router.post('/underover', APIController.underover)
router.post('/addmarket', APIController.addmarket)
router.post('/updateOrAddEventDmd',APIController.addOtherEvent)
router.post('/getVirtualCricketData',APIController.getcvirtualcricketdata)
router.post('/getbookdatabymarketid', APIController.getbookdatabymarketid)

router.get('/API', APIController.APIcall);











// FOR TESTING API //
// router.get('/getcricketdata',authController.isProtected,APIController.getcricketdata)
// router.get('/geteventwisemarketdata',authController.isProtected,APIController.geteventwisemarketdata)
// router.get('/getmarketappoddsdata',authController.isProtected,APIController.getmarketappodds)
// router.get('/getmarketmoddsdata',authController.isProtected,APIController.getmarketmodds)
// router.get('/getmarketodddsbymarketid',authController.isProtected,APIController.getmarketoddsbymarketid)
// router.get('/getmarketrullebymarketid',authController.isProtected,APIController.getmarketrules)
// router.post('/getmarketresult',authController.isProtected,APIController.getmarketresult)

// Admin Panal 


module.exports = router