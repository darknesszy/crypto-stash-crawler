import fetch from 'node-fetch'
import { join } from 'path'
import { createHmac } from 'crypto'

export const getBalance = (apiKey, currencies) =>
  Promise.resolve()
    // Get account snapshots from Binance.
    .then(() =>
      fetch(snapshotUrl(apiKey.privateKey), {
        headers: { 'X-MBX-APIKEY': apiKey.publicKey },
      })
    )
    .then(...handleResponse)
    // Convert to array of stats server API model.
    .then(snapshots =>
      snapshotsToAccountBalanceModel(
        apiKey.exchangeAccount,
        currencies,
        snapshots
      )
    )

// currency and binance rates can be fetched asynchronously (Limited by VPN switching).
export const getExchangeRate = (currencyExchange, currencies) =>
  fetch(pricesUrl(process.env.BINANCE_SECRET), {
    headers: { 'X-MBX-APIKEY': process.env.BINANCE_KEY },
  })
    .then(...handleResponse)
    .then(prices =>
      PairPricesToTickers(currencyExchange, currencies, PriceDict(prices))
    )

export const snapshotsToAccountBalanceModel = (
  exchangeAccount,
  currencies,
  { snapshotVos }
) =>
  snapshotVos.length > 0
    ? Object.values(
        snapshotVos[0].data.balances.reduce((acc, cur) => {
          const ticker = cur.asset.startsWith('LD')
            ? cur.asset.replace('LD', '')
            : cur.asset
          acc[ticker] = {
            asset: ticker,
            free: acc[ticker]
              ? acc[ticker].free + Number(cur.free)
              : Number(cur.free),
            locked: acc[ticker]
              ? acc[ticker].locked + Number(cur.locked)
              : Number(cur.locked),
          }
          return acc
        }, {})
      )
        .filter(({ free, locked }) => free !== 0 || locked !== 0)
        // Filter out Currencies that doesn't exist in database. Probably shouldn't add new currencies here.
        .filter(
          ({ asset }) =>
            currencies.map(el => el.ticker).indexOf(asset.toUpperCase()) !== -1
        )
        .map(({ asset, free }) => ({
          savings: free,
          exchangeAccount: {
            ...exchangeAccount,
            exchangeAccountApiKey: { publicKey: '', privateKey: '' },
          },
          currency:
            currencies[
              currencies.map(el => el.ticker).indexOf(asset.toUpperCase())
            ],
        }))
    : []

export const PairPricesToTickers = (currencyExchange, currencies, prices) =>
  currencies.reduce(
    (rates, buyerCurrency) => [
      ...rates,
      ...currencies.reduce(
        (innerRates, sellerCurrency) =>
          prices[buyerCurrency.ticker + sellerCurrency.ticker]
            ? [
                ...innerRates,
                {
                  current: prices[buyerCurrency.ticker + sellerCurrency.ticker],
                  buyerCurrency,
                  sellerCurrency,
                  currencyExchange,
                },
              ]
            : innerRates,
        []
      ),
    ],
    []
  )

export const PriceDict = prices =>
  prices.reduce(
    (dict, price) => ({
      ...dict,
      [price.symbol]: price.price,
    }),
    {}
  )
// export const PairPricesToTickers = (currencyExchange, currencies, prices) =>
//   currencies.reduce((rates, currency) => {
//     const currency = {}
//     const busd = prices.find(
//       ({ symbol }) => symbol === `${ticker.toUpperCase()}BUSD`
//     )
//     const usdt = prices.find(
//       ({ symbol }) => symbol === `${ticker.toUpperCase()}USDT`
//     )
//     const btc = prices.find(
//       ({ symbol }) => symbol === `${ticker.toUpperCase()}BTC`
//     )
//     const eth = prices.find(
//       ({ symbol }) => symbol === `${ticker.toUpperCase()}ETH`
//     )

//     if (busd != null) {
//       currency.usd = busd.price
//     } else if (usdt != null) {
//       currency.usd = usdt.price
//     } else if (btc != null) {
//       const btcPrice = prices.find(({ symbol }) => symbol === 'BTCBUSD').price
//       currency.usd = btc.price * btcPrice
//     } else if (eth != null) {
//       const ethPrice = prices.find(({ symbol }) => symbol === 'ETHBUSD').price
//       currency.usd = eth.price * ethPrice
//     } else {
//       process.stdout.write(`Price for ${ticker} cannot be found.\n`)
//     }

//     return [
//       ...rates,
//       prices.reduce(())
//       {
//         current: 0.1,
//         buyerCurrency: currency,
//         sellerCurrency: currencies.map(el => el.ticker).indexOf(),
//         currencyExchange,
//       }
//     ]
//   }, [])

export const signQuery = (secret, query) => {
  const hmac = createHmac('sha256', secret)
  hmac.update(query)
  return query.concat(`&signature=${hmac.digest('hex')}`)
}

const snapshotUrl = secret =>
  new URL(
    join(
      `https://api.binance.com/sapi/v1/accountSnapshot?${signQuery(
        secret,
        `type=SPOT&timestamp=${Date.now()}`
      )}`
    )
  )

// const accountUrl = secret =>
//   new URL(
//     `https://api.binance.com/sapi/v1/lending/union/account?${signQuery(
//       secret,
//       `type=SPOT&timestamp=${Date.now()}`
//     )}`
//   )

const pricesUrl = () => new URL(`https://api.binance.com/api/v3/ticker/price`)

const handleResponse = [
  res => {
    if (res.status === 200) {
      return res.json()
    }
    throw res.statusText || `Request Failed ${res.status}`
  },
  err => {
    throw err
  },
]
