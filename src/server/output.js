import { join } from 'path'
import { createStats, printResponse, updateStats } from '../utils/stats-server'
import { saveAsFile } from '../cli/file'

const getOutputFn = options =>
  sendOrDumpData(options.D || options.dump, Date.now().toString())

const sendOrDumpData = (outputPath, timestamp) => (data, route, query) =>
  outputPath
    ? saveAsFile(join(outputPath, `${route}_${timestamp}.json`), data)
    : sendData(data, route, query) // Send scrapped data to stats server.

const sendData = (data, route, query) =>
  !query
    ? createStats(route, data).then(res => printResponse(route, res))
    : updateStats(route, data, query)
        // .then(res => (res.status === 404 ? createStats(route, data) : res))
        .then(res => printResponse(route, res))

export default getOutputFn
