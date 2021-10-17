import fetch from 'node-fetch'
import { join } from 'path'
import { createHmac } from 'crypto'
import { createStats, updateStats, printResponse } from '../../utils/stats-server'

export const updateBalance = account => Promise.resolve()
    // Get account snapshots from Binance.
    .then(() => fetch(
        snapshotUrl(account),
        {
            headers: { "X-MBX-APIKEY": account.apiKey }
        }
    ))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Convert to array of stats server API model.
    .then(snapshots => snapshotsToAccountBalanceModel(account, snapshots))
    .then(balances => balances
        .forEach(balance => Promise.resolve()
            // Attempt to update stat.
            .then(() => updateStats('accountbalances', balance))
            // When update returns no object found, attempt to create stat.
            .then(res => res.status == 404 ? createStats('accountbalances', balance) : res)
            // Print message according to status code.
            .then(res => printResponse('accountbalances', res))
        )
    )

// Coin and binance rates can be fetched asynchronously (Limited by VPN switching).
export const updateExchangeRate = account => Promise.resolve()
    .then(() => fetch(`${process.env["STATS_SERVER"]}/coins`))
    .then(res => res.json(), err => { console.error(err) })
    .then(coins => fetch(
            pricesUrl(account),
            {
                headers: { "X-MBX-APIKEY": account.apiKey }
            }
        )
            .then(res => res.json(), err => { console.error(err); process.exit(5); })
            .then(prices => PairPricesToCoins(coins, prices))
    )
    .then(coins => coins
        // Attempt to update each coin individually on stats server.
        .forEach(coin => updateStats('coins', coin)
            .then(res => printResponse('coins', res))
        )
    )

export const snapshotsToAccountBalanceModel = ({ userId }, { snapshotVos }) => snapshotVos.length > 0
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

export const PairPricesToCoins = (coins, prices) => coins
    .map(coin => {
        const busd = prices.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}BUSD`)
        const usdt = prices.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}USDT`)
        const btc = prices.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}BTC`)
        const eth = prices.find(({ symbol }) => symbol == `${coin.ticker.toUpperCase()}ETH`)

        if (busd != null) {
            coin.usd = busd.price
        } else if (usdt != null) {
            coin.usd = usdt.price
        } else if (btc != null) {
            const btcPrice = prices.find(({ symbol }) => symbol == 'BTCBUSD').price
            coin.usd = btc.price * btcPrice
        } else if (eth != null) {
            const ethPrice = prices.find(({ symbol }) => symbol == 'ETHBUSD').price
            coin.usd = eth.price * ethPrice
        } else {
            console.log(`Price for ${coin.ticker} cannot be found.`)
        }

        return coin
    })

export const signQuery = ({ secret }, query) => {
    const hmac = createHmac('sha256', secret)
    hmac.update(query)
    return query.concat(`&signature=${hmac.digest('hex')}`)
}

const snapshotUrl = account => new URL(join(`https://api.binance.com/sapi/v1/accountSnapshot?${signQuery(account, `type=SPOT&timestamp=${Date.now()}`)}`))

const accountUrl = account => new URL(`https://api.binance.com/sapi/v1/lending/union/account?${signQuery(account, `type=SPOT&timestamp=${Date.now()}`)}`)

const pricesUrl = account => new URL(`https://api.binance.com/api/v3/ticker/price`)