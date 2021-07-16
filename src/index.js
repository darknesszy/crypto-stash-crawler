import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import cron from 'node-cron'
import { mainMenu } from './cli'

// Setup environment variables
!dotenv.config().error && console.log('Using Environment Variables from .env file...')

console.log('Crypto Stash scraper started...')
process.on('beforeExit', () => console.log('Cryto Stash scraper exited...'))

require('util').inspect.defaultOptions.depth = null
let options
if(process.env["WALLET_FILE"]) {
    options = { config: JSON.parse(readFileSync(process.env["WALLET_FILE"])), type: '-blockchain' }
} else if(process.env["POOL_FILE"]) {
    options = { config: JSON.parse(readFileSync(process.env["POOL_FILE"])), type: '' }
} else if(process.env["ACCOUNT_FILE"]) {
    options = { config: JSON.parse(readFileSync(process.env["ACCOUNT_FILE"])), type: '-defi' }
} else {
    options = mainMenu(process.argv.slice(2))
}

const run = () => Object.keys(options.config).forEach(key => {
    let request
    try {
        request = require(`./${key}${options.type}`)
    } catch {
        console.log(`${key} is unsupported at this time.`)
    }

    if(request != null) {
        // TODO: This is pseudo sequential, make it proper.
        options.config[key].forEach((el, i) => setTimeout(() => request.getSync(el), 1000 * i))
    }
})
console.log(options)
if(options.cron) {
    if(!cron.validate(options.cron)) {
        console.log('cron expression format is incorrect.')
        process.exit(0)
    }

    cron.schedule(options.cron, () => {
        console.log('cron job started...')
        run()
    })
} else {
    run()
}