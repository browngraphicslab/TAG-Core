function DoublyLinkedList() {
    "use strict";
    // pointer to first item
    this._head = null;
    // pointer to the last item
    this._tail = null;
    // length of list
    this._length = 0;
}

// Wraps data in a node object.
DoublyLinkedList.prototype._createNewNode = function (data) {
    var node = {
        data: data,
        next: null,
        prev: null
    };
    return node;
};

/*
    * Appends a node to the end of the list.
*/
DoublyLinkedList.prototype.append = function (data) {
    var node = this._createNewNode(data);

    if (this._length === 0) {

        // first node, so all pointers to this
        this._head = node;
        this._tail = node;
    } else {

        // put on the tail
        this._tail.next = node;
        node.prev = this._tail;
        this._tail = node;
    }

    // update count
    this._length++;

    return node;
};

/*
    * Prepends a node to the end of the list.
*/
DoublyLinkedList.prototype.prepend = function (data) {
    var node = this._createNewNode(data);

    if (this.first === null) {

        // we are empty, so this is the first node
        // use the same logic as append
        this.append(node);
        return;
    } else {

        // place before head
        this._head.prev = node;
        node.next = this._head;
        this._head = node;
    }

    // update count
    this._length++;

    return node;
};

/*
    * Returns the node at the specified index. The index starts at 0.
*/
DoublyLinkedList.prototype.item = function (index) {
    if (index >= 0 && index < this._length) {
        var node = this._head;
        while (index--) {
            node = node.next;
        }
        return node;
    }
};

DoublyLinkedList.prototype.search = function (key) {
    var node = this._head;
    while (node != null) {
        if (node.data === key) {
            return node;
        }
        node = node.next;
    }
    return null;
};

DoublyLinkedList.prototype.findNext = function (key) {
    var node = this._head;
    while (node != null) {
        if (node.data >= key) {
            return node;
        }
        node = node.next;
    }
    return null;
};
DoublyLinkedList.prototype.findPrev = function (key) {
    var node = this._head;
    while (node != null) {
        if (node.data >= key) {
            if (node.prev === null) {
                return null;
            } else {
                return node.prev;
            }
        }
        node = node.next;
    }
    return null;
};
/*
    * Returns the node at the head of the list.
*/
DoublyLinkedList.prototype.head = function () {
    return this._head;
};

/*
    * Returns the node at the tail of the list.
*/
DoublyLinkedList.prototype.tail = function () {
    return this._tail;
};

/*
    * Returns the size of the list.
*/
DoublyLinkedList.prototype.size = function () {
    return this._length;
};

/*******testing purposes only********/
DoublyLinkedList.prototype.printList = function () {
    var curNode = this._head;
    if (curNode === null) {
        doNothing("Empty List\n");
    } else {
        doNothing("Printing List...");
        for (var i = 0; i < this._length; i++) {
            doNothing(curNode.data + " ");
            curNode = curNode.next;
        }
        doNothing("\n");
    }
};


/*
    * Removes the item at the index.
*/
DoublyLinkedList.prototype.remove = function (index) {
    if (index < 0 || index >= this._length || this._length === 0) {
        doNothing("index is out of bounds");
    } else {

        var curNode = this.item(index);
        var nxtNode = curNode.next;
        var prevNode = curNode.prev;

        if (nxtNode != null && prevNode != null) {
            prevNode.next = nxtNode;
            nxtNode.prev = prevNode;
        } else if (nxtNode === null && prevNode != null) {
            prevNode.next = null;
            this._tail = prevNode;
        } else if (prevNode === null && nxtNode != null) {
            nxtNode.prev = null;
            this._head = nxtNode;
        } else {
            this._head = null;
            this._tail = null;
        }

        this._length--;
        return curNode;
    }
};