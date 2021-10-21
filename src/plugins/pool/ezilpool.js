import fetch from 'node-fetch'
import { join } from 'path'
import { createStats, printResponse } from '../../utils/stats-server'

// Skip if "ticker: 'zil'" to avoid duplicate (dedupe would remove "ticker: 'eth'" sometimes instead of "ticker: 'zil'")
export const readBalance = account => account.ticker != 'zil' 
    ? Promise.resolve()
        // Get billing data from ezil.me page api.
        .then(() => fetch(billingUrl(account)))
        .then(res => res.json(), err => { console.error(err); process.exit(5); })
        // Convert billing data to PoolBalance model.
        .then(billing => billingToPoolBalanceModel(account, billing))
    : Promise.resolve()

export const readHashrate = account => account.ticker != 'zil' && Promise.resolve()
    // Get worker data from ezil.me page api.
    .then(() => fetch(workerUrl(account)))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Convert worker array to Hashrate array.
    .then(workers => workersToHashrateModel(account, workers))

// Need refactoring.
export const readPayout = account => account.ticker != 'zil' && Promise.resolve()
    // Get withdrawal data from ezil.me page api.
    .then(() => fetch(withdrawalUrl(account)))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Convert withdrawal array to Payout array.
    .then(withdrawals => withdrawalsToPayoutModel(account, withdrawals))
    // // Attempt to update Payout model on stats server.
    // .then(payouts => createStats(`payouts`, payouts))
    // .then(res => printResponse('payouts', res))


export const billingToPoolBalanceModel = ({ ticker: mainCoin, identifier }, billing) => [mainCoin, 'zil']
    .map(ticker => ({
        current: billing[ticker],
        miningPool: {
            name: 'ezilpool'
        },
        address: identifier.split('.')[ticker == 'zil' ? 1 : 0]
        // address: data[`${coin}_wallet`]
    }))

export const workersToHashrateModel = ({ identifier }, workers) => workers
    .map(({
        wallet,
        worker,
        coin,
        current_hashrate,
        average_hashrate,
        last_share_timestamp,
        reported_hashrate
    }) => ({
        current: current_hashrate || 0,
        average: average_hashrate || 0,
        reported: reported_hashrate || 0,
        worker: {
            name: worker,
            address: identifier.split('.')[0],
            miningPool: {
                name: 'ezilpool'
            }
        }
    }))

export const withdrawalsToPayoutModel = ({ ticker: mainCoin, identifier }, withdrawals) => [mainCoin, 'zil']
    .map(ticker => (
        {
            miningPool: {
                name: 'ezilpool'
            },
            address: identifier.split('.')[ticker == 'zil' ? 1 : 0],
            txHash: withdrawals[ticker][0].tx_hash,
            amount: withdrawals[ticker][0].amount,
            created: withdrawals[ticker][0].created_at,
            confirmed: withdrawals[ticker][0].confirmed_at,
            isConfirmed: withdrawals[ticker][0].confirmed,
            confirmAttempts: withdrawals[ticker][0].confirmation_attempts
        }
    ))

const billingUrl = ({ identifier }) => new URL(join(`https://billing.ezil.me/balances/${identifier}`))

// Unused because response from workerUrl is more comprehensive.
const reportUrl = ({ identifier }) => new URL(join(`https://stats.ezil.me/current_stats/${identifier}/reported`))

const workerUrl = ({ identifier }) => new URL(join(`https://stats.ezil.me/current_stats/${identifier}/workers`))

const withdrawalUrl = ({ identifier }) => new URL(join(`https://billing.ezil.me/withdrawals/${identifier}`))