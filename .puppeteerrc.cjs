const { join } = require('path');
const executablePath = process.env.NODE_ENV === 'production' ? '/usr/bin/google-chrome-stable' : 'chrome'
// Tells puppeteer to expect chrome installed on the system
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    executablePath,
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
}; 
