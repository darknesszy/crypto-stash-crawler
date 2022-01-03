import fetch from 'node-fetch'
import { createHmac } from 'crypto'

export const getBalance = (apiKey, tokens) =>
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
      snapshotsToAccountBalanceModel(apiKey.exchangeAccount, tokens, snapshots)
    )

// currency and binance rates can be fetched asynchronously (Limited by VPN switching).
export const getExchangeRate = (currencyExchange, tokens) =>
  fetch(pricesUrl(process.env.BINANCE_SECRET), {
    headers: { 'X-MBX-APIKEY': process.env.BINANCE_KEY },
  })
    .then(...handleResponse)
    .then(prices =>
      PairPricesToTickers(currencyExchange, tokens, PriceDict(prices))
    )

export const combineBalances = balances =>
  balances.reduce((dict, balance) => {
    const ticker = balance.asset.startsWith('LD')
      ? balance.asset.replace('LD', '')
      : balance.asset
    return {
      ...dict,
      [ticker]: {
        asset: ticker,
        free: dict[ticker]
          ? dict[ticker].free + Number(balance.free)
          : Number(balance.free),
        locked: dict[ticker]
          ? dict[ticker].locked + Number(balance.locked)
          : Number(balance.locked),
      },
    }
  }, {})

export const snapshotsToAccountBalanceModel = (
  exchangeAccount,
  tokens,
  { snapshotVos }
) =>
  snapshotVos.length > 0
    ? Object.values(combineBalances(snapshotVos[0].data.balances))
        .filter(({ free, locked }) => free !== 0 || locked !== 0)
        // Filter out Tokens that doesn't exist in database. Probably shouldn't add new currencies here.
        .filter(
          ({ asset }) =>
            tokens.map(el => el.ticker).indexOf(asset.toUpperCase()) !== -1
        )
        .map(({ asset, free }) => ({
          savings: free,
          exchangeAccount: {
            ...exchangeAccount,
            exchangeAccountApiKey: { publicKey: '', privateKey: '' },
          },
          token:
            tokens[tokens.map(el => el.ticker).indexOf(asset.toUpperCase())],
        }))
    : []

export const PairPricesToTickers = (currencyExchange, tokens, prices) =>
  tokens.reduce(
    (rates, buyerToken) => [
      ...rates,
      ...tokens.reduce(
        (innerRates, sellerToken) =>
          prices[buyerToken.ticker + sellerToken.ticker]
            ? [
                ...innerRates,
                {
                  current: prices[buyerToken.ticker + sellerToken.ticker],
                  buyerToken,
                  sellerToken,
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

export const signQuery = (secret, query) => {
  const hmac = createHmac('sha256', secret)
  hmac.update(query)
  return query.concat(`&signature=${hmac.digest('hex')}`)
}

const snapshotUrl = secret =>
  new URL(
    `https://api.binance.com/sapi/v1/accountSnapshot?${signQuery(
      secret,
      `type=SPOT&timestamp=${Date.now()}&recvWindow=10000`
    )}`
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
