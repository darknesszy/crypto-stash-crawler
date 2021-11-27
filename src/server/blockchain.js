import fetch from 'node-fetch'
import { getToken } from '../utils/auth'

const getParams = task => paramsFnMap[task]()

// Get all the wallets from stats server.
const getWallets = () =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/wallets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...handleResponse)

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
