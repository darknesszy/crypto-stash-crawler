import { getWallets } from '../../src/utils/stats-server'
jest.mock('node-fetch')
import fetch from 'node-fetch'

it('can get wallets', async () => {
    // Arrange
    const wallets = [
        { coin: { ticker: 'eth' }, address: 'aweg;h' },
        { coin: { ticker: 'eth' }, address: 'bhjkl;h' },
        { coin: { ticker: 'eth' }, address: 'ok4oghh' },
        { coin: { ticker: 'zil' }, address: 'zil2w4g;h' }
    ]
    fetch.mockResolvedValue({
        json: () => wallets
    })

    // Act
    const result = await getWallets('')

    // Assert
    expect(result).toStrictEqual({
        eth: [
            { coin: { ticker: 'eth' }, address: 'aweg;h' },
            { coin: { ticker: 'eth' }, address: 'bhjkl;h' },
            { coin: { ticker: 'eth' }, address: 'ok4oghh' },
        ],
        zil: [
            { coin: { ticker: 'zil' }, address: 'zil2w4g;h' }
        ]
    })
})