import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ConversationAnalysis from './components/ConversationAnalysis';
import ImageAnalysis from './components/ImageAnalysis';
import DocumentSummarization from './components/DocumentSummarization';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/conversation-analysis" element={
        <ProtectedRoute>
          <ConversationAnalysis />
        </ProtectedRoute>
      } />
      <Route path="/image-analysis" element={
        <ProtectedRoute>
          <ImageAnalysis />
        </ProtectedRoute>
      } />
      <Route path="/document-summarization" element={
        <ProtectedRoute>
          <DocumentSummarization />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
