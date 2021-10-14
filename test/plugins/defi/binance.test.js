import { PairPricesToCoins, snapshotsToAccountBalanceModel } from '../../../src/plugins/defi/binance'

const mockAccount = {
    apiKey: '',
    secret: ''
}

test('Snapshot data can transform to AccountBalances', () => {
    // Arrange
    const mockSnapshots = {
        snapshotVos: [
            {
                type: 'spot',
                updateTime: 1625788799000,
                data: {
                    balances: [
                        { asset: 'ETH', free: Math.random(0, 10).toString(), locked: '0' }
                    ]
                }
            }
        ]
    }

    // Act
    const result = snapshotsToAccountBalanceModel(mockAccount, mockSnapshots)

    // Assert
    expect(Array.isArray(result)).toBeTruthy()
    
    const [{ current, account, coin }] = result
    const { snapshotVos: [{ type, updateTime, data }] } = mockSnapshots
    expect(current).toBe(Number(data.balances[0].free))
    expect(coin.ticker).toBe(data.balances[0].asset.toLowerCase())
    const { provider: { name } } = account
    expect(name).toBe('binance')
})

test('Prices can pair with coins', () => {
    // Arrange
    const mockPrices = [
        { symbol: 'ETHUSDT', price: '1884.91000000' }
    ]
    const mockCoins = [
        { ticker: 'eth' }
    ]

    // Act
    const result = PairPricesToCoins(mockCoins, mockPrices)

    // Assert
    expect(Array.isArray(result)).toBeTruthy()

    const [{ ticker, usd }] = result
    expect(ticker).toBe(mockCoins[0].ticker)
    expect(usd).toBe(mockPrices[0].price)
})