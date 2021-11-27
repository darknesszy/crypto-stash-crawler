import {
  updateBalance,
  getBalance,
} from '../../../src/plugins/blockchain/etherscan'

jest.mock('../../../src/utils/stats-server', () => ({
  __esModule: true,
  ...jest.requireActual('../../../src/utils/stats-server'),
  updateStats: jest.fn((route, data, params) => ({
    status: 200,
    data: data,
  })),
  printResponse: jest.fn((route, res) => res),
}))

test('Balance can convert to stats model', () => {
  // Arrange
  const mockAddress = '0xpa8924ghao23ij'
  const mockBalance = '859114248074655468'

  // Act
  const { currency, address, balance } = updateBalance(mockAddress, mockBalance)

  // Assert
  expect(currency.ticker).toBe('eth')
  expect(address).toBe(mockAddress)
  expect(Number(balance)).toBeLessThan(1)
})

// test("Read balance works", async () => {
//     // Arrange
//     const wallets = JSON.parse(readFileSync(process.env["WALLET_FILE"]))
//     // Act
//     const { status } = await readBalance({ address: wallets["eth"][0] })
//     // Assert
//     expect(status).toBe(200)
// })
