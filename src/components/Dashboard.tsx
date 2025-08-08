import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const skills = [
    {
      id: 'conversation-analysis',
      title: 'Conversation Analysis',
      description: 'Upload audio files, convert speech to text, and perform speaker diarization for up to 2 speakers.',
      path: '/conversation-analysis',
      icon: '🎤',
      points: 20
    },
    {
      id: 'image-analysis',
      title: 'Image Analysis',
      description: 'Upload images and generate detailed textual descriptions using AI vision capabilities.',
      path: '/image-analysis',
      icon: '🖼️',
      points: 10
    },
    {
      id: 'document-summarization',
      title: 'Document Summarization',
      description: 'Upload documents (PDF, DOC) or provide URLs and obtain concise summaries of the content.',
      path: '/document-summarization',
      icon: '📄',
      points: 20
    }
  ];

  return (
    <div className="app">
      <header className="page-header">
        <div className="container">
          <div className="logo">AI Playground</div>
          <nav className="nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name || 'User'}
              </span>
              <button 
                onClick={logout}
                className="btn btn-secondary"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Multi-Modal AI Playground
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore powerful AI capabilities including conversation analysis, image recognition, 
              and document summarization. Select a skill below to get started.
            </p>
          </div>

          <div className="skill-grid">
            {skills.map((skill) => (
              <Link 
                key={skill.id} 
                to={skill.path} 
                className="skill-card fade-in"
              >
                <div className="skill-icon">
                  <span className="text-2xl">{skill.icon}</span>
                </div>
                <h3>{skill.title}</h3>
                <p>{skill.description}</p>
                <div className="mt-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {skill.points} points
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="card max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold mb-2">How it works</h3>
              <p className="text-gray-600">
                Each skill provides a specialized AI-powered interface. Simply select a skill, 
                upload your content, and watch as AI processes and analyzes your data in real-time.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
