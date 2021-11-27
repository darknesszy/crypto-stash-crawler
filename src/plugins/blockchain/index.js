import { getBalance as etherscanGetBalance } from './etherscan'

export const getBalance = (ticker, ...params) =>
  // Filter out blockchains that are not supported yet.
  Object.keys(getBalanceFnMap).includes(ticker)
    ? getBalanceFnMap[ticker](...params)
    : Promise.resolve()

export const otherStuff = () => {
  throw new Error('Not Yet Implemented')
}

const getBalanceFnMap = {
  ETH: etherscanGetBalance,
}
