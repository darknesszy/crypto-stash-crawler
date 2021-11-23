import { join } from 'path'
import { getToken } from '../utils/auth'
import { createStats, getCoins, getDefiAccounts, getPoolAccounts, getWallets, printResponse, updateStats } from "../utils/stats-server"
import { saveAsFile } from "./file"
import { exitWithMsg, validateOptions } from "./menu"

// Get task parameter from server.
export const fetchParams = options => Promise.resolve()
    .then(() => getToken())
    .then(() => validateOptions(options)
        // Whether the selected plugin is known.
        && Object.keys(endpoints.paramsFnMap).includes(plugin(options))
            ? paramsFn(options)
            : exitWithMsg()
    )
    .then(params => ({
        ...options,
        params,
        // CHECK rename to cb.
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

// Plugin selected in command.
const plugin = options => options._[0]
// Function specified by command.
const paramsFn = options => endpoints.paramsFnMap[plugin(options)]()

// REST API endpoints mapped to each option condition.
const endpoints = {
    paramsFnMap: {
        blockchain: getWallets,
        pool: getPoolAccounts,
        defi: () => getDefiAccounts()
            .then(accounts => getCoins()
                .then(params => ({ ...params, accounts }))
            )
    }
}