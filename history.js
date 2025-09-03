//will determine if a given set of viewFields should be considered history-tracked or not, based on the fields that are present if history tracked, IE
//currentHistoryID
function isHistoryTracked(viewFields) {
    //i get this could be a one-liner.  However in future more checks and logic will need to be added!
    if(viewFields.has('currentHistoryID')) {
        return true
    } else {
        return false
    }
}

module.exports = {
    isHistoryTracked
}