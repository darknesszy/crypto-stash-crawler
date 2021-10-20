import fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const existsAsync = promisify(fs.exists)
const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)

export const readParams = options => Promise.resolve()
    .then(() => readJson(options['F'] || options['file']))
    .then(params => ({
        ...options,
        params,
        output: dumpOutput(
            options['D'] || options['dump'],
            Date.now().toString()
        )
    }))

// Send scrapped data to stats server.
export const dumpOutput = (outputPath, timestamp) => (data, name) => outputPath
    ? saveAsFile(join(outputPath, `${name}_${timestamp}.json`), data)
    : console.log(data)

export const saveAsFile = (filePath, data) => Promise.resolve()
    .then(() => existsAsync(filePath)
        .then(exists => exists
            ? appendJson(filePath, data)
            : writeFileAsync(filePath, JSON.stringify([data]))
        )
    )
    .then(() => console.log(`dumping data to ${filePath}...`))

export const appendJson = (path, data) => Promise.resolve()
    .then(() => readJson(path))
    .then(fileData => writeFileAsync(
        path, 
        JSON.stringify(
            [ ...fileData, data ]
        )
    ))

export const readJson = filePath => readFileAsync(filePath, 'utf8')
    .then(data => JSON.parse(data))