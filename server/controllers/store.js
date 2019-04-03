const db = require('../store_engine')
const _ = require('lodash')
const util = require('../utils/util')
const logger = require('../log')
const propertyMap = {
    store_id: 'store-id',
    store_name: 'store-name',
    store_place: 'store-place',
    store_pic: 'store-pic',
    longitude: 'longitude',
    latitude: 'latitude'

}
async function getStores (ctx, next) {
    const config = util.getConfig()
    var rsp = {}
    try {
        var storeInDb = await db.select().from('store')

        storeInDb.forEach(store => {
            store.store_pic = store.store_pic.split('↵')
        })

        var stores = []
        util.mapProperty(stores, storeInDb, propertyMap, true)
        rsp = {
            code: 200,
            'frontpage-pic': config.frontPage,
            stores: stores
        }
        
    } catch(error) {
        logger.error(error)
        rsp = {
            code: 99,
            msg: error.message,
            'frontpage-pic': config.frontPage,
            stores: []
        }
    }
    ctx.body = JSON.stringify(rsp)
}

module.exports = {
    getStores
}
