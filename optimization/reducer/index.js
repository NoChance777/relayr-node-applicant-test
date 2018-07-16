const _ = require('lodash');
let Storage = require('./storage');

function difference(base, object, ...exclude) {
    function changes(base, object) {
        return _.transform(object, function (result, value, key) {
            if (exclude.includes(key)) {
                result[key] = value; //save excluded properties
                return;
            }
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
     * @param {object} obj - any object with specified key
     * @returns {Array} array with of two values, first one shows the target object was stored,
     * second - differences with previously stored object with same key
     */
    reduce(obj) {
        if (typeof obj != 'object' && obj !== null) throw new Error('non null object excpected');
        if (!obj.hasOwnProperty(this.idprop)) {
            return [false, obj]; //can't find key, return object as is and don't store it
        }
        const key = obj[this.idprop];
        if (!this.storage.has(key))
            return [true, this.store(obj)];

        let source = this.storage.get(key);
        if (hasDeletedProperties(source, obj)) return [false, this.store(obj)];
        let diff = difference(source, obj, this.idprop);
        this.store(obj);
        return [true, diff];
    }

    /**
     * Restore object
     * @param {obj} obj - object with differences with previously stored value
     * @returns {Array} array with of two values, first one shows the object was successfully restored,
     * second - the restored object
     */
    restore(obj) {
        if (typeof obj != 'object' && obj !== null) throw new Error('non null object excpected');
        const key = obj[this.idprop];
        if (!obj.hasOwnProperty(this.idprop)) {
            return [false, obj]; // can't find key in object, return object as is
        }
        if (!this.storage.has(key)) { // received object not found in the storage, seems it's first occurance
            return [false, this.store(obj)];
        }
        let stored = this.storage.get(key);
        let restored = _.merge(stored, obj)
        return [true, this.store(restored)];
    }
}
