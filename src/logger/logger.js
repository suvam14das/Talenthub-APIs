const log4js = require('log4js')

// log4js.configure({ 
//     appenders: {
//         talenthub: {   type: 'file', filename: "./logs/talenthub.log"  }
//     }, 
//     categories: {
//         default: { appenders : ['talenthub'], level: 'debug'}
//     }
//     })
// const logger = log4js.getLogger('talenthub');

log4js.configure({ 
    appenders: {
        talenthub: {   type: 'console' }
    }, 
    categories: {
        default: { appenders : ['talenthub'], level: 'debug'}
    }
    })
const logger = log4js.getLogger('talenthub');


module.exports = logger