const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const logger = require('../log')


async function getClassDetail(ctx, next) {
    const config = util.getConfig()
    var classId = ctx.query['class-id']
    const propertyMap = {
        class_id: 'class-id',
        class_type: 'class-type',
        instrument_name: 'instrument-name',
        class_name: 'class-name',
        class_description: 'class-description',
        class_object: 'class-object',
        class_demand: 'class-demand',
        id: 'id',
        name: 'name'
    }
    var rsp = {}
    try {
        var classInDb = await db.where({class_id: classId}).select().from('class')

        if (classInDb.length != 1) {
            throw Error('classDetail does not exist')
        }
        var classItem = {}

        var instrumentStr = ''
        var rawInstrumentList = classInDb[0].instrument_type.split('↵')
        rawInstrumentList.forEach((item, i) => {
            instrumentStr += config.instrumentArray[item]
            if (i != rawInstrumentList.length - 1) {
                instrumentStr += '、'
            }
        })

        classInDb[0].instrument_name = instrumentStr
        classInDb[0].class_type = config.classTypeArray[classInDb[0].class_type]

        util.mapProperty(classItem, classInDb[0], propertyMap, true)
        rsp = {
            code: 200,
            'class-detail': classItem
        }
    } catch(error) {
        logger.error(error)
        rsp = {
            code: 99,
            msg: error.message,
            'class-detail': {}
        }
    }

    ctx.body = JSON.stringify(rsp)
}
module.exports = {
    getClassDetail
}
