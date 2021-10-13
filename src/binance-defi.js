import fetch from 'node-fetch'
import { join } from 'path'
import { createHmac } from 'crypto'
import { readFile, saveAsFile } from './debug'

const apiServer = process.env["API_SERVER"]

// Get defi data. DEPRECATED
export const get = _account => {
    const init = {
        headers: { "X-MBX-APIKEY": _account.apiKey }
    }

    updateCreateEntry(
        { url: accountBalanceUrl(_account), init },
        'accountbalances',
        convertAccountBalance(_account),
        true
    )

    getCoinTypes()
        .then(coins =>
            updateEntry({ url: pricesUrl(account), init }, 'coins', convertPrices(coins), true)
        )
}

// Non-Asynchronous version of get. DEPRECATED
export const getSync = account => {
    const init = {
        headers: { "X-MBX-APIKEY": account.apiKey }
    }

    return Promise.resolve()
        .then(() =>
            // Get account balance on Binance and store it in stats server.
            updateCreateEntry(
                { url: accountBalanceUrl(account), init },
                'accountbalances',
                convertAccountBalance(account),
                true
            )
        )
        .then(() =>
            // Get known coin types from stats server.
            getCoinTypes()
        )
        .then(coins =>
            // Get coin conversion rate from Binance and store it in stats server.
            updateEntry({ url: pricesUrl(account), init }, 'coins', convertPrices(coins), true)
        )
}

export const dryRun = account => {
    getCoinTypes('coins', convertToPrices)
        .then(coins =>
            convertPrices(coins)(readFile('binance-prices.json'))
        )
        .then(prices => console.log(prices))
}

export const getAccountBalance = _account => Promise.resolve()
    // Get account balance from Binance.
    .then(() => fetch(
        accountBalanceUrl(_account),
        {
            headers: { "X-MBX-APIKEY": _account.apiKey }
        }
    ))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    .then(balances =>
        // Convert to array of stats server API model.
        convertAccountBalance(_account)(balances)
            .forEach(balance => Promise.resolve()
                // Attempt to update stat.
                .then(() => updateStat('accountbalances', balance))
                // When update returns no object found, attempt to create stat.
                .then(res => res.status == 404 ? createStat('accountbalances', balance) : res)
                // Print message according to status code.
                .then(res => res.status >= 200 && res.status < 300
                    ? console.log(`${_api} has been sent...`)
                    : console.log(`${_api}: (${res.status})${res.statusText}`)
                )
            )
    )

export const getExchangeRates = _account => Promise.resolve()
    .then(() => fetch(`${apiServer}/coins`))
    .then(res => res.json())
    .then(() => fetch(
        pricesUrl(_account),
        {
            headers: { "X-MBX-APIKEY": _account.apiKey }
        }
    ))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    .then(coins => coins.forEach(coin => updateStat('coins', coin)))
    // Print message according to status code.
    .then(res => res.status >= 200 && res.status < 300
        ? console.log(`${_api} has been sent...`)
        : console.log(`${_api}: (${res.status})${res.statusText}`)
    )


export const updateStat = (_api, _data) => fetch(
    `${apiServer}/${_api}?coinTicker=${_data.coin.ticker}&userId=${_data.account.userId}`,
    {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_data),
    }
)

export const createStat = (_api, _data) => fetch(
    `${apiServer}/${_api}`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_data),
    }
)


// PUT data entry, if it fails then POST data entry. DEPRECATED
export const updateCreateEntry = ({ url, init }, _api, _convertFunc, _isSync) => fetch(url, init)
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // .then(data => console.log(api, converter(data)))
    .then(data => _isSync
        ? _convertFunc(data).reduce((acc, cur) => acc
            .then(() =>
                fetch(
                    `${apiServer}/${_api}?coinTicker=${cur.coin.ticker}&userId=${cur.account.userId}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cur),
                    }
                )
            )
            .then(res => res.status == 404
                ? fetch(
                    `${apiServer}/${_api}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cur),
                    }
                )
                : res
            )
            .then(res => res.status >= 200 && res.status < 300
                ? console.log(`${_api} updated successfully...`)
                : console.log(`${_api} reported: (${res.status}) ${res.statusText}`)
            ),
            Promise.resolve()
        )
        : Promise.all(
            _convertFunc(data).map(model =>
                fetch(
                    `${apiUrl}${_api}/${model.miningPool.name}/${model.wallet.address}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(model),
                    }
                ).then(res => res.status == 404
                    ? fetch(
                        `${apiUrl}/${_api}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(model),
                        }
                    )
                    : res
                ).then(res => res.status >= 200 && res.status < 300
                    ? console.log(`${_api} has been sent...`)
                    : console.log(`${_api}: (${res.status})${res.statusText}`)
                )
            )
        )
    )

// PUT data entry. DEPRECATED
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

// DEPRECATED
export const getCoinTypes = () => fetch(`${apiServer}/coins`)
    .then(res => res.json())

const signQuery = ({ secret }, query) => {
    const hmac = createHmac('sha256', secret)
    hmac.update(query)
    return query.concat(`&signature=${hmac.digest('hex')}`)
}

const accountBalanceUrl = account => new URL(join(`https://api.binance.com/sapi/v1/accountSnapshot?${signQuery(account, `type=SPOT&timestamp=${Date.now()}`)}`))

const savingsUrl = account => new URL(`https://api.binance.com/sapi/v1/lending/union/account?${signQuery(account, `type=SPOT&timestamp=${Date.now()}`)}`)

const pricesUrl = account => new URL(`https://api.binance.com/api/v3/ticker/price`)

const convertAccountBalance = ({ userId }) => ({ snapshotVos }) => snapshotVos.length > 0
    ? Object.values(
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
    : []

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

export const convertPrices = coins => data => coins
    .map(coin => {
        const busd = data.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}BUSD`)
        const usdt = data.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}USDT`)
        const btc = data.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}BTC`)
        const eth = data.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}ETH`)

        if (busd != null) {
            coin.usd = busd.price
        } else if (usdt != null) {
            coin.usd = usdt.price
        } else if (btc != null) {
            const btcPrice = data.find(({ symbol }) => symbol == 'BTCBUSD').price
            coin.usd = btc.price * btcPrice
        } else if (eth != null) {
            const ethPrice = data.find(({ symbol }) => symbol == 'ETHBUSD').price
            coin.usd = eth.price * ethPrice
        } else {
            console.log(`Price for ${coin.ticker} cannot be found.`)
        }

        return coin
    })