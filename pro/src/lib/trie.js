// Pure trie (prefix tree) core with optional trace recording, plus the
// layout used by the visualizer canvas.

export class TrieNode {
  constructor(char = "") {
    this.char = char;
    this.children = {};
    this.isEnd = false;
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, trace = []) {
    let node = this.root;
    for (let i = 0; i < word.length; i += 1) {
      const c = word[i];
      if (node.children[c]) {
        node = node.children[c];
        trace.push({ type: "existing", char: c, depth: i });
      } else {
        const child = new TrieNode(c);
        node.children[c] = child;
        node = child;
        trace.push({ type: "new-node", char: c, depth: i });
      }
    }
    node.isEnd = true;
    trace.push({ type: "end", word });
    return true;
  }

  contains(word) {
    const node = this._walk(word);
    return node !== null && node.isEnd === true;
  }

  hasPrefix(prefix) {
    return this._walk(prefix) !== null;
  }

  _walk(word) {
    let node = this.root;
    for (let i = 0; i < word.length; i += 1) {
      node = node.children[word[i]];
      if (!node) return null;
    }
    return node;
  }

  delete(word, trace = []) {
    const path = [];
    let node = this.root;
    for (let i = 0; i < word.length; i += 1) {
      const c = word[i];
      if (!node.children[c]) {
        trace.push({ type: "missing", char: c, depth: i });
        return false;
      }
      path.push({ node, char: c, child: node.children[c] });
      node = node.children[c];
      trace.push({ type: "descend", char: c, depth: i });
    }
    if (!node.isEnd) {
      trace.push({ type: "missing-word", char: word });
      return false;
    }
    node.isEnd = false;
    trace.push({ type: "unlink", char: word });
    // prune nodes with no children that aren't word ends
    while (path.length > 0) {
      const { node: parent, char } = path.pop();
      const last = parent.children[char];
      if (Object.keys(last.children).length === 0 && !last.isEnd) {
        delete parent.children[char];
        trace.push({ type: "prune", char, depth: path.length });
      } else {
        break;
      }
    }
    return true;
  }

  wordsWithPrefix(prefix, limit = Infinity) {
    const base = this._walk(prefix);
    if (!base) return [];
    const out = [];
    const dfs = (node, built) => {
      if (node.isEnd) out.push(built);
      if (out.length >= limit) return;
      Object.keys(node.children)
        .sort()
        .forEach((c) => dfs(node.children[c], built + c));
    };
    dfs(base, prefix);
    return out;
  }

  countWords() {
    let count = 0;
    const dfs = (node) => {
      if (node.isEnd) count += 1;
      Object.keys(node.children).forEach((c) => dfs(node.children[c]));
    };
    dfs(this.root);
    return count;
  }
}
