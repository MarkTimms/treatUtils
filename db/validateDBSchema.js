function validateSchema(dbSchema) {
    //check that every table has the mandatory fields
    validateMandatoryFields(dbSchema);
    validateReservedFieldNames(dbSchema);
    validateVarcharTypes(dbSchema);
}

//check every table has the mandatory fields
function validateMandatoryFields(dbSchema) {
    const mandatoryTableFields = require('../fields').mandatoryTableFields;
    dbSchema.tables.forEach((tableFields, tableName) => {
        mandatoryTableFields.forEach((mandatoryField) => {
            if (!tableFields.has(mandatoryField)) {
                throw new Error(`Table ${tableName} is missing mandatory field ${mandatoryField}`);
            }
        })
    })
}

//check no fields are named sort or pagination etc
function validateReservedFieldNames(dbSchema) {
    const reservedFieldNames = require('../fields').reservedFieldNames;
    dbSchema.tables.forEach((tableFields, tableName) => {
        reservedFieldNames.forEach((reservedFieldName) => {
            if (tableFields.has(reservedFieldName)) {
                throw new Error(`Table ${tableName} contains reserved field name ${reservedFieldName}`);
            }
        })
    })
}

//check all varchar fields are actually nvarchar
function validateVarcharTypes(dbSchema) {
    dbSchema.tables.forEach((tableFields, tableName) => {
        tableFields.forEach((field, fieldName) => {
            if (field.dataType === 'varchar') {
                throw new Error(`Table ${tableName} contains varchar field ${fieldName}.  Please update to nvarchar`);
            }
        })
    })
}

module.exports = validateSchema;
