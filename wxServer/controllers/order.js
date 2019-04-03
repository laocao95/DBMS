const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const wxapi = require('../wx_api/wxapi')
const schema = require('../utils/schema')
const logger = require('../log')

async function makeOrder(ctx, next) {
    
    util.validateObj(ctx.request.body, schema.makeOrderSchema)
    var rsp = {}
    //db transaction
    //var transClient = await db.transactionBegin()
    try {
        var x_token = ctx.request.header['x-token']
        //get openid
        //var wxSessionInDb = await db.select('wx_session', {'user_key': x_token}, undefined, transClient)
        var wxSessionInDb = await db.where({'user_key': x_token}).select().from('wx_session')

        if (wxSessionInDb.length != 1) {
            throw new Error('openid doesnt exist')
        }
        var wxSession = wxSessionInDb[0]
        var openid = wxSession.openid
        //check curriculum
        //var curriculumInDb = await db.select('curriculum', {'curriculum_id': ctx.request.body['curriculum-id']}, undefined, transClient)
        
        var curriculumInDb = await db.where({'curriculum_id': ctx.request.body['curriculum-id']}).select().from('curriculum')

        if (curriculumInDb.length == 0) {
            throw new Error('curriculum does not exist')
        }
        var curriculumItem = curriculumInDb[0]
        // var timeValid = util.checkCurriculumTime(curriculumItem)
        // var sizeValid = curriculumItem['size'] > curriculumItem['sold'] ? true : false
        // if (!timeValid || !sizeValid) {
        //     throw new Error('curriculum size or time is unavailable')
        // }
        //check fee
        var fee = ctx.request.body['fee'] //单位分
        var priceInDb = curriculumItem['price'] * 100 - curriculumItem['discount'] * 100
        if (priceInDb != fee) {
            throw new Error('fee is wrong')
        }
        
        //random booking num
        var bookingNum =  Date.now() + Math.ceil(Math.random()*10) + '';
        //insert order info into db
        var date = new Date()
        var orderObj = {
            booking_num: bookingNum,
            order_time: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds(),
            curriculum_id: ctx.request.body['curriculum-id'],
            student_id: -1, //update when confirm order
            price: fee / 100,
            confirm: false
        }

        //await db.insert('customer_order', orderObj, undefined, transClient)
        await db('customer_order').insert(orderObj)
        //call unifiedOrder
        var unifiedRsp = await wxapi.unifiedOrder(ctx, openid, bookingNum, priceInDb)


        rsp = {code: 200, ...unifiedRsp}
        ctx.body = JSON.stringify(rsp)

    } catch(error) {
        //await db.transactionRollback(transClient)
        logger.error(JSON.stringify(ctx.request.body) + ' ' + error)
        rsp = {
            code: 99,
            msg: 'unifiedOrder error'
        }
        ctx.body = JSON.stringify(rsp)
    }
}

async function getOrderByXToken (ctx, next) {

    const propertyMap = {
        order_id: 'order-id',
        curriculum_id: 'curriculum-id',
        store_id: 'store-id',
        class_id: 'class-id',
        class_type: 'class-type',
        class_date: 'class-date',
        class_name: 'class-name',
        class_stime: 'class-stime',
        class_etime: 'class-etime',
        price: 'price',
        onshelf: 'onshelf'
    }
    var x_token = ctx.request.header['x-token']
    var orderList = []

    try {
        //must exist after checkSession

        var sessionInDb = await db.where({user_key: x_token}).select().from('wx_session')

        if (sessionInDb.length != 1) {
            throw Error('wx session does not exist')
        }
        var sessionItem = sessionInDb[0]
        //var orderInDb = await db.select('customer_order', {student_id: studentItem['student_id']})
        var orderInDb = await db.where({openid: sessionItem.openid}).select().from('student')
                        .innerJoin('customer_order', 'customer_order.student_id', 'student.student_id')
                        .innerJoin('curriculum', 'curriculum.curriculum_id', 'customer_order.curriculum_id').where({confirm: true})

        
        for (var item of orderInDb) {
            var timeValid = util.checkCurriculumTime(item)
            item.onshelf = timeValid
            var classDate = item.class_date
            var classMon = classDate.getMonth() + 1 > 9 ? (classDate.getMonth() + 1) : '0' + (classDate.getMonth() + 1)
            var classDay = classDate.getDate() > 9 ? classDate.getDate() : ('0' + classDate.getDate())
            item.class_date = classDate.getFullYear() + '-' + classMon + '-'+ classDay
            item.class_stime = item.class_stime.substring(0, 5)
            item.class_etime = item.class_etime.substring(0, 5)
        }

        util.mapProperty(orderList, orderInDb, propertyMap, true)

    } catch(error) {
        logger.error(error)
        var rsp = {
            code: 99,
            'orders': []
        }
        return ctx.body = JSON.stringify(rsp)
    }
    //sort by class date
    if (orderList.length > 0) {
        orderList = _.sortBy(orderList, item => {
            return item['class-date']
        })
    }

    var rsp = {
        code: 200,
        'orders': orderList
    }

    ctx.body = JSON.stringify(rsp)
}

module.exports = {
    makeOrder,
    getOrderByXToken
}
