const electron = require('electron')
const {execFile, spawn} = require('child_process')
const fs = require('fs')
const tasklist = require('tasklist')
const dbMysql = require('./db.mysql')
const gMon = {}

gMon.listGames = async () => {
    const gameList = await dbMysql.gameList()
    for (let i in gameList) {
        const game = gameList[i]['game_id']
        if ( ! global.gpMonitor.gamesDetails[game]) {
            global.gpMonitor.gamesDetails[game] = gameList[i]
        }
    }
}

gMon.userLoggedOut = async () => {
    const fpathList = await dbMysql.fappsPathList()
    const argImageName = []
    if (fpathList) {
        for (var i = 0; i < fpathList.length; i++) {
            argImageName.push("/IM")
            argImageName.push(fpathList[i])
        }
    }
    for (let i in global.gpMonitor.gamesDetails) {
        argImageName.push("/IM")
        argImageName.push(global.gpMonitor.gamesDetails[i]['game_exe_name'])
    }
    if (argImageName.length) {
        argImageName.push("/F")
        console.log('taskkill', argImageName)
        spawn('taskkill', argImageName)
    }
}

gMon.startClock = () => {
    const { powerMonitor } = electron
    setInterval(async () => {
        const cafeId = await global.dialogWindow.webContents.executeJavaScript(`localStorage.getItem('cafeId')`)
        global.mainWindow.send('gisle-gameplay-running', {
            cafeId: cafeId,
            gameId: global.gpMonitor.games
        })
        console.log('\n60S-global.gpMonitor.games', Date(), global.gpMonitor.games, '\n')
    }, (60 * 1000))

    setInterval(async () => {
        const taskRunning = await tasklist()
        const taskRunningMapped = taskRunning.map(task => {
            return task['imageName']
        })
        console.log('\n\n')
        for (let i in global.gpMonitor.gamesDetails) {
            const gDetails = global.gpMonitor.gamesDetails[i]
            const index = taskRunningMapped.indexOf(gDetails.game_exe_name)
            if (index === -1) {
                const indexGame = global.gpMonitor.games.indexOf(gDetails.game_id)
                if (indexGame !== -1) {
                    global.gpMonitor.games.splice(indexGame)
                    console.log('Spliced index ', indexGame)
                    console.log('Stopped', Date(), gDetails.game_exe_name)
                }
                if ( ! global.mainWindow.isVisible()) {
                    global.mainWindow.setAlwaysOnTop(true)
                    global.mainWindow.show()
                }
            } else if (index !== -1) {
                if (global.gpMonitor.games.indexOf(gDetails.game_id) === -1) {
                    global.gpMonitor.games.push(gDetails.game_id)
                }
            } else {
                if (global.mainWindow.isFocused()) {
                    global.mainWindow.blur()
                }
            }
            console.log('gDetails.game_exe_name', gDetails.game_exe_name)
        }
        console.log('\n\n')
        if (global.gpMonitor.games.length>0) {
            if ( ! global.mainWindow.isVisible()) {
                global.mainWindow.showInactive()
            }
        }
        console.log('\n5S-taskRunningMapped', taskRunningMapped.join('|'))
        console.log('\n5S-global.gpMonitor.games', global.gpMonitor.games, '\n')
        powerMonitor.querySystemIdleTime((idleTime) => {
            if (idleTime >= 15 * 60) {
                console.log('\ngisle-bpjs-logout')
                global.mainWindow.send('gisle-bpjs-logout', {})
            }
        })
    }, (5 * 1000))
}

gMon.startGame = async (gameId) => {
    if (global.gpMonitor.games && global.gpMonitor.games.indexOf(gameId)!==-1) {
        global.mainWindow.send('gisle-swal-toast', {
            type: 'error',
            title: 'Game is running already'
        })
    } else {
        const gameDetails = (global.gpMonitor.gamesDetails[gameId]) ? global.gpMonitor.gamesDetails[gameId] : false
        if (gameDetails !== false) {
            const cafeId = await global.dialogWindow.webContents.executeJavaScript(`localStorage.getItem('cafeId')`)
            fs.access(gameDetails.game_exe_path, fs.constants.F_OK, (err) => {
                if (err) {
                    global.mainWindow.send('gisle-swal-toast', {
                        type: 'error',
                        title: 'Game is not installed on this machine!'
                    })
                } else {
                    const child = execFile(gameDetails.game_exe_path, (error, stdout, stderr) => {
                    })
                    if (child.pid) {
                        child.on('close', (code) => {
                            console.log(`child process exited with code ${code}`, code)
                            if (code === 0) {
                                if ( ! global.mainWindow.isVisible()) {
                                    global.mainWindow.show()
                                }
                            }
                        })
                        if (global.gpMonitor.games.indexOf(gameId) === -1) {
                            global.gpMonitor.games.push(gameId)
                        }
                        global.mainWindow.send('gisle-gameplay-start', {
                            cafeId: cafeId,
                            gameId: gameId
                        })
                        global.mainWindow.setAlwaysOnTop(false)
                        setTimeout(() => {
                            global.mainWindow.blur()
                        }, (5 * 1000))
                    }
                }
            })
        }
    }
}

if ( ! global.gpMonitor) {
    global.gpMonitor = {}
    global.gpMonitor.games = []
    global.gpMonitor.gamesDetails = {}
}

module.exports = gMon