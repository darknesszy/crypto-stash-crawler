import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import cron from 'node-cron'
import { mainMenu } from './cli'
// import { updateBalances } from './plugins/blockchain'
// import { updateBalances, updateHashrates } from './plugins/pool'
import { updateBalances, updateExchangeRates } from './plugins/defi'

// Setup environment variables.
!dotenv.config().error && console.log('Using Environment Variables from .env file...')

console.log('Crypto Stash scraper started...')
process.on('beforeExit', () => console.log('Cryto Stash scraper exited...'))

// Console.log deep print out objects.
require('util').inspect.defaultOptions.depth = null

updateExchangeRates()

// // Determine code execution method.
// let options
// if(process.env["WALLET_FILE"]) {
//     // Read wallet scraper configuration.
//     options = { config: JSON.parse(readFileSync(process.env["WALLET_FILE"])), type: '-blockchain' }
// } else if(process.env["POOL_FILE"]) {
//     // Read mining pool scraper configuration.
//     options = { config: JSON.parse(readFileSync(process.env["POOL_FILE"])), type: '' }
// } else if(process.env["ACCOUNT_FILE"]) {
//     // Read defi scraper configuration.
//     options = { config: JSON.parse(readFileSync(process.env["ACCOUNT_FILE"])), type: '-defi' }
// } else {
//     // Read cli parameters.
//     options = mainMenu(process.argv.slice(2))
// }

// // Run the method.
// const run = () => Object.keys(options.config).forEach(key => {
//     let request
//     try {
//         request = require(`./${key}${options.type}`)
//     } catch {
//         console.log(`${key} is unsupported at this time.`)
//     }

//     if(request != null) {
//         if(options.isDryRun) {
//             options.config[key]
//                 .forEach((el, i) => 
//                     setTimeout(() => request.dryRun(el), 1000 * i)
//                 )
//         } else {
//             // TODO: This is pseudo sequential, make it proper.
//             options.config[key]
//                 .forEach((el, i) => 
//                     setTimeout(() => request.getSync(el), 1000 * i)
//                 )
//         }
//     }
// })

// // Setup cron if options were set.
// if(options.cron) {
//     if(!cron.validate(options.cron)) {
//         console.log('cron expression format is incorrect.')
//         process.exit(0)
//     }

//     console.log(options.cron, options.type)
    
//     cron.schedule(options.cron, () => {
//         console.log('cron job started...')
//         run()
//     })
// } else {
//     run()
// }