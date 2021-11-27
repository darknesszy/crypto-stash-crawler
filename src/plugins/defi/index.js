import {
  getBalance as binanceBalance,
  getExchangeRate as binanceExchangeRate,
} from './binance'

export const getBalance = (provider, ...params) =>
  // Filter out defi functions that are not supported yet.
  Object.keys(getBalanceFnMap).includes(provider)
    ? getBalanceFnMap[provider](...params)
    : Promise.resolve()

export const getExchangeRate = (provider, ...params) =>
  // Filter out defi functions that are not supported yet.
  Object.keys(getExchangeRatesFnMap).includes(provider)
    ? getExchangeRatesFnMap[provider](...params)
    : Promise.resolve()

const getBalanceFnMap = {
  BINANCE: binanceBalance,
}

const getExchangeRatesFnMap = {
  BINANCE: binanceExchangeRate,
}
