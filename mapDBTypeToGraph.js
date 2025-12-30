const { GraphQLInt, GraphQLString, GraphQLBoolean, GraphQLFloat } = require('graphql');
const { GraphQLDateTime, GraphQLDate } = require('graphql-scalars');


//db field types must be mappable to an equivelant in graphql
function mapDBTypeToGraph(dbFieldType) {
    //get the data type of this field
    //if it exists
    if (mappings[dbFieldType]) {
        return mappings[dbFieldType];
    } else {
        //return undefined, this should be handled by the calling fn
        console.log(`PROBLEM: No mapping found for db field type ${dbFieldType}`)
        return undefined;
    }
}

const mappings = {
    'int': GraphQLInt,
    'tinyint': GraphQLInt,
    'nvarchar': GraphQLString,
    'datetime': GraphQLDateTime,
    'decimal': GraphQLFloat,
    'bit': GraphQLBoolean,
    'date': GraphQLDate,
}

module.exports = mapDBTypeToGraph;