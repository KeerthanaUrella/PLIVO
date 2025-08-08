import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ConversationAnalysis from './components/ConversationAnalysis';
import ImageAnalysis from './components/ImageAnalysis';
import DocumentSummarization from './components/DocumentSummarization';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/conversation-analysis" 
            element={
              <ProtectedRoute>
                <ConversationAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/image-analysis" 
            element={
              <ProtectedRoute>
                <ImageAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/document-summarization" 
            element={
              <ProtectedRoute>
                <DocumentSummarization />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
