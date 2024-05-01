const {ipcRenderer, remote} = require('electron')
const isOnline = require('is-online')
const $ = require('jquery')
const autoUpdater = remote.getGlobal('autoUpdater')
const checkForUpdates = () => {
    autoUpdater.on('checking-for-update', () => {
        console.log('SPLASH::CHECKING FOR UPDATE...')
    })
    autoUpdater.on('update-available', (ev, info) => {
        console.log('SPLASH::UPDATE AVAILABLE.')
    })
    autoUpdater.on('update-not-available', (ev, info) => {
        console.log('SPLASH::UPDATE NOT AVAILABLE.')
        setTimeout(() => {
            ipcRenderer.send('closeSplash', {})
        }, 3000)
    })
    autoUpdater.on('error', (ev, err) => {
        console.log('SPLASH::ERROR IN AUTO-UPDATER.', err)
        setTimeout(() => {
            ipcRenderer.send('closeSplash', {})
        }, 3000)
    })
    autoUpdater.on('download-progress', (ev, progressObj) => {
        console.log('SPLASH::DOWNLOAD PROGRESS...')
    })
    autoUpdater.on('update-downloaded', (ev, info) => {
        alert("A new update is available. Please wait we are upgrading this software.")
        setTimeout(function () {
            autoUpdater.quitAndInstall()
        }, 1000)
    })
    autoUpdater.checkForUpdates()
}
const runWhenReady = async () => {
    const isOnlineStatus = await isOnline()
    isOnlineStatus ? checkForUpdates() : setTimeout(runWhenReady, 10 * 1000);
}
$(document).ready(runWhenReady)