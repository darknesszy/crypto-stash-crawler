export const scheduleTask = task => {
    return () => {}
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