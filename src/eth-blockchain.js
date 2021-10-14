import fetch from 'node-fetch'
import web3 from 'web3'
import { join } from 'path'
import { saveAsFile } from './debug'

const apiKey = process.env["ETHERSCAN_KEY"]
const statsServer = process.env["STATS_SERVER"]

const balanceUrl = address => new URL(join(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`))

export const get = address => {
    updateEntry(balanceUrl(address), 'wallets', convertBalance(address), true)
}

export const getSync = address => Promise.resolve()
    .then(() => updateEntry(balanceUrl(address), 'wallets', convertBalance(address), true))

export const test = address => {
    saveAsFile(balanceUrl(address), 'etherscan-balance')
}

export const updateEntry = (url, api, converter, isSync) => fetch(url)
    .then(res => res.json(), err => { console.error(err); process.exit(5); })
    // .then(data => console.log(api, converter(data)))
    .then(data => isSync
        ? converter(data).reduce((acc, cur) => acc
            .then(() =>
                fetch(
                    `${statsServer}/${api}?address=${cur.address}`,
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
                : console.log(`${api} reported: (${res.status}) ${res.statusText}`)
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

const convertBalance = address => data => [{
    coin : {
        ticker: 'eth'
    },
    address,
    balance: web3.utils.fromWei(data.result)
}]