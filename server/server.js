require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: process.env.CONNECT_BACKEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const {
  buildFrequencyTable,
  buildHuffmanTree,
  buildCodes,
  encode,
} = require('./public/huffman');
const User = mongoose.models.User || require('./models/User.model');
const Chat = mongoose.models.Chat || require('./models/Chat.model');

app.use(cors({
  origin: process.env.CONNECT_BACKEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ success: false, message: 'Missing username or password' });

  // Username must be letters and spaces only, at least 2 characters
  if (!/^[A-Za-z ]{2,}$/.test(username)) {
    return res.json({ success: false, message: 'Username must be a real name (letters and spaces only)' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.json({ success: false, message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    console.log(`User registered: ${username}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ success: false, message: 'Missing username or password' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: 'Incorrect password' });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// websocket connection
io.on('connection', async (socket) => {
  console.log('User connected');

  // only displaying last 50 messages to client
  try {
    const chatHistory = await Chat.find().sort({ timestamp: -1 }).limit(50);
    socket.emit('chat history', chatHistory.reverse());
  } catch (err) {
    console.error('Error fetching chat history:', err);
  }

  socket.on('chat message', async ({ encoded, codes, username }) => {
    // Log encoded message to server terminal
    console.log(`Encoded message from ${username}:`, encoded);

    // Decode message server-side to save plain text
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
    const decodedMessage = decodeFromTree(encoded, tree);

    if (!decodedMessage) return;

    try {
      // Save decoded message to MongoDB
      const chatEntry = new Chat({ username, message: decodedMessage });
      await chatEntry.save();

      // Broadcast encoded message + codes + username to all clients
      io.emit('chat message', { encoded, codes, username });
    } catch (err) {
      console.error('Error saving chat message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
