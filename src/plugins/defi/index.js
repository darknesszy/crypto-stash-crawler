import fetch from 'node-fetch'
import _ from 'lodash'
import { updateBalance as binanceBalance, updateExchangeRate as binanceExchangeRate } from './binance'

export const updateBalances = () => Promise.resolve()
    // Get all accounts from stats server.
    .then(() => fetch(`${process.env["STATS_SERVER"]}/accounts`))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Group accounts by defi provider.
    .then(accounts => _.groupBy(accounts, el => el.provider.name))
    // Asynchronously call grouped defi functions.
    .then(providers => Promise.all(
        Object.keys(providers)
            // Filter out blockchains that are not supported yet.
            .filter(providerName => Object.keys(balanceFuncMap).includes(providerName))
            // Execute function for each wallet in the coin group synchronously.
            .map(providerName => providers[providerName]
                .reduce((acc, account) =>
                    acc.then(() =>
                        balanceFuncMap[providerName]({
                            ...JSON.parse(account.authJson),
                            userId: account.userId
                        })
                    ),
                    Promise.resolve()
                )
            )
    ))

export const updateExchangeRates = () => Promise.resolve()
    // Get all accounts from stats server.
    .then(() => fetch(`${process.env["STATS_SERVER"]}/accounts`))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Select bi
    .then(accounts => accounts.find(account => account.provider.name == 'binance'))
    .then(account => binanceExchangeRate(JSON.parse(account.authJson)))
    // // Group accounts by defi provider.
    // .then(accounts => _.groupBy(accounts, el => el.provider.name))
    // // Asynchronously call grouped defi functions.
    // .then(providers => Promise.all(
    //     Object.keys(providers)
    //         // Filter out blockchains that are not supported yet.
    //         .filter(providerName => Object.keys(balanceFuncMap).includes(providerName))
    //         // Execute function for each wallet in the coin group synchronously.
    //         .map(providerName => providers[providerName]
    //             .reduce((acc, account) =>
    //                 acc.then(() =>
    //                     balanceFuncMap[providerName]({
    //                         ...JSON.parse(account.authJson),
    //                         userId: account.userId
    //                     })
    //                 ),
    //                 Promise.resolve()
    //             )
    //         )
    // ))

const balanceFuncMap = {
    'binance': binanceBalance
}