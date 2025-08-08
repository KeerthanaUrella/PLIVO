import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import { demoAudioResults } from '../data/demoData';

interface AnalysisResult {
  transcript: string;
  diarization: string;
  summary: string;
}

const ConversationAnalysis: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setError('');
      setResult(null);
    } else {
      setError('Please upload a valid audio file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    multiple: false
  });

  const processAudio = async () => {
    if (!audioFile) return;

    setIsProcessing(true);
    setError('');
    setResult(null);

    try {
      // Simulate API call for audio processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Use demo data for realistic results
      const mockResult: AnalysisResult = demoAudioResults;

      setResult(mockResult);
    } catch (err) {
      setError('Failed to process audio file. Please try again.');
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
              to="/conversation-analysis" 
              className={`nav-link ${location.pathname === '/conversation-analysis' ? 'active' : ''}`}
            >
              Conversation Analysis
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
                Conversation Analysis
              </h1>
              <p className="text-gray-600">
                Upload audio files to convert speech to text and perform speaker diarization for up to 2 speakers.
              </p>
            </div>

            <div className="card">
              <div className="form-group">
                <label className="form-label">Upload Audio File</label>
                <div 
                  {...getRootProps()} 
                  className={`dropzone ${isDragActive ? 'dragover' : ''}`}
                >
                  <input {...getInputProps()} />
                  {audioFile ? (
                    <div>
                      <p className="text-green-600 font-medium">✓ {audioFile.name}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Click to replace or drag and drop a different file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">🎤</p>
                      <p className="font-medium">
                        {isDragActive ? 'Drop the audio file here' : 'Drag & drop an audio file here'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        or click to select a file (MP3, WAV, M4A, OGG)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {audioFile && (
                <button
                  onClick={processAudio}
                  disabled={isProcessing}
                  className="btn btn-primary w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="loading"></div>
                      Processing Audio...
                    </>
                  ) : (
                    'Analyze Conversation'
                  )}
                </button>
              )}

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              {result && (
                <div className="mt-8 space-y-6">
                  <div className="result-section">
                    <h3>📝 Transcript</h3>
                    <div className="result-content">
                      {result.transcript}
                    </div>
                  </div>

                  <div className="result-section">
                    <h3>👥 Speaker Diarization</h3>
                    <div className="result-content">
                      {result.diarization}
                    </div>
                  </div>

                  <div className="result-section">
                    <h3>📋 Summary</h3>
                    <div className="result-content">
                      {result.summary}
                    </div>
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

export default ConversationAnalysis;
