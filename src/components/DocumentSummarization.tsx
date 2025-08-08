import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import { demoDocumentSummaries } from '../data/demoData';

const DocumentSummarization: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [inputType, setInputType] = useState<'file' | 'url'>('file');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setDocumentFile(file);
      setError('');
      setSummary('');
    } else {
      setError('Please upload a valid document file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const processContent = async () => {
    if (inputType === 'file' && !documentFile) {
      setError('Please upload a document file');
      return;
    }
    
    if (inputType === 'url' && !url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (inputType === 'url' && !validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Simulate API call for document processing
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Use demo data for realistic results
      const randomIndex = Math.floor(Math.random() * demoDocumentSummaries.length);
      const mockSummary = demoDocumentSummaries[randomIndex];

      setSummary(mockSummary);
    } catch (err) {
      setError('Failed to process content. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            <Link 
              to="/document-summarization" 
              className={`nav-link ${location.pathname === '/document-summarization' ? 'active' : ''}`}
            >
              Document Summarization
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">
                Document Summarization
              </h1>
              <p className="text-gray-600">
                Upload documents (PDF, DOC) or provide URLs and obtain concise summaries of the content.
              </p>
            </div>

            <div className="card">
              <div className="form-group">
                <label className="form-label">Input Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="inputType"
                      value="file"
                      checked={inputType === 'file'}
                      onChange={(e) => setInputType(e.target.value as 'file' | 'url')}
                      className="mr-2"
                    />
                    Upload Document
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="inputType"
                      value="url"
                      checked={inputType === 'url'}
                      onChange={(e) => setInputType(e.target.value as 'file' | 'url')}
                      className="mr-2"
                    />
                    Enter URL
                  </label>
                </div>
              </div>

              {inputType === 'file' ? (
                <div className="form-group">
                  <label className="form-label">Upload Document</label>
                  <div 
                    {...getRootProps()} 
                    className={`dropzone ${isDragActive ? 'dragover' : ''}`}
                  >
                    <input {...getInputProps()} />
                    {documentFile ? (
                      <div>
                        <p className="text-green-600 font-medium">✓ {documentFile.name}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Click to replace or drag and drop a different document
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg mb-2">📄</p>
                        <p className="font-medium">
                          {isDragActive ? 'Drop the document here' : 'Drag & drop a document here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          or click to select a document (PDF, DOC, DOCX, TXT)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Enter URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="input"
                  />
                </div>
              )}

              <button
                onClick={processContent}
                disabled={isProcessing || (inputType === 'file' ? !documentFile : !url.trim())}
                className="btn btn-primary w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="loading"></div>
                    Processing Content...
                  </>
                ) : (
                  'Generate Summary'
                )}
              </button>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              {summary && (
                <div className="result-section">
                  <h3>📋 AI Summary</h3>
                  <div className="result-content">
                    {summary}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentSummarization;
