const Promise         = require('bluebird');
const _               = require('lodash');
const Service         = require('bi-service');
const Restfulness     = require('bi-service-restfulness');
const jsf             = require('json-schema-faker');

const sqlUtils = require('./lib/sqlUtils.js');
const SQL_TYPES = require('./lib/sqlDataTypeMapper.js');

//const FAKER_TOPICS = ['system', 'random', 'phone', 'name', 'lorem', 'internet',
//'image', 'helpers', 'hacker', 'finance', 'date', 'database', 'company',
//'commerce', 'address'];


jsf.extend('faker', () => require('faker'));
jsf.option({
    useDefaultValue: false,
    ignoreMissingRefs: true,
    failOnInvalidTypes: false,
    failOnInvalidFormat: false,
    alwaysFakeOptional: true
});

const Resource = Restfulness.Resource;


Service.once('set-up', function(appManager) {
    appManager.service.on('shell-cmd', registerSeedCommand);
});


/**
 * @this {Service}
 * @return {undefined}
 */
function registerSeedCommand(yargs) {
    const appManager = this.appManager;
    const config     = this.config;
    const knex       = this.resourceManager.get('knex');
    const app        = this.appManager.get(Object.keys(config.get('apps'))[0]);
    const ajv        = app.getValidator();
    const DB_VENDOR  = knex.client.constructor.name;

    yargs.command('seed', 'populate sql tables with testing fake data', {
        exclude: {
            alias: '-e',
            describe: 'list of resources to exclude',
            type: 'string',
            default: [],
            array: true
        },
        number: {
            alias: '-n',
            describe: 'how many records to seed',
            type: 'number',
            default: 20
        },
    }, command);

    function command(argv) {
        const resources = {};
        let dbTables;

        Resource.registry.forEach(function(resource) {
            resources[resource.getTableName()] = resource;
        });

        if (!SQL_TYPES[DB_VENDOR]) {
            throw new Error('Unsupported db vendor');
        }

        return sqlUtils.listTables(knex).then(function(listOfTablesInDb) {
            tableNames = Object.keys(resources);

            _.difference(tableNames, listOfTablesInDb).forEach(function(name) {
                console.warn(`Skipping resource ${name} as corresponding table does not exist in db.`);
            });

            dbTables = _.intersection(listOfTablesInDb, tableNames);
            dbTables = _.difference(dbTables, argv.exclude);

            return Promise.map(dbTables, function(table) {
                return sqlUtils.tableInfo(knex, table);
            });
        }).then(function(data) {
            const seederSchemas = [];

            data.forEach(function(info, index) {
                const resource = resources[dbTables[index]];
                const seederSchema = {
                    resource: resource,
                    table: resource.getTableName(),
                    requiredResources: getDependentTables(resource),
                    foreignKeyNames: getForeignKeyNames(resource),
                    uniqueKeyNames: [],
                    schema: {},
                    data: {}
                };

                const requiredColumns = {};

                info.forEach(function(columnInfo) {
                    const columnName = columnInfo.name;
                    if (!columnInfo.nullable) {
                        if (columnInfo.unique) {
                            seederSchema.uniqueKeyNames.push(columnName);
                        }

                        requiredColumns[columnName] = {};
                        if (columnInfo.charLength) {//nullable
                                requiredColumns[columnName].maxLength
                                = columnInfo.charLength;
                        }
                        Object.assign(
                            requiredColumns[columnName],
                            SQL_TYPES[DB_VENDOR][columnInfo.type]
                        );
                    }
                });

                const requiredProps = _.union(
                    Object.keys(requiredColumns),
                    resource.getRequiredProperties()
                );

                //append properties which are defined as non nullable in db
                //and are not defined as part of Resource property definitions
                requiredProps.forEach(function(propName) {
                    let propSchema;
                    if (!resource.hasProp(propName)) {
                        propSchema = requiredColumns[propName];
                    } else {
                         propSchema = resource.prop(propName);
                    }
                    seederSchema.schema[propName] = dereferenceJsonSchema(ajv, propSchema);
                });

                if (resource.prop(resource.getKeyName()).type === 'integer') {
                    delete seederSchema.schema[resource.getKeyName()];
                }

                if (resource.hasTimestamps()) {
                    delete seederSchema.schema[resource.CREATED_AT];
                    delete seederSchema.schema[resource.UPDATED_AT];
                }

                if (resource.hasTimestamps(resource.DELETED_AT)) {
                    delete seederSchema.schema[resource.DELETED_AT];
                }

                seederSchemas.push(seederSchema);
            });

            sortSeeders(seederSchemas);

            return seed(knex, seederSchemas, resources, argv.n);
        }).then(function() {
            process.stdout.write('OK\n');
            process.exit(0);
        }).catch(function(err) {
            console.error(err);
            process.exit(1);
        });
    };
}

