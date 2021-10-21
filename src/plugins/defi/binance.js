import fetch from 'node-fetch'
import { join } from 'path'
import { createHmac } from 'crypto'

export const readBalance = account => Promise.resolve()
    // Get account snapshots from Binance.
    .then(() => fetch(
        snapshotUrl(account.auth.secret),
        { headers: { "X-MBX-APIKEY": account.auth.apiKey } }
    ))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Convert to array of stats server API model.
    .then(snapshots => snapshotsToAccountBalanceModel(account, snapshots))

// Coin and binance rates can be fetched asynchronously (Limited by VPN switching).
export const readExchangeRate = tickers => fetch(
    pricesUrl(process.env['BINANCE_SECRET']),
    { headers: { "X-MBX-APIKEY": process.env['BINANCE_KEY'] } }
)
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    .then(prices => PairPricesToTickers(tickers, prices))

export const snapshotsToAccountBalanceModel = ({ user }, { snapshotVos }) => snapshotVos.length > 0
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
                userId: user,
                provider: {
                    name: 'binance'
                }
            },
            coin: {
                ticker: asset.toLocaleLowerCase()
            }
        }))
    : []

export const PairPricesToTickers = (tickers, prices) => tickers
    .map(ticker => {
        const coin = { ticker }
        const busd = prices.find(({ symbol }) => symbol == `${ticker.toUpperCase()}BUSD`)
        const usdt = prices.find(({ symbol }) => symbol == `${ticker.toUpperCase()}USDT`)
        const btc = prices.find(({ symbol }) => symbol == `${ticker.toUpperCase()}BTC`)
        const eth = prices.find(({ symbol }) => symbol == `${ticker.toUpperCase()}ETH`)

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
            console.log(`Price for ${ticker} cannot be found.`)
        }

        return coin
    })

export const signQuery = (secret, query) => {
    const hmac = createHmac('sha256', secret)
    hmac.update(query)
    return query.concat(`&signature=${hmac.digest('hex')}`)
}

const snapshotUrl = secret => new URL(join(`https://api.binance.com/sapi/v1/accountSnapshot?${signQuery(secret, `type=SPOT&timestamp=${Date.now()}`)}`))

const accountUrl = secret => new URL(`https://api.binance.com/sapi/v1/lending/union/account?${signQuery(secret, `type=SPOT&timestamp=${Date.now()}`)}`)

const pricesUrl = secret => new URL(`https://api.binance.com/api/v3/ticker/price`)