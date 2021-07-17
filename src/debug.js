import fetch from 'node-fetch'
import fs from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const writeFileAsync = promisify(fs.writeFile)

export const saveAsFile = async (url, fileName, reqInits) => {
    const res = await fetch(url, reqInits)

    try {
        console.log(res.headers)
        const data = await res.json()

        try {
            await writeFileAsync(
                join(__dirname, '..', 'logs', `${fileName || url.hostname}.json`),
                JSON.stringify(data)
            )
        } catch (e) {
            console.error(e)
        }

    } catch (e) {
        console.error(e)
    }

    console.log(`${fileName || url.hostname}.json has been written...`)
}

export const readFile = fileName => JSON.parse(fs.readFileSync(
    join(__dirname, '..', 'logs', fileName),
    'utf8'
))