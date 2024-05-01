/**
 * To Block Keyboard Access for
 * a complete Kiosk environment
 * 
 * https://www.autohotkey.com/
 * v 1.1.30.03
 */

const {app}       = require('electron')
const {execFile}  = require('child_process')
const os_platform = require('./os_platform')
const regedit     = require('./keyb.regedit')

const moduleApp = {
    init: () => {
        return new Promise((resolve, reject) => {
            let worked = false

            if (os_platform.isWindows()) {

                regedit.osWindows.regEnableKiosk()

                execFile(app.getAppPath() + '/components/keyb.win', (error, stdout, stderr) => {
                    if (error) {
                        throw error
                    }

                    console.log(`KEYB.INIT.stdout: ${stdout}`)
                    console.error(`KEYB.INIT.stderr: ${stderr}`)

                    worked = true
                })

                /*if (os_platform.isWindowsVersion('Windows 8.1')) {
                    execFile(app.getAppPath() + '/components/mrem.exe', ['--killmetro'], (error, stdout, stderr) => {
                        if (error) {
                            throw error
                        }

                        console.log(`KEYB.INIT.stdout: ${stdout}`)
                        console.error(`KEYB.INIT.stderr: ${stderr}`)

                        worked = true
                    })
                }*/

                execFile(app.getAppPath() + '/components/toggletb', ['hidetb'], (error, stdout, stderr) => {
                    if (error) {
                        throw error
                    }

                    console.log(`KEYB.INIT.stdout: ${stdout}`)
                    console.error(`KEYB.INIT.stderr: ${stderr}`)

                    worked = true
                })
            }

            resolve({'worked':worked,'callwas':'init'})
            reject(null)
        })

    },
    /**
     * Must Call when App is closed
     * remove Keyboard restrictions
     *
     * const {app, BrowserWindow} = require('electron')
     * mainWindow = new BrowserWindow()
     * mainWindow.on('close', e => {
     *     e.preventDefault()
     *     keyb.destroy()
     *     app.exit()
     * })
     *
     * @return void
     */
    destroy: () => {
        return new Promise((resolve, reject) => {
            let worked = false

            if (os_platform.isWindows()) {

                regedit.osWindows.regDisableKiosk()

                execFile(app.getAppPath() + '/components/keyb.win', ['closeapp'], (error, stdout, stderr) => {
                    if (error) {
                        throw error
                    }

                    console.log(`KEYB.DESTROY.stdout: ${stdout}`)
                    console.error(`KEYB.DESTROY.stderr: ${stderr}`)

                    worked = true
                })

                /*if (os_platform.isWindowsVersion('Windows 8.1')) {
                    execFile(app.getAppPath() + '/components/mrem.exe', ['--resexplr'], (error, stdout, stderr) => {
                        if (error) {
                            throw error
                        }

                        console.log(`KEYB.INIT.stdout: ${stdout}`)
                        console.error(`KEYB.INIT.stderr: ${stderr}`)

                        worked = true
                    })
                }*/

                execFile(app.getAppPath() + '/components/toggletb', ['showtb'], (error, stdout, stderr) => {
                    if (error) {
                        throw error
                    }

                    console.log(`KEYB.DESTROY.stdout: ${stdout}`)
                    console.error(`KEYB.DESTROY.stderr: ${stderr}`)

                    worked = true
                })
            }

            resolve({'worked':worked,'callwas':'destroy'})
            reject(null)
        })
    },
    /**
     * @see [https://stackoverflow.com/questions/21194934/node-how-to-create-a-directory-if-doesnt-exist]
     */
    backupUserSetting: (operation) => {
        if (os_platform.isWindows()) {
            if (operation==='init') {
            } else if (operation==='destroy') {
            }
        }
    }
}

regedit.osWindows.regEnsureKeys()

module.exports = moduleApp