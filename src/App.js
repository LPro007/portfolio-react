// src/App.js
import "./App.css";
import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import PortfolioPage from "./Pages/Home/PortfolioPage";
import WiserHome from "./Pages/Wiser/WiserHome";
import ArticlePage from "./Pages/Wiser/ArticlePage";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/wiser" replace />} />
          <Route path="/wiser" element={<WiserHome />} />
          <Route path="/wiser/:slug" element={<ArticlePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