/**
 * @param {Array<Object>} seeders
 * @param {Object} resources - mapping of table name -> resource
 * @param {Integer} seedNumber
 * @return {Promise}
 */
function seed(knex, seeders, resources, seedNumber) {
    const seededData = {
        primaryKeys: {},
        columns: {}
    };

    return Promise.map(Object.keys(resources), function(tableName) {
        const resource = resources[tableName];
        return resource.query(knex)
            .pluck(resource.getKeyName()).then(function(ids) {
                seededData[tableName] = ids;
            });
    }).then(function() {
        return seeders;
    }).each(function(seeder) {
        const resource = seeder.resource;
        return Promise.map(new Array(seedNumber), function() {
            return resource.query(knex).insert(
                getResourceData(seeder, seededData)
            ).returning(resource.getKeyName()).then(function(result) {
                if (!(seededData.primaryKeys[seeder.table] instanceof Array)) {
                    seededData.primaryKeys[seeder.table] = [];
                }
                seededData.primaryKeys[seeder.table].push(result[0]);
            })
        })
    });
}

/**
 * @return {Object}
 */
function getResourceData(seeder, seededData) {
    const data = {};
    const primaryKeys = seededData.primaryKeys;
    const columnData = seededData.columns;

    Object.keys(seeder.schema).forEach(function iterator(columnName) {
        if (seeder.foreignKeyNames.hasOwnProperty(columnName)) {
            if (primaryKeys.hasOwnProperty(seeder.foreignKeyNames[columnName])) {
                data[columnName] =
                    pickRandom(primaryKeys[seeder.foreignKeyNames[columnName]]);
            }
        } else {
            data[columnName] = jsf.generate(seeder.schema[columnName]);
        }

        if (!(columnData[columnName] instanceof Array)) {
            columnData[columnName] = [];
        }

        //make sure columns with unique key have original data
        if (seeder.uniqueKeyNames.includes(columnName)
            && columnData[columnName].includes(data[columnName])
        ) {
            return iterator(columnName);
        }

        //cache inserted data per table column
        columnData[columnName].push(data[columnName]);
    });

    return data;
}

/**
 * @param {Array} arr
 * @return {mixed}
 */
function pickRandom(arr) {
    return arr[_.random(0, arr.length-1, false)];
}

/**
 * @param {Array<Object>} tables
 * @return tables
 */
function sortSeeders(tables) {
    let _found = {};
    let _moveJobs = {};

    for (var i = 0, len = tables.length; i < len; i++) {
        let table = tables[i];

        if (_moveJobs.hasOwnProperty(table.table)) {
            let movIndex = _moveJobs[table.table];
            //place table to new location index
            if (movIndex < 0) {
                tables.unshift(table);
            } else {
                tables.splice(movIndex, 0, table);
            }
            //remove the table from its previous index position
            tables.splice((movIndex > i ? i : i+1), 1);
            return sortSeeders(tables);
        }

        for (var y = 0, len2 = table.requiredResources.length; y < len2; y++) {
            let requiredTable = table.requiredResources[y];
            if (!_found.hasOwnProperty(requiredTable)) {
                _moveJobs[requiredTable] = i-1;
                continue;
            }
        }
        _found[table.table] = i;
    }
    return tables;
}

/**
 * @param {Resource} resource
 * @return {Array<String>}
 */
function getDependentTables(resource) {
    return resource.getAssociatedResourceNames().filter(function(pluralName) {
        return resource.hasAssociation(pluralName, '1x1');
    }).map(function(pluralName) {
        return Resource.registry.getByPluralName(pluralName).getTableName();
    });
}

/**
 * @param {Resource} resource
 * @return {Object}
 */
function getForeignKeyNames(resource) {
    return resource.getAssociatedResourceNames().filter(function(pluralName) {
        return resource.hasAssociation(pluralName, '1x1');
    }).reduce(function(out, pluralName, index) {
        out[resource.getAssociation(pluralName).localKey] =
            Resource.registry.getByPluralName(pluralName).getTableName();
        return out;
    }, {});
}

/**
 * @param {Ajv} ajv - instance validator
 * @param {Object} schema - json schema
 */
function dereferenceJsonSchema(ajv, schema) {
    if (!schema.hasOwnProperty('$ref')) {
        return schema;
    }

    const _schema = _.omit(schema, ['$ref']);

    const validate = ajv.getSchema(schema.$ref);

    if (typeof validate !== 'function') {
        return _schema;
    }
    validate.schema = _.cloneDeep(validate.schema);
    delete validate.schema['$id'];

    return Object.assign({}, validate.schema, _schema);
}
