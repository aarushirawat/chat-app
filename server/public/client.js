const socket = io();
const username = localStorage.getItem('username');
if (!username) {
  window.location.href = '/';
}
userSpan.textContent = username;

logoutBtn.onclick = () => {
  localStorage.removeItem('username');
  window.location.href = '/';
};

// Huffman functions from huffman.js are available globally

// We will build Huffman tree per message for simplicity (can be optimized)

form.addEventListener('submit', (e) => {
  if (!input.value) return;

  const text = input.value;
  // Build freq table, tree, codes
  const freq = buildFrequencyTable(text);
  const tree = buildHuffmanTree(freq);
  const codes = buildCodes(tree);
  const encoded = encode(text, codes);

  // Send encoded message + codes + username
  socket.emit('chat message', { encoded, codes, username });
  input.value = '';
});

socket.on('chat message', ({ encoded, codes, username: sender }) => {
  // Rebuild tree from codes for decoding
  // To decode, reconstruct tree from codes:
  function codesToTree(codes) {
    const root = {};
    for (const char in codes) {
      let node = root;
      for (const bit of codes[char]) {
        if (!node[bit]) node[bit] = {};
        node = node[bit];
      }
      node.char = char;
    }
    return root;
  }

  function decodeFromTree(bits, tree) {
    let result = '';
    let node = tree;
    for (const bit of bits) {
      node = node[bit];
      if (!node) return null; // error
      if (node.char !== undefined) {
        result += node.char;
        node = tree;
      }
    }
    return result;
  }

  const tree = codesToTree(codes);
  const decoded = decodeFromTree(encoded, tree);

  const item = document.createElement('li');
  item.textContent = `${sender}: ${decoded}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

// Load previous chat history on connect
socket.on('chat history', (history) => {
  messages.innerHTML = '';
  history.forEach(({ username, message, timestamp }) => {
    const item = document.createElement('li');
    item.textContent = `${username} [${new Date(timestamp).toLocaleTimeString()}]: ${message}`;
    messages.appendChild(item);
  });
});

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    // Broadcast to all clients (including sender)
    io.emit('chat message', data);
  });
});
