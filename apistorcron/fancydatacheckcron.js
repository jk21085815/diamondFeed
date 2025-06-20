const cron = require('node-cron');
const fs = require('fs')
const path = require('path')
const archiver = require('archiver');
const AdmZip = require('adm-zip');




module.exports = () => {
    let i = 1
    cron.schedule('*/1 * * * *', async() => {
        try{
            function ensureDirSync(dirPath) {
                try {
                    fs.mkdirSync(dirPath, { recursive: true });
                    console.log(`Directory ${dirPath} created or already exists`);
                } catch (err) {
                    console.error(`Error creating directory ${dirPath}:`, err);
                    throw err;
                }
            }
            ensureDirSync(path.join(__dirname, '../utils/fancydata2'));
            ensureDirSync(path.join(__dirname, '../utils/fancydatazip'));
                // ensureDirSync(path.join(__dirname, '../utils/fancyzip'));
            function createZipWithAdmZip(inputFile, outputZip) {
                try {
                    const zip = new AdmZip();
                    
                    // Add file to zip
                    zip.addLocalFile(inputFile);
                    
                    // Write zip to file
                    zip.writeZip(outputZip);
                    
                    console.log(`Created ${outputZip} successfully`);
                    // Remove original
                    fs.unlinkSync(inputFile);
                    console.log(`Removed ${inputFile} successfully`);
                    return true;
                } catch (err) {
                    console.error('Error creating ZIP:', err);
                    return false;
                }
            }
            // Check file size and rename
            const filePath = path.join(__dirname, '../utils', 'fancyArray.txt');
            // console.log(filePath,'filepath')

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }
                let size = stats.size/(1024 * 1024)
                console.log(`File size: ${size} bytes`);
                if(size > 100 || true){
                    let newzipfile = path.join(__dirname, '../utils/fancydatazip', `fancyArrayzip${i}.zip`)
                    let status = true
                    while(status){
                        if (fs.existsSync(newzipfile)) {
                            i++
                            newzipfile = path.join(__dirname, '../utils/fancydatazip', `fancyArrayzip${i}.zip`)
                            console.log('File exists');
                        } else {
                            console.log('File does not exist');
                            status = false
                        }
                    }
                    let newPath = path.join(__dirname, '../utils/fancydata2', `fancyArray${i}.txt`);
                    fs.rename(filePath, newPath, async(renameErr) => {
                        if (renameErr) {
                        console.error('Error renaming file:', renameErr);
                        return;
                        }
                        console.log('File renamed successfully');
                        const success = createZipWithAdmZip(newPath, newzipfile);
                        if (success) console.log('Process completed');
                        i++
                    });

                }
            });
        }catch(error){
            console.log(error,'Errorrr exchagnePageCron')
        }
    })
}
