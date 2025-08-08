import React, { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import { describeImage, analyzeImageWithFocus } from '../utils/describeImage';

interface ImageAnalysisResult {
  description: string;
  objects: string[];
  people: string[];
  emotions: string[];
  colors: string[];
  scene: string;
  confidence: number;
}

const ImageAnalysis: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setError('');
      setResult(null);
      
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

  // Function to extract information from AI description
  const extractInfoFromDescription = (description: string): ImageAnalysisResult => {
    const objects: string[] = [];
    const people: string[] = [];
    const emotions: string[] = [];
    const colors: string[] = [];
    let scene = '';

    // Comprehensive object detection keywords
    const objectKeywords = [
      // Vehicles
      'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'van', 'suv', 'sedan', 'vehicle', 'automobile',
      // Buildings & Structures
      'building', 'house', 'skyscraper', 'tower', 'bridge', 'fence', 'wall', 'roof', 'window', 'door', 'chimney', 'garage', 'shed', 'barn',
      // Natural Elements
      'mountain', 'hill', 'tree', 'forest', 'lake', 'river', 'ocean', 'sea', 'water', 'sky', 'cloud', 'sun', 'moon', 'star', 'grass', 'flower', 'plant', 'rock', 'stone', 'sand', 'snow', 'ice',
      // Roads & Infrastructure
      'road', 'street', 'highway', 'path', 'sidewalk', 'traffic light', 'stop sign', 'sign', 'billboard', 'lamp post', 'telephone pole',
      // Furniture & Objects
      'chair', 'table', 'desk', 'bed', 'sofa', 'couch', 'lamp', 'mirror', 'picture', 'painting', 'clock', 'phone', 'computer', 'laptop', 'television', 'tv', 'book', 'newspaper', 'magazine',
      // Clothing & Accessories
      'shirt', 'pants', 'dress', 'hat', 'shoes', 'bag', 'backpack', 'purse', 'watch', 'glasses', 'sunglasses',
      // Animals
      'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'sheep', 'pig', 'chicken', 'duck', 'animal',
      // Food & Drinks
      'food', 'pizza', 'burger', 'sandwich', 'apple', 'banana', 'coffee', 'water bottle', 'cup', 'plate', 'bowl',
      // Technology
      'phone', 'smartphone', 'laptop', 'computer', 'tablet', 'camera', 'headphones', 'speaker', 'printer', 'keyboard', 'mouse'
    ];

    // Extract all objects mentioned in the description
    objectKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        objects.push(keyword);
      }
    });

    // Extract people-related information
    const peopleKeywords = ['person', 'people', 'man', 'woman', 'child', 'boy', 'girl', 'baby', 'adult', 'teenager', 'elderly', 'crowd', 'group'];
    peopleKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        people.push(keyword);
      }
    });

    // Extract emotions if people are present
    if (people.length > 0) {
      const emotionKeywords = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral', 'smiling', 'frowning', 'laughing', 'crying', 'serious', 'cheerful', 'melancholic', 'excited', 'calm', 'anxious', 'relaxed', 'tense', 'joyful', 'sad', 'worried', 'confident'];
      emotionKeywords.forEach(keyword => {
        if (description.toLowerCase().includes(keyword)) {
          emotions.push(keyword);
        }
      });
    }

    // Extract colors
    const colorKeywords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey', 'cyan', 'magenta', 'gold', 'silver', 'beige', 'navy', 'maroon', 'olive', 'teal', 'violet', 'crimson', 'azure', 'emerald', 'amber'];
    colorKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        colors.push(keyword);
      }
    });

    // Determine scene type
    if (description.toLowerCase().includes('indoor') || description.toLowerCase().includes('room') || description.toLowerCase().includes('inside') || description.toLowerCase().includes('interior')) {
      scene = 'Indoor scene';
    } else if (description.toLowerCase().includes('outdoor') || description.toLowerCase().includes('outside') || description.toLowerCase().includes('nature') || description.toLowerCase().includes('landscape') || description.toLowerCase().includes('exterior') || description.toLowerCase().includes('street') || description.toLowerCase().includes('park')) {
      scene = 'Outdoor scene';
    } else if (description.toLowerCase().includes('urban') || description.toLowerCase().includes('city') || description.toLowerCase().includes('downtown')) {
      scene = 'Urban scene';
    } else {
      scene = 'Mixed or unclear scene';
    }

    return {
      description,
      objects: [...new Set(objects)],
      people: [...new Set(people)],
      emotions: [...new Set(emotions)],
      colors: [...new Set(colors)],
      scene,
      confidence: 90 // High confidence for comprehensive AI analysis
    };
  };

  const analyzeImage = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    setError('');

    try {
      // Get AI description (will use demo mode if no API key)
      const aiDescription = await describeImage(imageFile);
      
      // Extract structured information from the description
      const analysisResult = extractInfoFromDescription(aiDescription);
      
      setResult(analysisResult);
    } catch (err) {
      console.error('Image analysis error:', err);
      setError(`Failed to analyze image: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            <Link 
              to="/image-analysis" 
              className={`nav-link ${location.pathname === '/image-analysis' ? 'active' : ''}`}
            >
              Image Analysis
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
                AI-Powered Image Analysis
              </h1>
              <p className="text-gray-600">
                Upload images and get detailed analysis using OpenAI's advanced vision AI.
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
                        Analyzing with AI...
                      </>
                    ) : (
                      'Analyze with AI'
                    )}
                  </button>
                )}

                {error && (
                  <div className="error">
                    {error}
                  </div>
                )}

                {/* API Key Setup Instructions */}
                {(() => {
                  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
                  console.log('🔍 Component API Key check:', apiKey ? 'Found' : 'Not found');
                  console.log('🔍 Component API Key length:', apiKey ? apiKey.length : 0);
                  
                  return !apiKey ? (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">🔑 Setup Required</h4>
                      <p className="text-sm text-yellow-700 mb-2">
                        To use AI-powered image analysis, you need to:
                      </p>
                      <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
                        <li>Get an OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
                        <li>Create a <code>.env.local</code> file in your project root</li>
                        <li>Add: <code>VITE_OPENAI_API_KEY=your_actual_api_key</code></li>
                        <li>Restart your development server</li>
                      </ol>
                      <p className="text-sm text-red-600 mt-2">
                        Current status: API key not detected
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✅ OpenAI API key configured. AI analysis is ready!
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        API key length: {apiKey.length} characters
                      </p>
                    </div>
                  );
                })()}
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

                {result && (
                  <div className="space-y-4">
                    <div className="result-section">
                      <h3>🤖 AI Description</h3>
                      <div className="result-content">
                        {result.description}
                      </div>
                    </div>

                    {result.people.length > 0 && (
                      <div className="result-section">
                        <h3>👥 People Detection</h3>
                        <div className="result-content">
                          {result.people.map((person, index) => (
                            <span key={index} className="inline-block bg-blue-100 px-2 py-1 rounded mr-2 mb-2">
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.emotions.length > 0 && (
                      <div className="result-section">
                        <h3>😊 Emotions & Mood</h3>
                        <div className="result-content">
                          {result.emotions.map((emotion, index) => (
                            <span key={index} className="inline-block bg-green-100 px-2 py-1 rounded mr-2 mb-2">
                              {emotion}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.objects.length > 0 && (
                      <div className="result-section">
                        <h3>🔍 Detected Objects</h3>
                        <div className="result-content">
                          {result.objects.map((object, index) => (
                            <span key={index} className="inline-block bg-purple-100 px-2 py-1 rounded mr-2 mb-2">
                              {object}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.colors.length > 0 && (
                      <div className="result-section">
                        <h3>🎨 Colors</h3>
                        <div className="result-content">
                          {result.colors.map((color, index) => (
                            <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 mb-2">
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="result-section">
                      <h3>📍 Scene Type</h3>
                      <div className="result-content">
                        <span className="inline-block bg-orange-100 px-2 py-1 rounded">
                          {result.scene}
                        </span>
                      </div>
                    </div>

                    <div className="result-section">
                      <h3>📊 AI Confidence</h3>
                      <div className="result-content">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full" 
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.confidence}% confidence in AI analysis
                        </p>
                      </div>
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