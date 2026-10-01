export class AVLNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this._height = 1;
  }

  get height() {
    return this._height || 1;
  }

  updateHeight() {
    const leftHeight = this.left ? this.left.height : 0;
    const rightHeight = this.right ? this.right.height : 0;
    this._height = Math.max(leftHeight, rightHeight) + 1;
  }
}

// Single funnel for trace recording so event shapes stay consistent.
const emit = (trace, event) => trace?.push(event);

export class AVLTree {
  constructor() {
    this.root = null;
    this.nodeCount = 0;
  }

  getHeight(node) {
    return node ? node.height : 0;
  }

  getBalanceFactor(node) {
    return this.getHeight(node?.left) - this.getHeight(node?.right);
  }

  rightRotate(y) {
    const x = y.left;
    const T3 = x.right;

    x.right = y;
    y.left = T3;

    y.updateHeight();
    x.updateHeight();

    return x;
  }

  leftRotate(x) {
    const y = x.right;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    x.updateHeight();
    y.updateHeight();

    return y;
  }

  // Recompute height, narrate it, and return the balance factor.
  recheck(root, trace) {
    root.updateHeight();
    const balance = this.getBalanceFactor(root);
    emit(trace, { type: 'recheck', node: root.value, height: root.height, balance });
    return balance;
  }

  // Insert-side balancing decides the rotation case from the inserted value.
  rebalanceAfterInsert(root, value, trace) {
    const balance = this.recheck(root, trace);

    if (balance > 1 && value < root.left.value) {
      emit(trace, { type: 'rotate', case: 'LL', node: root.value, child: root.left.value });
      return this.rightRotate(root);
    }

    if (balance < -1 && value > root.right.value) {
      emit(trace, { type: 'rotate', case: 'RR', node: root.value, child: root.right.value });
      return this.leftRotate(root);
    }

    if (balance > 1 && value > root.left.value) {
      emit(trace, { type: 'rotate', case: 'LR', node: root.value, child: root.left.value });
      root.left = this.leftRotate(root.left);
      return this.rightRotate(root);
    }

    if (balance < -1 && value < root.right.value) {
      emit(trace, { type: 'rotate', case: 'RL', node: root.value, child: root.right.value });
      root.right = this.rightRotate(root.right);
      return this.leftRotate(root);
    }

    return root;
  }

  // Delete-side balancing decides the case from the child's balance factor.
  rebalanceAfterDelete(root, trace) {
    const balance = this.recheck(root, trace);

    if (balance > 1 && this.getBalanceFactor(root.left) >= 0) {
      emit(trace, { type: 'rotate', case: 'LL', node: root.value, child: root.left.value });
      return this.rightRotate(root);
    }

    if (balance > 1 && this.getBalanceFactor(root.left) < 0) {
      emit(trace, { type: 'rotate', case: 'LR', node: root.value, child: root.left.value });
      root.left = this.leftRotate(root.left);
      return this.rightRotate(root);
    }

    if (balance < -1 && this.getBalanceFactor(root.right) <= 0) {
      emit(trace, { type: 'rotate', case: 'RR', node: root.value, child: root.right.value });
      return this.leftRotate(root);
    }

    if (balance < -1 && this.getBalanceFactor(root.right) > 0) {
      emit(trace, { type: 'rotate', case: 'RL', node: root.value, child: root.right.value });
      root.right = this.rightRotate(root.right);
      return this.leftRotate(root);
    }

    return root;
  }

  insert(root, value, trace = null) {
    if (!root) {
      this.nodeCount++;
      emit(trace, { type: 'created', value });
      return new AVLNode(value);
    }

    emit(trace, { type: 'compare', node: root.value, value });

    if (value < root.value) {
      emit(trace, { type: 'move', node: root.value, dir: 'left' });
      root.left = this.insert(root.left, value, trace);
    } else if (value > root.value) {
      emit(trace, { type: 'move', node: root.value, dir: 'right' });
      root.right = this.insert(root.right, value, trace);
    } else {
      emit(trace, { type: 'duplicate', node: root.value });
      return root;
    }

    return this.rebalanceAfterInsert(root, value, trace);
  }

  minValueNode(node, trace = null) {
    let current = node;
    while (current.left) {
      emit(trace, { type: 'successor-descend', from: current.value, to: current.left.value });
      current = current.left;
    }
    emit(trace, { type: 'successor-found', value: current.value });
    return current;
  }

  deleteNode(root, value, trace = null) {
    if (!root) {
      emit(trace, { type: 'missing', value });
      return root;
    }

    emit(trace, { type: 'compare', node: root.value, value });

    if (value < root.value) {
      emit(trace, { type: 'move', node: root.value, dir: 'left' });
      root.left = this.deleteNode(root.left, value, trace);
    } else if (value > root.value) {
      emit(trace, { type: 'move', node: root.value, dir: 'right' });
      root.right = this.deleteNode(root.right, value, trace);
    } else if (!root.left) {
      // Leaf or only a right child: splice it out. The removed frame does
      // not recheck itself — every ancestor balances on the way back up.
      emit(trace, {
        type: 'replace',
        node: root.value,
        replacement: root.right ? root.right.value : null,
        side: root.right ? 'right' : 'none',
      });
      this.nodeCount--;
      return root.right;
    } else if (!root.right) {
      emit(trace, {
        type: 'replace',
        node: root.value,
        replacement: root.left.value,
        side: 'left',
      });
      this.nodeCount--;
      return root.left;
    } else {
      // Two children: copy the inorder successor, delete it from the right
      // subtree (which decrements nodeCount once), then rebalance here.
      emit(trace, { type: 'two-children', node: root.value });
      const temp = this.minValueNode(root.right, trace);
      emit(trace, { type: 'copy-successor', from: root.value, to: temp.value });
      root.value = temp.value;
      root.right = this.deleteNode(root.right, temp.value, trace);
      return this.rebalanceAfterDelete(root, trace);
    }

    return this.rebalanceAfterDelete(root, trace);
  }

  search(root, value) {
    if (!root) return false;
    if (root.value === value) return true;
    if (value < root.value)
      return this.search(root.left, value);
    return this.search(root.right, value);
  }

  // Shared depth-first core; the named traversals are thin wrappers.
  traverse(root, order, result = []) {
    if (!root) return result;
    if (order === 'preOrder') result.push(root.value);
    this.traverse(root.left, order, result);
    if (order === 'inOrder') result.push(root.value);
    this.traverse(root.right, order, result);
    if (order === 'postOrder') result.push(root.value);
    return result;
  }

  preOrder(root, result = []) {
    return this.traverse(root, 'preOrder', result);
  }

  inOrder(root, result = []) {
    return this.traverse(root, 'inOrder', result);
  }

  postOrder(root, result = []) {
    return this.traverse(root, 'postOrder', result);
  }

  levelOrder(root, result = []) {
    if (!root) return result;
    const queue = [root];
    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return result;
  }

  isBalanced(node = this.root) {
    if (!node) return true;

    const balance = Math.abs(this.getBalanceFactor(node));
    if (balance > 1) return false;

    return this.isBalanced(node.left) && this.isBalanced(node.right);
  }
}
