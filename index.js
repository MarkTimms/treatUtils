module.exports = {
    getIDField: require('./getIDField'),
    nameGenerators: require('./nameGenerators'),
    history: require('./history'),
    mapDBTypeToGraph: require('./mapDBTypeToGraph'),
    //db schema related
    getDBSchema: require('./db/getDBSchema'),
    identifySchemaRelationships: require('./db/identifySchemaRelationships'),
}