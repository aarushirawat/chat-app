//Huffman coding implementation in JS
class Node {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
}

export function buildFrequencyTable(text) {
  const freq = {};
  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

export function buildHuffmanTree(freq) {
  const nodes = Object.entries(freq).map(([char, f]) => new Node(char, f));
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new Node(null, left.freq + right.freq, left, right);
    nodes.push(parent);
  }
  return nodes[0];
}

export function buildCodes(node, prefix = '', codes = {}) {
  if (!node) return;
  if (node.char !== null) {
    codes[node.char] = prefix;
  }
  buildCodes(node.left, prefix + '0', codes);
  buildCodes(node.right, prefix + '1', codes);
  return codes;
}

export function encode(text, codes) {
  let result = '';
  for (const char of text) {
    result += codes[char];
  }
  return result;
}

export function decode(bits, tree) {
  let result = '';
  let node = tree;
  for (const bit of bits) {
    node = bit === '0' ? node.left : node.right;
    if (node.char !== null) {
      result += node.char;
      node = tree;
    }
  }
  return result;
}
