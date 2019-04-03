const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const schema = require('../utils/schema')
const logger = require('../log')


async function getCurriculum (ctx, next) {
    // var queryStr = 'select * from store'
    // var res = await db.dbQuery(queryStr)
    
    //util.validateObj(ctx.query, schema.getCurriculumSchema)
    const config = util.getConfig()
    var x_token = ctx.request.header['x-token']
    var openid = undefined
    var studentInDb = await db.where({user_key: x_token}).select().from('wx_session').innerJoin('student', 'wx_session.openid', 'student.openid')
    if (studentInDb.length > 0) {
        openid = studentInDb[0].openid
    }

    const propertyMap = {
        curriculum_id: 'curriculum-id',
        store_id: 'store-id',
        store_name: 'store-name',
        longitude: 'longitude',
        latitude: 'latitude',
        class_id: 'class-id',
        class_type: 'class-type',
        class_date: 'class-date',
        //instrument_type: 'instrument_type',
        class_name: 'class-name',
        class_stime: 'class-stime',
        class_etime: 'class-etime',
        teacher_id: 'teacher-id',
        teacher_name: 'teacher-name',
        teacher_pic: 'teacher-pic',
        teacher_logo: 'teacher-logo',
        size: 'size',
        price: 'price',
        discount: 'discount',
        sold: 'sold',
        status: 'status'
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
            item.status = await checkStatus(openid, item)
            item.teacher_pic = config.picAttr + 'teacher/' + item.teacher_pic
            item.teacher_logo = config.picAttr + 'teacher/' + item.teacher_logo
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

async function checkStatus (openid, curriculumItem) {

    if (openid) {
        //check order
        var orderList = await db.where({'openid': openid}).select().from('student')
                .innerJoin('customer_order', 'student.student_id', 'customer_order.student_id').where({curriculum_id: curriculumItem.curriculum_id})
                .andWhere({confirm: true})
        if (orderList.length > 0) {
            return 4     //已预约
        }
    }
    var timeValid = util.checkCurriculumTime(curriculumItem)
    if (!timeValid) {
        return 3
    }
    var sizeValid = curriculumItem.size > curriculumItem.sold ? true : false

    if (!sizeValid) {
        return 2
    }
    return 1
}

async function getCurriculumItem (ctx, next) {
    const config = util.getConfig()
    const propertyMap = {
        curriculum_id: 'curriculum-id',
        store_id: 'store-id',
        store_name: 'store-name',
        longitude: 'longitude',
        latitude: 'latitude',
        class_id: 'class-id',
        class_type: 'class-type',
        class_date: 'class-date',
        //instrument_type: 'instrument_type',
        class_name: 'class-name',
        class_stime: 'class-stime',
        class_etime: 'class-etime',
        teacher_id: 'teacher-id',
        teacher_name: 'teacher-name',
        teacher_pic: 'teacher-pic',
        teacher_logo: 'teacher-logo',
    }
    var curriculumId = ctx.query['curriculum-id']
    var rsp = {}
    try {
        var curriculumInDb = await db('curriculum').where({curriculum_id: curriculumId}).innerJoin('teacher', 'curriculum.teacher_id', 'teacher.teacher_id')
                            .innerJoin('store', 'curriculum.store_id', 'store.store_id')

        if (curriculumInDb.length == 0) {
            throw Error('curriculum does not exist')
        }

        for (var item of curriculumInDb) {
            item.teacher_pic = config.picAttr + 'teacher/' + item.teacher_pic
            item.teacher_logo = config.picAttr + 'teacher/' + item.teacher_logo
            var classDate = item.class_date
            var classMon = classDate.getMonth() + 1 > 9 ? (classDate.getMonth() + 1) : '0' + (classDate.getMonth() + 1)
            var classDay = classDate.getDate() > 9 ? classDate.getDate() : ('0' + classDate.getDate())
            item.class_date = classDate.getFullYear() + '-' + classMon + '-'+ classDay
            item.class_stime = item.class_stime.substring(0, 5)
            item.class_etime = item.class_etime.substring(0, 5)
        }

        var curriculumItem = {}
        util.mapProperty(curriculumItem, curriculumInDb[0], propertyMap, true)
        rsp = {
            code: 200,
            'curriculum-item': curriculumItem
        }
        
    } catch(error) {
        logger.error(error)
        rsp = {
            code: 99,
            msg: error.message,
            'curriculum-item': {}
        }
    }
    ctx.body = JSON.stringify(rsp)
}

module.exports = {
    getCurriculum,
    getCurriculumItem
}
