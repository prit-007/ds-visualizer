// Pure Union-Find (disjoint-set) with union by rank and path compression.
// Optional trace events for the step builders:
//   { type: 'make', value, rank }
//   { type: 'link', node, parent }
//   { type: 'compress', node, rep }
//   { type: 'found', value, rep }
//   { type: 'union-start', a, b }
//   { type: 'attach', parent, child, rank }
//   { type: 'same', rep }
//   { type: 'missing', a, b }

const emit = (trace, event) => trace?.push(event);

export class UnionFind {
  constructor() {
    this.parent = {};
    this.rank = {};
    this.size = 0;
  }

  make(value, trace) {
    if (value in this.parent) return this;
    emit(trace, { type: 'make', value, rank: 0 });
    this.parent[value] = value;
    this.rank[value] = 0;
    this.size += 1;
    return this;
  }

  find(value, trace) {
    if (!(value in this.parent)) return null;
    const path = [];
    let x = value;
    while (this.parent[x] !== x) {
      emit(trace, { type: 'link', node: x, parent: this.parent[x] });
      path.push(x);
      x = this.parent[x];
    }
    const rep = x;
    for (const n of path) {
      if (this.parent[n] !== rep) {
        emit(trace, { type: 'compress', node: n, rep });
        this.parent[n] = rep;
      }
    }
    emit(trace, { type: 'found', value, rep });
    return rep;
  }

  union(a, b, trace) {
    if (!(a in this.parent) || !(b in this.parent)) {
      emit(trace, { type: 'missing', a, b });
      return null;
    }
    emit(trace, { type: 'union-start', a, b });
    const ra = this.find(a, trace);
    const rb = this.find(b, trace);
    if (ra === rb) {
      emit(trace, { type: 'same', rep: ra });
      return ra;
    }
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb;
      emit(trace, { type: 'attach', parent: rb, child: ra, rank: this.rank[rb] });
      return rb;
    }
    if (this.rank[ra] === this.rank[rb]) this.rank[ra] += 1;
    this.parent[rb] = ra;
    emit(trace, { type: 'attach', parent: ra, child: rb, rank: this.rank[ra] });
    return ra;
  }

  height(value) {
    const seen = new Set();
    let c = value;
    let h = 0;
    while (c in this.parent && !seen.has(c)) {
      seen.add(c);
      c = this.parent[c];
      h += 1;
    }
    return h;
  }
}
