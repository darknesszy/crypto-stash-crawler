import { join } from 'path'
import { createStats, getCoins, getDefiAccounts, getPoolAccounts, getWallets, printResponse, updateStats } from "../utils/stats-server"
import { saveAsFile } from "./file"
import { exitWithMsg, validateOptions } from "./menu"

// Get task parameters from stats server.
export const fetchParams = options => Promise.resolve()
    .then(() => validateOptions(options) 
        && Object.keys(endpoints.commands).includes(plugin(options))
        ? paramsFn(options)
        : exitWithMsg()
    )
    .then(params => ({
        ...options,
        params,
        output: sendData(
            options['D'] || options['dump'],
            Date.now().toString()
        )
    }))

export const sendData = (outputPath, timestamp) => (data, route, query) => outputPath
    ? saveAsFile(join(outputPath, `${route}_${timestamp}.json`), data)
    // Send scrapped data to stats server.
    : !query
        ? createStats(route, data).then(res => printResponse(route, res))
        : updateStats(route, data, query)
            .then(res => res.status == 404
                ? createStats(route, data)
                : res
            )
            .then(res => printResponse(route, res))

const plugin = options => options._[0]
const paramsFn = options => endpoints.commands[plugin(options)]()

// REST API endpoints mapped to each option condition.
const endpoints = {
    commands: {
        blockchain: getWallets,
        pool: getPoolAccounts,
        defi: () => getDefiAccounts()
            .then(accounts => getCoins()
                .then(params => ({ ...params, accounts }))
            )
    }
}