import { billingToPoolBalanceModel, withdrawalsToPayoutModel, workersToHashrateModel } from '../../../src/plugins/pool/ezil'

const mockWallet = {
    coin: 'eth',
    // Its ezil pool address for no particular reason.
    address: '0xcC22CB1b6625b64e81909456111d76Be6158dfBc'
}

test('Billing data can transform to PoolBalance', () => {
    // Arrange
    const mockBilling = {
        eth: 0.002068465684098714,
        etc: 0.059478372859604831,
        zil: 15.781060593082,
    }

    // Act
    const result = billingToPoolBalanceModel(mockWallet, mockBilling)
    
    // Assert
    expect(Array.isArray(result)).toBeTruthy()

    const [{ current, miningPool, address }] = result
    expect(current).toBe(mockBilling.eth)
    expect(miningPool.name).toBe('ezilpool')
    expect(address).toBe(mockWallet.address)
})

test('Worker data can transform to Hashrates', () => {
    // Arrange
    const mockWorker = [
        { worker: 'testmachine1', coin: 'eth', current_hashrate: 100964268, average_hashrate: 100299798, last_share_timestamp: 1625402429, reported_hashrate: 100898208 }
    ]

    // Act
    const result = workersToHashrateModel(mockWallet, mockWorker)
    
    // Assert
    expect(Array.isArray(result)).toBeTruthy()
    
    const [{ current, average, reported, worker }] = result
    expect(current).toBe(mockWorker[0].current_hashrate)
    expect(average).toBe(mockWorker[0].average_hashrate)
    expect(reported).toBe(mockWorker[0].reported_hashrate)

    const { name, miningPool: { name: poolName } } = worker
    expect(name).toBe(mockWorker[0].worker)
    expect(poolName).toBe('ezilpool')
})

test('Withdrawal data can transform to Payouts', () => {
    // Arrange
    const mockWithdrawals = {
        eth: [
            { amount: Math.random(0, 10), coin: 'eth', created_at: '2021-06-22T06:00:00Z', address: mockWallet.address }
        ],
        etc: [],
        zil: [
            { amount: Math.random(0, 100), coin: 'zil', created_at: '2021-06-22T06:00:00Z', address: mockWallet.address }
        ]
    }
    
    // Act
    const result = withdrawalsToPayoutModel(mockWallet, mockWithdrawals)
    
    // Assert
    expect(Array.isArray(result)).toBeTruthy()

    const [
        { amount, created, address, miningPool }
    ] = result
    expect(amount).toBe(mockWithdrawals['eth'][0].amount)
    expect(created).toBe(mockWithdrawals['eth'][0].created_at)
    expect(address).toBe(mockWithdrawals['eth'][0].address)
    expect(address).toBe(mockWallet.address)
    expect(miningPool.name).toBe('ezilpool')
})