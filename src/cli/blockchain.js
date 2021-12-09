import { getBalance } from '../plugins/blockchain'
import getServerParams from '../server/blockchain'
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

export const validateOptions = options =>
  Object.keys(taskFnMap)
    // Task is known.
    .includes(task(options))

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

const composeParams = options => [
  {
    address: options.a || options.address,
    currency: {
      ticker: (options.t || options.ticker).toUpperCase(),
    },
  },
]

const hasParams = options =>
  (options.a || options.address) && (options.t || options.ticker)

const exitWithMsg = () => {
  process.stdout.write(`${helpMsg}\n`)
  process.exit(0)
}

const taskFn = (options, params, outputFn) =>
  taskFnMap[task(options)](outputFn, params)
const task = options => options._[1]
const taskFnMap = {
  balance: getEachBalance,
}

const outputMsg = options => outputMsgMap[task(options)]
const outputMsgMap = {
  balance: data =>
    `${data.address} current balance is ${data.balance} ${data.currency.ticker}`,
}

const helpMsg = `
-F or --file: A json file
-a or --address: currency wallet address
-t or --ticker: The 3 letter ticker symbol of the currency
`
