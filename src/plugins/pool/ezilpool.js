import fetch from 'node-fetch'
import { join } from 'path'

export const getBalance = account =>
  Promise.resolve()
    // Get billing data from ezil.me page api.
    .then(() => fetch(billingUrl(account)))
    .then(...handleResponse)
    // Convert billing data to PoolBalance model.
    .then(billing => billingToBalanceModel(account, billing))

export const getHashRates = account =>
  Promise.resolve()
    // Get worker data from ezil.me page api.
    .then(() => fetch(workerUrl(account)))
    .then(...handleResponse)
    // Convert worker array to Hashrate array.
    .then(workers => workersToHashRateModel(account, workers))

// Need refactoring.
export const getPayouts = account =>
  Promise.resolve()
    // Get withdrawal data from ezil.me page api.
    .then(() => fetch(withdrawalUrl(account)))
    .then(...handleResponse)
    // Convert withdrawal array to Payout array.
    .then(withdrawals => withdrawalsToPayoutModel(account, withdrawals))
// // Attempt to update Payout model on stats server.
// .then(payouts => createStats(`payouts`, payouts))
// .then(res => printResponse('payouts', res))

export const billingToBalanceModel = (account, billing) =>
  account.miningPool.currencies.map(currency => ({
    miningAccount: account,
    savings: billing[currency.ticker.toLowerCase()],
    currency,
  }))

export const workersToHashRateModel = (account, workers) =>
  workers.map(
    ({
      // wallet,
      worker,
      // currency,
      current_hashrate: current,
      average_hashrate: average,
      // last_share_timestamp,
      reported_hashrate: reported,
    }) => ({
      current: current || 0,
      average: average || 0,
      reported: reported || 0,
      miningWorker: findWorker(account, worker),
    })
  )

export const findWorker = (account, name) => {
  const index = (account.miningWorkers || []).map(el => el.name).indexOf(name)
  return {
    ...(index !== -1 && account.miningWorkers[index]),
    name,
    miningAccount: {
      ...account,
      miningWorkers: [],
    },
  }
}

// export const workersToHashrateModel = ({ identifier }, workers) =>
//   workers.map(
//     ({
//       // wallet,
//       worker,
//       // currency,
//       current_hashrate: current,
//       average_hashrate: average,
//       // last_share_timestamp,
//       reported_hashrate: reported,
//     }) => ({
//       current: current || 0,
//       average: average || 0,
//       reported: reported || 0,
//       worker: {
//         name: worker,
//         address: identifier.split('.')[0],
//         miningPool: {
//           name: 'ezilpool',
//         },
//       },
//     })
//   )

export const withdrawalsToPayoutModel = (
  { ticker: maincurrency, identifier },
  withdrawals
) =>
  [maincurrency, 'zil'].map(ticker => ({
    miningPool: {
      name: 'ezilpool',
    },
    address: identifier.split('.')[ticker === 'zil' ? 1 : 0],
    txHash: withdrawals[ticker][0].tx_hash,
    amount: withdrawals[ticker][0].amount,
    created: withdrawals[ticker][0].created_at,
    confirmed: withdrawals[ticker][0].confirmed_at,
    isConfirmed: withdrawals[ticker][0].confirmed,
    confirmAttempts: withdrawals[ticker][0].confirmation_attempts,
  }))

const billingUrl = ({ identifier }) =>
  new URL(join(`https://billing.ezil.me/balances/${identifier}`))

// Unused because response from workerUrl is more comprehensive.
// const reportUrl = ({ identifier }) =>
//   new URL(join(`https://stats.ezil.me/current_stats/${identifier}/reported`))

const workerUrl = ({ identifier }) =>
  new URL(join(`https://stats.ezil.me/current_stats/${identifier}/workers`))

const withdrawalUrl = ({ identifier }) =>
  new URL(join(`https://billing.ezil.me/withdrawals/${identifier}`))

const handleResponse = [
  res => {
    if (res.status === 200) {
      return res.json()
    }
    throw res.statusText || `Request Failed ${res.status}`
  },
  err => {
    throw err
  },
]
