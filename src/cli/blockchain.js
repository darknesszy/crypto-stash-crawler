import { getBalance } from '../plugins/blockchain'

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
  Promise.all([getEachBalance(outputFn, wallets)])

export const getEachBalance = (outputFn, wallets) =>
  wallets
    // Execute function for each wallet in the currency group synchronously.
    .reduce(
      (promises, wallet) =>
        promises
          .then(() => getBalance(wallet.currency.ticker, wallet))
          .then(balance => outputFn(balance, 'wallets', wallet.id)),
      Promise.resolve()
    )

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
  balance: getEachBalance,
}

const help = `
-F or --file: A json file
-a or --address: currency wallet address
-t or --ticker: The 3 letter ticker symbol of the currency
`
