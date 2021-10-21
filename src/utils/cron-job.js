import cron from 'node-cron'

export const scheduleTask = (expression, taskFn) => {
    // Setup cron if options were set.
    if (!cron.validate(expression)) {
        console.log('cron expression format is incorrect.')
        process.exit(0)
    }

    console.log(`cron job started with ${expression}...`)
    taskFn()

    cron.schedule(expression, () => {
        console.log(`job triggered - ${new Date().toString()}...`)
        taskFn()
    })
}

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