import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { convertAccountBalance, convertPrices } from '../src/binance-defi'

// Setup environment variables.
!dotenv.config().error && console.log('Using Environment Variables from .env file...')

test("Account balance conversion works", () => {
    // Arrange
    const binanceAccount = {
        userId: 555
    }
    const data = {
        "snapshotVos": [
            {
                data: {
                    balances: [
                        { asset: 'TEST', free: '0.13047', locked: '0' }
                    ]
                }
            }
        ]
    }

    // Act
    const [{ current, account, coin }] = convertAccountBalance(binanceAccount)(data)

    // Assert
    expect(current).toBe(0.13047)
    expect(account.userId).toBe(555)
    expect(coin.ticker).toBe('test')
})

test("Exchange rate conversion works", () => {
    // Arrange
    const coins = [
        { ticker: 'TEST', usd: 0 },
    ]
    const rates = [
        { symbol: 'TESTUSDT', price: '0.01' }
    ]
    
    // Act
    const [{ ticker, usd }] = convertPrices(coins)(rates)

    // Assert
    expect(ticker).toBe('TEST')
    expect(usd).toBe('0.01')
})