import cron from 'node-cron'

const scheduleTask = (expression, taskFn) => {
  // Setup cron if options were set.
  if (!cron.validate(expression)) {
    process.stdout.write('cron expression format is incorrect.\n')
    process.exit(0)
  }

  process.stdout.write(`cron job started with ${expression}...\n`)
  taskFn()

  cron.schedule(expression, () => {
    process.stdout.write(`job triggered - ${new Date().toString()}...\n`)
    taskFn()
  })
}

export default scheduleTask

// // Setup cron if options were set.
// if(options.cron) {
//     if(!cron.validate(options.cron)) {
//         console.log('cron expression format is incorrect.')
//         process.exit(0)
//     }

//     console.log(options.cron, options.type)

//     cron.schedule(options.cron, () => {
//         console.log('cron job started...')
//         run()
//     })
// } else {
//     run()
// }
