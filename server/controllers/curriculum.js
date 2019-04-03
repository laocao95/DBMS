const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const schema = require('../utils/schema')
const logger = require('../log')
async function addCurriculum(ctx, next) {
    var insertObj = {
        class_id: ctx.request.body['class-id'],
        store_id: ctx.request.body['store-id'],
        class_date: ctx.request.body['class-date'],
        class_stime: ctx.request.body['class-stime'],
        class_etime: ctx.request.body['class-etime'],
        teacher_id: ctx.request.body['teacher-id'],
        price: ctx.request.body['price'],
        size: ctx.request.body['size'],
        sold: 0,
        discount: ctx.request.body['discount'],
        //onshelf: ctx.request.body['onshelf']
    }
    var rsp = {
        code: 200,
        msg: 'success'
    }

    var classid = ctx.request.body['class-id']
    var storeid = ctx.request.body['store-id']
    try {
        //temporarily all Jian zhou

        if (insertObj.teacher_id == undefined) {
            insertObj.teacher_id = 1
        }

        //var classInDb = await db.select('class', {class_id: classid})
        var classInDb = await db.where({class_id: classid}).select().from('class')
        
        if (classInDb.length == 0) {
            throw new Error('class template does not exist')
        }
        insertObj['class_type'] = classInDb[0]['class_type']
        insertObj['class_name'] = classInDb[0]['class_name']
        insertObj['instrument_type'] = classInDb[0]['instrument_type']

        //var storeInDb= await db.select('store', {store_id: storeid})
        var storeInDb = db.where({store_id: storeid}).select().from('store')
        if (storeInDb.length == 0) {
            throw new Error('store template does not exist')
        }
        //insertObj['store_name'] = storeInDb[0]['store_name']
        
        //await db.insert('curriculum', insertObj)
        await db('curriculum').insert(insertObj)
    } catch(error) {
        logger.error(JSON.stringify(ctx.request.body) + ' ' + error)
        rsp['code'] = 99
        rsp['msg'] = error.message
    }
    ctx.body = JSON.stringify(rsp)
}


