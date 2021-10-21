import { scheduleTask } from '../utils/cron-job'
import { mapToTask as blockchainTask } from './blockchain'
import { mapToTask as poolTask } from './pool'
import { mapToTask as defiTask } from './defi'

export const runCommand = options => validateOptions(options)
    ? mapToPlugin(options)
    : exitWithMsg()

export const validateOptions = options => options._ != null 
    && options._.length >= 2
    // plugin is known.
    && Object.keys(pluginFnMap).includes(plugin(options))

// Check if task should run as a cron job.
export const mapToPlugin = options => options.R || options.cron
    ? scheduleTask(options.R || options.cron, () => pluginFn(options))
    : pluginFn(options)

export const exitWithMsg = () => {
    console.log(help)
    process.exit(0)
}

const pluginFn = options => pluginFnMap[plugin(options)](options)
const plugin = options => options._[0]
const pluginFnMap = {
    blockchain: blockchainTask,
    pool: poolTask,
    defi: defiTask
}

const help = `
pool: Scrap a mining pool
wallet: Scrap a wallet
defi: Scrap a defi API

-R or --cron: Cron job
-H or --help: Command help
Use command with --help for specific subcommands
`