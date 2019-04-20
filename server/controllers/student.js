const db = require('../store_engine')
const _ = require('lodash')
const logger = require('../log')
const util = require('../utils/util')

async function getStudents (ctx, next) {

    try {
        const storeId = ctx.query['store-id'] //only for 1, 2, 3, no valid for 0
        const pageIndex = ctx.query['pageIndex']
        const pageSize = ctx.query['pageSize']

        const startRowNum = (pageIndex - 1) * pageSize + 1;
        const endRowNum = pageIndex * pageSize;

        var storeIdOp = '='
        if (storeId == 0) {
            storeIdOp = '!='
        }

        var columns1 = [
            db.raw('rownum as \"no\"'),
            'student_id',
            'student_name'
        ]

        var columns2 = [
            //db.raw('\"tmp2\".\"student_id\"'),
            'tmp2.student_id',
            'tmp2.student_name',
            'order_time',
            //'student_name',
            'curriculum_id',
            //db.raw('max(\"order_time\") as \"lastest\"'),
            db.raw('row_number() over(partition by "tmp2"."student_id" order by "customer_order"."order_time" DESC) as "rownum"')
        ]

        var columns3 = [
            //db.raw('\"tmp2\".\"student_id\"'),
            'tmp2.student_id',
            //'order_time'
            //'student_name',
            db.raw('max(\"class_type\") as \"rank\"')
        ]

        var columns4 = [
            //db.raw('\"tmp2\".\"student_id\"'),
            'student_id',
            'student_name',
            'order_time',
            'class_name'
            //'order_time'
            //'student_name',
            //db.raw('max(\"class_type\") as \"rank\"')
        ]
        var columns4 = [
            //db.raw('\"tmp2\".\"student_id\"'),
            'student_id',
            'student_name',
            'order_time',
            'class_name'
            //'order_time'
            //'student_name',
            //db.raw('max(\"class_type\") as \"rank\"')
        ]
        var columns5 = [
            //db.raw('\"tmp2\".\"student_id\"'),
            db.raw('"student_name" as "name"'),
            db.raw('"class_name" as "lastClass"'),
            db.raw('"order_time" as "lastTime"'),
            'rank'
            //'order_time'
            //'student_name',
            //db.raw('max(\"class_type\") as \"rank\"')
        ]

        var total = await db.select(db.raw('count(*) as "total"'))
        .from('student')
        .where('store_id', storeIdOp, storeId)

        console.log(total)

        var studentInDb = await db.with('tmp', qb => {
            qb
            .select(columns1)
            .from('student')
            .where('store_id', storeIdOp, storeId)
        }).with('tmp2', qb => {
            qb
            .select()
            .from('tmp')
            .where('no', '>=', startRowNum)
            .andWhere('no', '<=', endRowNum)
        }).with('tmp3', qb => {
            qb
            .select(columns2)
            .from('tmp2')
            .innerJoin('customer_order', 'customer_order.student_id', 'tmp2.student_id')
            //.groupBy('tmp2.student_id')
        })
        .with('tmp4', qb => {
            qb
            .select()
            .from('tmp3')
            .where('rownum', 1)
        })
        .with('tmp5', qb => {
            qb
            .select(columns4)
            .from('tmp4')
            .innerJoin('curriculum', 'tmp4.curriculum_id', 'curriculum.curriculum_id')
        })
        .with('tmp6', qb => {
            qb
            .select(columns3)
            .from('tmp2')
            .innerJoin('customer_order', 'customer_order.student_id', 'tmp2.student_id').innerJoin('curriculum', 'curriculum.curriculum_id', 'customer_order.curriculum_id')
            .groupBy('tmp2.student_id')
        })
        .select(columns5)
        .from('tmp5')
        .innerJoin('tmp6', 'tmp5.student_id', 'tmp6.student_id')

 
        console.log(studentInDb)

        rsp = {
            code: 200,
            ...total[0],
            'data': studentInDb
        }

    } catch(error) {
        logger.error(error)
        rsp = {
            code: 99,
            msg: error.message,
            'studentList': []
        }
    }

    ctx.body = JSON.stringify(rsp)
}


module.exports = {
    getStudents
}
