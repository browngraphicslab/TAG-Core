function HashTable() {
    this._length = 0;
    this._items = {};
   
}

    HashTable.prototype.insert = function (key, value) {
        var previous = undefined;
        if (this._hasItem(key)) {
            previous = this._items[key];
        }
        else {
            this._length++;
        }
        this._items[key] = value;
        return previous;
    }

    HashTable.prototype.getLength = function (key) {
        return this._length;
    }

    HashTable.prototype.lookup = function (key) {
        return this._hasItem(key) ? this._items[key] : undefined;
    }

    HashTable.prototype._hasItem = function (key) {
        return this._items.hasOwnProperty(key);
    }

    HashTable.prototype.removeItem = function (key) {
        if (this._hasItem(key)) {
            previous = this._items[key];
            this._length--;
            delete this._items[key];
            return previous;
        }
        else {
            return undefined;
        }
    }

    HashTable.prototype.keys = function () {
        var keys = [];
        for (var k in this._items) {
            if (this._hasItem(k)) {
                keys.push(k);
            }
        }
        return keys;
    }

    HashTable.prototype.values = function () {
        var values = [];
        for (var k in this._items) {
            if (this._hasItem(k)) {
                values.push(this._items[k]);
            }
        }
        return values;
    }

    HashTable.prototype.each = function (fn) {
        for (var k in this._items) {
            if (this._hasItem(k)) {
                fn(k, this._items[k]);
            }
        }
    }

    HashTable.prototype.clear = function () {
        this._items = {}
        this._length = 0;
    }
