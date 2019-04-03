const router = require('koa-router')()
const store = require('./controllers/store')
const classes = require('./controllers/class')
const teacher = require('./controllers/teacher')
const curriculum = require('./controllers/curriculum')
const order = require('./controllers/order')
const wxLogin = require('./controllers/wxLogin')
const wxUser = require('./controllers/wxUser')
const wxApi = require('./wx_api/wxapi')


//common

router.post('/common/wxLogin', wxLogin)

router.post('/common/confirmOrder', wxApi.confirmOrder)

//wx
router.get('/wx/stores', store.getStores)

router.get('/wx/getCurriculum', curriculum.getCurriculum)

router.post('/wx/updateUserInfo', wxUser.updateUserInfo)

router.post('/wx/getOrderByXToken', order.getOrderByXToken)

router.post('/wx/makeOrder', order.makeOrder)

router.get('/wx/getClassDetail', classes.getClassDetail)

router.get('/wx/getTeacherDetail', teacher.getTeacherDetail)

router.get('/wx/getOrderByXToken', order.getOrderByXToken)

router.get('/wx/getCurriculumItem', curriculum.getCurriculumItem)

module.exports = router