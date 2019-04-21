const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const logger = require('../log')

async function userGraph (ctx, next) {
    var rsp = {}
    try {
        const storeId = ctx.query['store-id']
        const yearMonth = ctx.query['month']
        const year = ctx.query['year']
        var result
        var userResult
        var startYear
        var startMonth
        if(yearMonth != null) {
            startYear = parseInt(yearMonth.split('-')[0])
            startMonth = parseInt(yearMonth.split('-')[1])
        }
        var nextMonth = startMonth + 1
        var storeIdOp = '='
        if (storeId == 0) {
            storeIdOp = '!='
        }
        if(year != null) {
            var column0 = [
                db.raw('to_char(\"timestamp\", \'yyyy-mm\') as \"month\"'),
                db.raw('\"student_id\"')
            ]
            var column1 = [
                db.raw('\"month\" as \"month1\"'),
                db.raw('count(\"student_id\") as \"cum1\"')
            ]
            var column2 = [
                db.raw('\"month\" as \"month2\"'),
                db.raw('count(\"student_id\") as \"cum2\"')
            ]
            var column3 = [
                db.raw('\"month1\" as \"index\"'),
                db.raw('sum(\"cum2\") as \"count\"')
            ]
            
            result = await db
            .with('tmp0', qb => {
                qb
                .select(column0)
                .from('student')
                .where('store_id', storeIdOp, storeId)
            })
            .with('tmp1', qb => {
                qb
                .select(column1)
                .from('tmp0')
                .groupBy('month')
            })
            .with('tmp2', qb => {
                qb
                .select(column2)
                .from('tmp0')
                .groupBy('month')
            })
            .with('tmp3', qb => {
                qb
                .select()
                .from('tmp1')
                .crossJoin('tmp2')
            })
            .with('tmp4', qb => {
                qb
                .select(column3)
                .from('tmp3')
                .whereRaw('\"month1\" >= \"month2\"')
                .groupBy('month1')
            })
            .select()
            .from('tmp4')
            .whereRaw('\"index\" <= \'' + year + '-12\'')
            .whereRaw('\"index\" >= \'' + year + '-01\'')
            .orderByRaw('\"index\" ASC ')
        }
        if(yearMonth != null) {
            
            if(nextMonth <= 9)
            {
                var endTime = startYear.toString() + '-0' + nextMonth.toString()
            }
            else
            {
                var endTime = startYear.toString() + '-' + nextMonth.toString()
            }
            var column0 = [
                db.raw('to_char(\"timestamp\", \'yyyy-mm-dd\') as \"day\"'),
                db.raw('\"student_id\"')
            ]
            var column1 = [
                db.raw('\"day\" as \"day1\"'),
                db.raw('count(\"student_id\") as \"cum1\"')
            ]
            var column2 = [
                db.raw('\"day\" as \"day2\"'),
                db.raw('count(\"student_id\") as \"cum2\"')
            ]
            var column3 = [
                db.raw('\"day1\" as \"index\"'),
                db.raw('sum(\"cum2\") as \"count\"')
            ]
            
            result = await db
            .with('tmp0', qb => {
                qb
                .select(column0)
                .from('student')
            })
            .with('tmp1', qb => {
                qb
                .select(column1)
                .from('tmp0')
                .groupBy('day')
            })
            .with('tmp2', qb => {
                qb
                .select(column2)
                .from('tmp0')
                .groupBy('day')
            })
            .with('tmp3', qb => {
                qb
                .select()
                .from('tmp1')
                .crossJoin('tmp2')
            })
            .with('tmp4', qb => {
                qb
                .select(column3)
                .from('tmp3')
                .whereRaw('\"day1\" >= \"day2\"')
                .groupBy('day1')
            })
            .select()
            .from('tmp4')
            .whereRaw('\"index\" >= \'' + yearMonth + '-01\'')
            .andWhereRaw('\"index\" < \'' + endTime + '-01\'')
            .orderByRaw('\"index\" ASC ')
        }
        if(year != null) {
            var column0 = [
                db.raw('to_char(\"timestamp\", \'yyyy-mm\') as \"month\"'),
                db.raw('\"openid\"')
            ]
            var column1 = [
                db.raw('\"month\" as \"month1\"'),
                db.raw('count(\"openid\") as \"cum1\"')
            ]
            var column2 = [
                db.raw('\"month\" as \"month2\"'),
                db.raw('count(\"openid\") as \"cum2\"')
            ]
            var column3 = [
                db.raw('\"month1\" as \"index\"'),
                db.raw('sum(\"cum2\") as \"count\"')
            ]
            
            userResult = await db
            .with('tmp0', qb => {
                qb
                .select(column0)
                .from('wx_session')
            })
            .with('tmp1', qb => {
                qb
                .select(column1)
                .from('tmp0')
                .groupBy('month')
            })
            .with('tmp2', qb => {
                qb
                .select(column2)
                .from('tmp0')
                .groupBy('month')
            })
            .with('tmp3', qb => {
                qb
                .select()
                .from('tmp1')
                .crossJoin('tmp2')
            })
            .with('tmp4', qb => {
                qb
                .select(column3)
                .from('tmp3')
                .whereRaw('\"month1\" >= \"month2\"')
                .groupBy('month1')
            })
            .select()
            .from('tmp4')
            .whereRaw('\"index\" <= \'' + year + '-12\'')
            .whereRaw('\"index\" >= \'' + year + '-01\'')
            .orderByRaw('\"index\" ASC ')
        }
        if(yearMonth != null) {
            if(nextMonth <= 9)
            {
                var endTime = startYear.toString() + '-0' + nextMonth.toString()
            }
            else
            {
                var endTime = startYear.toString() + '-' + nextMonth.toString()
            }
            var column0 = [
                db.raw('to_char(\"timestamp\", \'yyyy-mm-dd\') as \"day\"'),
                db.raw('\"openid\"')
            ]
            var column1 = [
                db.raw('\"day\" as \"day1\"'),
                db.raw('count(\"openid\") as \"cum1\"')
            ]
            var column2 = [
                db.raw('\"day\" as \"day2\"'),
                db.raw('count(\"openid\") as \"cum2\"')
            ]
            var column3 = [
                db.raw('\"day1\" as \"index\"'),
                db.raw('sum(\"cum2\") as \"count\"')
            ]
            
            userResult = await db
            .with('tmp0', qb => {
                qb
                .select(column0)
                .from('wx_session')
            })
            .with('tmp1', qb => {
                qb
                .select(column1)
                .from('tmp0')
                .groupBy('day')
            })
            .with('tmp2', qb => {
                qb
                .select(column2)
                .from('tmp0')
                .groupBy('day')
            })
            .with('tmp3', qb => {
                qb
                .select()
                .from('tmp1')
                .crossJoin('tmp2')
            })
            .with('tmp4', qb => {
                qb
                .select(column3)
                .from('tmp3')
                .whereRaw('\"day1\" >= \"day2\"')
                .groupBy('day1')
            })
            .select()
            .from('tmp4')
            .whereRaw('\"index\" >= \'' + yearMonth + '-01\'')
            .andWhereRaw('\"index\" < \'' + endTime + '-01\'')
            .orderByRaw('\"index\" ASC ')
        }

        rsp = {
            code: 200, 
            users: userResult,
            students: result
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
    userGraph
}