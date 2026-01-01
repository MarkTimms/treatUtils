const graphqlFields = require('graphql-fields');

const nonInsertableCommonFields = [ //obviously dont forget to exclude the ID field too!
    'createdByUserID',
    'createdDate',
    'updatedByUserID',
    'updatedDate',
    'deletedByUserID',
    'deletedDate',
    'deleted',
    'currentHistoryID',
]

const nonUpdatableCommonFields = [ //obviously dont forget to exclude the ID field too!
    'createdByUserID',
    'createdDate',
    'updatedByUserID',
    'updatedDate',
    'deletedByUserID',
    'deletedDate',
    //'deleted',
    'currentHistoryID',
]

const nonSelectableCommonFields = [ //fields that should not be selectable in queries
    //'deletedByUserID', - do not exclude these in the code.  Instead, mask them at the security layer.  Eg administrators may need to see these fields.  The UI will need to be able to show these as deleted records
    //'deletedDate',
    //'deleted',
]

const reservedFieldNames = [ //these should be checked when dbschema runs, to ensure they are not used as field names.  They will interfere when the graphql schema is built, as objects with these names can be passed in to perform things like sorting and pagination
    'sort',
    'pagination',
]

/**
 * Returns an array of non-updatable fields for a given table, including common non-updatable fields and the ID field
 * @param {*} tableFields 
 * @returns 
 */
function nonUpdatableFields(tableFields) {
    //start with the common non-updatable fields
    const nonUpdatable = [...nonUpdatableCommonFields];
    //cannot update the ID field
    const idFieldName = require('./getIDField')(tableFields)
    nonUpdatable.push(idFieldName);
    return nonUpdatable;
}


/**
 * Returns an array of non-insertable fields for a given table, including common non-insertable fields and the ID field
 * @param {*} tableFields 
 * @returns 
 */
function nonInsertableFields(tableFields) {
    //start with the common non-insertable fields
    const nonInsertable = [...nonInsertableCommonFields];
    //cannot insert the ID field
    const idFieldName = require('./getIDField')(tableFields)
    nonInsertable.push(idFieldName);
    return nonInsertable;
}

/**
 * Prunes the fields selected in a graphql query to only those that are relevant to the view.  Sensitive to any relationships which might mean we need to select data allowing us to fulfil that relationship
 * @param {*} info - the graphql info object
 * @param {*} viewFields - the fields in the view
 * @param {*} n1Relevant - the n1 relationships in the view
 * @param {*} nnRelevant - the nn relationships in the view
 * @returns an array of fields to select
 */
function pruneFields(info, viewFields, n1Relevant, nnRelevant, subkey) {
    let parsedInfo = graphqlFields(info)
    //are we looking atr fields under a particular subkey?  For example for plural queries, we look under subkey 'data'
    if (subkey) {
        parsedInfo = parsedInfo[subkey]
    }
    if (process.env.LOGGING === 'verbose') console.log(`Extracted raw graphql fields list: `, parsedInfo);
    //fields is just the keys
    const fields = Object.keys(parsedInfo)
    //compile a list of fields to return, being a set to avoid duplicates
    const prunedFields = new Set();
    //check each field requested in the query
    fields.forEach(field => {
        if (viewFields.has(field)) {
            //it's in the schema, so include it
            prunedFields.add(field);
        } else {
            if (process.env.LOGGING === 'verbose') console.log(`Attempt to select field ${field} which is not in schema`);
        }
    });
    //now check that necessary relatoinship fields are included.  N1 first.  This is like Sale -> Store.  We must include StoreID field
    if (n1Relevant) {
        //go through each of the relationships to see if they are being requested
        for (const [fieldName, props] of Object.entries(n1Relevant)) {
            //are they requesting this related type via it's graph name?
            if (fields.includes(props.name)) {
                //it's being requested, so we must add its primary field to our pruned list, so it's requested form the DB and used to make the join
                if (process.env.LOGGING === 'verbose') console.log(`Field ${fieldName} may have been pruned were it not requested as an n1 relationship`);
                prunedFields.add(fieldName);
            }
        }
    }
    //now NN fields.  This is like Store -> Sales.  We must include StoreID (primary key) in the query
    if (nnRelevant) {
        //go through each of the relationships to see if they are being requested
        for (const [relatedTypeName, joins] of Object.entries(nnRelevant)) {
            //let's go through each of the joins to see if it's being requested
            for (const [joinField, graphName] of Object.entries(joins)) {
                if (fields.includes(graphName)) {
                    //make sure we include the primary key of this type in the query - so it can be used to join with the related type
                    let idFieldName = require('./getIDField')(viewFields)
                    if (process.env.LOGGING === 'verbose') console.log(`Field ${idFieldName} may have been pruned were it not requested as ${graphName} invoking a join with ${relatedTypeName}`);
                    prunedFields.add(idFieldName);
                }
            }
        }
    }
    //return our complete list
    return [...prunedFields]; //return as an array
}

module.exports = {
    pruneFields,
    nonInsertableCommonFields,
    nonUpdatableCommonFields,
    nonInsertableFields,
    nonUpdatableFields,
    nonSelectableCommonFields,
    reservedFieldNames,
}