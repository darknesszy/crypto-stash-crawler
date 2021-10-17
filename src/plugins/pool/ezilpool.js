import fetch from 'node-fetch'
import { join } from 'path'
import { createStats, updateStats, printResponse } from '../../utils/stats-server'

// Skip if "coin: 'zil'" to avoid duplicate (dedupe will remove "coin: 'eth'" sometimes instead of "coin: 'zil'")
export const updateBalance = wallet => wallet.coin != 'zil' && Promise.resolve()
    // Get billing data from ezil.me page api.
    .then(() => fetch(billingUrl(wallet)))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Convert billing data to PoolBalance model.
    .then(billing => billingToPoolBalanceModel(wallet, billing))
    // Attempt to update PoolBalance model on stats server.
    .then(balances => Promise.all(
        balances.map(balance => updateStats(`poolbalances`, balance)
            // When update returns no object found, attempt to create model.
            .then(res => res.status == 404
                ? createStats('poolbalances', balance)
                : res
            )
        )
            .then(res => printResponse('poolbalances', res))
    ))


export const updateHashrate = wallet => wallet.coin != 'zil' && Promise.resolve()
    // Get worker data from ezil.me page api.
    .then(() => fetch(workerUrl(wallet)))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Convert worker array to Hashrate array.
    .then(workers => workersToHashrateModel(wallet, workers))
    // Attempt to update Hashrate model on stats server.
    .then(hashrates => Promise.all(
        hashrates.map(hashrate => createStats(`hashrates`, hashrate)
            .then(res => printResponse('hashrates', res))
        )
    ))
    

export const updateWallet = wallet => Promise.resolve()
    // Get withdrawal data from ezil.me page api.
    .then(() => fetch(withdrawalUrl(wallet)))
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // Convert withdrawal array to Payout array.
    .then(withdrawals => withdrawalsToPayoutModel(wallet, withdrawals))
    // Attempt to update Payout model on stats server.
    .then(payouts => createStats(`payouts`, payouts))
    .then(res => printResponse('payouts', res))


export const billingToPoolBalanceModel = ({ coin: mainCoin, account }, billing) => [mainCoin, 'zil']
    .map(coin => ({
        current: billing[coin],
        miningPool: {
            name: 'ezilpool'
        },
        address: account.split('.')[coin == 'zil' ? 1 : 0]
        // address: data[`${coin}_wallet`]
    }))

export const workersToHashrateModel = ({ account }, workers) => workers
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
            address: account.split('.')[0],
            miningPool: {
                name: 'ezilpool'
            }
        }
    }))

export const withdrawalsToPayoutModel = ({ coin: mainCoin, account }, withdrawals) => [mainCoin, 'zil']
    .map(coin => (
        {
            miningPool: {
                name: 'ezilpool'
            },
            address: account.split('.')[coin == 'zil' ? 1 : 0],
            txHash: withdrawals[coin][0].tx_hash,
            amount: withdrawals[coin][0].amount,
            created: withdrawals[coin][0].created_at,
            confirmed: withdrawals[coin][0].confirmed_at,
            isConfirmed: withdrawals[coin][0].confirmed,
            confirmAttempts: withdrawals[coin][0].confirmation_attempts
        }
    ))

const billingUrl = ({ account }) => new URL(join(`https://billing.ezil.me/balances/${account}`))

// Unused because response from workerUrl is more comprehensive.
const reportUrl = ({ account }) => new URL(join(`https://stats.ezil.me/current_stats/${account}/reported`))

const workerUrl = ({ account }) => new URL(join(`https://stats.ezil.me/current_stats/${account}/workers`))

const withdrawalUrl = ({ account }) => new URL(join(`https://billing.ezil.me/withdrawals/${account}`))