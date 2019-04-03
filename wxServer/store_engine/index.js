var pg = require('pg')
var _ = require('lodash')
var config = require('../config')

var knex = require('knex')(config.knexConfig);

class database {
    constructor() {
        this.pool = new pg.Pool(config.dbConfig)
        console.log('db engine start')
    }
    async transactionBegin() {
        var transClient = await this.pool.connect()
        await transClient.query('BEGIN')
        return transClient
    }
    async transactionEnd(transClient) {
        await transClient.query('COMMIT')
        await transClient.release()
    }
    async transactionRollback(transClient) {
        await transClient.query('ROLLBACK')
        await transClient.release()
    }
    async select(table, matchObj, returnColumns, transClient = undefined) {
        _.forEach(matchObj, (value, key) => {
            if (value == undefined) {
                throw new Error('matchObj has undefined value')
            }
        })
        var client = undefined
        if (transClient == undefined) {
            client = await this.pool.connect()
        } else {
            client = transClient
        }
        var returnColStr = ""
        var str = ""
        if(returnColumns === undefined) {
            returnColStr = '*'
        } else {
            returnColStr = returnColumns.join(",")
        }
        if (matchObj === undefined) {
            str = "select " + returnColStr + " from " + table
        } else {
            str = "select " + returnColStr + " from " + table + " where "
            var columns = []
            var values = []
            var i = 0
            _.forEach(matchObj, (value, key) =>{
                i++
                columns.push(key + '=$' + i)
                values.push(value)
            })
            str += columns.join(" and ")
        }
        //console.log("sqlString: " + str)
        var res = await client.query(str,values)
        if (transClient == undefined) {
            client.release()
        }
        return res.rows
    }
    
    async insert(table, valueObj, returnValue, transClient = undefined) {
        _.forEach(valueObj, (value, key) => {
            if (value == undefined) {
                throw new Error('valueObj has undefined value')
            }
        })
        var client = undefined
        if (transClient == undefined) {
            client = await this.pool.connect()
        } else {
            client = transClient
        }
        var str = "insert into "+ table +"(";
        var columns = []
        var values = []
        var counts = []
        var i = 0
        _.forEach(valueObj, (value, key) => {
            i++
            columns.push(key)
            values.push(value)
            counts.push('$' + i)
        })
        str += columns.join(',') + ') values(' + counts.join(',') + ')'
        if (returnValue != undefined) {
            str += ' RETURNING ' + returnValue
        }
        var res = await client.query(str, values)
        if (transClient == undefined) {
            client.release()
        }
        return res.rows
    }

    async update(table, matchObj, valueObj, transClient = undefined) {
        //matchObj combined by and
        if (matchObj) {
            _.forEach(matchObj, (value, key) => {
                if (value == undefined) {
                    throw new Error('matchObject has undefined value')
                }
            })
        }
        if (valueObj) {
            _.forEach(valueObj, (value, key) => {
                if (value == undefined) {
                    throw new Error('valueObj has undefined value')
                }
            })
        }
        var client = undefined
        if (transClient == undefined) {
            client = await this.pool.connect()
        } else {
            client = transClient
        }
        var str = "update "+ table +" set "
        var matchColumns = []
        var valueColumns = []
        var values = []
        var i = 0
        _.forEach(valueObj, (value, key) => {
            i++
            valueColumns.push(key + '=$' + i)
            values.push(value)
        })
        _.forEach(matchObj, (value, key) => {
            i++
            matchColumns.push(key + '=$' + i)
            values.push(value)
        })
        str += valueColumns.join(',') + ' where ' + matchColumns.join(' and ')
        //console.log(str)
        var res = await client.query(str, values)
        if (transClient == undefined) {
            client.release()
        }
        return res.rowCount
    }

    async delete(table, matchObj, transClient = undefined) {
        if (matchObj) {
            _.forEach(matchObj, (value, key) => {
                if (value == undefined) {
                    throw new Error('matchObject has undefined value')
                }
            })
        }
        var client = undefined
        if (transClient == undefined) {
            client = await this.pool.connect()
        } else {
            client = transClient
        }
        var str = "delete from " + table + " where "
        var columns = []
        var values = []
        var i = 0
        _.forEach(matchObj, (value, key) => {
            i++
            columns.push(key + '=$' + i)
            values.push(value)
        })
        str += columns.join(' and ')
        var res = await client.query(str, values)
        if (transClient == undefined) {
            client.release()
        }
        return res.rowCount
    }

    async count(table, transClient = undefined) {
        var client = undefined
        if (transClient == undefined) {
            client = await this.pool.connect()
        } else {
            client = transClient
        }
        var str = 'select count(*) from ' + table
        var res = await client.query(str)
        if (transClient == undefined) {
            client.release()
        }
        return res.rows[0].count
    }

    async queryStr(str, transClient = undefined) {
        var client = undefined
        if (transClient == undefined) {
            client = await this.pool.connect()
        } else {
            client = transClient
        }
        var res = await client.query(str)
        if (transClient == undefined) {
            client.release()
        }
        return res.rows
    }

}

//var db = new database()


module.exports = knex
