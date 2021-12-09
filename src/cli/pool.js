import { getBalance, getHashRates, getPayouts } from '../plugins/pool'
import { getParams as getServerParams } from '../server/pool'
import getServerOutputFn from '../server/output'
import { getOutputFn as getCliOutputFn } from './file'
import { loadToken } from '../utils/auth'

export const runTask = options =>
  process.env.API_SERVER !== undefined
    ? runServerParams(options)
    : runCliParams(options)

export const runServerParams = options =>
  validateOptions(options)
    ? Promise.resolve()
        .then(() => loadToken())
        .then(() => getServerParams(task(options)))
        .then(params => taskFn(options, params, getServerOutputFn(options)))
    : exitWithMsg()

export const runCliParams = options =>
  validateOptions(options) && hasParams(options)
    ? taskFn(
        options,
        composeParams(options),
        getCliOutputFn(options, outputMsg(options))
      )
    : exitWithMsg()

// Task is known.
export const validateOptions = options =>
  Object.keys(taskFnMap).includes(task(options))

export const getEachBalance = (outputFn, accounts) =>
  // Sequentially call pool function for every account.
  accounts.reduce(
    (accountPromises, account) =>
      accountPromises
        .then(() => getBalance(account.miningPool.name, account))
        // This sequential because outputing as file will write simultaneously otherwise.
        .then(balances =>
          balances.reduce(
            (balancePromises, balance) =>
              balancePromises.then(() =>
                outputFn(balance, [
                  'miningaccounts',
                  balance.miningAccount.id || 0,
                  'balances',
                ])
              ),
            Promise.resolve()
          )
        ),
    Promise.resolve()
  )

export const getEachHashRates = (outputFn, accounts) =>
  // Sequentially call pool function for every account.
  accounts.reduce(
    (accountPromises, account) =>
      accountPromises
        .then(() => getHashRates(account.miningPool.name, account))
        .then(hashrates =>
          hashrates.reduce(
            (hashRatePromises, hashRate) =>
              hashRatePromises.then(() =>
                outputFn(hashRate, ['miningworkers', 'hashrates'])
              ),
            Promise.resolve()
          )
        ),
    Promise.resolve()
  )

export const getEachPayouts = (outputFn, accounts) =>
  // Sequentially call pool function for every account.
  accounts.reduce(
    (accountPromises, account) =>
      accountPromises
        .then(() => getPayouts(account.miningPool.name, account))
        .then(payouts =>
          payouts.reduce(
            (hashRatePromises, hashRate) =>
              hashRatePromises.then(() => outputFn(hashRate, 'payouts')),
            Promise.resolve()
          )
        ),
    Promise.resolve()
  )

const composeParams = options => [
  {
    identifier: options.a || options.address,
    miningPool: {
      name: (options.p || options.pool).toUpperCase(),
      currencies: currenciesParam(options),
    },
  },
]

const currenciesParam = options =>
  (options.t || options.ticker).includes(',')
    ? (options.t || options.ticker)
        .split(',')
        .map(el => ({ ticker: el.toUpperCase() }))
    : [{ ticker: (options.t || options.ticker).toUpperCase() }]

const hasParams = options =>
  (options.a || options.address) &&
  (options.t || options.ticker) &&
  (options.p || options.pool)

const exitWithMsg = () => {
  process.stdout.write(`${help}\n`)
  process.exit(0)
}

const taskFn = (options, params, outputFn) =>
  taskFnMap[task(options)](outputFn, params)
const task = options => options._[1]
const taskFnMap = {
  balance: getEachBalance,
  hashrate: getEachHashRates,
  payout: getEachPayouts,
}

const outputMsg = options => outputMsgMap[task(options)]
const outputMsgMap = {
  balance: data =>
    `${data.miningAccount.identifier} current balance is ${data.savings} ${data.currency.ticker}`,
  hashrate: data =>
    `Worker ${data.miningWorker.name} hashrate is currently ${data.current}, ${data.average}, ${data.reported}`,
}

const help = `
-F or --file: A json file
-a or --address: Account name used by the pool to identify you
-t or --ticker: The 3 letter ticker symbol of the currency
-p or --pool: The name of the pool
`
