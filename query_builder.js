var bunyan = require('bunyan')
var log = bunyan.createLogger({ name: 'log-test' });
var _ = require('lodash')

module.exports = class QueryBuilder {

    constructor(sqlStatements) {
        try {
            this.sqlStatements = sqlStatements;
            return this;
        } catch (error) {
            log.error(error.stack);
            throw error;
        }
    }

    getSQL(queryName, sqlStatements) {
        if (_.isEmpty(queryName)) {
            log.error('Query name not specified');
            throw new Error('Query name not specified');
        }
        if (!Array.isArray(queryName)) queryName = [queryName];
        let sqls = [];
        for (let i = 0; i < queryName.length; i++) {
            let sql = queryName[i].split('.').reduce((x, y) => x ? x[y] : null, sqlStatements);
            if (!sql) {
                throw new Error(`Unable to fetch query for ${queryName[i]}. SQL statement not registered in the SQL file`);
            }
            this.validateSQLType(sql);
            if (Array.isArray(sql)) {
                sqls = sqls.concat(sql);

            } else {
                sqls.push(sql);
            }
        }
        return sqls;
    }

    /**
     * handles the sql queries by collecting all sql statements and executes them
     * @param {*} param0 
     */
    async executeTransaction({ queryName, bindings, options, connection }) {
        try {

            if (_.isEmpty(queryName)) {
                throw new Error('Queryname not specified');
            }
            if (!bindings)
                bindings = {}; //if null is passed it is set to empty object
            if (!options)
                options = {};
            if (!Array.isArray[queryName])
                queryName = [queryName];
            if (!Array.isArray[bindings])
                bindings = [bindings];

            let sql = this.getSQL(queryName, this.sqlStatements);
            var conn = connection ? connection : await this.getConnection();
            if (!connection) await this.beginTransaction(conn)
            let results = await this.executeSQL(conn, sql, bindings, options);
            if (!connection) await this.commit(conn);
            return results;

        } catch (error) {
            await this.rollback(conn);
            log.error(error);
        } finally {
            // if connection is passed, the consumer is controlling the transaction
            if (!connection)
                await this.releaseConnection(conn);
        }
    }

    /**
     * validate sql type
     * @param {*} sql 
     */
    validateSQLType(sql) {
        const SQL_TYPES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'select', 'insert', 'update', 'delete'];
        let sql_prefix = sql.subtring(0, sql.indexOf(' '));
        if (SQL_TYPES.includes(sql_prefix)) {
            return sql_prefix;
        } else {
            throw new Error('Invalid SQL statement provided');
        }
    }

    /**
     * Arranges the resultset to be an array of objects
     * @param {array} result 
     */
    extractResultSet(result) {
        var metaData = result.metaData;
        rows = result.rows;
        var resultSet = [];

        rows.forEach(element => {
            let eachResult = {};
            for (let i = 0; i < metaData.length; i++) {
                eachResult[metaData[i].name.toLowerCase()] = element[i];
            }
            resultSet.push(eachResult);
        });

        return resultSet;
    }
}
