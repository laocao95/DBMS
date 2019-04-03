const Joi = require('joi')

const schema = {
    makeOrderSchema: Joi.object().keys({
        'fee': Joi.number().required(),
        'curriculum-id': Joi.number().required()
    }),
    getCurriculumSchema: Joi.object().keys({
        'from': Joi.string(),
        'to': Joi.string(),
        'store-id': Joi.string().required()
    }).or('from', 'to')
}
module.exports = schema