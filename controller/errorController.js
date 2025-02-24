const AppError = require("./../utils/AppError");
const handleCastErrorDB = err => {
    const message= `invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 404)
}
const handleJWTError = err => {
   return new AppError("Invalid token please log in again!", 401)
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate fields value: ${value}, please use onother value`
    return new AppError(message, 404);
}
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(val => val.message)
    const message =`invalid input data ${errors.join('. ')}.`;
    return new AppError(message, 404);
}

const sendErrorDev = (err, req,res) => {
    if(req.originalUrl.startsWith('/api')){
    console.log(err, "THis is the ERROR")
    return res.status(err.statusCode).json({
        status : err.status,
        error: err,
        message : err.message,
        stack: err.stack
    })
    }
    if(err.message == "Please log in to access"){
        return res.status(err.statusCode).json({
            message : err.message,
        })
    }else{
        console.log(err, "THis is the ERROR")
        let message = "Opps! Please try again later"
        if(err.message.startsWith('Cannot read properties of undefined')){
            message = "Opps! Please try again later"
        }else if(err.message.startsWith('not a valid user')){
            message = "not a valid user"
        }else {
            message = err.message
        }
        return res.status(err.statusCode).json({
            message : message,
        })
    }
}

module.exports=(err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "Error"
    if (err.name === "CastError") err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === "ValidationError") err = handleValidationErrorDB(err);
    sendErrorDev(err, req,res)
}