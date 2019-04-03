const db = require('../store_engine')
const _ = require('lodash')
const logger = require('../log')
const util = require('../utils/util')


async function getTeacherDetail (ctx, next) {
    const config = util.getConfig()
    var teacherId = ctx.query['teacher-id']
    const propertyMap = {
        teacher_id: 'teacher-id',
        teacher_name: 'teacher-name',
        teacher_pic: 'teacher-pic',
        teacher_description: 'teacher-description',
        teacher_skill: 'teacher-skill',
        teacher_certificate: 'teacher-certificate',
        teacher_logo: 'teacher-logo'
    }
    var rsp = {}
    try {
        var teacherInDb = await db.where({teacher_id: teacherId}).select().from('teacher')

        if (teacherInDb.length != 1) {
            throw Error('teacher does not exist')
        }
        var teacherItem = {}
        var skillStr = '' 
        var rawSkillList = teacherInDb[0].teacher_skill.split('↵')
        rawSkillList.forEach((item, i) => {
            skillStr += config.instrumentArray[item]
            if (i != rawSkillList.length - 1) {
                skillStr += '、'
            }
        })
        teacherInDb[0].teacher_skill = skillStr
        teacherInDb[0].teacher_pic = config.picAttr + 'teacher/' + teacherInDb[0].teacher_pic
        teacherInDb[0].teacher_logo = config.picAttr + 'teacher/' + teacherInDb[0].teacher_logo

        util.mapProperty(teacherItem, teacherInDb[0], propertyMap, true)
        rsp = {
            code: 200,
            'teacher-detail': teacherItem
        }
    } catch(error) {
        logger.error(error)
        rsp = {
            code: 99,
            msg: error.message,
            'teacher-detail': {}
        }
    }

    ctx.body = JSON.stringify(rsp)
}

module.exports = {
    getTeacherDetail
}
