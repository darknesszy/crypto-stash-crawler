import fetch from 'node-fetch'
import { getToken } from '../utils/auth'

export const getParams = task => paramsFnMap[task]()

export const getMiningAccounts = () =>
  Promise.all([
    fetch(`${process.env.API_SERVER}/miningaccounts`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(...handleResponse),
    fetch(`${process.env.API_SERVER}/miningpools`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(...handleResponse)
      .then(pools =>
        pools.reduce(
          (dict, pool) => ({
            ...dict,
            [pool.id]: pool,
          }),
          {}
        )
      ),
  ]).then(([accounts, pools]) =>
    accounts.map(account => ({
      ...account,
      miningPool: pools[account.miningPool.id],
    }))
  )

export const getMiningAccountsWithWorker = () =>
  Promise.resolve()
    .then(() =>
      fetch(`${process.env.API_SERVER}/miningaccounts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
    )
    .then(...handleResponse)
    .then(accounts =>
      Promise.all(
        accounts.map(account =>
          fetch(`${process.env.API_SERVER}/miningaccounts/${account.id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }).then(...handleResponse)
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

const paramsFnMap = {
  balance: getMiningAccounts,
  hashrate: getMiningAccountsWithWorker,
}
