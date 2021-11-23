import fetch from 'node-fetch'
import queryString from 'query-string'
import { getToken } from './auth'

export const getCurrencies = provider =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/currencys`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...jsonOrExit)
    .then(currencys => ({
      provider: provider || 'binance',
      tickers: currencys.map(currency => currency.ticker),
    }))

// Get all accounts from stats server.
export const getDefiAccounts = () =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/accounts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...jsonOrExit)
    .then(accounts =>
      accounts.map(account => ({
        user: account.userId,
        provider: account.provider.name,
        auth: JSON.parse(account.authJson),
      }))
    )

// Get all the wallets from stats server.
export const getWallets = () =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/wallets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...jsonOrExit)
    .then(wallets =>
      wallets.map(wallet => ({
        address: wallet.address,
        ticker: wallet.currency.ticker,
      }))
    )

// Get all pool balances from stats server.
export const getPoolAccounts = () =>
  Promise.resolve()
    // Get all mining pools from stats server.
    .then(() =>
      fetch(`${process.env.API_SERVER}/miningpools`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...jsonOrExit)
    // Get details of each mining pool.
    .then(pools =>
      Promise.all(
        pools.map(pool =>
          fetch(`${process.env.API_SERVER}/miningpools/${pool.id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }).then(...jsonOrExit)
        )
      )
    )
    .then(pools =>
      pools.reduce(
        (acc, pool) =>
          acc.concat(
            pool.poolBalances.map(poolBalance => ({
              identifier: poolBalance.loginAccount || poolBalance.address,
              address: poolBalance.address,
              pool: pool.name,
            }))
          ),
        []
      )
    )
    .then(pools =>
      fetch(`${process.env.API_SERVER}/wallets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then(...jsonOrExit)
        .then(wallets =>
          wallets.reduce(
            (acc, wallet) => ({
              ...acc,
              [wallet.address]: wallet.currency.ticker,
            }),
            {}
          )
        )
        .then(addressMap =>
          pools
            .filter(pool => addressMap[pool.address] != null)
            .map(pool => ({
              ...pool,
              ticker: addressMap[pool.address],
            }))
        )
    )

export const updateStats = (route, data, query) =>
  fetch(`${process.env.API_SERVER}/${route}?${queryString.stringify(query)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  })

export const createStats = (route, data) =>
  fetch(`${process.env.API_SERVER}/${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  })

export const printResponse = (route, res) =>
  res.status >= 200 && res.status < 300
    ? process.stdout.write(`${route} has been sent...\n`)
    : process.stdout.write(`${route}: (${res.status})${res.statusText}\n`)

// Parse JSON from http response. On error, exit the process.
const jsonOrExit = [
  res => {
    if (res.status === 200) {
      return res.json()
    }
    throw res.statusText || 'Request Failed'
  },
  err => {
    console.error(err)
  },
]
