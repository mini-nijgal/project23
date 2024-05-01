/**
 * @see [https://nodejs.org/api/process.html#process_process_platform]
 */
const os = require('os')
const osName = require('os-name');
const app = {
    isWindows: () => {
        const platform = os.platform()
        const platforms = [
        'win32'
        ]
        return platforms.indexOf(platform) === -1 ? false : true
    },
    isWindowsVersion: (version) => {
        return version === osName() ? true : false
    }
}

module.exports = app