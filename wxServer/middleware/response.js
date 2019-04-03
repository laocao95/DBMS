const logger = require('../log')
module.exports = async function (ctx, next) {
    try {
        ctx.response.type = 'json'
        //record all request
        if (ctx.request.header['x-token'] != undefined) {
            logger.info('x-token: ' + ctx.request.header['x-token'] + ' method=' + ctx.request.path)
        } else {
            logger.info('ip: ' + ctx.request.ip + ' method=' + ctx.request.path)
        }
        await next()
    } catch (e) {
        if (e.status === 401) {
            ctx.status = 401
            rsp = {code: 99, msg:'Token is invalid'}
            ctx.body = JSON.stringify(rsp)
            logger.error('management token is invalid')
        } else if (e.status === -1) {
            ctx.status = 200
            rsp = {code: 99, msg:'params is invalid'}
            ctx.body = JSON.stringify(rsp)
            logger.error('params is invalid')
        }
        else {
            // catch 未捕获的错误信息
            ctx.status = 200
            rsp = {code: 99, msg: 'unhandle error: ' + (e && e.message ? e.message : e.toString())}
            ctx.body = JSON.stringify(rsp)
            logger.error(JSON.stringify(rsp))
        }
    }
}