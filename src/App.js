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
import { AuthProvider, RequireAuthor } from "./Pages/Wiser/auth";

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
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/wiser" replace />} />
            <Route path="/wiser" element={<WiserHome />} />
            <Route path="/wiser/login" element={<LoginPage />} />
            <Route
              path="/wiser/stories"
              element={
                <RequireAuthor>
                  <StoriesPage />
                </RequireAuthor>
              }
            />
            <Route
              path="/wiser/new"
              element={
                <RequireAuthor>
                  <NewArticle />
                </RequireAuthor>
              }
            />
            <Route
              path="/wiser/edit/:id"
              element={
                <RequireAuthor>
                  <Suspense fallback={null}>
                    <EditorPage />
                  </Suspense>
                </RequireAuthor>
              }
            />
            <Route path="/wiser/:slug" element={<ArticlePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
