const config = require('../config/config')
const axios = require('axios')
const app = {}

/********
* Admin *
********/

app.fappsDetails = async (appId) => {
    const resource = config.apiUrl + 'api/featured_apps/details?param1=' + appId
    try {
        const response = await axios.get(resource)
        return response.status === 200 && response.data.status === 'success' ? response.data.data : false
    } catch(e) {
        console.log(e)
    }
}

app.fappsPathList = async () => {
    const resource = config.apiUrl + 'api/featured_apps/exe_details'
    try {
        const response = await axios.get(resource)
        return response.status === 200 && response.data.status === 'success' ? response.data.data : false
    } catch(e) {
        console.log(e)
    }
}


/*******
* Cafe *
*******/

app.cafeCheckExists = async (cafeId) => {
    const resource = config.apiUrl + 'api/cafe/account_created?param1=' + cafeId
    try {
        const response = await axios.get(resource)
        return response.status === 200 && response.data.status === 'success' ? true : false
    } catch(e) {
        console.log(resource,e)
    }
}

/*********
* Player *
*********/

/*******
* Game *
*******/

app.gameList = async (gameId) => {
    const resource = config.apiUrl + 'api/games/'
    try {
        const response = await axios.get(resource)
        return response.status === 200 && response.data.status === 'success' ? response.data.data : false
    } catch(e) {
        console.log(e)
    }
}

app.gameDetails = async (gameId) => {
    const resource = config.apiUrl + 'api/games/details/?param1=' + gameId
    try {
        const response = await axios.get(resource)
        return response.status === 200 && response.data.status === 'success' ? response.data.data : false
    } catch(e) {
        console.log(e)
    }
}

module.exports = app