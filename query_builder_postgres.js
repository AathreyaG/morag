var bunyan = require('bunyan')
var log = bunyan.createLogger({ name: 'log-test' });
var _ = require('lodash');
const pg = require('pg');
const QueryBuilder = require('./query_builder');


var pool;
var config = {
    user: 'tinrrwfjlxidxe',
    host: 'ec2-54-80-184-43.compute-1.amazonaws.com',
    database: 'd4r40msegpi63b',
    password: 'f80c9947a746bedd7d7cdb4ca8bd29afbb496631b30b62446711830f87f12cde',
    port: '5432'
}

//force all CLOBs to be returned as string
pg.fetchAsString = [pg.CLOB];

module.exports = class QueryBuilderPostgres extends QueryBuilder {

    async getPool() {
        if (!pool)
            pool = new pg.Pool(config);
        return pool;
    }

    /**
     * Fetches a connection from the DB connection pool
     */
    async getConnection() {
        try {
            let pool = await this.getPool();
            let conn = await pool.connect();
            return conn;
        } catch (error) {
            throw error;
        }
    }

    /**
     * This function will execute the sql statements provided as an array
     * @param {object} conn 
     * @param {Array} sql 
     * @param {Array} bindings 
     */
    async executeSQL(conn, sql, bindings) {
        try {

            let results = [];
            let values = [];
            for (let i = 0; i < sql.length; i++) {
                log.info(sql[i]);
                var result;
                if (_.isEmpty(bindings[i])) {
                    values = this.extractBinds(sql[i], bindings[i]);
                    result = await conn.query(values[0], values[1]);
                } else {
                    result = await conn.query(sql[i], values);
                }
                result = (result.command === 'SELECT' ? result.rows : { 'rowsAffected': result.rowCount })
                results.push({
                    sql: sql[i],
                    result: result
                });
                return results;
            }
        } catch (error) {
            log.error(error);
            throw error;
        }
    }

    /**
     * Thismethod extracts the binds and orders it while executing the postgres query
     * @param {array} sql 
     * @param {array} bindings 
     */
    extractBinds(sql, bindings) {
        let valueBind = sql.match(/(\$\S+\b)/ig);
        let values = [];
        for (let j = 0; j < valueBind.length; j++) {
            //Replaces the values after "$" with integers starting from 1 to give bindings for postgres runnable queries 
            sql = sql.replace(valueBind[j], '$' + (j + 1));

            let matchBindings = valueBind[j].split('$')[1];

            values.push(bindings[matchBindings]);
        }
        return [sql, values];
    }

    /**
     * This method begins the transaction
     * @param {object} conn 
     */
    async beginTransaction(conn) {
        if (conn) {
            try {
                await conn.query('BEGIN')
            } catch (error) {
                log.error(error);
                throw error;
            }
        }
    }

    /**
     * This method is to release the connection
     * @param {object} conn 
     */
    async releaseConnection(conn) {
        if (conn) {
            try {
                await conn.release();
            } catch (error) {
                log.error(error);
                throw error;
            }
        }
    }

    /**
     * Method to rollback
     * @param {object} conn 
     */
    async rollback(conn) {
        if (conn) {
            try {
                await conn.query('ROLLBACK')
            } catch (error) {
                log.error(error);
                throw error;
            }
        }
    }

    /**
     * Commits the connection
     * @param {object} conn 
     */
    async commit(conn) {
        if (conn) {
            try {
                await conn.query('COMMIT')
            } catch (error) {
                log.error(error);
                throw error;
            }
        }
    }
}
