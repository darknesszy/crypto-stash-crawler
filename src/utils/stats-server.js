import fetch from 'node-fetch'

export const getCoins = provider => Promise.resolve()
    .then(() => fetch(`${process.env['STATS_SERVER']}/coins`))
    .then(...jsonOrExit)
    .then(coins => ({
        provider: provider || 'binance',
        tickers: coins.map(coin => coin.ticker)
    }))

// Get all accounts from stats server.
export const getDefiAccounts = () => Promise.resolve()
    .then(() => fetch(`${process.env['STATS_SERVER']}/accounts`))
    .then(...jsonOrExit)
    .then(accounts => accounts
        .map(account => ({
            user: account.userId, 
            provider: account.provider.name,
            auth: JSON.parse(account.authJson)
        }))
    )

// Get all the wallets from stats server.
export const getWallets = () => Promise.resolve()
    .then(() => fetch(`${process.env['STATS_SERVER']}/wallets`))
    .then(...jsonOrExit)
    .then(wallets => wallets
        .map(wallet => ({ 
            address: wallet.address, 
            ticker: wallet.coin.ticker 
        }))
    )

// Get all pool balances from stats server.
export const getPoolAccounts = () => Promise.resolve()
    // Get all mining pools from stats server.
    .then(() => fetch(`${process.env['STATS_SERVER']}/miningpools`))
    .then(...jsonOrExit)
    // Get details of each mining pool.
    .then(pools => Promise.all(
        pools.map(pool =>
            fetch(`${process.env['STATS_SERVER']}/miningpools/${pool.id}`)
                .then(...jsonOrExit)
        )
    ))
    .then(pools => pools.reduce(
        (acc, pool) => acc.concat(
            pool.poolBalances.map(poolBalance => ({ 
                identifier: poolBalance.loginAccount || poolBalance.address,
                address: poolBalance.address,
                pool: pool.name
            }))
        ),
        []
    ))
    .then(pools => fetch(`${process.env['STATS_SERVER']}/wallets`)
        .then(...jsonOrExit)
        .then(wallets => wallets.reduce(
                (acc, wallet) => ({ ...acc, [wallet.address]: wallet.coin.ticker }),
                {}
            )
        )
        .then(addressMap => pools
            .filter(pool => addressMap[pool.address] != null)
            .map(pool => ({ ...pool, ticker: addressMap[pool.address] })
        ))
    )

export const updateStats = (route, data, query) => fetch(
    `${process.env['STATS_SERVER']}/${route}${query ? queryToString(query) : ''}`,
    {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }
)

export const createStats = (route, data) => fetch(
    `${process.env['STATS_SERVER']}/${route}`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }
)

export const printResponse = (route, res) => res.status >= 200 && res.status < 300
    ? console.log(`${route} has been sent...`)
    : console.log(`${route}: (${res.status})${res.statusText}`)

// Parse JSON from http response. On error, exit the process.
const jsonOrExit = [
    res => res.json(),
    err => { console.error(err); }
]

const queryToString = query => Object.keys(query).reduce(
    (acc, cur) => acc.concat('&', cur, '=', query[cur]),
    '?'
)