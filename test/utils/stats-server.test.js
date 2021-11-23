import { getWallets } from '../../src/utils/stats-server'
jest.mock('node-fetch')
import fetch from 'node-fetch'

it('can get wallets', async () => {
  // Arrange
  const wallets = [
    { currency: { ticker: 'eth' }, address: 'aweg;h' },
    { currency: { ticker: 'eth' }, address: 'bhjkl;h' },
    { currency: { ticker: 'eth' }, address: 'ok4oghh' },
    { currency: { ticker: 'zil' }, address: 'zil2w4g;h' },
  ]
  fetch.mockResolvedValue({
    json: () => wallets,
  })

  // Act
  const result = await getWallets('')

  // Assert
  expect(result).toStrictEqual({
    eth: [
      { currency: { ticker: 'eth' }, address: 'aweg;h' },
      { currency: { ticker: 'eth' }, address: 'bhjkl;h' },
      { currency: { ticker: 'eth' }, address: 'ok4oghh' },
    ],
    zil: [{ currency: { ticker: 'zil' }, address: 'zil2w4g;h' }],
  })
})
