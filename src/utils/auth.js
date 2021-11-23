import fetch from 'node-fetch'

export let accessToken = undefined

export const getToken = () => fetch(
    `${process.env['ID_URL']}/connect/token`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            'grant_type': 'client_credentials',
            'scope': 'manage finance.read finance.write mining.read mining.write',
            'client_id': 'cryptostashconnect',
            'client_secret': process.env['CLIENT_SECRET']
        })
    }
)
    .then(res => {
        if (res.status == 200) {
            return res.json()
        } else {
            throw res.statusText || 'Request Failed'
        }
    })
    .then(res => {
        accessToken = res.access_token
        console.log(res)
        return accessToken
    })