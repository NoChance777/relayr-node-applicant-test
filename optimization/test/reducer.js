let mocha = require("mocha");
let assert = require("assert");
const Reducer = require("../index").Reducer;

const base = {
    id: "any-key",
    property1: "string",
    property2: 123.456,
    property3: {
        property4: "inner-string",
        property5: ["a", "b", "c"]
    }
}

describe("reducer tests", function () {
    describe("should create reducer", function () {
        it("#new", function (done) {
            assert.doesNotThrow(function () {
                let reducer = new Reducer("deviceId");
                done();
            });
        });
        it("#new without id prop", function (done) {
            assert.throws(function () {
                let reducer = new Reducer();
            }, err => { done(); });
        });
    });
    describe("should reduce object", function () {
        it("#reduce - object without key ", function (done) {
            let obj = Object.assign({}, base);
            delete obj.id;
            let reducer = new Reducer("id");
            let [reduced, reducedObj] = reducer.reduce(obj);
            assert.ok(!reduced);
            assert.deepEqual(reducedObj, obj);
            done();
        });
        it("#reduce - first occurrence", function (done) {
            let reducer = new Reducer("id");
            let [reduced, diff] = reducer.reduce(base);
            assert.ok(!reduced);
            assert.deepEqual(diff, base);
            done();
        });
        it("#reduce - target object has less properties", function (done) {
            let reducer = new Reducer("id");
            reducer.store(base);
            let target = Object.assign({}, base);
            target.property3 = Object.assign({}, target.property3);
            delete target.property3.property4;
            let [reduced, diff] = reducer.reduce(target);
            assert.ok(!reduced);
            assert.deepEqual(diff, target);
            done();
        });

        it("#reduce - extract differences", function (done) {
            let reducer = new Reducer("id");
            reducer.store(base);
            let target = Object.assign({}, base);
            target.property2 = 0;
            target.property3 = {
                property4: "inner-string",
                property5: ["a", "b", "c", "d"]
            };
            let [isSaved, diff] = reducer.reduce(target);
            assert.ok(isSaved);
            assert.equal(diff.property2, target.property2);
            assert.equal(diff.property3.property5, target.property3.property5);
            assert.equal(Object.keys(diff).length, 3); //two changed properties + id
            done();
        });

        it("#reduce - new property", function (done) {
            let reducer = new Reducer("id");
            reducer.store(base);
            let target1 = Object.assign({}, base);
            target1.property6 = "new property";
            let [isSaved, diff] = reducer.reduce(target1);
            assert.ok(isSaved);
            assert.equal(diff.property6, target1.property6);
            assert.equal(Object.keys(diff).length, 2); //one new property + id
            done();
        });
        it("#reduce - new property in the child object ", function (done) {
            let reducer = new Reducer("id");
            reducer.store(base);
            let target = Object.assign({}, base);
            target.property3 = {
                ...target.property3,
                property6: "new property"
            };
            let [isSaved, diff] = reducer.reduce(target);
            assert.ok(isSaved);
            assert.equal(diff.property3.property6, target.property3.property6);
            assert.equal(Object.keys(diff).length, 2); //one new property + id
            done();
        });
    });
    describe("should restore object", function () {
        it("#restore", function () {
            let reducer = new Reducer("id");
            reducer.store(base);
            let diff = {
                property2: 0.123456,
                id: base.id,
                property3: {
                    property5: ["a", "b", "c", "d"]
                }
            };
            let [isRestored, target] = reducer.restore(diff)
            assert.ok(isRestored);
            assert.equal(diff.property2, target.property2);
            assert.deepEqual(diff.property3.property5, target.property3.property5);
            assert.deepEqual(Object.keys(base).sort(), Object.keys(target).sort());
        });
    });
});