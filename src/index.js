import dotenv from 'dotenv'
import minimist from 'minimist'
import { readParams } from './cli/file'
import { runCommand } from './cli/menu'
import { fetchParams } from './cli/server'

// Setup environment variables.
!dotenv.config().error && console.log('Using Environment Variables from .env file...')

console.log('Crypto Stash scraper started...')
process.on('beforeExit', () => console.log('Cryto Stash scraper exited...'))

// Console.log deep print out objects.
require('util').inspect.defaultOptions.depth = null

const options = minimist(process.argv.slice(2))

process.env['API_SERVER'] != null
    ? fetchParams(options).then(options => runCommand(options))
    // Feed input arguments to menu.
    : readParams(options).then(options => runCommand(options))