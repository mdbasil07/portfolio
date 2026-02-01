import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import About from "./pages/Home";
import Projects from "./pages/Work";
import Learning from "./pages/Learning";
import Connect from "./pages/Connect";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#ffffff] text-black overflow-x-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/connect" element={<Connect />} />
        </Routes>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;