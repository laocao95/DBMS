const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const schema = require('../utils/schema')
const logger = require('../log')

async function getOrderByCurriculumId(ctx, next) {
    const propertyMap = {
        order_id: 'order-id',
        order_time: 'order-time',
        student_name: 'student-name',
        //student_phone: 'student-phone',
        price: 'price',
        confirmation: 'confirm'
    }
    var curriculumId = ctx.query['curriculum-id']
    var orderList = []

    try {
        //var orderInDb = await db.select('customer_order', {curriculum_id: curriculumId})
        var orderInDb = await db.where({curriculum_id: curriculumId}).select().from('customer_order').innerJoin('student', 'student.student_id', 'customer_order.student_id')
        //var orderInDb = await db.select().from('customer_order');
        console.log(orderInDb.length)
        _.forEach(orderInDb, item => {      
            var orderTime = item.order_time
            var orderMon = orderTime.getMonth() + 1 > 9 ? (orderTime.getMonth() + 1) : '0' + (orderTime.getMonth() + 1)
            var orderDay = orderTime.getDate() > 9 ? orderTime.getDate() : ('0' + orderTime.getDate())
            var orderHour = orderTime.getHours() > 9 ? orderTime.getHours() : ('0' + orderTime.getHours())
            var orderMin = orderTime.getMinutes() > 9 ? orderTime.getMinutes() : ('0' + orderTime.getMinutes())
            var orderSec = orderTime.getSeconds() > 9 ? orderTime.getSeconds() : ('0' + orderTime.getSeconds())
            item.order_time = orderTime.getFullYear() + '-' + orderMon + '-' + orderDay + ' ' + orderHour + ':' + orderMin + ':' + orderSec
        })

    } catch(error) {
        logger.error(JSON.stringify(ctx.query) + ' ' + error)
        var rsp = {
            code: 99,
            msg: error.message,
            'orders': []
        }
        return ctx.body = JSON.stringify(rsp)
    }
    //sort by order time
    if (orderInDb.length > 0) {
        orderInDb = _.sortBy(orderInDb, item => {
            return item.order_time
        })
    }

    util.mapProperty(orderList, orderInDb, propertyMap, true)

    var rsp = {
        code: 200,
        'orders': orderList
    }

    ctx.body = JSON.stringify(rsp)
}

module.exports = {
    getOrderByCurriculumId
}
