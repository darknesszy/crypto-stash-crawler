import {
  readBalance as binanceBalance,
  readExchangeRate as binanceExchangeRate,
} from '../plugins/defi/binance'

export const mapToTask = options =>
  validateOptions(options) ? runTask(options) : exitWithMsg

// Task is known.
export const validateOptions = options =>
  Object.keys(taskFnMap).includes(task(options))

export const runTask = options =>
  options.params
    ? taskFn(options, options.params, options.output)
    : runCreateTask(options)

const runCreateTask = options =>
  hasParams(options)
    ? taskFn(options, createParams(options), options.output)
    : exitWithMsg()

export const runAll = (outputFn, data) =>
  Promise.all([
    getBalances(outputFn, data.accounts),
    getExchangeRate(outputFn, data),
  ])

export const getBalances = (outputFn, accounts) =>
  accounts
    // Filter out pools that are not supported yet.
    .filter(account => Object.keys(balanceFnMap).includes(account.provider))
    // Synchronously call pool function for every account.
    .reduce(
      (accountPromises, account) =>
        accountPromises
          .then(() => balanceFnMap[account.provider](account))
          .then(balances =>
            balances.reduce(
              (balancePromises, balance) =>
                balancePromises.then(() =>
                  outputFn(balance, 'accountbalances', {
                    currencyTicker: balance.currency.ticker,
                    userId: balance.account.userId,
                  })
                ),
              Promise.resolve()
            )
          ),
      Promise.resolve()
    )

export const getExchangeRate = (outputFn, { provider, tickers }) =>
  Promise.resolve()
    .then(() => exchangeRateFnMap[provider](tickers))
    .then(exchangeRates =>
      exchangeRates.reduce(
        (acc, exchangeRate) =>
          acc.then(() =>
            outputFn(exchangeRate, 'currencys', {
              currencyTicker: exchangeRate.ticker,
            })
          ),
        Promise.resolve()
      )
    )

const createAllParams = options => [
  {
    ...createBalanceParams(options)[0],
    ...createExchangeRateParams(options)[0],
  },
]

const createBalanceParams = options => [
  {
    provider: options.p || options.provider,
    auth: {
      apiKey: options.a || options.apikey,
      secret: options.s || options.secret,
    },
  },
]

const createExchangeRateParams = options => ({
  provider: options.p || options.provider,
  tickers: [options.t || options.ticker],
})

const hasAllParams = options =>
  hasBalanceParams(options) && hasExchangeRateParams(options)

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
const createParams = options => taskFnMap[task(options)].createParams(options)
const task = options => options._[1]
const taskFnMap = {
  all: {
    hasParams: hasAllParams,
    createParams: createAllParams,
    runFn: runAll,
  },
  balance: {
    hasParams: hasBalanceParams,
    createParams: createBalanceParams,
    runFn: getBalances,
  },
  exchangerate: {
    hasParams: hasExchangeRateParams,
    createParams: createExchangeRateParams,
    runFn: getExchangeRate,
  },
}

const balanceFnMap = {
  binance: binanceBalance,
}

const exchangeRateFnMap = {
  binance: binanceExchangeRate,
}

const help = `
-F or --file: A json file
-p or --provider: Name of the service
-a or --apikey: API key for accessing the service (Highly recommend not using CLI for this)
-s or --secret API secret for accessing the service (Highly recommend not using CLI for this)
-t or --ticker: The 3 letter ticker symbol of the currency
`
