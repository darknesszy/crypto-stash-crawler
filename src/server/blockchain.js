import fetch from 'node-fetch'
import { getToken } from '../utils/auth'

const getParams = task => paramsFnMap[task]()

const supported = ['ETH']

// Get all the wallets from stats server.
export const getCurrencyWallets = currency =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/currencies/${currency.id}/wallets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...handleResponse)
    .then(wallets =>
      wallets.map(wallet => ({
        ...wallet,
        currency,
      }))
    )

export const getWallets = () =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/currencies`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...handleResponse)
    .then(currencies =>
      currencies.filter(currency => supported.includes(currency.ticker))
    )
    .then(currencies =>
      Promise.all(
        currencies.map(currency => getCurrencyWallets(currency))
      ).then(currenciesWallet =>
        currenciesWallet.reduce(
          (wallets, currencyWallets) => [...wallets, ...currencyWallets],
          []
        )
      )
    )

// Parse JSON from http response. On error, exit the process.
const handleResponse = [
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

// REST API endpoints mapped to each option condition.
const paramsFnMap = {
  balance: getWallets,
}

export default getParams
