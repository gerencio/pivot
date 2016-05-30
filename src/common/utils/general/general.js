var immutable_1 = require('immutable');
var immutable_class_1 = require('immutable-class');
var objectHasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, key) {
    if (!obj)
        return false;
    return objectHasOwnProperty.call(obj, key);
}
exports.hasOwnProperty = hasOwnProperty;
function moveInList(list, itemIndex, insertPoint) {
    var n = list.size;
    if (itemIndex < 0 || itemIndex >= n)
        throw new Error('itemIndex out of range');
    if (insertPoint < 0 || insertPoint > n)
        throw new Error('insertPoint out of range');
    var newArray = [];
    list.forEach(function (value, i) {
        if (i === insertPoint)
            newArray.push(list.get(itemIndex));
        if (i !== itemIndex)
            newArray.push(value);
    });
    if (n === insertPoint)
        newArray.push(list.get(itemIndex));
    return immutable_1.List(newArray);
}
exports.moveInList = moveInList;
function makeTitle(name) {
    return name
        .replace(/^[ _\-]+|[ _\-]+$/g, '')
        .replace(/(^|[_\-]+)\w/g, function (s) {
        return s.replace(/[_\-]+/, ' ').toUpperCase();
    })
        .replace(/[a-z0-9][A-Z]/g, function (s) {
        return s[0] + ' ' + s[1];
    });
}
exports.makeTitle = makeTitle;
function immutableListsEqual(listA, listB) {
    if (listA === listB)
        return true;
    if (!listA !== !listB)
        return false;
    return immutable_class_1.immutableArraysEqual(listA.toArray(), listB.toArray());
}
exports.immutableListsEqual = immutableListsEqual;
function collect(wait, fn) {
    var timeout;
    var later = function () {
        timeout = null;
        fn();
    };
    return function () {
        if (!timeout) {
            timeout = setTimeout(later, wait);
        }
    };
}
exports.collect = collect;
var URL_UNSAFE_CHARS = /[^\w.~\-]+/g;
function makeUrlSafeName(name) {
    return name.replace(URL_UNSAFE_CHARS, '_');
}
exports.makeUrlSafeName = makeUrlSafeName;
function verifyUrlSafeName(name) {
    if (typeof name !== 'string')
        throw new TypeError('name must be a string');
    if (!name.length)
        throw new Error('can not have empty name');
    var urlSafeName = makeUrlSafeName(name);
    if (name !== urlSafeName) {
        throw new Error("'" + name + "' is not a URL safe name. Try '" + urlSafeName + "' instead?");
    }
}
exports.verifyUrlSafeName = verifyUrlSafeName;
function arraySum(inputArray) {
    return inputArray.reduce(function (pV, cV) {
        return pV + cV;
    }, 0);
}
exports.arraySum = arraySum;
//# sourceMappingURL=general.js.map