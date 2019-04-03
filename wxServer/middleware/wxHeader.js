const logger = require('../log')
module.exports = function (ctx, next) {
    
    var headerCheck = async function(ctx, next) {
        if (ctx.request.header['x-token'] === undefined) {
            var rsp = {
                code:99,
                msg: 'error wx token'
            }
            logger.error('缺少wxtoken')
            return ctx.body = JSON.stringify(rsp)
        }
        await next()
    }
    
    headerCheck.unless = require('koa-unless')
    return headerCheck
}
