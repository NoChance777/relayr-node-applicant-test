const _ = require('lodash');
let Storage = require('./storage');

/* function areArraysEqual(array1, array2) {
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
} */

function difference(base, object) {
    function changes(base, object) {
        return _.transform(object, function (result, value, key) {
            if (!_.isEqual(value, base[key])) {
                result[key] = _.isPlainObject(value) && _.isPlainObject(base[key]) ?
                    changes(base[key], value) :
                    value;
            }
        });
    }
    return changes(base, object);
}
function hasDeletedProperties(base, object) {
    function find(base, object) {
        for (const key in base) {
            if (_.isUndefined(object[key])
                || (_.isPlainObject(base[key]) &&
                    _.isPlainObject(object[key]) &&
                    find(base[key], object[key]))) return true;

        }
        return false;
    }
    let found = Object.keys(base).find(propName => !object.hasOwnProperty(propName));
    return find(base, object);
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
        return target;
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
            return [false, this.store(target)];

        let source = this.storage.get(key);
        if (hasDeletedProperties(source, target)) return [false, this.store(target)];

        let diff = difference(source, target);
        diff[this.idprop] = key; //restore id prop
        this.store(target);
        return [true, diff];
    }

    restore(diff) {
        if (typeof diff != 'object' && diff !== null) throw new Error('non null object excpected');
        const key = diff[this.idprop];
        if (!diff.hasOwnProperty(this.idprop) || !this.storage.has(key)) {
            return [false, null]; //can't find key, return null
        }
        let source = this.storage.get(key);
        return [true, Object.assign(source, diff)];
    }
}
