import { updateBalances } from '../../../src/plugins/blockchain'

import dotenv from 'dotenv'
// Setup environment variables.
!dotenv.config().error && console.log('Using Environment Variables from .env file...')

test('test', async () => {
    const result = await updateBalances()
    // console.log(result)
    // Object.keys(result).forEach(key => console.log(key))
})