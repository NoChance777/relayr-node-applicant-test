let mocha = require("mocha");
let assert = require("assert");
const Reducer = require("../index").Reducer;

const source = {
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
            let obj = Object.assign({}, source);
            delete obj.id;
            let reducer = new Reducer("id");
            let [saved, reducedObj] = reducer.reduce(obj);
            assert.ok(!saved);
            assert.deepEqual(reducedObj, obj);
            done();
        });
        it("#reduce - first occurrence", function (done) {
            let reducer = new Reducer("id");
            let [saved, diff] = reducer.reduce(source);
            assert.ok(saved);
            assert.deepEqual(diff, source);
            done();
        });
        it("#reduce - target object has less properties", function (done) {
            let reducer = new Reducer("id");
            reducer.store(source);
            let target = Object.assign({}, source);
            delete target.property1;
            let [saved, diff] = reducer.reduce(target);
            assert.ok(saved);
            assert.deepEqual(diff, target);
            done();
        });

        it("#reduce - extract differences", function (done) {
            let reducer = new Reducer("id");
            reducer.store(source);
            let target = Object.assign({}, source);
            target.property2 = 0;
            target.property3 = {
                property5: ["a", "b", "c"]
            };
            let [saved, diff] = reducer.reduce(target);
            assert.ok(saved);
            assert.equal(diff.property2, target.property2);
            assert.deepEqual(diff.property3, target.property3);
            assert.equal(Object.keys(diff).length, 3); //two changed properties + id
            done();
        });
        it("#reduce - new property", function (done) {
            let reducer = new Reducer("id");
            reducer.store(source);
            let target1 = Object.assign({}, source);
            target1.property6 = "new property";
            let [saved, diff] = reducer.reduce(target1);
            assert.ok(saved);
            assert.equal(diff.property6, target1.property6);
            assert.equal(Object.keys(diff).length, 2); //one new property + id
            done();
        });
        it("#reduce - new property in the child object ", function (done) {
            let reducer = new Reducer("id");
            reducer.store(source);
            let target = Object.assign({}, source);
            target.property3 = {
                ...target.property3,
                property6 : "new property"
            };
            let [saved, diff] = reducer.reduce(target);
            assert.ok(saved);
            assert.equal(diff.property3, target.property3);
            assert.equal(Object.keys(diff).length, 2); //one new property + id
            done();
        });
    });
});