async function getCurriculum (ctx, next) {
    // var queryStr = 'select * from store'
    // var res = await db.dbQuery(queryStr)
    
    //util.validateObj(ctx.query, schema.getCurriculumSchema)
    
    const propertyMap = {
        curriculum_id: 'curriculum-id',
        store_id: 'store-id',
        store_name: 'store-name',
        class_id: 'class-id',
        class_type: 'class-type',
        instrument_type: 'instrument-type',
        class_date: 'class-date',
        class_name: 'class-name',
        class_stime: 'class-stime',
        class_etime: 'class-etime',
        teacher_id: 'teacher-id',
        teacher_name: 'teacher-name',
        teacher_pic: 'teacher_pic',
        teacher_logo: 'teacher-logo',
        size: 'size',
        price: 'price',
        discount: 'discount',
        sold: 'sold',
        onshelf: 'onshelf'
    }
    //var date = ctx.query['date'];
    //var store_id = ctx.query['store-id'] ? parseInt(ctx.query['store-id']) : 1

    //get all curriculum of day
    var curriculums = []
    var rsp = {
        code: 200,
        'all-curriculums': []
    }
    try {

        var curriculumsInDb = []
        if (ctx.query['from'] && ctx.query['to']) {
            curriculumsInDb = await db('curriculum').where('class_date', '>=', ctx.query['from']).andWhere('class_date', '<=', ctx.query['to'])
            .andWhere('store_id', ctx.query['store-id']).innerJoin('teacher', 'curriculum.teacher_id', 'teacher.teacher_id')
        } else if (ctx.query['from']) {
            curriculumsInDb = await db('curriculum').where('class_date', '>=', ctx.query['from']).andWhere('store_id', ctx.query['store-id'])
            .innerJoin('teacher', 'curriculum.teacher_id', 'teacher.teacher_id')
        } else if (ctx.query['to']) {
            curriculumsInDb = await db('curriculum').where('class_date', '<=', ctx.query['to']).andWhere('store_id', ctx.query['store-id'])
            .innerJoin('teacher', 'curriculum.teacher_id', 'teacher.teacher_id')
        } else {
            throw Error('params error')
        }
        
        for (var item of curriculumsInDb) {
            var timeValid = util.checkCurriculumTime(item)
            item.onshelf = timeValid
            var rawList = item.instrument_type.split('↵')
            item.instrument_type = rawList.map(item => parseInt(item))
            var classDate = item.class_date
            var classMon = classDate.getMonth() + 1 > 9 ? (classDate.getMonth() + 1) : '0' + (classDate.getMonth() + 1)
            var classDay = classDate.getDate() > 9 ? classDate.getDate() : ('0' + classDate.getDate())
            item.class_date = classDate.getFullYear() + '-' + classMon + '-'+ classDay
            item.class_stime = item.class_stime.substring(0, 5)
            item.class_etime = item.class_etime.substring(0, 5)
        }
        //sort by class-date then class-stime

        util.mapProperty(curriculums, curriculumsInDb, propertyMap, true)

        var curriculumMap = {}

        for (var item of curriculums) {
            if (!curriculumMap.hasOwnProperty(item['class-date'])) {
                var dayObj = {
                    "date": item['class-date'],
                    "curriculums": [item]
                }
                curriculumMap[item['class-date']] = dayObj
            } else {
                curriculumMap[item['class-date']]['curriculums'].push(item)
            }
        }

        var keyList = []
        
        _.forEach(curriculumMap, (value, key) => {
            keyList.push(key)
            value['curriculums'] = _.sortBy(value['curriculums'], item => {return item['class-stime']})
        })

        keyList.sort()

        for (var key of keyList) {
            rsp['all-curriculums'].push(curriculumMap[key])
        }

    } catch(error) {
        logger.error(error)
        rsp['code'] = 99
        rsp['all-curriculums'] = []
    }
    ctx.body = JSON.stringify(rsp)

}

async function deleteCurriculumById(ctx, next) {
    const deleteObj = {
        curriculum_id: ctx.request.body['curriculum-id']
    }
    var rsp = {
        code: 200,
        msg: 'success'
    }
    try {
        //await db.delete('curriculum', deleteObj)
        var ans = await db('curriculum').where(deleteObj).del()

        if (ans != 1) {
            throw Error('curriculum do not exist')
        }
    } catch(error) {
        logger.error(JSON.stringify(ctx.request.body) + ' ' + error)
        rsp['code'] = 99
        rsp['msg'] = error.message
    }

    ctx.body = JSON.stringify(rsp)

}

async function updateCurriculumById(ctx, next) {
    var valueObj = {
        // class_id: ctx.request.body['class-id'],
        // class_date: ctx.request.body['class-date'],
        // class_stime: ctx.request.body['class-stime'],
        // class_etime: ctx.request.body['class-etime'],
        price: ctx.request.body['price'],
        size: ctx.request.body['size'],
        discount: ctx.request.body['discount']
        //onshelf: ctx.request.body['onshelf']
    }
    var matchObj = {
        curriculum_id: ctx.request.body['curriculum-id']
    }
    var rsp = {
        code: 200,
        msg: 'success'
    }
    
    try {
        //await db.update('curriculum', matchObj, valueObj)

        var ans = await db('curriculum').where(matchObj).update(valueObj)
        if (ans != 1) {
            throw Error('curriculum do not exist')
        }
        
    } catch(error) {
        logger.error(JSON.stringify(ctx.request.body) + ' ' + error)
        rsp['code'] = 99
        rsp['msg'] = error.message
    }

    ctx.body = JSON.stringify(rsp)
}

module.exports = {
    getCurriculum,
    addCurriculum,
    deleteCurriculumById,
    updateCurriculumById
}
