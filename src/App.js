// src/App.js
import "./App.css";
import React, { useState, useEffect } from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./Pages/Home/Navbar";
import Home from "./Pages/Home/Homescreen";
import Loading from "./Pages/Home/Loading"; // Adjust path if needed

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set a timer for 1.5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      <Loading isVisible={isLoading} />
      <div className={`main-content ${isLoading ? "hidden" : "visible"}`}>
        <Router>
          <div>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
          </div>
        </Router>
      </div>
    </div>
  );
}

export default App;