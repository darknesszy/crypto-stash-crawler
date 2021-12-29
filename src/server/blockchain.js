import fetch from 'node-fetch'
import { getToken } from '../utils/auth'

const getParams = task => paramsFnMap[task]()

// Get all the wallets from stats server.
export const getBlockchainWallets = blockchain =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/blockchains/${blockchain.id}/wallets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...handleResponse)
    .then(wallets =>
      wallets.map(wallet => ({
        ...wallet,
        blockchain,
      }))
    )

export const getWallets = () =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/blockchains`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...handleResponse)
    .then(blockchains =>
      Promise.all(
        blockchains.map(blockchain => getBlockchainWallets(blockchain))
      ).then(blockchainsWallet =>
        blockchainsWallet.reduce(
          (wallets, blockchainWallets) => [...wallets, ...blockchainWallets],
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
