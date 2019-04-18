const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const logger = require('../log')

async function salesMonthly (ctx, next) {
    var rsp = {}
    try {
        //util.validateObj(ctx.query, schema.getCurriculumSchema)
        const storeId = ctx.query['store-id']
        const yearMonth = ctx.query['month']
        const startYear = parseInt(yearMonth.split('-')[0])
        const startMonth = parseInt(yearMonth.split('-')[1])
        var endYear = startYear
        var endMonth = startMonth + 1
        
        if (endMonth == 13) {
            endYear = endYear + 1
            endMonth = 1
        }

        var startTime = util.toTimeStamp(startYear + '-' + startMonth + '-1 00:00:00')
        var endTime = util.toTimeStamp(endYear + '-' + endMonth + '-1 00:00:00')


        //startTime = 'to_timestamp(\'18-3-2019 21:24:00\', \'dd-mm-yyyy hh24:mi:ss\')'

        var storeIdOp = '='
        if (storeId == 0) {
            storeIdOp = '!='
        }

        var columns1 = [
            'gross',
            db.raw('cast(\"amount\" as integer) as \"amount\"'),
            db.raw('round(\"gross\" \/ \"amount\", 2) as \"avg\"')
        ]

        console.log(startTime)
        

        var salesTotal = await db.with('tmp', qb => {
            qb
            .select()
            .from('customer_order')
            .innerJoin('curriculum', 'curriculum.curriculum_id', 'customer_order.curriculum_id')
            //.where('order_time', '>=', startTime)
            //.andWhere('order_time', '<=', endTime)
            .whereRaw('\"order_time\" >= ' + startTime)
            .andWhereRaw('\"order_time\" <= ' + endTime)
            .andWhere('confirmation', 1)
            .andWhere('store_id', storeIdOp, storeId)
            .sum('customer_order.price as gross')
            .count('order_id as amount')
        })
        .select(columns1)
        .from('tmp')

        //console.log(salesTotal)


        var columns2 = [
            db.raw('extract(day from \"order_time\") as \"day\"'),
            'customer_order.price'
        ]

        var columns3 = [
            'day',
            db.raw('SUM (\"price\") as \"money\"')
        ]

        var salesDaily = await db.with('tmp', qb => {
            qb
            .select(columns2)
            .from('customer_order')
            .innerJoin('curriculum', 'curriculum.curriculum_id', 'customer_order.curriculum_id')
            //.where('order_time', '>=', startTime)
            //.andWhere('order_time', '<=', endTime)
            .whereRaw('\"order_time\" >= ' + startTime)
            .andWhereRaw('\"order_time\" <= ' + endTime)
            .andWhere('confirmation', 1)
            .andWhere('store_id', storeIdOp, storeId)
        })
        .select(columns3)
        .from('tmp')
        .groupBy('day')
        .orderBy('day')

        //salesDaily = _.sortBy(salesDaily, item => {return item['day']})

        //console.log(salesDaily)

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

async function salesYearly (ctx, next) {
    var rsp = {}
    try {
        //util.validateObj(ctx.query, schema.getCurriculumSchema)
        const year = ctx.query['year']
        const storeId = ctx.query['store-id']

        const startTime = util.toTimeStamp(year + '-1-1 00:00:00')
        const endTime = util.toTimeStamp((parseInt(year) + 1) + '-1-1 00:00:00')

        var storeIdOp = '='
        if (storeId == 0) {
            storeIdOp = '!='
        }

        var columns1 = [
            'gross',
            db.raw('cast(\"amount\" as integer) as \"amount\"'),
            db.raw('round(\"gross\" \/ \"amount\", 2) as \"avg\"')
        ]

        var salesTotal = await db.with('tmp', qb => {
            qb
            .select()
            .from('customer_order')
            .innerJoin('curriculum', 'curriculum.curriculum_id', 'customer_order.curriculum_id')
            //.where('order_time', '>=', startTime)
            //.andWhere('order_time', '<=', endTime)
            .whereRaw('\"order_time\" >= ' + startTime)
            .andWhereRaw('\"order_time\" <= ' + endTime)
            .andWhere('confirmation', 1)
            .andWhere('store_id', storeIdOp, storeId)
            .sum('customer_order.price as gross')
            .count('order_id as amount')
        })
        .select(columns1)
        .from('tmp')


        
        var columns2 = [
            db.raw('extract(month from \"order_time\") as \"month\"'),
            'customer_order.price'
        ]

        var columns3 = [
            'month',
            db.raw('SUM (\"price\") as \"money\"')
        ]

        var salesMonth = await db.with('tmp', qb => {
            qb
            .select(columns2)
            .from('customer_order')
            .innerJoin('curriculum', 'curriculum.curriculum_id', 'customer_order.curriculum_id')
            //.where('order_time', '>=', startTime)
            //.andWhere('order_time', '<=', endTime)
            .whereRaw('\"order_time\" >= ' + startTime)
            .andWhereRaw('\"order_time\" <= ' + endTime)
            .andWhere('confirmation', 1)
            .andWhere('store_id', storeIdOp, storeId)
        })
        .select(columns3)
        .from('tmp')
        .groupBy('month')
        .orderBy('month')
        
        
        //salesMonth = _.sortBy(salesMonth, item => {return item['month']})

        // console.log(salesTotal)
        // console.log(salesDaily)

        rsp = {
            code: 200, 
            ...salesTotal[0],
            monthly: salesMonth
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
    salesMonthly,
    salesYearly
}
