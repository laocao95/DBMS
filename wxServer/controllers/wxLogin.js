const wxapi = require('../wx_api/wxapi')
const crypto = require('crypto')
const db = require('../store_engine')
const logger = require('../log')
const util = require('../utils/util')

async function getSessionKey(wxCode) {
    const Config = util.getConfig()
    const response = await wxapi.code2Session(
        Config.wxConfig.code2session_url,
        Config.wxConfig.appId,
        Config.wxConfig.appSecret,
        wxCode,
        Config.wxConfig.grant_type
    )
    if (response.errcode && response.errcode != 0) {
        return {
            code: response.errcode,
            msg: 'call wxapi error:' + response.errmsg
        }
    }
    if (!response.openid || !response.session_key) {
        return {
            code: -2,
            msg: '参数有误，请检查'
        }
    }
    return {
        code: 0,
        data: {
            openid:response.openid,
            session_key:response.session_key
        },
        msg: ''
    }
} 

async function saveSessionKey(data) {
    const credential = data.openid
    const user_key = crypto.createHash('sha1').update(credential, 'utf8').digest('hex')
    const session_key = data.session_key
    try {
        //check wx_session
        //var sessionInDb = await db.select('wx_session', { 'openid': credential })
        var sessionInDb = await db.where({'openid': credential}).select().from('wx_session')

        if (sessionInDb.length == 0) {
            //await db.insert('wx_session',  { 'openid': credential, 'user_key': user_key,  'session_key': session_key })
            var date = new Date()
            var timestamp = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
            await db('wx_session').insert({'openid': credential, 'user_key': user_key, 'session_key': session_key, 'timestamp': timestamp})
        } else {
            //await db.update('wx_session', { 'openid': credential }, { 'user_key': user_key, 'session_key': session_key })
            await db('wx_session').where({'openid': credential}).update({'user_key': user_key, 'session_key': session_key})
        }
    } catch(error) {
        return {
            code: -1,
            msg: '数据库操作失败'
        }
    }
    return {
        code: 0,
        'user_key': user_key
    }
}

async function checkSessionKey(userid, sessionKey) {
    try {
        //check wx_session
        //var sessionItem = await db.select('wx_session', { 'user_id': userid, session_key: sessionKey })
        var sessionItem = await db.where({'user_id': userid, session_key: sessionKey}).select().from('wx_session')
        if (sessionItem.length == 0) {
            return {
                code: 99,
                msg: 'sessionKey校验失败'
            }
        }
    } catch(error) {
        console.log('check session key error: ' + error)
        return {
            code: -1,
            msg: '数据库操作失败'
        }
    }
    return {
        code: 0,
        msg: ''
    }
}

async function wxLogin(ctx, next) {
    const data = ctx.request.body
    var rsp = {}
    if(!data.wxCode) {
        rsp = {
            code: 99,
            data: null,
            msg: '参数不合法'
        }
        return ctx.body = JSON.stringify(rsp)
    }
    rsp = await getSessionKey(data.wxCode)
    if (rsp.code !== 0) {
        rsp = { ...rsp, code: 99}
        logger.error(JSON.stringify('getSessionKey error: ' + rsp.msg))
        return ctx.body = JSON.stringify(rsp)
    }
    rsp = await saveSessionKey(rsp.data)
    if (rsp.code !== 0) {
        rsp = { ...rsp, code: 99 }
        logger.error('save sessionKey error: ' + JSON.stringify(rsp.msg))
        return ctx.body = JSON.stringify(rsp)
    }
    var rsp =  { ...rsp, ...{ code: 200, msg: '登录成功' }}
    logger.info('微信用户登录成功 userKey: ' + rsp.user_key)
    return ctx.body = JSON.stringify(rsp)
}

module.exports = wxLogin