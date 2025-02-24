const memoryUsage = process.memoryUsage();
const cron = require('node-cron');
module.exports = () => {
    cron.schedule('00 * * * * *', async() => {
        console.log("Heap Total:", (memoryUsage.heapTotal / 1024 / 1024).toFixed(2), "MB");
        console.log("Heap Used:", (memoryUsage.heapUsed / 1024 / 1024).toFixed(2), "MB");
        console.log("RSS:", (memoryUsage.rss / 1024 / 1024).toFixed(2), "MB");
        console.log("RSS:", memoryUsage);
    })}