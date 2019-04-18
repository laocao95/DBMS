const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const logger = require('../log')

async function userDataCompare (ctx, next) {
    var rsp = {}
    try {
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

        const startTime = startYear + '-' + startMonth + '-1 00:00:00'
        const endTime = endYear + '-' + endMonth + '-1 00:00:00'

        var storeIdOp = '='
        if (storeId == 0) {
            storeIdOp = '!='
        }

        var usr_amt = await db
            .select()
            .from('wx_session')
            .count('openid as user_amount')

        var std_amt = await db
            .select()
            .from('student')
            .where('store_id', storeIdOp, storeId)
            .count('store_id as student_amount')

        var column0 = [
            db.raw('std_val \* 100 \/ usr_val as cvs_rate')
        ]

        var cvs_rate = await db
            .select(column0)
            .from(
                function(){
                    this.select()
                    .from('wx_session')
                    .count('openid as usr_val')
                    .as('usr')
                }
            )
            .crossJoin(
                function(){
                    this.select()
                    .from('student')
                    .where('store_id', storeIdOp, storeId)
                    .count('student_id as std_val')
                    .as('std')
                }
            )

        //two_repeat_purchase_rate
        var column1 = [
            db.raw('std_buy_two \* 100 \/ std_val as two_rate')
        ]
        
        var trp_rate = await db
        .with('tmp', qb => {
            qb
            .select()
            .from('student')
            .where('store_id', storeIdOp, storeId)
            .count('student.student_id as std_val')
        })
        .with('tmp1', qb => {
            qb
            .select()
            .from('customer_order')
            .whereIn('customer_order.student_id', function() {
            this.select('customer_order.student_id')
            .from('customer_order')
            .innerJoin('student', 'customer_order.student_id', 'student.student_id')
            .where('student.store_id', storeIdOp, storeId)
            .groupBy('customer_order.student_id')
            .havingRaw("count('order_id') >= ?", [2])
        })
        .count('customer_order.student_id as std_buy_two')
        })
        .select(column1)
        .from('tmp')
        .crossJoin('tmp1')

        var column2 = [
            db.raw('round(cast(order_num as numeric) \/ cast(std_num as numeric), 2) as avg_cls')
        ]     
        
        var avg_cls_num = await db
        .with('tmp0', qb => {
            qb
            .select(db.raw('count (order_id) as order_num'))
            .from('customer_order')
            .innerJoin('student', 'student.student_id', 'customer_order.student_id')
            .where('confirm', true)
            .andWhere('store_id', storeIdOp, storeId)
        })
        .with('tmp1', qb =>{
            qb
            .select(db.raw('count (student_id) as std_num'))
            .from('student')
            .where('store_id', storeIdOp, storeId)
        })
        .select(column2)
        .from('tmp1')
        .crossJoin('tmp0')
        
        var column3 = [
            db.raw('extract(day from order_time) as day'),
            'customer_order.order_id'
        ]

        var 


        rsp = {
            code: 200, 
            ...std_amt[0],
            ...usr_amt[0],
            ...cvs_rate[0],
            ...trp_rate[0],
            ...avg_cls_num[0]
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
    userDataCompare
}