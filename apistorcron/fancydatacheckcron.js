const cron = require('node-cron');
const fs = require('fs')
const path = require('path')
const archiver = require('archiver');



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
            ensureDirSync(path.join(__dirname, '../utils/fancydata'));
            ensureDirSync(path.join(__dirname, '../utils/fancyzip'));
            async function createZip(outputFilePath, sourceDir) {
                const output = fs.createWriteStream(outputFilePath);
                const archive = archiver('zip', {
                    zlib: { level: 9 } // Sets the compression level
                });

                output.on('close', () => {
                    console.log(`${archive.pointer()} total bytes`);
                    console.log('Zip file created successfully');
                });

                archive.on('error', (err) => {
                    throw err;
                });

                archive.pipe(output);
                
                // Add entire directory
                archive.directory(sourceDir, false);
                
                // Or add specific files
                // archive.file('file1.txt', { name: 'file1.txt' });
                // archive.file('file2.jpg', { name: 'images/file2.jpg' });

                archive.finalize();
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
                if(size > 10){
                    let newPath = path.join(__dirname, '../utils/fancyzip', `fancyArray${i}.txt`);
                    let status = true
                    while(status){
                        if (fs.existsSync(newPath)) {
                            i++
                            newPath = path.join(__dirname, '../utils/fancyzip', `fancyArray${i}.txt`);
                            console.log('File exists');
                        } else {
                            console.log('File does not exist');
                            status = false
                        }
                    }
                    let newzipfile = path.join(__dirname, '../utils/fancydata', `fancyArrayzip${i}.zip`);
                    fs.rename(filePath, newPath, async(renameErr) => {
                        if (renameErr) {
                        console.error('Error renaming file:', renameErr);
                        return;
                        }
                        console.log('File renamed successfully');
                       

                        // Usage
                        await createZip(newzipfile, path.join(__dirname, '../utils/fancyzip'));
                        if (fs.existsSync(newzipfile)) {
                            fs.unlinkSync(newPath);
                            i++
                            console.log('Zip created & original file deleted successfully');
                        } else {
                            consoel.error('Zip was not created, skipping file delete');
                        }

                    });

                }
            });
        }catch(error){
            console.log(error,'Errorrr exchagnePageCron')
        }
    })
}
