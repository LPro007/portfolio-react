// src/App.js
import "./App.css";
import React, { lazy, Suspense, useMemo } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import PortfolioPage from "./Pages/Home/PortfolioPage";
import WiserHome from "./Pages/Wiser/WiserHome";
import ArticlePage from "./Pages/Wiser/ArticlePage";
import LoginPage from "./Pages/Wiser/LoginPage";
import StoriesPage from "./Pages/Wiser/StoriesPage";
import { RequireAuth } from "./Pages/Wiser/auth";

// The editor is large and only the author needs it.
const EditorPage = lazy(() => import("./Pages/Wiser/EditorPage"));

function NewArticle() {
  const id = useMemo(() => crypto.randomUUID(), []);
  return <Navigate to={`/wiser/edit/${id}`} replace />;
}

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/wiser" replace />} />
          <Route path="/wiser" element={<WiserHome />} />
          <Route path="/wiser/login" element={<LoginPage />} />
          <Route
            path="/wiser/stories"
            element={
              <RequireAuth>
                <StoriesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/wiser/new"
            element={
              <RequireAuth>
                <NewArticle />
              </RequireAuth>
            }
          />
          <Route
            path="/wiser/edit/:id"
            element={
              <RequireAuth>
                <Suspense fallback={null}>
                  <EditorPage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route path="/wiser/:slug" element={<ArticlePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
