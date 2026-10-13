// Pure min-heap (binary heap over an array). insert bubbles up, extractMin
// moves the last key to the root and sifts down. Optional trace events for
// the step builders:
//   { type: 'append', index, value }
//   { type: 'compare', index, parent, value, parentValue }
//   { type: 'swap', a, b, aValue, bValue }
//   { type: 'extract', value }
//   { type: 'move', index, value }
//   { type: 'compare-children', index, value, left, right }
//   { type: 'done' }
//   { type: 'empty' }

const emit = (trace, event) => trace?.push(event);

export const parentOf = (i) => Math.floor((i - 1) / 2);
export const leftOf = (i) => 2 * i + 1;
export const rightOf = (i) => 2 * i + 2;

export class MinHeap {
  constructor(values = []) {
    this.items = [];
    values.forEach((v) => this.insert(v));
  }

  get size() {
    return this.items.length;
  }

  insert(value, trace) {
    emit(trace, { type: 'append', index: this.items.length, value });
    this.items.push(value);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = parentOf(i);
      emit(trace, {
        type: 'compare',
        index: i,
        parent,
        value: this.items[i],
        parentValue: this.items[parent],
      });
      if (this.items[parent] <= this.items[i]) break;
      emit(trace, {
        type: 'swap',
        a: i,
        b: parent,
        aValue: this.items[i],
        bValue: this.items[parent],
      });
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
    emit(trace, { type: 'done' });
    return this.items;
  }

  peek() {
    return this.items[0];
  }

  extractMin(trace) {
    if (this.items.length === 0) {
      emit(trace, { type: 'empty' });
      return undefined;
    }
    const min = this.items[0];
    const last = this.items.pop();
    emit(trace, { type: 'extract', value: min });
    if (this.items.length > 0) {
      this.items[0] = last;
      emit(trace, { type: 'move', index: 0, value: last });
      this._siftDown(0, trace);
    }
    emit(trace, { type: 'done' });
    return min;
  }

  _siftDown(start, trace) {
    let i = start;
    const n = this.items.length;
    for (;;) {
      const left = leftOf(i);
      const right = rightOf(i);
      const value = this.items[i];
      if (left >= n) break;
      const leftVal = this.items[left];
      const rightVal = right < n ? this.items[right] : null;
      emit(trace, {
        type: 'compare-children',
        index: i,
        value,
        left: leftVal,
        right: rightVal,
      });
      let smallest = i;
      if (leftVal < this.items[smallest]) smallest = left;
      if (rightVal !== null && rightVal < this.items[smallest]) smallest = right;
      if (smallest === i) break;
      emit(trace, {
        type: 'swap',
        a: i,
        b: smallest,
        aValue: this.items[i],
        bValue: this.items[smallest],
      });
      [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
      i = smallest;
    }
  }
}
