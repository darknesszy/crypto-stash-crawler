import fetch from 'node-fetch'
import _ from 'lodash'
import { readBalance as etherscan } from './etherscan'

export const updateBalances = () => Promise.resolve()
    // Get all the wallets from stats server.
    .then(() => fetch(`${process.env["STATS_SERVER"]}/wallets`))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Group wallets by the type of blockchain it belongs to.
    .then(wallets => _.groupBy(wallets, el => el.coin.ticker))
    // Asynchronously call grouped blockchain functions.
    .then(coins => Promise.all(
        Object.keys(coins)
            // Filter out blockchains that are not supported yet.
            .filter(coin => Object.keys(coinFuncMap).includes(coin))
            // Execute function for each wallet in the coin group synchronously.
            .map(coin => coins[coin]
                .reduce((acc, wallet) => 
                    acc.then(() => coinFuncMap[coin](wallet.address)),
                    Promise.resolve()
                )
            )
    ))

const coinFuncMap = {
    'eth': etherscan
}