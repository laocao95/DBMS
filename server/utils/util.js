const db = require('../store_engine')
const config = require('../config')
const _ = require('lodash')
const crypto = require('crypto');
const Joi = require('joi')
const logger = require('../log')

function checkCurriculumTime(curriculumItem) {
    //utc time
    var classDate = curriculumItem.class_date

    var classTime = new Date(classDate.getFullYear() + '-' + (classDate.getMonth() + 1) + '-' + classDate.getDate() + ' ' + curriculumItem.class_stime)

    var curTime = new Date()
 
    return classTime > curTime ? true : false

}
async function checkCurriculumSize(curriculumItem) {

    var soldList = await db.select('customer_order', {'curriculum_id': curriculumItem.curriculum_id})

    return soldList.length >= curriculumItem.size ? false : true

}
function paysignjs(appid, nonceStr, package, signType, timeStamp) {
    const config = getConfig()
    var ret = {
        appId: appid,
        nonceStr: nonceStr,
        package: package,
        signType: signType,
        timeStamp: timeStamp
    };
    var string = raw(ret)
    string = string + '&key='+ config.wxConfig.mch_key
    var ans = crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase()
    logger.info('paysignjs: ' + ans)
    return ans
};

function raw(args) {
    var keys = Object.keys(args)
    keys = keys.sort()
    var newArgs = {}
    keys.forEach(function(key) {
        newArgs[key] = args[key]
    })

    var string = ''
    for(var k in newArgs) {
        string += '&' + k + '=' + newArgs[k]
    }
    string = string.substr(1)
    return string
};

function paysignjsapi(appid, attach, body, mch_id, nonce_str, notify_url, openid, out_trade_no, spbill_create_ip, total_fee, trade_type) {
    var ret = {
        appid: appid,
        attach: attach,
        body: body,
        mch_id: mch_id,
        nonce_str: nonce_str,
        notify_url: notify_url,
        openid: openid,
        out_trade_no: out_trade_no,
        spbill_create_ip: spbill_create_ip,
        total_fee: total_fee,
        trade_type: trade_type
    };
    var string = raw(ret)
    string = string + '&key='+ config.wxConfig.mch_key
    logger.info('paysignjsapi: ' + string)
    var ans = crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase()
    return ans
};

function getXMLNodeValue(node_name, xml) {
    var tmp = xml.split("<" + node_name + ">")
    var tmp1 = tmp[1].split("</" + node_name + ">")
    var tmp = tmp1[0].split('[');
    var result = tmp[2].split(']');
    return result[0]
}

function randomStr(length) {
    if (length > 62) {
        throw new Error('random length is invalid')
    }
    var result = ''
    var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    for (var i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}
function getRawBody(ctx) {
    //only vaild in parseXML since bodyParser can not consume xml
    return new Promise((resolve, reject) => {
        var data = "";
        ctx.req.on("data", chunk => data += chunk);
        ctx.req.on("end", () => resolve(data));
        }
    )
}

function mapProperty(destination, source, propertyMap, mode) {
    var hasProperty = false;

    if (source == undefined) {
        return destination;
    }
    for (var property in source) {
        var destinationProperty;
        hasProperty = true;
        if (propertyMap == undefined){
            destinationProperty = property;
        } else {
            if (source[0] == undefined){
                destinationProperty = propertyMap[property] == undefined ? property: propertyMap[property];
                //strict mode, only copy property in map
                if( propertyMap[property] == undefined ){
                    if( mode != undefined && mode === true ){
                        continue;
                    }
                }
            } else {
                destinationProperty = property;
            }
        }
        if (source[property] != undefined &&
            source[property].constructor.name === 'Object') {
            if (destination == undefined){
                if (source[0] !=  undefined){
                    destination = new Array();
                } else {
                    destination = new Object();
                }
            }
            if (destination[destinationProperty] == undefined) {
                if (source[property][0] == undefined){
                    destination[destinationProperty] = new Object();
                } else {
                    destination[destinationProperty] = new Array();
                }
            }
            mapProperty(destination[destinationProperty], source[property], propertyMap, mode);
        } else if (source[property] != undefined){
            if (destination == undefined){
                if (source[0] !=  undefined){
                    destination =  new Array();
                } else {
                    destination = new Object();
                }
            }

            if (source[0] != undefined){
                destination.push(source[property]);
            } else {
                destination[destinationProperty] = source[property];
            }
        } else {
            // do not copy undefined property
        }
    }
    if (hasProperty){
        return destination;
    } else {
        return source;
    }
}

function validateObj(obj,schema) {
    const result = Joi.validate(obj, schema)
    if (result.error) {
        console.log(result.error)
        var error = new Error('params is invalid')
        error.status = -1
        throw error
    }
}

function getConfig() {
    var config = require('../config')
    return config
}


module.exports = {
    checkCurriculumTime,
    checkCurriculumSize,
    paysignjsapi,
    paysignjs,
    getXMLNodeValue,
    randomStr,
    getRawBody,
    mapProperty,
    validateObj,
    getConfig
}