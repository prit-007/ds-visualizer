// Pure order-3 B-tree (max 2 keys per node, min 1 key except root).
// insert/search record optional trace events for the step builders:
//   { type: 'compare', node: keys, value }
//   { type: 'insert', node: keys, value, position, leaf }
//   { type: 'shift', node: keys, from, key }
//   { type: 'descend', node: keys, child, value }
//   { type: 'split', node: keys, median, right: keys, leaf }
//   { type: 'promote', median, parent: keys }
//   { type: 'found', node: keys }
//   { type: 'missing', value }
//   { type: 'duplicate', value }

const emit = (trace, event) => trace?.push(event);

export class BTreeNode {
  constructor() {
    this.keys = [];
    this.children = [];
    this.leaf = true;
  }
}

export class BTree {
  constructor(order = 3) {
    this.order = order; // max keys = order - 1
    this.root = new BTreeNode();
    this.size = 0;
  }

  insert(value, trace) {
    if (this._find(this.root, value, trace, true)) {
      emit(trace, { type: 'duplicate', value });
      return this.root;
    }
    this.size += 1;
    if (this.root.keys.length === this.order - 1) {
      const newRoot = new BTreeNode();
      newRoot.leaf = false;
      newRoot.children = [this.root];
      this.root = newRoot;
      emit(trace, { type: 'split', node: [...newRoot.children[0].keys], median: null, right: [], leaf: false, rootSplit: true });
      this._splitChild(newRoot, 0, trace);
    }
    this._insertNonFull(this.root, value, trace);
    return this.root;
  }

  _insertNonFull(node, value, trace) {
    emit(trace, { type: 'compare', node: [...node.keys], value });
    if (node.leaf) {
      let i = node.keys.length - 1;
      while (i >= 0 && node.keys[i] > value) {
        emit(trace, { type: 'shift', node: [...node.keys], from: i, key: node.keys[i] });
        i -= 1;
      }
      node.keys.splice(i + 1, 0, value);
      emit(trace, { type: 'insert', node: [...node.keys], value, position: i + 1, leaf: true });
      return;
    }
    let i = node.keys.length - 1;
    while (i >= 0 && value < node.keys[i]) i -= 1;
    i += 1;
    emit(trace, { type: 'descend', node: [...node.keys], child: i, value });
    if (node.children[i].keys.length === this.order - 1) {
      this._splitChild(node, i, trace);
      if (value > node.keys[i]) i += 1;
    }
    this._insertNonFull(node.children[i], value, trace);
  }

  _splitChild(parent, i, trace) {
    const full = parent.children[i];
    const median = full.keys[1];
    const right = new BTreeNode();
    right.keys = full.keys.slice(2);
    right.leaf = full.leaf;
    right.children = full.leaf ? [] : full.children.slice(2);
    full.keys = full.keys.slice(0, 1);
    full.children = full.leaf ? [] : full.children.slice(0, 2);
    parent.keys.splice(i, 0, median);
    parent.children.splice(i + 1, 0, right);
    emit(trace, { type: 'split', node: [...full.keys], median, right: [...right.keys], leaf: full.leaf });
    emit(trace, { type: 'promote', median, parent: [...parent.keys] });
  }

  search(value, trace) {
    return this._find(this.root, value, trace, false);
  }

  _find(node, value, trace, forInsert) {
    emit(trace, { type: 'compare', node: [...node.keys], value });
    let i = 0;
    while (i < node.keys.length && value > node.keys[i]) i += 1;
    if (i < node.keys.length && value === node.keys[i]) {
      emit(trace, { type: 'found', node: [...node.keys] });
      return node;
    }
    if (node.leaf) {
      if (!forInsert) emit(trace, { type: 'missing', value });
      return null;
    }
    emit(trace, { type: 'descend', node: [...node.keys], child: i, value });
    return this._find(node.children[i], value, trace, forInsert);
  }

  // In-order traversal over all keys (left child, key, right child, ...).
  inOrder(node = this.root, out = []) {
    if (!node) return out;
    if (node.leaf) {
      node.keys.forEach((k) => out.push(k));
      return out;
    }
    node.children.forEach((child, idx) => {
      this.inOrder(child, out);
      if (idx < node.keys.length) out.push(node.keys[idx]);
    });
    return out;
  }

  nodeCount(node = this.root) {
    if (!node) return 0;
    return 1 + node.children.reduce((sum, c) => sum + this.nodeCount(c), 0);
  }

  height(node = this.root) {
    if (!node) return 0;
    if (node.leaf) return 1;
    return 1 + Math.max(...node.children.map((c) => this.height(c)));
  }
}
