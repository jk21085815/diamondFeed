// utils/logger.js
const fs = require('fs');
const path = require('path');

// Create the write stream ONCE and reuse it
const logFile = path.join(__dirname, 'logs.txt');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(data, label = 'LOG') {
    const timestamp = new Date().toISOString();
    const message = typeof data === 'object' ? JSON.stringify(data) : data;

    logStream.write(`[${label}] [${timestamp}] ${message}\n`);
}

// Optional: handle stream errors
logStream.on('error', (err) => {
    console.error('Log stream error:', err);
});

process.on('exit', () => {
    logStream.end('Log stream closed.\n');
});

module.exports = { log };
