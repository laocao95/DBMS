const router = require('koa-router')()
const store = require('./controllers/store')
const classes = require('./controllers/class')
const curriculum = require('./controllers/curriculum')
const order = require('./controllers/order')
const jwt = require('jsonwebtoken')
const managementLogin = require('./controllers/managementLogin')
const teacher = require('./controllers/teacher')
const sale = require('./controllers/sale')

//common

router.post('/common/managementlogin', managementLogin)

//management

router.get('/management/stores', store.getStores)

router.get('/management/getCurriculum', curriculum.getCurriculum)

router.post('/management/addCurriculum', curriculum.addCurriculum)

router.post('/management/deleteCurriculumById', curriculum.deleteCurriculumById)

router.post('/management/updateCurriculumById', curriculum.updateCurriculumById)

router.post('/management/addClassTemplate', classes.addClassTemplate)

router.post('/management/deleteClassTemplateById', classes.deleteClassTemplateById)

router.post('/management/updateClassTemplateById', classes.updateClassTemplateById)

router.get('/management/getClassTemplate', classes.getClassTemplate)

router.get('/management/getOrderByCurriculumId', order.getOrderByCurriculumId)

router.post('/management/addTeacher', teacher.addTeacher)

router.post('/management/updateTeacherDetail', teacher.updateTeacherDetail)

router.get('/management/getTeachers', teacher.getTeachers)

router.get('/management/salesMonthly', sale.salesMonthly)

module.exports = router