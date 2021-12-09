import { getBalance, getExchangeRate } from '../plugins/defi'
import getServerParams from '../server/defi'
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
      .then(() =>
        getServerParams(task(options), (options.p || options.provider).toUpperCase())
      )
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

export const getEachBalance = (outputFn, [apiKeys, currencies]) =>
  apiKeys
    // Synchronously call defi function for every account.
    .reduce(
      (accountPromises, apiKey) =>
        accountPromises
          .then(() =>
            getBalance(
              apiKey.exchangeAccount.currencyExchange.name,
              apiKey,
              currencies
            )
          )
          .then(balances =>
            balances.reduce(
              (balancePromises, balance) =>
                balancePromises.then(() =>
                  outputFn(balance, [
                    'exchangeaccounts',
                    balance.exchangeAccount.id || 0,
                    'balances',
                  ])
                ),
              Promise.resolve()
            )
          ),
      Promise.resolve()
    )

export const getServiceExchangeRates = (
  outputFn,
  [currencyExchange, currencies]
) =>
  Promise.resolve()
    .then(() =>
      getExchangeRate(currencyExchange.name, currencyExchange, currencies)
    )
    .then(exchangeRates =>
      exchangeRates.reduce(
        (promises, exchangeRate) =>
          promises.then(() =>
            outputFn(exchangeRate, [
              'currencyexchanges',
              exchangeRate.currencyExchange.id || 0,
              'exchangerates',
            ])
          ),
        Promise.resolve()
      )
    )

const composeBalanceParams = options => [
  [
    {
      publicKey: options.a || options.apikey,
      privateKey: options.s || options.secret,
      exchangeAccount: {
        currencyExchange: {
          name: (options.p || options.provider).toUpperCase(),
        },
      },
    },
  ],
  ['ETH', 'ZIL', 'USDT'].map(el => ({ ticker: el })),
]

const composeExchangeRateParams = options => [
  {
    name: (options.p || options.provider).toUpperCase(),
  },
  (options.t || options.ticker)
    .split(',')
    .map(el => ({ ticker: el.toUpperCase() })),
]

const hasBalanceParams = options =>
  (options.p || options.provider) &&
  (options.a || options.apikey) &&
  (options.s || options.secret)

const hasExchangeRateParams = options =>
  (options.p || options.provider) && (options.t || options.ticker)

const exitWithMsg = () => {
  console.log(help)
  process.exit(0)
}

const taskFn = (options, params, outputFn) =>
  taskFnMap[task(options)].runFn(outputFn, params)
const hasParams = options => taskFnMap[task(options)].hasParams(options)
const composeParams = options => taskFnMap[task(options)].createParams(options)
const task = options => options._[1]
const taskFnMap = {
  balance: {
    hasParams: hasBalanceParams,
    createParams: composeBalanceParams,
    runFn: getEachBalance,
  },
  exchangerate: {
    hasParams: hasExchangeRateParams,
    createParams: composeExchangeRateParams,
    runFn: getServiceExchangeRates,
  },
}

const outputMsg = options => outputMsgMap[task(options)]
const outputMsgMap = {
  balance: data =>
    `Your account with ${data.exchangeAccount.currencyExchange.name} currently holds ${data.savings} ${data.currency.ticker}`,
  exchangerate: data =>
    `Current rate for buying ${data.sellerCurrency.ticker} with ${data.buyerCurrency.ticker} is ${data.current} ${data.buyerCurrency.ticker}`,
}

const help = `
-F or --file: A json file
-p or --provider: Name of the service
-a or --apikey: API key for accessing the service
-s or --secret API secret for accessing the service
-t or --ticker: The ticker symbol of the currency
`
