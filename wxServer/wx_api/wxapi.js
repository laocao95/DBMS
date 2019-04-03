const qs = require('querystring')
const request = require('request')
const util = require('../utils/util')
const db = require('../store_engine')
const logger = require('../log')

var wxapi = {
    code2Session : async function (url, appid, secret, js_code, grant_type) {
        const reqUrl = url + '?' + qs.stringify({ appid, secret, js_code, grant_type })
        //for test
        return new Promise((resolve, reject) =>
            request({ url: reqUrl, json: true }, function (error, response, body) {
                if (error || response.statusCode !== 200) {
                    const rsp = {
                        errcode: (response && response.statusCode) ? response.statusCode : -2,
                        errmsg: (error) ? error : '请求失败'
                    }
                    return reject(rsp)
                }
                resolve(body)
            }))
    },
    unifiedOrder: async function(ctx, openid, bookingNum, fee) {
        const config = util.getConfig()
        const appid = config.wxConfig.appId
        const attach = 'tutti'
        const body = 'tutti'
        const mch_id = config.wxConfig.mch_id
        const nonce_str = util.randomStr(20)
        const notify_url = config.wxConfig.notify_url
        const spbill_create_ip = ctx.request.ip
        //const spbill_create_ip = '127.0.0.1'
        const trade_type = 'JSAPI'
        const timeStamp = Date.now().toString()


        var formData = "<xml>";
        formData += "<appid>" + appid + "</appid>"
        formData += "<attach>" + attach +"</attach>"
        formData += "<body>" + body + "</body>"
        formData += "<mch_id>" + mch_id +"</mch_id>"
        formData += "<nonce_str>" + nonce_str + "</nonce_str>"
        formData += "<notify_url>" + notify_url + "</notify_url>"
        formData += "<openid>" + openid + "</openid>"
        formData += "<out_trade_no>" + bookingNum + "</out_trade_no>"
        formData += "<spbill_create_ip>" + spbill_create_ip +"</spbill_create_ip>"
        formData += "<total_fee>" + fee + "</total_fee>"
        formData += "<trade_type>" + trade_type + "</trade_type>"
        formData += "<sign>" + util.paysignjsapi(appid, attach, body, mch_id, nonce_str, notify_url, openid, bookingNum, spbill_create_ip, fee, trade_type) + "</sign>"
        formData += "</xml>"


        return new Promise((resolve, reject)=>{
            request({
                url: config.wxConfig.unifiedOrder_url,
                method: 'POST',
                body: formData
            }, function(err, response, body) {
                if(!err && response.statusCode == 200) {
                    //check return_code
                    var return_code = util.getXMLNodeValue('return_code', body.toString("utf-8"))
                    if (return_code == 'FAIL') {
                        var errorInfo = util.getXMLNodeValue('return_msg', body.toString("utf-8"))
                        reject(new Error(errorInfo))
                        return
                    } 
                    var rsp = {}
                    try {
                        var prepay_id = util.getXMLNodeValue('prepay_id', body.toString("utf-8"))
                        var _paySignjs = util.paysignjs(appid, nonce_str, 'prepay_id=' + prepay_id, 'MD5',timeStamp)
                        rsp = {
                            timeStamp: timeStamp,
                            nonceStr: nonce_str,
                            package: 'prepay_id=' + prepay_id,
                            signType: 'MD5',
                            _paySignjs: _paySignjs
                        }
                    } catch(error) {
                        reject(error)
                        return
                    }
                    resolve(rsp)
                } else {
                    reject(err)
                }
            })
        })
    },
    confirmOrder: async function(ctx, next) {
        var body = await util.getRawBody(ctx)
        //db transaction
        //var transClient = await db.transactionBegin()

        //const promisify = (fn) => new Promise((resolve, reject) => fn(resolve))
        //var trx = await promisify(db.transaction)

        try {
            var state = util.getXMLNodeValue('return_code', body)
            if (state == 'SUCCESS') {
                var bookingNum =  util.getXMLNodeValue('out_trade_no', body)
                //get order item
                //var orderInDb = await db.select('customer_order', {'booking_num': bookingNum}, undefined, transClient)

                var orderInDb = await db.where({'booking_num': bookingNum}).select().from('customer_order')

                if (orderInDb.length != 1) {
                    throw Error('confirm order error: order does not exist. bookingNum: ' + bookingNum)
                }
                var orderItem = orderInDb[0]

                if (orderItem.confirm == true) {
                    //dulicate notification
                    logger.info('重复通知 bookingNum: ' + bookingNum)
                    var formData = '<xml>'
                    formData += '<return_code><![CDATA[SUCCESS]]></return_code>'
                    formData += '<return_msg><![CDATA[OK]]></return_msg>'
                    formData += '</xml>'
                    ctx.response.type = 'xml'
                    ctx.response.body = formData
                    return next()
                }
                //get curriculum item

                //var curriculumInDb = await db.select('curriculum', {'curriculum_id': orderItem.curriculum_id}, undefined, transClient)
                
                var curriculumInDb = await db.where({'curriculum_id': orderItem.curriculum_id}).select().from('curriculum')
                
                if (curriculumInDb.length == 0) {
                    throw new Error('curriculum does not exist')
                }
                var curriculumItem = curriculumInDb[0]
                
                //update sold num
                //await db.update('curriculum', {'curriculum_id': curriculumItem.curriculum_id}, {'sold': curriculumItem.sold + 1}, transClient)
                await db('curriculum').where({'curriculum_id': curriculumItem.curriculum_id}).update({'sold': curriculumItem.sold + 1})
                
                //check whether in student table
                var openid = util.getXMLNodeValue('openid', body.toString("utf-8"))
                var studentInfo = {}
                //var studentInDb = await db.select('student', {'openid': openid}, undefined, transClient)
                var studentInDb = await db.where({'openid': openid, 'store_id': curriculumItem.store_id}).select().from('student')
                if (studentInDb.length > 0) {
                    studentInfo = studentInDb[0]
                    await db('customer_order').where({'booking_num': bookingNum}).update({'confirm': true, 'student_id': studentInfo.student_id})
                } else {
                    var wxSessionInDb = await db.where({'openid': openid}).select().from('wx_session')

                    if (wxSessionInDb.length != 1) {
                        throw new Error('wxSession doesnt exist')
                    }
                    var wxSession = wxSessionInDb[0]
                    var date = new Date()
                    studentInfo['student_name'] = wxSession.name == undefined ? '' : wxSession.name
                    studentInfo['student_phone'] = wxSession.phone == undefined ? '' : wxSession.phone
                    studentInfo['openid'] = wxSession.openid
                    studentInfo['timestamp'] = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
                    studentInfo['store_id'] = curriculumItem.store_id
                    //insert into student
                    //var returnObj = await db.insert('student', studentInfo, 'student_id', transClient)
                    await db.transaction(async function(trx) {
                        try {
                            var returnObj = await db('student').insert(studentInfo).returning('student_id').transacting(trx)
                            studentInfo['student_id'] = returnObj[0]
                            await db('customer_order').where({'booking_num': bookingNum}).update({'confirm': true, 'student_id': studentInfo.student_id}).transacting(trx)
                            trx.commit
                        } catch(error) {
                            trx.rollback
                            throw Error('添加学生失败')
                        }
                    })
                }

                logger.info('微信确认订单成功 trade_no' + bookingNum)
                var formData = '<xml>'
                formData += '<return_code><![CDATA[SUCCESS]]></return_code>'
                formData += '<return_msg><![CDATA[OK]]></return_msg>'
                formData += '</xml>'
                ctx.response.type = 'xml'
                ctx.response.body = formData
            } else {
                logger.error('微信确认订单失败 body: ' + body)
            }
        } catch(error) {
            //await db.transactionRollback(transClient)
            logger.error('微信确认订单内部错误' + error + ' body: ' + body)
            var formData = '<xml>'
            formData += '<return_code><![CDATA[FAIL]]></return_code>'
            formData += '<return_msg><![CDATA[NULL]]></return_msg>'
            formData += '</xml>'
            ctx.response.type = 'xml'
            ctx.response.body = formData
        }
    }
}

module.exports = wxapi