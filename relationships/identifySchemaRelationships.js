const { generateTypeNameFromView, pluraliseType } = require('../nameGenerators')

/*
Relationships object looks like this:

{
    //like sales:createdByUser and sales:updatedByUser
    n1: {
        //keys are the n view/type names
        Sale: { (this is typeNameN)
            //keys are the fields in the n view/type, values are the view/type to which it relates (assumptino it is the primary key in the other view/type)
            createdByUserID: { (this is fieldNameN)
                type: User, (this is typeName1)
                name: CreatedByUser, //added to the GraphQLObjectType with this name
            }
            updatedByUserID: {
               type: User,
               name: UpdatedByUser,
            }  
            storeID: {
                type: Store,
                name: Store,
            }
        },
        Store: {
            storeTypeID: {
                type: StoreType,
                name: StoreType,
            },
            storeRegionID: {
                type: StoreRegion,
                name: StoreRegion,
            },
        },
        User: {
            defaultStoreID: {
               type: Store,
               name: DefaultStore
            }
        }
    }
    //like User:createdByUser in sales and User:updatedByUser in sales
    nn: {
        User: { (this is typeName1)
            Sale: { (this is typeNameN)
                createdByUserID: SalesCreatedByUser, //intention to add to graphql User type as SalesCreatedByUser
                updatedByUserID: SalesUpdatedByUser, //intention to add to graphql User type as SalesUpdatedByUser
                deletedByUserID: SalesDeletedByUser,
                attributableToUserID: SalesAttributableToUser,
                ^^^^^^^^^
                (this is fieldNameN)
            },
            Store: {
                createdByUserID: StoresCreatedByUser,
                updatedByUserID: StoresUpdatedByUser,
                deletedByUserID: StoresDeletedByUser,
            },
        },
        Store: {
            User: {
                defaultStoreID: UsersDefaultStore, //intention to add to graphql Store type as UsersDefaultStore
            }
        },
        Site: {
            Facility: {
                siteID: Facilities, //intention to add to graphql Site type as Facilities (ie when the field name is the primary key of the view, just use the name of the related view/type)
            }
        }
    }
}

We should think about 1:1 relationships too in the future

*/

function identifySchemaRelationships(dbSchemaViews) {
    //there are 2 relationships, n:1 and n:n
    //n:1 is like sales:store
    //each n:1 has a mirror n:n relationship, like stores:sales
    //so let's go through each view, looking at all the fields (except the primary key) and see if we can find a view which has that primary key - this will be our n:1 relationship
    //generate object names instead of view names
    typesAndFields = [...dbSchemaViews].map(([viewName, viewFields]) => [generateTypeNameFromView(viewName), viewFields]);
    //these are the maps we'll populate and return
    let relationships = {
        n1: {},
        nn: {},
    }
    //loop through all the views
    typesAndFields.forEach(([typeName, viewFields]) => {
        //get the primary key of the current view - we'll need it to help name the NN relationship
        //loop through all the fields in the current view
        [...viewFields].forEach(([fieldName, fieldProperties]) => {
            //looking for n1 relationships where the field name matches the primary key of another view exactly
            relationships = checkExactRelationship(relationships, typeName, fieldName, fieldProperties.ordinalPosition, typesAndFields)
            //now looking for those fields which end with the name of a primary key of another table.  Like 'createdByUserID' (matches UserID)
            relationships = checkEndingRelationship(relationships, typeName, fieldName, fieldProperties.ordinalPosition, typesAndFields)
        })
    })
    //output a summary of the relationships found
    if(process.env.LOGGING === 'verbose') console.log(`Found relationships: `, JSON.stringify(relationships, null, 2))
    return relationships
}

function checkEndingRelationship(relationships, typeName, fieldName, ordinalPosition, views) {
    //only going to search if it is not the primary key (ordinal pos 1), and it ends in 'ID' (becasue this is what an n1 relationship would have), and we dont already have a relationship for this field yet)
    if(ordinalPosition !== 1 && fieldName.endsWith('ID') && relationships.n1[typeName]?.[fieldName] === undefined) {
        //see if there is a view with a primary key matching the ending of this field (longest match wins)
        const [typeName1, viewFields1] = findViewWithPrimaryKeyMatchingEnding(views, fieldName);
        //did we find one?
        if(typeName1) {
            if(process.env.LOGGING === 'verbose') console.log(`${typeName} has field ${fieldName}, and type with a primary key matching the ending of this field was found: ${typeName1}. Adding relationships`)  
            //get the ID field name of the matching view
            const idFieldName1 = require('../getIDField')(viewFields1);
            //add the relationship to our maps
            relationships = addRelationshipPair(relationships, typeName, fieldName, typeName1, idFieldName1);
        } 

    }
    return relationships
}

//check if there is an exact match in the schema, for example if there is a field in in the Sales table called 'StoreID', and a view/type with primary key 'StoreID'
function checkExactRelationship(relationships, typeName, fieldName, ordinalPosition, views) {
    //only going to search if it is not the primary key (ordinal pos 1), and it ends in 'ID' (becasue this is what an n1 relationship would have)
    if(ordinalPosition !== 1 && fieldName.endsWith('ID')) {
        //see if there is a matching view with this field name as its primary key
        const [typeName1, viewFields1] = findViewWithPrimaryKey(views, fieldName);
        //did we find one?
        if(typeName1) {
            if(process.env.LOGGING === 'verbose') console.log(`${typeName} contains candidate exact relationship field ${fieldName}, and type with this primary key was found: ${typeName1}. Adding relationships`)  
            //get the ID field name of the matching view
            const idFieldName1 = require('../getIDField')(viewFields1);
            //add the relationship to our maps
            relationships = addRelationshipPair(relationships, typeName, fieldName, typeName1, idFieldName1);
        } 
    }
    return relationships
}

