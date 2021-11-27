import fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const existsAsync = promisify(fs.exists)
const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)

export const readParams = options =>
  validateOptions(options)
    ? Promise.resolve()
        .then(() => readJson(options.F || options.file))
        .then(params => ({
          ...options,
          params,
          output: dumpOutput(options.D || options.dump, Date.now().toString()),
        }))
    : // No file was provided.
      exitWithMsg()

export const getOutputFn = (options, outputMsgFn) =>
  options.D || options.dump
    ? dumpOutput(options.D || options.dump, Date.now().toString())
    : data => process.stdout.write(`${outputMsgFn(data)}\n`)

// Send scrapped data to stats server.
export const dumpOutput = (outputPath, timestamp) => (data, name) =>
  outputPath
    ? saveAsFile(join(outputPath, `${name.join('_')}_${timestamp}.json`), data)
    : process.stdout.write(`${data}\n`)

export const validateOptions = options => options.F || options.file

export const exitWithMsg = () => {
  process.stdout.write(`${help}\n`)
  process.exit(0)
}

export const saveAsFile = (filePath, data) =>
  Promise.resolve()
    .then(() =>
      existsAsync(filePath).then(exists =>
        exists
          ? appendJson(filePath, data)
          : writeFileAsync(filePath, JSON.stringify([data]))
      )
    )
    .then(() => process.stdout.write(`dumping data to ${filePath}...\n`))

export const appendJson = (path, data) =>
  Promise.resolve()
    .then(() => readJson(path))
    .then(fileData => writeFileAsync(path, JSON.stringify([...fileData, data])))

export const readJson = filePath =>
  readFileAsync(filePath, 'utf8').then(data => JSON.parse(data))

const help = `
pool: Scrap a mining pool
wallet: Scrap a wallet
defi: Scrap a defi API

-R or --cron: Cron job
-H or --help: Command help
Use command with --help for specific subcommands
`
