import {
  getBalance as ezilBalance,
  getHashRates as ezilHashrate,
  getPayouts as ezilPayout,
} from './ezilpool'

export const getBalance = (poolName, ...params) =>
  // Filter out pool functions that are not supported yet.
  Object.keys(getBalanceFnMap).includes(poolName)
    ? getBalanceFnMap[poolName](...params)
    : Promise.resolve()

export const getHashRates = (poolName, ...params) =>
  // Filter out pool functions that are not supported yet.
  Object.keys(getHashRatesFnMap).includes(poolName)
    ? getHashRatesFnMap[poolName](...params)
    : Promise.resolve()

export const getPayouts = (poolName, ...params) =>
  // Filter out pool functions that are not supported yet.
  Object.keys(getPayoutsFnMap).includes(poolName)
    ? getPayoutsFnMap[poolName](...params)
    : Promise.resolve()

const getBalanceFnMap = {
  EZIL: ezilBalance,
}

const getHashRatesFnMap = {
  EZIL: ezilHashrate,
}

const getPayoutsFnMap = {
  EZIL: ezilPayout,
}
