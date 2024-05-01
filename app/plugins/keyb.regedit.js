/**
 * To Block Keyboard Access for
 * a complete Kiosk environment
 * 
 * @see [https://www.thewindowsclub.com/remove-shutdown-power-button-login-start-menu]
 * @see [https://stackoverflow.com/questions/16610567/enable-disable-taskmanager]
 */

const regedit = require('regedit')

const osWindows = {
    regEnsureKeys: () => {
        const hkcuPolicies = []

        regedit.list([
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies',
            'HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options'
            ])
        .on('error', function(err) {
            console.log('KBRG.REGENSUREKEYS.LIST.ERROR()::',err)
        })
        .on('data', function(entry) {
            if (entry.key === 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies') {
                if (entry.data.values) {
                    /* Win 10 */
                    if ( ! entry.data.values['System']) {
                        hkcuPolicies.push('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System')
                    }
                    if ( ! entry.data.values['Explorer']) {
                        hkcuPolicies.push('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer')
                    }
                } else if (entry.data.keys) {
                    /* Win 8 */
                    if (entry.data.keys.indexOf('System') === -1) {
                        hkcuPolicies.push('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System')
                    }
                    if (entry.data.keys.indexOf('Explorer') === -1) {
                        hkcuPolicies.push('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer')
                    }
                } else {
                    hkcuPolicies.push('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System')
                    hkcuPolicies.push('HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer')
                }
            } else if (entry.key === 'HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options') {
                if (entry.data.keys.indexOf('Utilman.exe') === -1) {
                    hkcuPolicies.push('HKLM\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\Utilman.exe')
                }
            }
        })
        .on('finish', () => {
            if (hkcuPolicies.length > 0) {
                regedit.createKey(hkcuPolicies, function (err) {
                    console.log('KBRG.REGENSUREKEYS.LIST.FINISH()::',err)
                })
            }
        })
    },
    regEnableKiosk: () => {
        const prop = {value: 1, type: 'REG_DWORD'}
        const valuesToPut = {
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System': {
                'DisableLockWorkstation': prop,
                'DisableChangePassword': prop,
                'DisableTaskMgr': prop
            },
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer': {
                'NoClose': prop,
                'NoLogoff': prop,
                'NoSetTaskbar': prop
            },
            'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System': {
                'HideFastUserSwitching': prop
            },
            'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\Utilman.exe': {
                'Debugger': {value: 'doesNothingApp.exe', type: 'REG_SZ'}
            }
        }

        regedit.putValue(valuesToPut, (err) => {
            console.log('KBRG.REGENABLEKIOSK::',err)
        })
    },
    regDisableKiosk: () => {
        const prop = {value: 0, type: 'REG_DWORD'}
        const valuesToPut = {
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System': {
                'DisableLockWorkstation': prop,
                'DisableChangePassword': prop,
                'DisableTaskMgr': prop
            },
            'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer': {
                'NoClose': prop,
                'NoLogoff': prop,
                'NoSetTaskbar': prop
            },
            'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System': {
                'HideFastUserSwitching': prop
            },
            'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\Utilman.exe': {
                'Debugger': {value: '', type: 'REG_SZ'}
            }
        }

        regedit.putValue(valuesToPut, (err) => {
            console.log('KBRG.REGDISABLEKIOSK::',err)
        })
    },
    regBackup: () => {
    },
    regBackupRestore: () => {
    }
}

const moduleApp = {
    osWindows
}

module.exports = moduleApp