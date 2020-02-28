var bunyan = require('bunyan');
var log = bunyan.createLogger({ name: "morag" });

function init(sqlFilePath){
    try{
        let sqlStatements = module.parent.require(sqlFilePath);
        let SQL;
        SQL = require('./query_builder_postgres');
        return new SQL(sqlStatements);
    }catch(error){
        log.error(error);
        throw error;
    }
}

module.exports = {
    init: init
}