//update and return the relationships object
function addRelationshipPair(relationships, typeNameN, fieldNameN, typeName1, idFieldName1) {
    //add the n1 relationship
    relationships.n1 = addN1Relationship(relationships.n1, typeNameN, fieldNameN, typeName1)
    //add the nn relationship
    relationships.nn = addNNRelationship(relationships.nn, typeNameN, fieldNameN, typeName1, idFieldName1)
    return relationships
}

/* 
Adding the relationship to the object at
{
    n1: {
        here
    }
}
*/
function addN1Relationship(n1Relationships, typeNameN, fieldNameN, typeName1) {
    //check if we need to add the key - if this is the first relationship
    if(!(typeNameN in n1Relationships)) {
        //no relationships exist yet for this view/type.  Add the key
        n1Relationships[typeNameN] = {}
    }
    //now we have the key for this type/view, add the field (key) and the view/type to which it relates (value)
    n1Relationships[typeNameN][fieldNameN] = {
        name: decideN1RelationshipName(fieldNameN),
        type: typeName1,
    };
    return n1Relationships
}

function decideN1RelationshipName(fieldNameN) {
    //this is just the name of the field, but capitalised and with ID taken off the end
    //remove 'id' at the end
    let description = fieldNameN.replace(/ID$/, '');
    //capitalise first letter
    return description.charAt(0).toUpperCase() + description.slice(1);
}

function addNNRelationship(nnRelationships, typeNameN, fieldNameN, typeName1, idFieldName1) {
    //bear in mind here that typename1/fieldname1 is actually the N field in this case (we are adding the opposite site of the original n1 relationship)
    //check if we need to add the key - if this is the first relationship
    if(!(typeName1 in nnRelationships)) {
        //no relationships exist yet for this view/type.  Add the key
        nnRelationships[typeName1] = {}
    }
    //now we have the key for this type/view, next level is the key for the view/type to which it relates.  Check if we need to add it
    if(!(typeNameN in nnRelationships[typeName1])) {
        //this is the first time we have joined these view/types
        nnRelationships[typeName1][typeNameN] = {}
    }
    //push our field name, and the name it will have in the relationship, into the object
    nnRelationships[typeName1][typeNameN][fieldNameN] = decideNNRelationshipName(idFieldName1, fieldNameN, typeNameN)
    return nnRelationships
}

function decideNNRelationshipName(idFieldName, fieldName, typeName) {
    //if the id field of the parent type is the same as the field on the child type, we just pluralise the type name
    //eg Sites-->Facilities would be Facilities
    //console.log(`idFieldName is ${idFieldName} and fieldName is ${fieldName} so we just pluralise`)
    if(idFieldName === fieldName) {
        return pluraliseType(typeName);
    }
    //alternatively, if the name does not match, we can build a nice name, like createdByUserID = SalesCreatedByUser
    //remove 'ID' from the end of the fieldName
    let description = fieldName.replace(/ID$/, '');
    //capitalise it
    description = description.charAt(0).toUpperCase() + description.slice(1);
    //return it with the child type name
    return `${pluraliseType(typeName)}${description}`;
}

function findViewWithPrimaryKey(views, matchFieldName) {
    let found = []
    //loop through all the views
    views.forEach(([typeName, viewFields]) => {
        //loop through all the fields in the current view
        [...viewFields].forEach(([thisFieldName, fieldProperties]) => {
            //is this the primary key? Ordinal position 1
            if(fieldProperties.ordinalPosition === 1 && thisFieldName === matchFieldName) {
                //console.log(`MATCH! ${typeName} has primary key ${primaryKeyName}`)
                found = [typeName, viewFields]
            }
        })
    })
    return found
}

function findViewWithPrimaryKeyMatchingEnding(views, matchFieldName) {
    let found = []
    let bestMatchLength = 0
    //make it lower case
    matchFieldNameLower = matchFieldName.toLowerCase()
    //loop through all the views
    views.forEach(([typeName, viewFields]) => {
        //loop through all the fields in the current view
        [...viewFields].forEach(([thisFieldName, fieldProperties]) => {
            //is this the primary key? Ordinal position 1
            //if(fieldProperties.ordinalPosition === 1) console.log(`Does ${matchFieldName} end with ${thisFieldName}?`)
            if(fieldProperties.ordinalPosition === 1 && thisFieldName !== matchFieldName && matchFieldNameLower.endsWith(thisFieldName.toLowerCase())) {
                let matchLength = thisFieldName.length;
                //console.log(`YEAH by ${matchLength}`)
                //we have found a match.  BUT, there could be multiple matches.  We only use the longest match
                //how long is the match at the end of the string?
                if(matchLength > bestMatchLength) {
                    //this is the new best match
                    //console.log(`${typeName} has primary key ${thisFieldName} which matches the last ${matchLength} chars`)
                    bestMatchLength = matchLength
                    found = [typeName, viewFields]
                }
            }
        })
    })
    return found
}

module.exports = identifySchemaRelationships