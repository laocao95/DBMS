const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const logger = require('../log')

async function salesMonthly (ctx, next) {
    var rsp = {}
    try {
        //util.validateObj(ctx.query, schema.getCurriculumSchema)
        const yearMonth = ctx.query['month']
        const year = yearMonth.split('-')[0]
        const month = yearMonth.split('-')[1]

        const startTime = year + '-' + month + '-1 00:00:00'
        const endTime = year + '-' + (parseInt(month) + 1) + '-1 00:00:00'

        var columns1 = [
            'gross',
            db.raw('cast(amount as integer)'),
            db.raw('round(gross \/ amount, 2) as avg')
        ]

        var salesTotal = await db.with('tmp', qb => {
            qb.select().from('customer_order').where('order_time', '>=', startTime).andWhere('order_time', '<=', endTime)
            .andWhere('confirm', true).sum('price as gross').count('order_id as amount')
        }).select(columns1).from('tmp')


        var columns2 = [
            db.raw('extract(day from order_time) as day'),
            'price'
        ]

        var columns3 = [
            'day',
            db.raw('SUM (price) as money')
        ]

        var salesDaily = await db.with('tmp', qb => {
            qb.select(columns2).from('customer_order').where('order_time', '>=', startTime).andWhere('order_time', '<=', endTime)
            .andWhere('confirm', true).toSQL()
        }).select(columns3).from('tmp').groupBy('day')

        salesDaily = _.sortBy(salesDaily, item => {return item['day']})

        // console.log(salesTotal)
        // console.log(salesDaily)

        rsp = {
            code: 200, 
            ...salesTotal[0],
            daily: salesDaily
        }
    } catch(error) {
        logger.error(JSON.stringify(ctx.query) + ' ' + error)
        rsp = {
            code: 99,
            msg: error.message
        }
    }
    ctx.body = JSON.stringify(rsp)
    
}

module.exports = {
    salesMonthly
}
