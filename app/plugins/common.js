const app = {}

/**
 * @see [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim#Polyfill]
 */
app.trimWhiteSpaces = (str) => {
	if (!str) {
		return ''
	}
	if (str.trim) {
		return str.trim()
	}
	return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
}

/**
 * @see	[https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript#answer-8084248]
 */
app.getRandomString = () => {
	return Math.random().toString(36).substring(7)
}

/**
 * @see [https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript?page=1&tab=active#tab-top]
 */
app.validateEmail = (email) => {
    const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return reg.test(String(email).toLowerCase())
}

app.isEmptyObject = (obj) => {
    return JSON.stringify(obj) === JSON.stringify({})
}

app.curntMilisec = () => {
    return Date.now()
}

app.hoursInMilisec = hours => {
    hours = hours || 1
    const _1hrsMn = 60
    const _1minSc = 60
    const _1secMs = 1000
    const _1hours = _1hrsMn * _1minSc * _1secMs
    return hours * _1hours
}

app.daysInMilisec = days => {
    days = days || 1
    const _1day = app.hoursInMilisec(24)
    return days * _1day
}

module.exports = app