import fetch from 'node-fetch'
import _ from 'lodash'
import { updateBalance as ezilBalance, updateHashrate as ezilHashrate } from './ezilpool'

export const updateBalances = () => Promise.resolve()
    .then(() => getPoolAccounts())
    // Asynchronously call grouped pool functions.
    .then(pools => Promise.all(
        Object.keys(pools)
            // Filter out pools that are not supported yet.
            .filter(pool => Object.keys(balanceFuncMap).includes(pool))
            // Asynchronously call pool function for every address.
            .map(pool => Promise.all(
                pools[pool].map(wallet => balanceFuncMap[pool](wallet))
            ))
    ))

export const updateHashrates = () => Promise.resolve()
    .then(() => getPoolAccounts())
    // Asynchronously call grouped pool functions.
    .then(pools => Promise.all(
        Object.keys(pools)
            // Filter out pools that are not supported yet.
            .filter(pool => Object.keys(hashrateFuncMap).includes(pool))
            // Asynchronously call pool function for every address.
            .map(pool => Promise.all(
                pools[pool].map(wallet => hashrateFuncMap[pool](wallet))
            ))
    ))

export const getPoolAccounts = () => Promise.resolve()
    // Get all pool balances from stats server.
    .then(() => fetch(`${process.env["STATS_SERVER"]}/miningpools`))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    .then(pools => Promise.all(
        pools.map(pool => 
            fetch(`${process.env["STATS_SERVER"]}/miningpools/${pool.id}`)
                .then(res => res.json(), err => { console.error(err); process.exit(5); })
        )
    ))
    .then(pools => fetch(`${process.env["STATS_SERVER"]}/wallets`)
        .then(res => res.json(), err => { console.error(err); process.exit(5); })
        .then(wallets => wallets.reduce((acc, wallet) => ({ ...acc, [wallet.address]: wallet.coin.ticker }), {}))
        .then(addressDict => pools
            .reduce(
                (acc, { name, poolBalances }) => ({ 
                    ...acc, 
                    [name]: poolBalances
                        .filter(poolBalance => addressDict[poolBalance.address] != null)
                        .map(poolBalance => ({ 
                            account: poolBalance.loginAccount || poolBalance.address,
                            coin: addressDict[poolBalance.address]
                        }))
                }),
                {}
            )
        )
    )

const balanceFuncMap = {
    'ezilpool': ezilBalance
}

const hashrateFuncMap = {
    'ezilpool': ezilHashrate
}