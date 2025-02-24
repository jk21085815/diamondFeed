const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
exports.isProtected = catchAsync( async (req, res, next) => {
    let token 
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1].split("=")[1];
        if(!token){
            token = req.headers.authorization.split(' ')[1]
        }
        if(!token){
            token = req.headers.authorization.split('  ')[1].split("=")[1];
        }
    }
    if(!token){
        return res.status(401).json({
            status:'error',
            message:'token not exists'
        })
    }
    
    if(token !== process.env.token){
        return res.status(401).json({
            status:'error',
            message:'your token is wrong'
        })
    }
    next()
});


