const fs = require('fs');

const PG_DESCRIBE_TABLE = fs.readFileSync(__dirname + '/postgresDescribeTable.sql');
const MYSQL_DESCRIBE_TABLE = fs.readFileSync(__dirname + '/mysqlDescribeTable.sql');
const SQL_TYPES = require('./sqlDataTypeMapper.js');

exports.listTables = listTables;
exports.tableInfo = tableInfo;

function listTables(knex) {
    let query;
    let bindings = [];

    switch(knex.client.constructor.name) {
        case 'Client_MSSQL':
            query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_catalog = ?',
            bindings = [ knex.client.database() ];
            break;
        case 'Client_MySQL':
        case 'Client_MySQL2':
            query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = ?';
            bindings = [ knex.client.database() ];
            break;
        case 'Client_Oracle':
        case 'Client_Oracledb':
            query = 'SELECT table_name FROM user_tables';
            break;
        case 'Client_PG':
            query =  'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_catalog = ?';
            bindings = [ knex.client.database() ];
            break;
        case 'Client_SQLite3':
            query = "SELECT name AS table_name FROM sqlite_master WHERE type='table'";
            break;
    }

    return knex.raw(query, bindings).then(function(results) {
        return results.rows.map((row) => row.table_name);
    });
}

function tableInfo(knex, table) {
    const dbVendor = knex.client.constructor.name;
    let query;
    let bindings = [table];
    let mapper;

    switch(dbVendor) {
        case 'Client_MySQL':
        case 'Client_MySQL2':
            query = MYSQL_DESCRIBE_TABLE.toString();
            mapper = mysqlMapper;
            break;
        case 'Client_PG':
            query = PG_DESCRIBE_TABLE.toString();
            mapper = pgMapper;
            break;
        default:
            throw new Error('Unsupported db vendor');
            break;
    }

    return knex.raw(query, bindings).then(function(results) {
        return mapper(results, dbVendor);
    });
}

function pgMapper(results, dbVendor) {
    return results.rows.map(function(val) {
        return {
            name: val.column,
            nullable: !val.not_null,
            type: val.data_type_name,
            unique: val.is_unique_key === 't' || val.is_primary_key === 't',
            default: val.default_value,
            charLength: val.data_type_length && parseInt(val.data_type_length)
        };
    });
}

function mysqlMapper(results, dbVendor) {
    return results[0].map(function(val) {
        let index = val.Type.indexOf('(');
        let type = val.Type;
        let charLength = null;

        if (~index) {
            type = val.Type.slice(0, index);
            if (SQL_TYPES[dbVendor]
                && !['integer', 'number'].includes(SQL_TYPES[dbVendor][type].type)
            ) {
                charLength = parseInt(
                    val.Type.slice(index+1, val.Type.indexOf(')'))
                );
            }
        }

        return {
            name: val.Field,
            nullable: val.Null !== 'NO',
            type: type,
            unique: val.Key === 'PRI' || val.Key === 'UNI',
            default: val.Default,
            charLength: charLength
        };
    });
}
