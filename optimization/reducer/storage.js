//dummy storage implementation, here might be Redis of another key-value database
module.exports = class Storage {
    constructor() {
        this.state = new Map();
    }
    get(key) {
        return this.state.get(key);
    }
    set(key, value) {
        this.state.set(key, value);
    }
    has(key) {
        return this.state.has(key);
    }

}
