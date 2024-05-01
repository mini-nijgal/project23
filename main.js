const electron  = require('electron')
const {app}     = electron

const gotTheLock = app.requestSingleInstanceLock()

if ( ! gotTheLock) {
    app.quit()
} else {
    global.GISLE = null
    global.autoUpdater = null
    global.mainWindow = null
    global.dialogWindow = null

    const {BrowserWindow, ipcMain, globalShortcut, BrowserView} = electron
    const fs            = require('fs')
    const path          = require('path')
    const {execFile}    = require('child_process')
    const {autoUpdater} = require('electron-updater')
    const uuidv4        = require('uuid/v4')
    const isOnline      = require('is-online')
    const config        = require('./app/config/config')
    const dbMysql       = require('./app/plugins/db.mysql')
    const keyb          = require('./app/plugins/keyb')
    const gMonitor      = require('./app/plugins/gameplay.monitor')
    const aplhaCap      = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']

    global.GISLE = {}
    global.autoUpdater = autoUpdater

    let mainWindow   = null
    let splashWindow = null
    let dialogWindow = null
    let mwBrowserView = null

    const createWindow = () => {
        const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize

        mainWindow = new BrowserWindow({
            width,
            height,
            backgroundColor: '#2e2c29',
            icon: path.join(__dirname, './assets/img/logo/square_125x125.png'),
            webPreferences: {
                nodeIntegration: true,
                partition: "persist:"+uuidv4()
            }
        })

        mainWindow.removeMenu()

        /**
         * @see [https://discuss.atom.io/t/is-there-a-way-to-block-popups/44648/2]
         * @see [https://electronjs.org/docs/api/web-contents#event-new-window]
         */
        mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
            event.preventDefault()
            mainWindow.loadURL(url, {
                userAgent: config.browseWebUserAgent
            })
        })

        mainWindow.once('did-finish-load', () => {
            dialogWindow.hide()
        })

        mainWindow.on('closed', () => {
            mainWindow = null
            global.mainWindow = null
        })

        mainWindow.on('close', e => {
            e.preventDefault()

            if (global.GISLE.isClosable) {
                app.exit()
            }
        })

        mainWindow.loadURL(global.GISLE.loadURL ? global.GISLE.loadURL : config.apiUrl+'api/cafe/wv/login', {
            userAgent: config.browseWebUserAgent
        })

        global.GISLE.isClosable = true
        global.GISLE.kioskCallwas = ''
        global.mainWindow = mainWindow

        _kiosk(true)

        gMonitor.listGames()
        gMonitor.startClock()

        let accelerator = 'Shift+CommandOrControl+Alt+F1'
        globalShortcut.register(accelerator, () => {
            mainWindow.webContents.openDevTools()
        })

        accelerator = 'Shift+CommandOrControl+Alt+F2'
        globalShortcut.register(accelerator, () => {
            if (mwBrowserView !== null) {
                mwBrowserView.webContents.openDevTools()
            }
        })
    }

    const loadSplashWindow = () => {
        splashWindow = new BrowserWindow({
            width: 480,
            height: 320,
            frame: false,
            resizable: false,
            transparent: true,
            icon: path.join(__dirname, './assets/img/logo/square_125x125.png'),
            webPreferences: {
                nodeIntegration: true
            }
        })

        /*splashWindow.webContents.openDevTools()*/

        splashWindow.removeMenu()

        splashWindow.loadFile('./app/screens/splash/splash.html')

        splashWindow.on('closed', () => {
            splashWindow = null
        })
    }

    const loadDialogWindow = async () => {
        dialogWindow = new BrowserWindow({
            width: 480,
            height: 320,
            show: false,
            resizable: false,
            icon: path.join(__dirname, './assets/img/logo/square_125x125.png'),
            webPreferences: {
                nodeIntegration: true
            }
        })

        /*dialogWindow.webContents.openDevTools()*/

        dialogWindow.removeMenu()

        dialogWindow.loadFile('./app/screens/config.tool/config.tool.html')

        dialogWindow.webContents.once('did-finish-load', () => {
            dialogWindow.webContents.executeJavaScript(`localStorage.getItem('keyp')`)
            .then((result) => {
                splashWindow.close()

                if (aplhaCap.indexOf(result) !== -1) {
                    const accelerator = 'Shift+CommandOrControl+Alt+'+result
                    globalShortcut.register(accelerator, forceExitKiosk)
                }

                dialogWindow.webContents.send('gisle-localp-lookup', {})
            })
        })

        dialogWindow.on('closed', () => {
            dialogWindow = null
            global.dialogWindow = null
        })

        dialogWindow.on('close', e => {
            e.preventDefault()

            if (mainWindow === null) {
                app.exit()
            }
        })

        global.dialogWindow = dialogWindow
    }

    const forceExitKiosk = () => {
        if ( ! global.GISLE.isClosable) {
            if (global.GISLE.swalPrompt) {
                mainWindow.webContents.send('gisle-unlock-prompt-enter', {})
            }
        } else {
            if ( ! mainWindow.isKiosk()) {
                _kiosk(true)
            }
        }
    }

    const _kiosk = (booleano) => {
        if (
            ((booleano === true) && (global.GISLE.kioskCallwas === 'destroy' || global.GISLE.kioskCallwas === '')) || 
            ((booleano === false) && (global.GISLE.kioskCallwas === 'init'))
            ) {
        } else {
            return
        }

        console.log('_KIOSK.BOOLEANO',booleano)

        mainWindow.setKiosk(booleano)
        mainWindow.setClosable(!booleano)
        /*mainWindow.setAlwaysOnTop(booleano)*/
        mainWindow.setMinimizable(!booleano)

        keybPromise = booleano===true ? keyb.init() : keyb.destroy()

        keybPromise.then((response) => {
            global.GISLE.kioskCallwas = response.callwas
            global.GISLE.isClosable = (!booleano)
        })
    }

    const appSecondInstance = (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore()
            }
            mainWindow.focus()
        }
    }

    const appWindowAllClosed = function () {
        if (process.platform !== 'darwin') app.quit()
    }

    const appActivate = function () {
        if (mainWindow === null) loadSplashWindow()
    }

    const ipcmCloseSplash = (event, arg) => {
        splashWindow.hide()
        loadDialogWindow()
    }

    const ipcmLocalpFound = (event, arg) => {
        if (arg.found) {
            dialogWindow.hide()

            if (arg.cafeLogin) {
                global.GISLE.loadURL = config.baseUrl+'player-app/v1'
            }

            createWindow()
        } else {
            dialogWindow.show()
        }
    }

    const ipcmLocalpRegister = (event, arg) => {
        if (aplhaCap.indexOf(arg.key) === -1) {
            dialogWindow.webContents.executeJavaScript(`localStorage.removeItem('localp')`)
        } else {
            dialogWindow.hide()

            dialogWindow.webContents.send('gisle-localk-register', {
                key: arg.key
            })

            const accelerator = `Shift+CommandOrControl+Alt+${arg.key}`

            globalShortcut.register(accelerator, forceExitKiosk)

            createWindow()
        }
    }

    const ipcmUnlockPromptVerify = (event, arg) => {
        let password = arg.password
        password = password.toString()

        dialogWindow.webContents.send('gisle-unlock-prompt-true', {
            password: password
        })
    }

    const ipcmUnlockPromptFalse = (event, arg) => {
        mainWindow.webContents.send('gisle-swal-toast', {
            type: 'error',
            title: 'Incorrect Password'
        })
    }

    const ipcmLock = (event, arg) => {
        if (arg.password) {
            dialogWindow.webContents.executeJavaScript(`localStorage.setItem('serverp', ${arg.password})`)
            .then((result) => {
                _kiosk(true)
            })
        } else {
            _kiosk(true)
        }
    }

    const ipcmUnlock = (event, arg) => {
        if (arg.case=='1') {
            mainWindow.webContents.send('gisle-swal-toast', {
                type: 'success',
                title: 'Exit successful'
            })
        }
        _kiosk(false)
    }

    const ipcmCisleSetup = (event, arg) => {
        if (arg.cafeId) {
            const cafeId = parseInt(arg.cafeId)
            if ( ! isNaN(cafeId)) {
                dialogWindow.webContents.executeJavaScript(`localStorage.setItem('cafeId', ${cafeId})`)
                event.reply('gisle-bcjs-isle-setup', {})
            }
        }
    }

    const ipcmPisleInfoRequest = (event, arg) => {
        dialogWindow.webContents.executeJavaScript(`localStorage.getItem('cafeId')`)
        .then((result) => {
            mainWindow.webContents.send('gisle-bpjs-isle-info-response', {
                cafeId: result,
                payload: arg.payload
            })
        })
    }

    const ipcmPgameplayStart = (event, arg) => {
        gMonitor.startGame(arg.gameId)
    }

    const ipcmPbrowseWeb = (event, arg) => {

        global.GISLE.swalPrompt = (!arg.toggle)

        if (arg.destroy && arg.toggle) {
            console.log('bw.case1')
        } else if (!arg.destroy && !arg.toggle) {
            if (mwBrowserView !== null && mwBrowserView.setBounds) {
                mwBrowserView.setBounds({ x: 0, y: 0, width: 0, height: 0 })
            }
        } else if (arg.destroy && !arg.toggle) {
            if (mwBrowserView !== null) {
                mwBrowserView.destroy()
                mwBrowserView = null
            }
            gMonitor.userLoggedOut()
        } else if (!arg.destroy && arg.toggle) {
            if (mwBrowserView === null) {

                /**
                 * @see [https://stackoverflow.com/questions/8206269/how-to-remove-http-from-a-url-in-javascript#answer-8206299]
                 */
                const trimHttps = (url) => {
                    return url.replace(/(^\w+:|^)\/\//, '')
                }

                mwBrowserView = new BrowserView({
                    webPreferences: {
                        nodeIntegration: false,
                        partition: "persist:"+uuidv4(),
                        allowDisplayingInsecureContent: true,
                        allowRunningInsecureContent: true,
                        "web-security": false
                    }
                })

                mainWindow.setBrowserView(mwBrowserView)
                mwBrowserView.webContents.loadURL(config.browseWebUrl, {
                    userAgent: config.browseWebUserAgent
                })
                mwBrowserView.webContents.on('new-window', (event, url, frameName, disposition, options) => {
                    event.preventDefault()
                    mwBrowserView.webContents.loadURL(url, {
                        userAgent: config.browseWebUserAgent
                    })
                })
                mwBrowserView.webContents.on('did-finish-load', () => {

                    mwBrowserView.webContents.insertCSS('html, body { background: #fff !important; }')

                    mainWindow.webContents.send('gisle-bpjs-bw-new-url', {
                        url: trimHttps(mwBrowserView.webContents.getURL())
                    })
                })
            }

            ipcmToggleMenu(null, {toggle: true})
        }
    }

    const ipcmPbalanceLow = (event, arg) => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.send('gisle-swal-toast', {
            type: 'error',
            title: 'Your are low on Balance. Please add balance to Login'
        })
        setTimeout(() => {
            mainWindow.send('gisle-bpjs-logout', {})
        }, 2000)
    }

    const ipcmBwGoSearch = (event, arg) => {
        /**
         * @see [https://stackoverflow.com/questions/4460586/javascript-regular-expression-to-check-for-ip-addresses#answer-27434991]
         */
        const validIPaddr = (ipaddress) => {
            return (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))
            ? true : false
        }
        const hasHttp = (url) => {
            return null === url.match(/(http(s)?:\/\/.)/g)
            ? false : true
        }
        const urlOk = (url) => {
            return null === url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
            ? false : true
        }
        if (!arg.url) {
            event.reply('gisle-bpjs-bw-error', {
                message: 'URL is required'
            })
        } else if (validIPaddr(arg.url)) {
            event.reply('gisle-bpjs-bw-error', {
                message: 'IP address are not allowed, please use domain name'
            })
        } else if (hasHttp(arg.url)) {
            event.reply('gisle-bpjs-bw-error', {
                message: 'Please do not include http:// or https://'
            })
        } else if (!urlOk(arg.url)) {
            event.reply('gisle-bpjs-bw-error', {
                message: 'URL is invalid'
            })
        } else {
            if (mwBrowserView !== null) {
                mwBrowserView.webContents.loadURL(config.browseWebSearchPrefix + arg.url, {
                    userAgent: config.browseWebUserAgent
                })
            }
        }
    }

    const ipcmBwGoBack = (event, arg) => {
        if (mwBrowserView !== null && mwBrowserView.webContents.canGoBack()) {
            mwBrowserView.webContents.goBack()
        }
    }

    const ipcmBwGoForward = (event, arg) => {
        if (mwBrowserView !== null && mwBrowserView.webContents.canGoForward()) {
            mwBrowserView.webContents.goForward()
        }
    }

    const ipcmBwGoReload = (event, arg) => {
        if (mwBrowserView !== null) {
            mwBrowserView.webContents.reload()
        }
    }

    const ipcmBwGoHome = (event, arg) => {
        if (mwBrowserView !== null) {
            mwBrowserView.webContents.loadURL(config.browseWebUrl, {
                userAgent: config.browseWebUserAgent
            })
        }
    }

    const ipcmToggleMenu = (event, arg) => {
        if (mwBrowserView !== null) {
            mwBrowserView.setBounds({ x: 0, y: 0, width: 0, height: 0 })

            const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
            const prcntAmt = (prcnt, total) => {
                return Math.round(prcnt * total / 100)
            }
            const cnfg = {
                x: 300,
                y: 45,
                width: 0,
                height: prcntAmt(99, height)
            }

            if (arg.toggle === true) {
                cnfg.x = 5
                cnfg.width = prcntAmt(99, width)
            } else {
                if (width <= 1152) {
                    cnfg.width = prcntAmt(70, width)
                } else if (width <= 800) {
                    cnfg.width = prcntAmt(60, width)
                } else {
                    cnfg.width = prcntAmt(75, width)
                }
            }

            setTimeout(()=>{
                mwBrowserView.setBounds(cnfg)
            }, 501)
        }
    }

    const ipcmFappStart = async (event, arg) => {
        const gDetails = await dbMysql.fappsDetails(arg.appId)
        if (gDetails) {
            fs.access(gDetails.app_exe_path, fs.constants.F_OK, (err) => {
                if (err) {
                    mainWindow.webContents.send('gisle-swal-toast', {
                        type: 'error',
                        title: 'App is not installed on this machine!'
                    })
                } else {
                    const child = execFile(gDetails.app_exe_path, (error, stdout, stderr) => {
                    })
                    if (child.pid) {
                        setTimeout(() => {
                            mainWindow.blur()
                        }, (5 * 1000))
                    }
                }
            })
        } else {
            mainWindow.webContents.send('gisle-swal-toast', {
                type: 'error',
                title: 'App details missing on server!'
            })
        }
    }

    app.on('second-instance', appSecondInstance)
    app.on('ready', loadSplashWindow)
    app.on('window-all-closed', appWindowAllClosed)
    app.on('activate', appActivate)

    ipcMain.once('closeSplash', ipcmCloseSplash)

    ipcMain.on('gisle-localp-found', ipcmLocalpFound)
    ipcMain.on('gisle-localp-register', ipcmLocalpRegister)

    ipcMain.on('gisle-unlock-prompt-verify', ipcmUnlockPromptVerify)
    ipcMain.on('gisle-unlock-prompt-false', ipcmUnlockPromptFalse)

    ipcMain.on('gisle-lock', ipcmLock)
    ipcMain.on('gisle-unlock', ipcmUnlock)

    ipcMain.on('gisle-bcjs-isle-setup', ipcmCisleSetup)

    ipcMain.on('gisle-bpjs-isle-info-request', ipcmPisleInfoRequest)
    ipcMain.on('gisle-bpjs-gameplay-start', ipcmPgameplayStart)
    ipcMain.on('gisle-bpjs-browse-web', ipcmPbrowseWeb)
    ipcMain.on('gisle-bpjs-balance-low', ipcmPbalanceLow)
    ipcMain.on('gisle-bpjs-bw-go-search', ipcmBwGoSearch)
    ipcMain.on('gisle-bpjs-bw-go-back', ipcmBwGoBack)
    ipcMain.on('gisle-bpjs-bw-go-forward', ipcmBwGoForward)
    ipcMain.on('gisle-bpjs-bw-go-reload', ipcmBwGoReload)
    ipcMain.on('gisle-bpjs-bw-go-home', ipcmBwGoHome)
    ipcMain.on('gisle-bpjs-bw-toggle-menu', ipcmToggleMenu)
    ipcMain.on('gisle-bpjs-fapp-start', ipcmFappStart)
}