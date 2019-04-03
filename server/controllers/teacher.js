const db = require('../store_engine')
const _ = require('lodash')
const logger = require('../log')
const util = require('../utils/util')

async function getTeachers (ctx, next) {
    const propertyMap = {
        teacher_id: 'teacher-id',
        teacher_name: 'teacher-name',
        teacher_pic: 'teacher-pic',
        teacher_logo: 'teacher-logo',
        teacher_description: 'teacher-description',
        teacher_skill: 'teacher-skill',
        teacher_certificate: 'teacher-certificate'
    }
    var rsp = {}
    try {
        var teacherInDb = await db.select().from('teacher')
        
        teacherInDb.forEach(item => {
            var rawSkillList = item.teacher_skill.split('↵')
            item.teacher_skill = rawSkillList.map(item => parseInt(item))
        })

        var teacherList = []

        util.mapProperty(teacherList, teacherInDb, propertyMap, true)
        rsp = {
            code: 200,
            'teacherList': teacherList
        }

    } catch(error) {
        logger.error(error)
        rsp = {
            code: 99,
            msg: error.message,
            'teacherList': []
        }
    }

    ctx.body = JSON.stringify(rsp)
}

async function addTeacher(ctx, next) {

    const insertObj = {
        teacher_name: ctx.request.body['teacher-name'],
        teacher_pic: ctx.request.body['teacher-pic'],
        teacher_logo: ctx.request.body['teacher-logo'],
        teacher_description: ctx.request.body['teacher-description'],
        teacher_skill: ctx.request.body['teacher-skill'],
        teacher_certificate: ctx.request.body['teacher-certificate']
    }
    var rsp = {
        code: 200,
        msg: 'success'
    }
    try {
        var teacherSkill = ''

        insertObj.teacher_skill.forEach((item, i) =>{
            teacherSkill += item
            if (i != insertObj.teacher_skill.length - 1) {
                teacherSkill += '↵'
            }
        })

        insertObj.teacher_skill = teacherSkill
        await db('teacher').insert(insertObj)
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


async function updateTeacherDetail (ctx, next) {
    const matchObj = {
        teacher_id: ctx.request.body['teacher-id']
    }
    const valueObj = {
        teacher_name: ctx.request.body['teacher-name'],
        teacher_pic: ctx.request.body['teacher-pic'],
        teacher_logo: ctx.request.body['teacher-logo'],
        teacher_description: ctx.request.body['teacher-description'],
        teacher_skill: ctx.request.body['teacher-skill'],
        teacher_certificate: ctx.request.body['teacher-certificate']
    }

    var rsp = {
        code: 200,
        msg: 'success'
    }

    try {
        var teacherSkill = ''
        valueObj.teacher_skill.forEach((item, i) =>{
            teacherSkill += item
            if (i != valueObj.teacher_skill.length - 1) {
                teacherSkill += '↵'
            }
        })
        valueObj.teacher_skill = teacherSkill
        var ans = await db('teacher').where(matchObj).update(valueObj)
        if (ans != 1) {
            throw Error('teacher do not exist')
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
    getTeachers,
    addTeacher,
    updateTeacherDetail
}
