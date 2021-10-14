import fetch from 'node-fetch'
import web3 from 'web3'
import { join } from 'path'
import { createStats, updateStats, printResponse } from '../../utils/stats-server'

export const readBalance = ({ address }) => Promise.resolve()
    .then(() => fetch(balanceUrl(address)))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    .then(({ result }) => balanceToStats(address, result))
    .then(wallet => updateStats(`wallets/${wallet.address}`, wallet)
        .then(res => res.status == 404
            ? createStats('wallets', wallet)
            : res
        )
    )
    .then(res => printResponse('wallets', res))

export const balanceToStats = (address, balance) => ({
    coin : {
        ticker: 'eth'
    },
    address: address,
    balance: web3.utils.fromWei(balance)
})

const balanceUrl = address => new URL(join(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env["ETHERSCAN_KEY"]}`))