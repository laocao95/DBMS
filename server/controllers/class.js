const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const logger = require('../log')

async function getClassTemplate(ctx, next) {
    const propertyMap = {
        class_id: 'class-id',
        class_type: 'class-type',
        instrument_type: 'instrument-type',
        class_name: 'class-name',
        class_description: 'class-description',
        class_object: 'class-object',
        class_demand: 'class-demand'

    }
    var rsp = {}
    try {
        var classInDb = await db.select().from('class')

        classInDb.forEach(item => {
            var rawList = item.instrument_type.split('↵')
            item.instrument_type = rawList.map(item => parseInt(item))
        });

        var classTemplatelist = []

        util.mapProperty(classTemplatelist, classInDb, propertyMap, true)
        rsp = {
            code: 200,
            'class-template': classTemplatelist
        }
    } catch(error) {
        logger.error(error)
        rsp = {
            code: 99,
            msg: error.message,
            'class-template': []
        }
    }

    ctx.body = JSON.stringify(rsp)
}


async function addClassTemplate(ctx, next) {

    //console.log(ctx.request.body)
    const insertObj = {
        class_name: ctx.request.body['class-name'],
        class_type: ctx.request.body['class-type'],
        instrument_type: ctx.request.body['instrument-type'],
        class_description: ctx.request.body['class-description'],
        class_object: ctx.request.body['class-object'],
        class_demand: ctx.request.body['class-demand']
    }
    var rsp = {
        code: 200,
        msg: 'success'
    }
    try {
        var instrumentStr = ''  
        insertObj.instrument_type.forEach((item, i) => {
            instrumentStr += item
            if (i != insertObj.instrument_type.length - 1) {
                instrumentStr += '↵'
            }
        })
        insertObj.instrument_type = instrumentStr

        await db('class').insert(insertObj)
        //await db.insert('class', insertObj)
    } catch(error) {
        logger.error(JSON.stringify(ctx.request.body) + ' ' + error)
        rsp = {
            code: 99,
            msg: error.message
        }
    }
    ctx.body = JSON.stringify(rsp)

}


async function deleteClassTemplateById(ctx, next) {
    const deleteObj = {
        class_id: ctx.request.body['class-id']
    }
    var rsp = {
        code: 200,
        msg: 'success'
    }

    try {
        //var ans = await db.delete('class', deleteObj)

        var ans = await db('class').where(deleteObj).del()

        console.log(ans)
        
        if (ans != 1) {
            throw Error('classTemplate do not exist')
        }
    } catch(error) {
        logger.error(JSON.stringify(ctx.request.body) + ' ' + error)
        rsp = {
            code: 99,
            msg: error.message
        }
    }
    ctx.body = JSON.stringify(rsp)

}

async function updateClassTemplateById(ctx, next) {
    const matchObj = {
        class_id: ctx.request.body['class-id']
    }
    const valueObj = {
        class_name: ctx.request.body['class-name'],
        class_type: ctx.request.body['class-type'],
        instrument_type: ctx.request.body['instrument-type'],
        class_description: ctx.request.body['class-description'],
        class_object: ctx.request.body['class-object'],
        class_demand: ctx.request.body['class-demand']
    }
    var rsp = {
        code: 200,
        msg: 'success'
    }
    try {
        var instrumentStr = ''  
        valueObj.instrument_type.forEach((item, i) => {
            instrumentStr += item
            if (i != valueObj.instrument_type.length - 1) {
                instrumentStr += '↵'
            }
        })
        valueObj.instrument_type = instrumentStr
        var ans = await db('class').where(matchObj).update(valueObj)
        if (ans != 1) {
            throw Error('classTemplate do not exist')
        }
    } catch(error) {
        logger.error(JSON.stringify(ctx.request.body) + ' ' + error)
        rsp = {
            code: 99,
            msg: error.message
        }
    }

    ctx.body = JSON.stringify(rsp)

}

module.exports = {
    addClassTemplate,
    deleteClassTemplateById,
    updateClassTemplateById,
    getClassTemplate
}
