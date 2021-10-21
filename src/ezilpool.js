import fetch from 'node-fetch'
import fs from 'fs'
import { join } from 'path'

const statsServer = process.env["API_SERVER"]

const billingUrl = ({ address }) => new URL(join(`https://billing.ezil.me/balances/${address}`))
const hashrateUrl = ({ address }) => new URL(join(`https://stats.ezil.me/current_stats/${address}/reported`))
const workerUrl = ({ address }) => new URL(join(`https://stats.ezil.me/current_stats/${address}/workers`))
const payoutUrl = ({ address }) => new URL(join(`https://billing.ezil.me/withdrawals/${address}`))

export const get = wallet => {
    updateEntry(billingUrl(wallet), 'poolbalances', convertBilling(wallet))
    addEntry(workerUrl(wallet), 'hashrates', convertWorker(wallet))
    addEntry(payoutUrl(wallet), `payouts`, convertPayout(wallet))
}

export const getSync = wallet => Promise.resolve()
    .then(() => updateEntry(billingUrl(wallet), 'poolbalances', convertBilling(wallet), true))
    .then(() => addEntry(workerUrl(wallet), 'hashrates', convertWorker(wallet), true))
    .then(() => addEntry(payoutUrl(wallet), `payouts`, convertPayout(wallet), true))

export const test = wallet => {
    const data = JSON.parse(fs.readFileSync(
        join(__dirname, '..', 'data', `payout.ezil.me.json`),
        'utf8'
    ))

    console.log(convertPayout(wallets, 'ezilpool')(data))
}

export const addEntry = (url, api, converter, isSync) => fetch(url)
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // .then(data => console.log(api, converter(data)))
    .then(data => isSync
        ? converter(data).reduce((acc, cur) => acc
            .then(() =>
                fetch(
                    `${statsServer}/${api}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cur),
                    }
                )
            )
            .then(res => res.status >= 200 && res.status < 300
                ? console.log(`${api} added successfully...`)
                : console.log(`${api} reported: (${res.status}) ${res.statusText}`)
            ),
            Promise.resolve()
        )
        : Promise.all(
            converter(data).map(model =>
                fetch(
                    `${apiUrl}/${api}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(model),
                    }
                ).then(res => res.status >= 200 && res.status < 300
                    ? console.log(`${api} has been sent...`)
                    : console.log(`sending ${api}: (${res.status})${res.statusText}`)
                )
            )
        )
    )

export const updateEntry = (url, api, converter, isSync) => fetch(url)
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // .then(data => console.log(api, converter(data)))
    .then(data => isSync
        ? converter(data).reduce((acc, cur) => acc
            .then(() =>
                fetch(
                    `${statsServer}/${api}?address=${cur.address}&poolName=${cur.miningPool.name}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cur),
                    }
                )
            )
            .then(res => res.status == 404
                ? fetch(
                    `${statsServer}/${api}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cur),
                    }
                )
                : res
            )
            .then(res => res.status >= 200 && res.status < 300
                ? console.log(`${api} updated successfully...`)
                : console.log(`updating ${api} reported: (${res.status}) ${res.statusText}`)
            ),
            Promise.resolve()
        )
        : Promise.all(
            converter(data).map(model =>
                fetch(
                    `${apiUrl}${api}/${model.miningPool.name}/${model.wallet.address}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(model),
                    }
                ).then(res => res.status == 404
                    ? fetch(
                        `${apiUrl}/${api}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(model),
                        }
                    )
                    : res
                ).then(res => res.status >= 200 && res.status < 300
                    ? console.log(`${api} has been sent...`)
                    : console.log(`${api}: (${res.status})${res.statusText}`)
                )
            )
        )
    )

const convertBilling = ({ coin: mainCoin, address }) => data => [mainCoin, 'zil']
    .map(coin => ({
        current: data[coin],
        miningPool: {
            name: 'ezilpool'
        },
        address: address.split('.')[coin == 'zil' ? 1 : 0]
        // address: data[`${coin}_wallet`]
    }))

const convertWorker = ({ address }) => data => data
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
            address: address.split('.')[0],
            miningPool: {
                name: 'ezilpool'
            }
        }
    }))

const convertPayout = ({ coin: mainCoin, address }) => data => [mainCoin, 'zil']
    .map(coin => (
        {
            miningPool: {
                name: 'ezilpool'
            },
            address: address.split('.')[coin == 'zil' ? 1 : 0],
            txHash: data[coin][0].tx_hash,
            amount: data[coin][0].amount,
            created: data[coin][0].created_at,
            confirmed: data[coin][0].confirmed_at,
            isConfirmed: data[coin][0].confirmed,
            confirmAttempts: data[coin][0].confirmation_attempts
        }
    ))