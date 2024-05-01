const electron      = require('electron')
const {ipcRenderer} = electron
const myAppUtil     = require('../../plugins/common')
const dbMysql       = require('../../plugins/db.mysql')

const abcdxyz      = '<option value="">Select Key</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="F">F</option><option value="G">G</option><option value="H">H</option><option value="I">I</option><option value="J">J</option><option value="K">K</option><option value="L">L</option><option value="M">M</option><option value="N">N</option><option value="O">O</option><option value="P">P</option><option value="Q">Q</option><option value="R">R</option><option value="S">S</option><option value="T">T</option><option value="U">U</option><option value="V">V</option><option value="W">W</option><option value="X">X</option><option value="Y">Y</option><option value="Z">Z</option>'
const lastKey      = document.getElementById('last_key')
const pwd          = document.getElementById('password')
const pwdCnf       = document.getElementById('passwordc')
const cnfBtn       = document.getElementById('pwd_confirmation')
const errmsg       = document.getElementById('errmsg')
const flashErr     = (msg,index) => {
    errmsg.innerHTML = msg
    if (index!==null) {
        fieldsetFlash(index,'red')
    }
    setTimeout(() => {
        errmsg.innerHTML = ''
        if (index!==null) {
            fieldsetFlash(index,'')
        }
    }, 1500)
}
const fieldsetFlash = (index,color) => {
    try {
        document.getElementsByTagName('fieldset')[index].style.borderColor=color
        document.getElementsByTagName('fieldset')[index].firstElementChild.style.color=color
    } catch (e) {
    }
}
const hashPassword = (x,o) => {
    return x
}
const submitForm = () => {
    const vlk = myAppUtil.trimWhiteSpaces(lastKey.value)
    const vlp = myAppUtil.trimWhiteSpaces(pwd.value)
    const vlc = myAppUtil.trimWhiteSpaces(pwdCnf.value)

    if (!vlk) {
        flashErr('Please select any Key from A-Z!',0)
    } else if (!vlp) {
        flashErr('Please enter Password!',1)
    } else if (vlp.length<4) {
        flashErr('Password too short! 4 character minimum required',null)
    } else if (!vlc) {
        flashErr('Please enter Confirm Password!',1)
    } else if (vlc!==vlp) {
        flashErr('Password and Confirm Password do not match!',null)
    } else {
        if (confirm('Are you sure to continue?')) {
            const phash = hashPassword(vlp,['v1'])

            localStorage.setItem('localp', phash)

            ipcRenderer.send('gisle-localp-register', {
                key: vlk
            })
        }
    }
}

pwd.addEventListener('keyup', e => {
    if (e.keyCode === 13) {
        submitForm()
    }
})

pwdCnf.addEventListener('keyup', e => {
    if (e.keyCode === 13) {
        submitForm()
    }
})

cnfBtn.addEventListener('click', submitForm)

ipcRenderer.on('gisle-localp-lookup', async (event, arg) => {
    let bool   = false
    let localp = localStorage.getItem('localp')

    if (localp && localp.length && localp.length > 0) {
        localp = myAppUtil.trimWhiteSpaces(localp)
        if (localp) {
            bool = true
        }
    }

    let cafeId = parseInt(localStorage.getItem('cafeId'))
    let cafeLogin = false

    if (!isNaN(cafeId)) {
        cafeLogin = await dbMysql.cafeCheckExists(cafeId)
    }

    ipcRenderer.send('gisle-localp-found', {
        found: bool,
        cafeLogin: cafeLogin
    })
})

ipcRenderer.on('gisle-localk-register', (event, arg) => {
    localStorage.setItem('keyp', arg.key)
})

ipcRenderer.on('gisle-unlock-prompt-true', (event, arg) => {
    const serverp = localStorage.getItem('serverp')
    const localp  = localStorage.getItem('localp')

    if ((serverp && serverp == arg.password) || (localp && localp == arg.password)) {
        ipcRenderer.send('gisle-unlock', {
            case: '1'
        })
    } else {
        ipcRenderer.send('gisle-unlock-prompt-false', {})
    }
})

lastKey.innerHTML = abcdxyz