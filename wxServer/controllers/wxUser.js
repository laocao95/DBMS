const db = require('../store_engine')
const _ = require('lodash')
const logger = require('../log')
async function updateUserInfo (ctx, next) {
    var x_token = ctx.request.header['x-token']
    var name = ctx.request.body['name']
    if (x_token == undefined || name == undefined) {
        rsp = {
            code: 99,
            msg: '参数不正确'
        }
        logger.error(JSON.stringify(ctx.request.body) + ' 参数不正确')
        return ctx.body = JSON.stringify(rsp)
    }
    //var userInDb = await db.select('wx_session', {user_key: x_token}, undefined)
    var userInDb = await db.where({user_key: x_token}).select().from('wx_session')

    if (userInDb.length == 0) {
        rsp = {
            code: 99,
            msg: '用户不存在'
        }
        logger.error(JSON.stringify(ctx.request.body) + ' 用户不存在')
        return ctx.body = JSON.stringify(rsp)
    }

    //update username, temporarily only called by new wx user
    try {
        //await db.update('wx_session', {user_key: x_token}, {name: name})
        await db('wx_session').where({user_key: x_token}).update({name: name})

        var sessionInDb = await db.where({user_key: x_token}).select().from('wx_session')

        var openid = sessionInDb[0].openid

        await db('student').where({'openid': openid}).update({student_name: name})

        var rsp = {
            code: 200,
            msg: 'success'
        }
        ctx.body = JSON.stringify(rsp)
    } catch(error) {
        logger.error(JSON.stringify(ctx.request.body) + ' ' + error)
        var rsp = {
            code: 99,
            msg: error
        }
        ctx.body = JSON.stringify(rsp)
    }

}

module.exports = {
    updateUserInfo
}