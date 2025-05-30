import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Signup from "./signup";
import Chat from "./chat";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
