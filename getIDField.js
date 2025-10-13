function getIDField(fromEntityDBFields) {
    let idField
    //it is the field with the ordinal position 1
    [...fromEntityDBFields].forEach(([fieldName, fieldProperties]) => {
        if(fieldProperties.ordinalPosition === 1) {
            idField = fieldName;
        }
    })
    return idField;
}

module.exports = getIDField;