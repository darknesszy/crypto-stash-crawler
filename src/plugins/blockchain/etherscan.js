import fetch from 'node-fetch'
import { utils } from 'web3'
import { join } from 'path'

export const getBalance = wallet =>
  Promise.resolve()
    .then(() => fetch(balanceUrl(wallet)))
    .then(
      res => res.json(),
      err => {
        console.error(err)
        process.exit(0)
      }
    )
    .then(({ result }) => BalanceToWalletBalanceModel(wallet, result))

export const BalanceToWalletBalanceModel = (wallet, balance) => ({
  wallet,
  tokenId: wallet.blockchain.nativeToken.id,
  token: wallet.blockchain.nativeToken,
  savings: utils.fromWei(balance),
})

// export const updateBalance = (wallet, balance) => ({
//   ...wallet,
//   balance: utils.fromWei(balance),
// })

const balanceUrl = ({ address }) =>
  new URL(
    join(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.ETHERSCAN_KEY}`
    )
  )
