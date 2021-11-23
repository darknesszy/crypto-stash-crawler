import dotenv from 'dotenv'
import minimist from 'minimist'
import { readParams } from './cli/file'
import { runCommand } from './cli/menu'
import { fetchParams } from './cli/server'

// Setup environment variables.
if (dotenv.config().error === undefined)
  process.stdout.write('Using Environment Variables from .env file...\n')

process.stdout.write('Crypto Stash scraper started...\n')
process.on('beforeExit', () =>
  process.stdout.write('Cryto Stash scraper exited...\n')
)

// Console.log deep print out objects.
require('util').inspect.defaultOptions.depth = null

const options = minimist(process.argv.slice(2))

if (process.env.API_SERVER !== null) {
  fetchParams(options).then(_options => runCommand(_options))
} else {
  // Feed input arguments to menu.
  readParams(options).then(_options => runCommand(_options))
}
