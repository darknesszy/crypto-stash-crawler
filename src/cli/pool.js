import _ from 'lodash'
import { readBalance as ezilBalance, readHashrate as ezilHashrate } from '../plugins/pool/ezilpool'

export const mapToTask = options => validateOptions(options)
    ? runTask(options)
    : exitWithMsg

// Task is known.
export const validateOptions = options => Object.keys(taskFnMap)
    .includes(task(options))

export const runTask = options => options.params
    ? taskFn(options, options.params, options.output)
    : hasParams(options)
        ? taskFn(options, createParams(options), options.output)
        : exitWithMsg()

export const runAll = (outputFn, accounts) => Promise.all([
    getBalances(outputFn, accounts),
    getHashrates(outputFn, accounts)
])

export const getBalances = (outputFn, accounts) => accounts
    // Filter out pools that are not supported yet.
    .filter(account => Object.keys(balanceFnMap).includes(account.pool))
    // Synchronously call pool function for every account.
    .reduce(
        (acc, account) => acc
            .then(() => balanceFnMap[account.pool](account))
            // Skip if function returns null, otherwise treat return value as array.
            .then(balances => balances && balances.reduce(
                (acc, balance) => acc.then(() => 
                    outputFn(
                        balance, 
                        'poolbalances',
                        { address: balance.address, poolName: balance.miningPool.name }
                    )
                ),
                Promise.resolve()
            )),
        Promise.resolve()
    )

export const getHashrates = (outputFn, accounts) => accounts
    // Filter out pools that are not supported yet.
    .filter(account => Object.keys(hashrateFnMap).includes(account.pool))
    // Synchronously call pool function for every account.
    .reduce(
        (acc, account) => acc
            .then(() => hashrateFnMap[account.pool](account))
            .then(hashrates => hashrates && hashrates.reduce(
                (acc, hashrate) => acc.then(() => outputFn(hashrate, 'hashrates')),
                Promise.resolve()
            )),
        Promise.resolve()
    )

const createParams = options => [{
    identifier: options.i || options.identifier,
    ticker: options.t || options.ticker,
    pool: options.p || options.pool
}]

const hasParams = options => (options.i || options.identifier)
    && (options.t || options.ticker) && (options.p || options.pool)

const exitWithMsg = () => {
    console.log(help)
    process.exit(0)
}

const taskFn = (options, params, outputFn) => taskFnMap[task(options)](outputFn, params)
const task = options => options._[1]
const taskFnMap = {
    all: runAll,
    balance: getBalances,
    hashrate: getHashrates
}

const balanceFnMap = {
    'ezilpool': ezilBalance
}

const hashrateFnMap = {
    'ezilpool': ezilHashrate
}

const help = `
-F or --file: A json file
-i or --identifier: Account name used by the pool to identify you
-t or --ticker: The 3 letter ticker symbol of the coin
-p or --pool: The name of the pool
`