import fetch from 'node-fetch'
import { join } from 'path'
import { createHmac } from 'crypto'
import { readFile, saveAsFile } from './debug'

const apiServer = process.env["API_SERVER"]

const signedQuery = ({ secret }, query) => {
    const hmac = createHmac('sha256', secret)
    hmac.update(query)
    return query.concat(`&signature=${hmac.digest('hex')}`)
}

const walletsUrl = account => new URL(join(`https://api.binance.com/sapi/v1/accountSnapshot?${signedQuery(account, `type=SPOT&timestamp=${Date.now()}`)}`))

const savingsUrl = account => new URL(`https://api.binance.com/sapi/v1/lending/union/account?${signedQuery(account, `type=SPOT&timestamp=${Date.now()}`)}`)

const pricesUrl = account => new URL(`https://api.binance.com/api/v3/ticker/price`)

export const get = account => {
    const init = {
        headers: {
            "X-MBX-APIKEY": account.apiKey
        }
    }

    updateCreateEntry({ url: walletsUrl(account), init: init }, 'accountbalances', convertWallets(account), true)
}

export const getSync = account => {
    const init = {
        headers: {
            "X-MBX-APIKEY": account.apiKey
        }
    }

    return Promise.resolve()
        .then(() => updateCreateEntry({ url: walletsUrl(account), init }, 'accountbalances', convertWallets(account), true))
        .then(() =>
            getList('coins', convertToPrices)
                .then(coins =>
                    updateEntry({ url: pricesUrl(account), init }, 'coins', convertPrices(coins), true)    
                )
        )
}

export const test = account => {
    getList('coins', convertToPrices)
        .then(coins =>
            convertPrices(coins)(readFile('binance-prices.json'))
        )
        .then(prices => console.log(prices))
}

export const updateCreateEntry = ({ url, init }, api, converter, isSync) => fetch(url, init)
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

export const updateEntry = ({ url, init }, api, converter, isSync) => fetch(url, init)
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // .then(data => console.log(api, converter(data)))
    .then(data => isSync
        ? converter(data).reduce((acc, cur) => acc
            .then(() =>
                fetch(
                    `${apiServer}/${api}/${cur.id}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cur),
                    }
                )
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
                    `${apiUrl}${api}/${model.id}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(model),
                    }
                ).then(res => res.status >= 200 && res.status < 300
                    ? console.log(`${api} has been sent...`)
                    : console.log(`${api}: (${res.status})${res.statusText}`)
                )
            )
        )
    )

export const getList = (api, converter) => fetch(`${apiServer}/${api}`)
    .then(res => res.json())
    .then(data => converter(data))

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

const convertToPrices = coins => coins

const convertPrices = coins => data => coins
    .map(coin => {
        const busd = data.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}BUSD`)
        const usdt = data.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}USDT`)
        const btc = data.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}BTC`)
        const eth = data.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}ETH`)

        if(busd != null) {
            coin.usd = busd.price
        } else if(usdt != null) {
            coin.usd = usdt.price
        } else if(btc != null) {
            const btcPrice = data.find(({ symbol }) => symbol == 'BTCBUSD').price
            coin.usd = btc.price * btcPrice
        } else if(eth != null) {
            const ethPrice = data.find(({ symbol }) => symbol == 'ETHBUSD').price
            coin.usd = eth.price * ethPrice
        } else {
            console.log(`Price for ${coin.ticker} cannot be found.`)
        }

        return coin
    })