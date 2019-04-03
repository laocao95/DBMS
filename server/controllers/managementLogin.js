const jwt = require('jsonwebtoken')
const logger = require('../log')
const util = require('../utils/util')
async function login(ctx, next) {
    const config = util.getConfig()
    const data = ctx.request.body;
    if(!data.userCode || !data.userPassword){
        var rsp = {
            code: 99,
            data: null,
            msg: '参数不合法'
        }
        return ctx.body = JSON.stringify(rsp)
    }
    const result = data.userCode === config.User.username && data.userPassword === config.User.password ? true : false
    if (result) {
        const token = jwt.sign({
            name: data.userCode
        }, 'tutti_token', {expiresIn: '24h'});
        var rsp = {
            code: 200,
            data: token,
            msg: '登录成功'
        }
        return ctx.body = JSON.stringify(rsp)
    } else {
        var rsp = {
            code: 99,
            data: null,
            msg: '用户名或密码错误'
        }
        logger.error(JSON.stringify(ctx.request.body) + ' 后台用户密码错误')
        return ctx.body = JSON.stringify(rsp)
    }
}

module.exports = login