import minimist from 'minimist'
import { runCommand, mapToPlugin } from '../../src/cli/menu'
import { runTask as blockchainTask } from '../../src/cli/blockchain'
jest.mock('../../src/cli/blockchain')

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

it('exits with invalid command', () => {
    // Arrange
    const command = minimist(['pool', '-R'])
    // Act
    runCommand(command)
    // Assert
    expect(mockExit).toHaveBeenCalledWith(0)
})

it('maps to blockchain task with blockchain command', () => {
    // Arrange
    blockchainTask.mockImplementation(() => {})
    const command = minimist(['blockchain', 'balance', '--json=./blockchain.json'])
    // Act
    mapToPlugin(command)
    // Assert
    expect(blockchainTask).toHaveBeenCalled()
})