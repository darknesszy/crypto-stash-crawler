import dotenv from 'dotenv'
import minimist from 'minimist'
import { runCommand } from './cli/menu'

// Setup environment variables.
if (dotenv.config().error === undefined)
  process.stdout.write('Using Environment Variables from .env file...\n')

process.stdout.write('Crypto Stash Connect started...\n')
process.on('beforeExit', () =>
  process.stdout.write('Crypto Stash Connect exited...\n')
)

// Console.log deep print out objects.
require('util').inspect.defaultOptions.depth = null

// Feed input arguments to menu.
runCommand(minimist(process.argv.slice(2), { string: ['a', 'address'] }))