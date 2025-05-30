import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

// Huffman functions (import or implement as needed)
import { buildFrequencyTable, buildHuffmanTree, buildCodes, encode } from "../../server/public/huffman"

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const socket = useRef(null);

  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }
    socket.current = io(`${import.meta.env.VITE_BASE_URL}`);

    socket.current.on("chat history", (history) => {
      setMessages(history.map(msg => ({
        user: msg.username,
        text: msg.message,
        timestamp: msg.timestamp,
      })));
    });

    socket.current.on("chat message", ({ encoded, codes, username: user }) => {
      // Decode message client-side for display
      const tree = codesToTree(codes);
      const decoded = decodeFromTree(encoded, tree);
      setMessages(prev => {
        const updated = [...prev, { user, text: decoded }];
        // Scroll only when a new message is added
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 0);
        return updated;
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, [username, navigate]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // --- Huffman helpers (same as server) ---
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
      if (!node) return null;
      if (node.char !== undefined) {
        result += node.char;
        node = tree;
      }
    }
    return result;
  }

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Huffman encode before sending
    const freq = buildFrequencyTable(input);
    const tree = buildHuffmanTree(freq);
    const codes = buildCodes(tree);
    const encoded = encode(input, codes);

    socket.current.emit("chat message", {
      encoded,
      codes,
      username,
    });

    setInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: "#181824",
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(0,0,0,0.08) 0 40px, transparent 40px 80px), url('data:image/svg+xml;utf8,<svg width=\"300\" height=\"100\" xmlns=\"http://www.w3.org/2000/svg\"><text x=\"0\" y=\"60\" font-size=\"48\" fill=\"%23888\" fill-opacity=\"0.13\" font-family=\"monospace\">01 01 01 01 01</text></svg>')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto, 300px 100px",
        backgroundPosition: "center center",
        backgroundBlendMode: "lighten"
      }}
    >
      <div className="bg-white shadow-xl rounded-xl w-full max-w-2xl p-6 flex flex-col h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-700">Huffman Chat</h2>
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              Logged in as: <span className="text-purple-600">{username}</span>
            </span>
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto border rounded-lg p-3 bg-gray-50 mb-4" style={{ maxHeight: 350 }}>
          {messages.map((msg, idx) => (
            <li
              key={idx}
              className={`py-2 px-4 rounded-lg mb-2 ${
                msg.user === username
                  ? "bg-purple-100 text-right ml-auto max-w-[70%]"
                  : "bg-blue-100 text-left mr-auto max-w-[70%]"
              }`}
            >
              <span className="block text-xs text-gray-500">{msg.user}</span>
              <span className="block text-gray-800">{msg.text}</span>
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}