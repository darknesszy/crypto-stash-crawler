import fetch from 'node-fetch'
import web3 from 'web3'
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
  coin: {
    ticker: 'eth',
  },
  address,
  balance: web3.utils.fromWei(balance),
})

const balanceUrl = address =>
  new URL(
    join(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_KEY}`
    )
  )
