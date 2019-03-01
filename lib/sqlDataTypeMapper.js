module.exports = {
    Client_PG: {
        'tsquery'           : {},//not supported yet
        'tsvector'          : {},//not supported yet
        'txid_snapshot'     : {},//not supported yet
        'path'              : {},//not supported yet
        'pg_lsn'            : {},//not supported yet
        'point'             : {},//not supported yet
        'polygon'           : {},//not supported yet
        'line'              : {},//not supported yet
        'lseg'              : {},//not supported yet
        'interval'          : {},//not supported yet
        'box'               : {},//not supported yet
        'circle'            : {}, //not supported yet
        'bit'               : {type: 'string', format: 'hex'},
        'bit varying'       : {type: 'string', format: 'hex'},
        'varbit'            : {type: 'string', format: 'hex'},
        'boolean'           : {type: 'boolean'},
        'bool'              : {type: 'boolean'},
        'bytea'             : {type: 'string', format: 'hex'},
        'character'         : {type: 'string'},
        'character varying' : {type: 'string'},
        'varchar'           : {type: 'string'},
        'char'              : {type: 'string'},
        'cidr'              : {type: 'string'},
        'double precision'  : {type: 'number', maximum: 1000, minimum: 0},
        'float8'            : {type: 'number', maximum: 1000, minimum: 0},
        'inet'              : {type: 'string'},
        'integer'           : {type: 'integer'},
        'int'               : {type: 'integer'},
        'int4'              : {type: 'integer'},
        'json'              : {type: 'string', format: 'json'},
        'jsonb'             : {type: 'string', format: 'json'},
        'macaddr'           : {type: 'string'},
        'money'             : {type: 'number', maximum: 1000, minimum: 0},
        'numeric'           : {type: 'number', maximum: 1000, minimum: 0},
        'real'              : {type: 'number', maximum: 1000, minimum: 0},
        'float4'            : {type: 'number', maximum: 1000, minimum: 0},
        'smallint'          : {type: 'integer'},
        'int2'              : {type: 'integer'},
        'smallserial'       : {type: 'integer'},
        'serial2'           : {type: 'integer'},
        'serial'            : {type: 'integer'},
        'serial4'           : {type: 'integer'},
        'text'              : {type: 'string'},
        'uuid'              : {type: 'string'},
        'xml'               : {type: 'string'},
        'time'              : {type: 'string', format: 'time'},
        'date'              : {type: 'string', format: 'date'},
        'time with time zone' : {type: 'string', format: 'time'},
        'time without time zone' : {type: 'string', format: 'time'},
        'timestamp with time zone' : {type: 'string', format: 'date-time'},
        'timestamptz' : {type: 'string', format: 'date-time'},
        'timestamp without time zone' : {type: 'string', format: 'date-time'}
    },
    Client_MySQL: {
        int        : {type: 'integer'},
        tinyint    : {type: 'integer'},
        smallint   : {type: 'integer'},
        mediumint  : {type: 'integer'},
        bigint     : {type: 'integer'},
        float      : {type: 'number', maximum: 1000, minimum: 0},
        double     : {type: 'number', maximum: 1000, minimum: 0},
        decimal    : {type: 'number', maximum: 1000, minimum: 0},
        date       : {type: 'string', format: 'date'},
        datetime   : {type: 'string', format: 'date-time'},
        timestamp  : {type: 'string', format: 'date-time'},
        time       : {type: 'string', format: 'time'},
        year       : {type: 'string', format: 'date'},
        char       : {type: 'string'},
        varchar    : {type: 'string'},
        blob       : {type: 'string'},
        text       : {type: 'string'},
        tinyblob   : {type: 'string'},
        tinytext   : {type: 'string'},
        mediumblob : {type: 'string'},
        mediumtext : {type: 'string'},
        longblob   : {type: 'string'},
        longtext   : {type: 'string'},
        enum       : {type: 'string'}
    }
};
