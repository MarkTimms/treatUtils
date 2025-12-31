module.exports = {
    nameGenerators: require('./nameGenerators'),
    history: require('./history'),
    //db schema related
    getDBSchema: require('./db/getDBSchema'),
    identifySchemaRelationships: require('./db/identifySchemaRelationships'),
    //field related
    fields: require('./fields'),
    getIDField: require('./getIDField'),
    mapDBTypeToGraph: require('./mapDBTypeToGraph'),
}