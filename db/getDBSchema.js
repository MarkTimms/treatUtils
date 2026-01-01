//The DB is comprised of the 'apiViews' and 'apiTables' in the database

//The views are intended to be the source of data for the GraphQL API when requesting data
//The views to be used in this way are all named starting 'apiView'

//The tables are intended to be used when doing the mutations
//the tables are all named starting with 'api'

//In this way we can automatically generate a lot of the boilerplate code for the GraphQL API

/**
 * Gets the schema of the database, to be passed into the GraphQL context
 * @param {*} db the knex db connection
 * @returns {Promise<*>} a promise that resolves to a Map (by tableName) of Maps (by columnName) of the schema
 */
async function getDBSchema(db) {
    const dbSchema = {
        tables: await getTables(db),
        views: await getViews(db),
    }

    //report on the total number of fields in each entity type
    const totalTableFields = [...dbSchema.tables.values()].reduce((sum, m) => sum + m.size, 0);
    const totalViewFields = [...dbSchema.views.values()].reduce((sum, m) => sum + m.size, 0);

    console.log(`DB contains ${dbSchema.tables.size} tables (${totalTableFields} fields) and ${dbSchema.views.size} views (${totalViewFields} fields)`);

    //validate the schema
    validateSchema(dbSchema);
    return dbSchema;
}

function validateSchema(dbSchema) {
    //check that every table has the mandatory fields
    validateMandatoryFields(dbSchema);
    validateReservedFieldNames(dbSchema);
}

function validateMandatoryFields(dbSchema) {
    const mandatoryTableFields = require('treatUtils').fields.mandatoryTableFields;
    dbSchema.tables.forEach((table) => {
        mandatoryTableFields.forEach((mandatoryField) => {
            if (!table.has(mandatoryField)) {
                throw new Error(`Table ${table.key} is missing mandatory field ${mandatoryField}`);
            }
        })
    })
}

function validateReservedFieldNames(dbSchema) {
    const reservedFieldNames = require('treatUtils').fields.reservedFieldNames;
    dbSchema.tables.forEach((table) => {
        reservedFieldNames.forEach((reservedFieldName) => {
            if (table.has(reservedFieldName)) {
                throw new Error(`Table ${table.key} contains reserved field name ${reservedFieldName}`);
            }
        })
    })
}

async function getTables(db) {
    //return map of tables and their fields
    const columns = await db('INFORMATION_SCHEMA.COLUMNS')
        .select('TABLE_NAME AS tableName', 'COLUMN_NAME as columnName', 'DATA_TYPE AS dataType', 'CHARACTER_MAXIMUM_LENGTH AS length', 'IS_NULLABLE AS isNullable', 'COLUMN_DEFAULT AS defaultValue', 'ORDINAL_POSITION AS ordinalPosition')
        //only selecting the views that are designed to be queried as part of the api (ones that start with 'apiView')
        .where('TABLE_NAME', 'like', 'api%')
        .whereNot('TABLE_NAME', 'like', 'apiView%')

    const tableNames = new Set(columns.map(c => c.tableName));

    //create a map of maps, where the outer map is the tableName and the inner map is the columnName
    const schema = new Map(
        [...tableNames].map(tableName => [
            tableName,
            new Map(
                columns.filter(column => column.tableName === tableName).map(column => [
                    column.columnName,
                    {
                        dataType: column.dataType,
                        length: column.length,
                        isNullable: column.isNullable === 'YES',
                        defaultValue: column.defaultValue,
                        ordinalPosition: column.ordinalPosition,
                        requiredInDB: (column.isNullable !== 'YES' && (column.COLUMN_DEFAULT === null || column.COLUMN_DEFAULT === undefined)), //do we need to specify this field when inserting?  Used throughout the codebase
                    }
                ])
            )
        ])
    );

    return schema;
}

async function getViews(db) {
    //return map of views and their fields
    const columns = await db('INFORMATION_SCHEMA.COLUMNS')
        .select('TABLE_NAME AS viewName', 'COLUMN_NAME as columnName', 'DATA_TYPE AS dataType', 'CHARACTER_MAXIMUM_LENGTH AS length', 'IS_NULLABLE AS isNullable', 'COLUMN_DEFAULT AS defaultValue', 'ORDINAL_POSITION AS ordinalPosition')
        //only selecting the views that are designed to be queried as part of the api (ones that start with 'apiView')
        .whereLike('TABLE_NAME', 'apiView%')

    const viewNames = new Set(columns.map(c => c.viewName));

    //create a map of maps, where the outer map is the tableName and the inner map is the columnName
    const schema = new Map(
        [...viewNames].map(viewName => [
            viewName,
            new Map(
                columns.filter(column => column.viewName === viewName).map(column => [
                    column.columnName,
                    {
                        dataType: column.dataType,
                        length: column.length,
                        isNullable: column.isNullable === 'YES',
                        defaultValue: column.defaultValue,
                        ordinalPosition: column.ordinalPosition,
                    }
                ])
            )
        ])
    );

    return schema;
}

module.exports = getDBSchema;