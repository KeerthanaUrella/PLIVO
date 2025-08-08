import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import { demoImageDescriptions } from '../data/demoData';

const ImageAnalysis: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setError('');
      setDescription('');
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please upload a valid image file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false
  });

  const analyzeImage = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    setError('');

    try {
      // Simulate API call for image analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use demo data for realistic results
      const randomIndex = Math.floor(Math.random() * demoImageDescriptions.length);
      const mockDescription = demoImageDescriptions[randomIndex];

      setDescription(mockDescription);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
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
              to="/image-analysis" 
              className={`nav-link ${location.pathname === '/image-analysis' ? 'active' : ''}`}
            >
              Image Analysis
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
                Image Analysis
              </h1>
              <p className="text-gray-600">
                Upload images and generate detailed textual descriptions using AI vision capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card">
                <div className="form-group">
                  <label className="form-label">Upload Image</label>
                  <div 
                    {...getRootProps()} 
                    className={`dropzone ${isDragActive ? 'dragover' : ''}`}
                  >
                    <input {...getInputProps()} />
                    {imageFile ? (
                      <div>
                        <p className="text-green-600 font-medium">✓ {imageFile.name}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Click to replace or drag and drop a different image
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg mb-2">🖼️</p>
                        <p className="font-medium">
                          {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          or click to select an image (JPEG, PNG, GIF, BMP, WebP)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {imageFile && (
                  <button
                    onClick={analyzeImage}
                    disabled={isProcessing}
                    className="btn btn-primary w-full"
                  >
                    {isProcessing ? (
                      <>
                        <div className="loading"></div>
                        Analyzing Image...
                      </>
                    ) : (
                      'Analyze Image'
                    )}
                  </button>
                )}

                {error && (
                  <div className="error">
                    {error}
                  </div>
                )}
              </div>

              <div className="card">
                {imagePreview && (
                  <div className="mb-4">
                    <label className="form-label">Image Preview</label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  </div>
                )}

                {description && (
                  <div className="result-section">
                    <h3>📝 AI Description</h3>
                    <div className="result-content">
                      {description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ImageAnalysis;
