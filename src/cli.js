import minimist from 'minimist'
import { readFileSync } from 'fs'

export const mainMenu = args => {
    const parsedArgs = minimist(args)
    if(!parsedArgs['_'] || parsedArgs['_'].length == 0) {
        console.log(mainHelp)
        process.exit(0)
    }

    const options = {
        cron: parsedArgs['R'] || parsedArgs['cron'],
        concurrent: parsedArgs['U'] || parsedArgs['concurrent']
    }

    switch(parsedArgs['_'][0]) {
        case 'pool':
            return { ...options, config: poolMenu(parsedArgs), type: '' }
        case 'blockchain':
            return { ...options, config: blockchainMenu(parsedArgs), type: '-blockchain' }
        case 'defi':
            return { ...options, config: defiMenu(parsedArgs), type: '-defi' }
        default:
            console.log(mainHelp)
            process.exit(0)
    }
}

export const blockchainMenu = parsedArgs => {
    const configs = parsedArgs['C'] || parsedArgs['config']
    const address = parsedArgs['a'] || parsedArgs['address']
    const ticker = parsedArgs['t'] || parsedArgs['ticker']

    if(configs) {
        return JSON.parse(readFileSync(configs))
    } else if(address && ticker) {
        return {
            [poolName]: {
                address: address,
                coin: ticker
            }
        }
    }

    console.log(blockchainHelp)
    process.exit(0)
}

export const poolMenu = parsedArgs => {
    const configs = parsedArgs['C'] || parsedArgs['config']
    const poolName = parsedArgs['p'] || parsedArgs['pool']
    const address = parsedArgs['a'] || parsedArgs['address']
    const ticker = parsedArgs['t'] || parsedArgs['ticker']

    if(configs) {
        return JSON.parse(readFileSync(configs))
    } else if(poolName && address && ticker) {
        return {
            [poolName]: {
                address: address,
                coin: ticker
            }
        }
    }

    console.log(poolHelp)
    process.exit(0)
}

export const defiMenu = parsedArgs => {
    const configs = parsedArgs['C'] || parsedArgs['config']

    if(configs) {
        return JSON.parse(readFileSync(configs))
    }

    console.log(defiHelp)
    process.exit(0)
}

const mainHelp = `
pool: Scrap a mining pool
wallet: Scrap a wallet
defi: Scrap a defi API

-R or --cron: Cron job
-U or --concurrent: Concurrent mode (not yet implemented)
-H or --help: Command help
Use command with --help for specific subcommands
`

const blockchainHelp = `
-C or --config: A json file
-a or --address: Coin wallet address
-t or --ticker: The 3 letter ticker symbol of the coin
`

const poolHelp = `
-C or --config: A json file
-p or --pool: Name of the pool to scrape
-a or --address: Wallet address the pool is mining to
-t or --ticker: The 3 letter ticker symbol of the coin
`

const defiHelp = `
-C or --config: A json file
Only config file is supported because defi accounts usually requires the use of an API key or secret, which is not secure to write in console
`