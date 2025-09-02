//generate the plural name from the view name.  apiViewUsers => Users
function generatePluralNameFromView(viewName) {
    let name = viewName
    //the start of the view name will be like 'apiView' - replace this
    name = name.replace('apiView', '')
    //if(process.env.VERBOSE === 'true') console.log(`View ${viewName} => query ${name}`)
    return name;
}

function generateViewNameFromTable(tableName) {
    //should just be a case of swapping the prefix 'api' with 'apiView'
      if (typeof tableName !== 'string') {
        throw new TypeError('tableName must be a string');
    }
    if (!tableName.startsWith('api')) {
        throw new Error(`Invalid tableName "${tableName}". Must start with "api".`);
    }
    return tableName.replace(/^api/, 'apiView');
}

//generate the type name from the view name
function generateTypeNameFromView(viewName) {
    let name = viewName
    //the start of the view name will be like 'apiView' - replace this
    name = name.replace('apiView', '')
    //capitalise the first letter
    name = name.charAt(0).toUpperCase() + name.slice(1)
    //the view name will be plural, so make it singular
    //deal with ones ending ies
    if(name.endsWith('ies')) {
        name = name.replace('ies', 'y')
    }
    //deal with ones ending s
    if(name.endsWith('s')) {
        name = name.slice(0, -1)
    }
    //if(process.env.VERBOSE === 'true') console.log(`View ${viewName} => object ${name}`)
    return name;
}

generateTypeNameFromView = viewName => generateTypeNameFrom(viewName, 'view')
generateTypeNameFromTable = tableName => generateTypeNameFrom(tableName, 'table')

//generate the type name from the view or table name (only difference is the prefix)
function generateTypeNameFrom(viewOrTableName, type) {
    //if table it's like apiStores.  If view its like apiViewStores
    const prefix = (type === 'view' ? 'apiView' : 'api')
    //start mutating
    let name = viewOrTableName
    //the start of the view name will be like 'apiView' - replace this
    name = name.replace(prefix, '')
    //capitalise the first letter
    name = name.charAt(0).toUpperCase() + name.slice(1)
    //the view name will be plural, so make it singular
    //deal with ones ending ies
    if(name.endsWith('ies')) {
        name = name.replace('ies', 'y')
    }
    //deal with ones ending s
    if(name.endsWith('s')) {
        name = name.slice(0, -1)
    }
    //if(process.env.VERBOSE === 'true') console.log(`View ${viewName} => object ${name}`)
    return name;
}

function generateViewNameFromType(typeName) {
    let name = typeName
    //the start of the view name will be like 'apiView'
    name = 'apiView' + name
    //pluralise it
    name = pluraliseType(name)
    return name
}

function pluraliseType(typeName) {
    let name = typeName
    //handle ones ending y
    if(name.endsWith('y')) {
        name = name.replace('y', 'ies')
    } else {
        name += 's'
    }
    return name
}

module.exports = { generatePluralNameFromView, generateTypeNameFromView, generateTypeNameFromTable, pluraliseType, generateViewNameFromType, generateViewNameFromTable };