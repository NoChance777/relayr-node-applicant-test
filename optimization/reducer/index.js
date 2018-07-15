let Storage = require('./storage');

function areArraysEqual(array1, array2) {
    if (!array2) return false;
    if (array1.length != array2.length) return false;

    for (var i = 0, l = array1.length; i < l; i++) {
        if (array1[i] instanceof Array && array2[i] instanceof Array) {
            if (!areArraysEqual(array1[i], array2[i])) return false;
        }
        else if (array1[i] != array2[i]) {
            // warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
function compare(source, target) {
    let result = {};
    for (let propName in target) {
        if (target.hasOwnProperty(propName) != source.hasOwnProperty(propName)) {
            result[propName] = target[propName];
            continue;
        }
        // check instance type
        if (typeof target[propName] != typeof source[propName]) {
            // different types => not equal
            result[propName] = target[propName];
            continue;
        }
        if (target[propName] instanceof Array) {
            // recurse into the nested arrays
            if (!areArraysEqual(target[propName], source[propName]))
                result[propName] = target[propName];
            continue;
        }
        if (target[propName] instanceof Object) {
            // recurse into another objects
            if (hasDeletedProperties(source[propName], target[propName])
                || Object.keys(
                    compare(source[propName], target[propName])
                ).length > 0) {
                result[propName] = target[propName]; // save whole nested object, but it also can be reduced
            }
            continue;
        }
        // normal value comparison for strings and numbers
        if (target[propName] != source[propName]) {
            result[propName] = target[propName];
        }
    }
    return result;
}

function hasDeletedProperties(source, target) {
    let found = Object.keys(source).find(propName => !target.hasOwnProperty(propName));
    return !!found;
}

module.exports = class Reducer {
    constructor(idprop, storage = new Storage()) {
        this.storage = storage;
        if (!idprop) throw new Error("Id property required");
        this.idprop = idprop;
    }
    store(target) {
        const key = target[this.idprop];
        this.storage.set(key, target); //save in storage
        return [true, target];
    }

    /**
     * Save object and returns only changed properties 
     * @param {object} target - any object with specified key
     * @returns {Array} array with of two values, first one shows the target object was stored,
     * second - differences with previously stored object with same key
     */
    reduce(target) {
        if (typeof target != 'object' && target !== null) throw new Error('non null object excpected');
        if (!target.hasOwnProperty(this.idprop)) {
            return [false, target]; //can't find key, return object as is
        }
        const key = target[this.idprop];
        if (!this.storage.has(key))
            return this.store(target);

        let source = this.storage.get(key);
        if (hasDeletedProperties(source, target)) {
            return this.store(target);
        }
        let diff = compare(source, target);
        diff[this.idprop] = key; //restore id prop
        this.store(target);
        return [true, diff];
    }

    restore() {
        throw new Error('not implemented');
    }
}
