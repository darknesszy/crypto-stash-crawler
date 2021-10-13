import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { getAccountBalance } from '../src/binance-defi'

// Setup environment variables.
!dotenv.config().error && console.log('Using Environment Variables from .env file...')

test("Dummy unit test", () => {
    // Arrange
    const accounts = JSON.parse(readFileSync(process.env["ACCOUNT_FILE"]))

    // Act
    // convertPricesFunc(data)
    console.log(getAccountBalance(accounts[0]))

    // Assert
    // expect(data).toMatchObject({ 'bianance': {} })
    // const actual = 1; // not implemented yet
    // expect(actual).toBe(1);
});