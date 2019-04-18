const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const logger = require('../log')

async function classAnalysis (ctx, next) {
    var rsp = {}
    try {
        //util.validateObj(ctx.query, schema.getCurriculumSchema)
        const storeId = ctx.query['store-id']
        
        var storeIdOp = '='
        if (storeId == 0) {
            storeIdOp = '!='
        }

        var columns1 = [
            'class_id',
            db.raw('SUM (sold) as soldnum'),
            db.raw('SUM (size) as allnum'),
            db.raw('(SUM (sold) * 100 / SUM (size)) as rate')
        ]

        var columns2 = [
            'class_name',
            db.raw('cast(rate as integer)')
        ]

        var classRank = await db.with('tmp', qb => {
            qb.select(columns1)
            .from('curriculum')
            .where('store_id', storeIdOp, storeId)
            .groupBy('class_id')
            .orderBy('rate', 'desc')
        }).select(columns2)
        .from('tmp')
        .innerJoin('class', 'class.class_id', 'tmp.class_id')


        var columns3 = [
            'class_type',
            db.raw('cast((SUM (sold) * 100 / SUM (size)) as integer) as rate')
        ]

        var typeRank = await db.select(columns3)
        .from('curriculum')
        .where('store_id', storeIdOp, storeId)
        .groupBy('class_type')
        .orderBy('rate', 'desc')


        var columns4 = [
            'instrument_type',
            db.raw('(SUM (sold) * 100 / SUM (size)) as rate')
        ]

        var instrumentRaw = await db.select(columns4)
        .from('curriculum')
        .where('store_id', storeIdOp, storeId)
        .groupBy('instrument_type')
        .orderBy('rate', 'desc')

        var instrumentDict = {}
        var instrumentRank = []

        instrumentRaw.forEach(item => {
            var li = item.instrument_type.split('↵')
            li.forEach(item2 => {
                if (instrumentDict[item2] == undefined) {
                    instrumentDict[item2] = parseInt(item.rate);
                } else {
                    instrumentDict[item2] += parseInt(item.rate);
                }
            })

        })

        _.forEach(instrumentDict, (value, key) => {
            instrumentRank.push({
                instrument_type: parseInt(key),
                rate: value
            })
        })


        rsp = {
            code: 200, 
            classRank: classRank,
            typeRank: typeRank,
            instrumentRank: instrumentRank
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
    classAnalysis
}