const cron = require('node-cron');
const fs = require('fs')
const path = require('path')


module.exports = () => {
    let i = 1
    cron.schedule('*/1 * * * *', async() => {
        try{
            // Check file size and rename
            fs.stat('../utils/fancyArray.txt', (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }

                console.log(`File size: ${stats.size} bytes`);
                
                fs.rename('../utils/fancyArray.txt', `../utils/fancyArray${i}.txt`, (renameErr) => {
                    if (renameErr) {
                    console.error('Error renaming file:', renameErr);
                    return;
                    }
                    console.log('File renamed successfully');
                });
            });
        }catch(error){
            console.log(error,'Errorrr exchagnePageCron')
        }
        i++
    })
}
