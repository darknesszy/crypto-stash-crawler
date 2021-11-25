import { readBalance as etherscanBalance } from '../plugins/blockchain/etherscan'

export const mapToTask = options =>
  validateOptions(options) ? runTask(options) : exitWithMsg

export const validateOptions = options =>
  Object.keys(taskFnMap)
    // Task is known.
    .includes(task(options))

export const runTask = options =>
  options.params
    ? taskFn(options, options.params, options.output)
    : createRunTask(options)

const createRunTask = options =>
  hasParams(options)
    ? taskFn(options, createParams(options), options.output)
    : exitWithMsg()

export const runAll = (outputFn, wallets) =>
  Promise.all([getBalances(outputFn, wallets)])

export const getBalances = (outputFn, wallets) =>
  wallets
    // Filter out blockchains that are not supported yet.
    .filter(({ ticker }) => Object.keys(balanceFnMap).includes(ticker))
    // Execute function for each wallet in the currency group synchronously.
    .reduce(
      (promises, { address, ticker }) =>
        promises
          .then(() => balanceFnMap[ticker](address))
          .then(balance =>
            outputFn(balance, 'wallets', {
              address: balance.address,
            })
          ),
      Promise.resolve()
    )

const balanceFnMap = {
  ETH: etherscanBalance,
}

const createParams = options => [
  {
    address: options.a || options.address,
    ticker: options.t || options.ticker,
  },
]

const hasParams = options =>
  (options.a || options.address) && (options.t || options.ticker)

const exitWithMsg = () => {
  process.stdout.write(`${help}\n`)
  process.exit(0)
}

const taskFn = (options, params, outputFn) =>
  taskFnMap[task(options)](outputFn, params)
const task = options => options._[1]
const taskFnMap = {
  all: runAll,
  balance: getBalances,
}

const help = `
-F or --file: A json file
-a or --address: currency wallet address
-t or --ticker: The 3 letter ticker symbol of the currency
`
