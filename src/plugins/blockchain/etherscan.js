import fetch from 'node-fetch'
import { utils } from 'web3'
import { join } from 'path'

export const readBalance = address =>
  Promise.resolve()
    .then(() => fetch(balanceUrl(address)))
    .then(
      res => res.json(),
      err => {
        console.error(err)
        process.exit(0)
      }
    )
    .then(({ result }) => balanceToStats(address, result))

export const balanceToStats = (address, balance) => ({
  currency: {
    ticker: 'eth',
  },
  address,
  balance: utils.fromWei(balance),
})

const balanceUrl = address =>
  new URL(
    join(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_KEY}`
    )
  )
