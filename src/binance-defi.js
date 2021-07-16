import fetch from 'node-fetch'
import { join } from 'path'
import { createHmac } from 'crypto'
import { saveAsFile } from './debug'

const apiServer = process.env["API_SERVER"]

const signedQuery = ({ secret }, query) => {
    const hmac = createHmac('sha256', secret)
    hmac.update(query)
    return query.concat(`&signature=${hmac.digest('hex')}`)
}

const walletsUrl = account => new URL(join(`https://api.binance.com/sapi/v1/accountSnapshot?${signedQuery(account, `type=SPOT&timestamp=${Date.now()}`)}`))

const savingsUrl = account => new URL(`https://api.binance.com/sapi/v1/lending/union/account?${signedQuery(account, `type=SPOT&timestamp=${Date.now()}`)}`)

export const get = account => {
    const init = {
        headers: {
            "X-MBX-APIKEY": account.apiKey
        }
    }

    updateEntry({ url: walletsUrl(account), init: init }, 'accountbalances', convertWallets(account), true)
}

export const getSync = account => Promise.resolve()
    .then(() => ({
        headers: {
            "X-MBX-APIKEY": account.apiKey
        }
    }))
    .then(init => updateEntry({ url: walletsUrl(account), init: init }, 'accountbalances', convertWallets(account), true))

export const test = account => {
    // saveAsFile(walletsUrl(account), 'binance-wallets', { headers: { "X-MBX-APIKEY": account.apiKey } })
    saveAsFile(savingsUrl(account), 'binance-savings', { headers: { "X-MBX-APIKEY": account.apiKey } })
}

export const updateEntry = ({ url, init }, api, converter, isSync) => fetch(url, init)
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // .then(data => console.log(api, converter(data)))
    .then(data => isSync
        ? converter(data).reduce((acc, cur) => acc
            .then(() =>
                fetch(
                    `${apiServer}/${api}?coinTicker=${cur.coin.ticker}&userId=${cur.account.userId}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cur),
                    }
                )
            )
            .then(res => res.status == 404
                ? fetch(
                    `${apiServer}/${api}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cur),
                    }
                )
                : res
            )
            .then(res => res.status >= 200 && res.status < 300
                ? console.log(`${api} updated successfully...`)
                : console.log(`${api} reported: (${res.status}) ${res.statusText}`)
            ),
            Promise.resolve()
        )
        : Promise.all(
            converter(data).map(model =>
                fetch(
                    `${apiUrl}${api}/${model.miningPool.name}/${model.wallet.address}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(model),
                    }
                ).then(res => res.status == 404
                    ? fetch(
                        `${apiUrl}/${api}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(model),
                        }
                    )
                    : res
                ).then(res => res.status >= 200 && res.status < 300
                    ? console.log(`${api} has been sent...`)
                    : console.log(`${api}: (${res.status})${res.statusText}`)
                )
            )
        )
    )

const convertWallets = ({ userId }) => ({ snapshotVos }) => snapshotVos.length > 0 
    && Object.values(
        snapshotVos[0].data.balances.reduce((acc, cur) => {
            const ticker = cur.asset.startsWith('LD') ? cur.asset.replace('LD', '') : cur.asset
            acc[ticker] = {
                asset: ticker,
                free: acc[ticker] ? acc[ticker].free + Number(cur.free) : Number(cur.free),
                locked: acc[ticker] ? acc[ticker].locked + Number(cur.locked) : Number(cur.locked)
            }
            return acc
        }, {})
    )
    .filter(({ free, locked }) => free != 0 || locked != 0)
    .map(({ asset, free }) => ({
        current: free,
        account: {
            userId,
            provider: {
                name: 'binance'
            }
        },
        coin: {
            ticker: asset.toLocaleLowerCase()
        }
    }))

const convertSavings = ({ userId }) => ({ positionAmountVos }) => positionAmountVos
    .map(({ asset, amount }) => ({
        current: amount,
        account: {
            userId,
            provider: {
                name: 'binance'
            }
        },
        coin: {
            ticker: asset.toLocaleLowerCase()
        }
    }))