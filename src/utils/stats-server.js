import fetch from 'node-fetch'

export const updateStats = (route, data, params) => fetch(
    `${process.env["STATS_SERVER"]}/${route}${params ? paramsToString(params) : ''}`,
    {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }
)

export const createStats = (route, data) => fetch(
    `${process.env["STATS_SERVER"]}/${route}`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }
)

export const printResponse = (route, res) => res.status >= 200 && res.status < 300
    ? console.log(`${route} has been sent...`)
    : console.log(`${route}: (${res.status})${res.statusText}`)

const paramsToString = params => Object.keys(params)
    .reduce((acc, cur) => acc.concat('&', cur, '=', params[cur]), '?')