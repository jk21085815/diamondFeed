const cron = require('node-cron');
const fs = require('fs')
const path = require('path')


module.exports = () => {
    let i = 1
    cron.schedule('*/1 * * * *', async() => {
        try{
            // Check file size and rename
            const filePath = path.join(__dirname, '../utils', 'fancyArray.txt');
            console.log(filePath,'filepath')

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }
                let size = stats.size/(1024 * 1024)
                console.log(`File size: ${size} bytes`);
                if(size > 100){
                    const newPath = path.join(__dirname, '../utils', `fancyArray${i}.txt`);
                    fs.rename(filePath, newPath, (renameErr) => {
                        if (renameErr) {
                        console.error('Error renaming file:', renameErr);
                        return;
                        }
                        console.log('File renamed successfully');
                    });

                }
            });
        }catch(error){
            console.log(error,'Errorrr exchagnePageCron')
        }
        i++
    })
}
